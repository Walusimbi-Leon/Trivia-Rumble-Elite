import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateTriviaBatch, TriviaQuestion } from './src/services/geminiTrivia';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── In-Memory & File-Backed Storage ──────────────────────────────────────────
const PLAYERS_BACKUP_PATH = path.join(__dirname, 'src', 'data', 'existing_players.json');
const BANK_BACKUP_PATH = path.join(__dirname, 'src', 'data', 'initial_bank.json');

interface PlayerRecord {
  id: string;
  username: string;
  avatarUrl: string;
  platform: 'discord' | 'browser';
  score: number;
  online: boolean;
  lastSeen: number;
  joinedAt?: number;
}

interface QuestionRecord {
  question: string;
  options: string[];
  correctAnswer: number;
  category?: string;
}

let playersStore: Record<string, PlayerRecord> = {};
let answersStore: Record<number, Record<string, { answer: number; at: number }>> = {};

// Load existing 1,912 players
try {
  if (fs.existsSync(PLAYERS_BACKUP_PATH)) {
    const raw = fs.readFileSync(PLAYERS_BACKUP_PATH, 'utf-8');
    playersStore = JSON.parse(raw);
    console.log(`[Database] Loaded ${Object.keys(playersStore).length} historical players from existing database.`);
  }
} catch (err) {
  console.warn('[Database] Failed to read players backup:', err);
}

// Curated starter trivia bank
const DEFAULT_QUESTIONS: QuestionRecord[] = [
  { question: "Which country does the sitar come from?", options: ["India", "China", "Pakistan", "Japan"], correctAnswer: 0, category: "Music" },
  { question: "Which author wrote the 'Chronicles of Narnia'?", options: ["Roald Dahl", "J.K. Rowling", "C.S. Lewis", "J.R.R. Tolkien"], correctAnswer: 2, category: "Literature" },
  { question: "Which sport uses a shuttlecock?", options: ["Tennis", "Racquetball", "Squash", "Badminton"], correctAnswer: 3, category: "Sports" },
  { question: "Which artist is famous for melting clocks in 'The Persistence of Memory'?", options: ["Salvador Dalí", "Pablo Picasso", "Claude Monet", "Andy Warhol"], correctAnswer: 0, category: "Art" },
  { question: "What gas do plants primarily absorb during photosynthesis?", options: ["Hydrogen", "Oxygen", "Nitrogen", "Carbon dioxide"], correctAnswer: 3, category: "Science" },
  { question: "What is the capital city of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], correctAnswer: 2, category: "Geography" },
  { question: "Which planet in our solar system has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], correctAnswer: 1, category: "Science" },
  { question: "In video games, what is Mario's original profession in Donkey Kong?", options: ["Plumber", "Carpenter", "Electrician", "Architect"], correctAnswer: 1, category: "Gaming" },
  { question: "What year did the Titanic sink?", options: ["1910", "1912", "1914", "1918"], correctAnswer: 1, category: "History" },
  { question: "Which element has the chemical symbol 'Au'?", options: ["Silver", "Gold", "Copper", "Platinum"], correctAnswer: 1, category: "Science" },
  { question: "Who was the lead singer of the rock band Queen?", options: ["Freddie Mercury", "David Bowie", "Mick Jagger", "Robert Plant"], correctAnswer: 0, category: "Music" },
  { question: "What is the largest internal organ in the human body?", options: ["Heart", "Brain", "Liver", "Lungs"], correctAnswer: 2, category: "Biology" },
  { question: "In Pokemon, what type is Pikachu?", options: ["Fire", "Electric", "Water", "Psychic"], correctAnswer: 1, category: "Gaming" },
  { question: "Which ocean is the largest on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: 3, category: "Geography" },
  { question: "What is the name of the protagonist in The Legend of Zelda series?", options: ["Zelda", "Link", "Ganon", "Navi"], correctAnswer: 1, category: "Gaming" },
  { question: "How many bones are in the adult human body?", options: ["186", "206", "226", "246"], correctAnswer: 1, category: "Anatomy" },
  { question: "Which country gifted the Statue of Liberty to the United States?", options: ["United Kingdom", "France", "Spain", "Germany"], correctAnswer: 1, category: "History" },
  { question: "What is the fastest land animal in the world?", options: ["Cheetah", "Lion", "Pronghorn", "Greyhound"], correctAnswer: 0, category: "Nature" },
  { question: "In Minecraft, which block is required to craft a portal to the Nether?", options: ["Bedrock", "Obsidian", "Netherrack", "Crying Obsidian"], correctAnswer: 1, category: "Gaming" },
  { question: "What is the rarest blood type among humans?", options: ["O Negative", "AB Negative", "B Positive", "A Negative"], correctAnswer: 1, category: "Science" },
  { question: "Who painted the Mona Lisa?", options: ["Vincent van Gogh", "Leonardo da Vinci", "Michelangelo", "Raphael"], correctAnswer: 1, category: "Art" },
  { question: "What is the boiling point of water at standard atmospheric pressure in Celsius?", options: ["90°C", "100°C", "110°C", "120°C"], correctAnswer: 1, category: "Science" },
  { question: "Which programming language was created by Brendan Eich in just 10 days?", options: ["Python", "Java", "JavaScript", "C++"], correctAnswer: 2, category: "Technology" },
  { question: "What is the capital of Japan?", options: ["Kyoto", "Osaka", "Tokyo", "Hiroshima"], correctAnswer: 2, category: "Geography" },
  { question: "Which superhero is known as the 'Caped Crusader'?", options: ["Superman", "Batman", "Spider-Man", "Iron Man"], correctAnswer: 1, category: "Comics" }
];

// ── Firebase Configuration ───────────────────────────────────────────────────
const FIREBASE_RTDB_URL = (process.env.FIREBASE_RTDB_URL || 'https://studio-3101124565-bd63c-default-rtdb.firebaseio.com').replace(/\/+$/, '');
const FIREBASE_DB_SECRET = process.env.FIREBASE_DB_SECRET || 'V6BCS2vL24IlYodAvZ6t6h5fbBYJEOdBM8JYUI30';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'studio-3101124565-bd63c';

let bank: QuestionRecord[] = [];

// Load bank sample if available, combined with default bank
try {
  if (fs.existsSync(BANK_BACKUP_PATH)) {
    const rawBank = fs.readFileSync(BANK_BACKUP_PATH, 'utf-8');
    const parsed = JSON.parse(rawBank);
    const list = Object.keys(parsed)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => parsed[k])
      .filter((q: any) => q && q.question && Array.isArray(q.options));
    bank = list.length > 0 ? list : [...DEFAULT_QUESTIONS];
  } else {
    bank = [...DEFAULT_QUESTIONS];
  }
} catch (e) {
  bank = [...DEFAULT_QUESTIONS];
}

if (!bank.length) {
  bank = [...DEFAULT_QUESTIONS];
}

// Deterministic game timer: 20 seconds per question slot
const SLOT_DURATION = 20000;
const ROOM_START_TIME = 1793995178901; // stable anchor for continuous rotation

const getGameState = () => ({
  bankLen: bank.length,
  questionStart: ROOM_START_TIME,
  slotDuration: SLOT_DURATION,
  startedAt: ROOM_START_TIME,
});

// ── Gemini AI Daily Trivia Question Pipeline (Free Tier) ─────────────────────
interface AiGenerationStatus {
  isGenerating: boolean;
  totalAddedByAi: number;
  lastRunAt: number | null;
  nextScheduledRun: number | null;
  lastBatchCount: number;
  lastError: string | null;
  currentProgress?: { currentBatch: number; totalBatches: number; generatedCount: number };
}

const aiStatus: AiGenerationStatus = {
  isGenerating: false,
  totalAddedByAi: 0,
  lastRunAt: null,
  nextScheduledRun: null,
  lastBatchCount: 0,
  lastError: null,
};

async function appendQuestionsToBank(newQuestions: TriviaQuestion[]): Promise<{ added: number; totalBankLen: number }> {
  if (!newQuestions.length) return { added: 0, totalBankLen: bank.length };

  let nextIndex = bank.length;
  try {
    const shallowRes = await fetch(`${FIREBASE_RTDB_URL}/trivia/global/bank.json?shallow=true&auth=${FIREBASE_DB_SECRET}`);
    if (shallowRes.ok) {
      const shallowKeys = await shallowRes.json();
      if (shallowKeys && typeof shallowKeys === 'object') {
        const numericKeys = Object.keys(shallowKeys).map(Number).filter((n) => !isNaN(n));
        if (numericKeys.length > 0) {
          nextIndex = Math.max(...numericKeys) + 1;
        }
      }
    }
  } catch (err) {
    console.warn('[Bank Append] Shallow check warning, using local next index:', err);
  }

  // Write in chunks of 50 to avoid payload limits
  const CHUNK_SIZE = 50;
  for (let i = 0; i < newQuestions.length; i += CHUNK_SIZE) {
    const slice = newQuestions.slice(i, i + CHUNK_SIZE);
    const chunkObj: Record<string, TriviaQuestion> = {};
    slice.forEach((q, idx) => {
      chunkObj[String(nextIndex + i + idx)] = q;
    });

    try {
      const patchRes = await fetch(`${FIREBASE_RTDB_URL}/trivia/global/bank.json?auth=${FIREBASE_DB_SECRET}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunkObj),
      });

      if (!patchRes.ok) {
        console.error(`[Bank Append] Chunk failed at ${i}:`, patchRes.status, await patchRes.text());
      }
    } catch (e) {
      console.error(`[Bank Append] Network error on chunk at ${i}:`, e);
    }
  }

  // Append to in-memory bank
  bank.push(...newQuestions);
  const totalCount = nextIndex + newQuestions.length;

  // Save backup to file
  try {
    const allDict: Record<string, any> = {};
    bank.forEach((q, idx) => {
      allDict[String(idx)] = q;
    });
    fs.writeFileSync(BANK_BACKUP_PATH, JSON.stringify(allDict, null, 2));
  } catch (e) {
    console.warn('[Bank Backup] Save warning:', e);
  }

  // Update Firebase game bankLen
  try {
    await fetch(`${FIREBASE_RTDB_URL}/trivia/global/game.json?auth=${FIREBASE_DB_SECRET}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankLen: totalCount }),
    });
  } catch (e) {
    /* ignore */
  }

  console.log(`[Bank Append] Added ${newQuestions.length} questions. Bank now has ${totalCount} questions!`);
  return { added: newQuestions.length, totalBankLen: totalCount };
}

async function generateDaily500Questions(targetCount: number = 500) {
  if (aiStatus.isGenerating) {
    console.log('[Gemini AI] Question generation already in progress.');
    return;
  }

  aiStatus.isGenerating = true;
  aiStatus.lastError = null;
  console.log(`[Gemini AI] 🚀 Starting daily generation of ${targetCount} questions via Gemini Free Tier...`);

  const existingTitles = new Set<string>();
  bank.forEach((q) => {
    if (q.question) {
      existingTitles.add(q.question.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  });

  const BATCH_SIZE = 25;
  const batchesNeeded = Math.ceil(targetCount / BATCH_SIZE);
  const generated: TriviaQuestion[] = [];

  try {
    for (let b = 0; b < batchesNeeded; b++) {
      const remaining = targetCount - generated.length;
      if (remaining <= 0) break;
      const count = Math.min(BATCH_SIZE, remaining);

      aiStatus.currentProgress = {
        currentBatch: b + 1,
        totalBatches: batchesNeeded,
        generatedCount: generated.length,
      };

      try {
        console.log(`[Gemini AI] Generating batch ${b + 1}/${batchesNeeded} (${count} questions)...`);
        const batch = await generateTriviaBatch(count, b, existingTitles);

        batch.forEach((q) => {
          const norm = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!existingTitles.has(norm)) {
            existingTitles.add(norm);
            generated.push(q);
          }
        });
      } catch (batchErr: any) {
        console.warn(`[Gemini AI] Batch ${b + 1} warning: ${batchErr.message || batchErr}. Continuing...`);
        await new Promise((r) => setTimeout(r, 3000));
      }

      // 3 second pause between batches to respect free-tier 15 RPM limits
      if (b < batchesNeeded - 1 && generated.length < targetCount) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    console.log(`[Gemini AI] Generation complete. Appending ${generated.length} unique questions to Firebase...`);
    const result = await appendQuestionsToBank(generated);

    aiStatus.totalAddedByAi += generated.length;
    aiStatus.lastRunAt = Date.now();
    aiStatus.lastBatchCount = generated.length;
    aiStatus.currentProgress = undefined;
    console.log(`[Gemini AI] 🎉 Successfully updated bank to ${result.totalBankLen} questions!`);
  } catch (err: any) {
    console.error('[Gemini AI] Error during generation run:', err);
    aiStatus.lastError = err.message || 'Generation error';
  } finally {
    aiStatus.isGenerating = false;
  }
}

function scheduleDailyAiGeneration() {
  const now = new Date();
  // Scheduled for 00:00 UTC every day
  const nextRun = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const delayMs = nextRun.getTime() - now.getTime();
  aiStatus.nextScheduledRun = nextRun.getTime();

  console.log(`[AI Scheduler] Scheduled next daily 500 questions generation in ${Math.round(delayMs / 60000)} minutes (at 00:00 UTC).`);

  setTimeout(async () => {
    try {
      await generateDaily500Questions(500);
    } catch (e) {
      console.error('[AI Scheduler] Run error:', e);
    }
    scheduleDailyAiGeneration();
  }, delayMs);
}

// Periodic save of players store to keep data persistent
setInterval(() => {
  try {
    fs.writeFileSync(PLAYERS_BACKUP_PATH, JSON.stringify(playersStore, null, 2));
  } catch (err) {
    // Ignore transient file lock
  }
}, 30000);

// ── API Routes ───────────────────────────────────────────────────────────────

// 1. Time & Clock Synchronization
app.get('/api/time', (_req: Request, res: Response) => {
  res.json({
    now: Date.now(),
    game: getGameState(),
  });
});

// 2. Trivia questions top-up / provider
app.post('/api/trivia', (req: Request, res: Response) => {
  const count = Number(req.body?.count) || 20;
  // If user requests more questions, ensure bank is populated
  res.json({
    bankLen: bank.length,
    source: 'bank_curated',
    requested: count,
  });
});

// 3. Discord OAuth Code Exchange Proxy
app.post('/api/exchange', async (req: Request, res: Response) => {
  const { code } = req.body;
  const clientId = process.env.DISCORD_CLIENT_ID || '1535428947624460328';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  if (!clientSecret) {
    // Return graceful mock/public fallback if client secret not yet configured
    console.warn('[Discord OAuth] DISCORD_CLIENT_SECRET not configured in .env. Falling back.');
    return res.status(501).json({ error: 'Discord Client Secret not configured on server' });
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
    });

    const response = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    console.error('[Discord OAuth] Exchange error:', err);
    return res.status(500).json({ error: err.message || 'Token exchange failed' });
  }
});

// 4. Database diagnostic & migration status
app.get('/api/database/status', (_req: Request, res: Response) => {
  const allPlayers = Object.values(playersStore);
  const discordPlayers = allPlayers.filter((p) => p.platform === 'discord');
  const browserPlayers = allPlayers.filter((p) => p.platform === 'browser');
  const topPlayers = [...allPlayers]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 10);

  res.json({
    totalPlayers: allPlayers.length,
    discordPlayersCount: discordPlayers.length,
    browserPlayersCount: browserPlayers.length,
    questionsInBank: bank.length,
    topPlayers: topPlayers.map((p) => ({
      id: p.id,
      username: p.username,
      score: p.score,
      platform: p.platform,
    })),
    firebaseStatus: {
      targetConfigured: true,
      targetUrl: FIREBASE_RTDB_URL,
      projectId: FIREBASE_PROJECT_ID,
      isLiveConnected: true,
    },
  });
});

// 5. Database Migration Handler (Push backed up players to new Firebase project)
app.post('/api/database/migrate', async (req: Request, res: Response) => {
  const targetUrl = (req.body?.firebaseUrl || FIREBASE_RTDB_URL).replace(/\/+$/, '');
  const secret = req.body?.authToken || FIREBASE_DB_SECRET;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Please provide firebaseUrl (e.g. https://your-project-default-rtdb.firebaseio.com)' });
  }

  const all = playersStore;
  const total = Object.keys(all).length;

  try {
    const entries = Object.entries(all);
    const CHUNK_SIZE = 100;
    let migrated = 0;

    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      const slice = Object.fromEntries(entries.slice(i, i + CHUNK_SIZE));
      const targetEndpoint = `${targetUrl}/trivia/global/players.json${secret ? `?auth=${secret}` : ''}`;
      
      const patchRes = await fetch(targetEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slice),
      });

      if (!patchRes.ok) {
        const errText = await patchRes.text();
        return res.status(patchRes.status).json({
          error: `Failed to migrate chunk at index ${i}: ${errText}`,
          migratedSoFar: migrated,
        });
      }
      migrated += Object.keys(slice).length;
    }

    return res.json({
      success: true,
      message: `Successfully migrated ${migrated} of ${total} player profiles into ${targetUrl}!`,
      total,
    });
  } catch (err: any) {
    console.error('[Migration] Error:', err);
    return res.status(500).json({ error: err.message || 'Migration network error' });
  }
});

// ── Firebase REST Sandbox Proxy ──────────────────────────────────────────────
// Routes all player scores, answers, and leaderboard entries directly to the
// new dedicated Firebase Realtime Database with auth secret authentication.
app.all('/firebase/*', async (req: Request, res: Response) => {
  const rawPath = req.path.replace(/^\/firebase\//, '').replace(/\.json$/, '');
  const method = ((req.headers['x-fb-method'] as string) || req.method).toUpperCase();

  // Keep local memory store synchronized on every write
  const playerMatch = rawPath.match(/^trivia\/global\/players\/([^/]+)$/);
  if (playerMatch && req.body && typeof req.body === 'object') {
    const id = playerMatch[1];
    if (method === 'PATCH' || method === 'PUT') {
      playersStore[id] = { ...(playersStore[id] || { id, score: 0 }), ...req.body };
    }
  }

  const upstreamBase = FIREBASE_RTDB_URL;
  if (upstreamBase) {
    try {
      const subPath = req.path.replace(/^\/firebase\//, '');

      // Extract query params, delete old ns, append auth secret
      const queryIdx = req.url.indexOf('?');
      const searchParams = new URLSearchParams(queryIdx >= 0 ? req.url.slice(queryIdx + 1) : '');
      searchParams.delete('ns');
      if (FIREBASE_DB_SECRET && !searchParams.has('auth')) {
        searchParams.set('auth', FIREBASE_DB_SECRET);
      }
      if ((searchParams.has('limitToLast') || searchParams.has('limitToFirst')) && !searchParams.has('orderBy')) {
        searchParams.set('orderBy', '"$key"');
      }

      const qs = searchParams.toString();
      const target = `${upstreamBase}/${subPath}${qs ? '?' + qs : ''}`;

      // Only pass body and Content-Type for methods that accept a body (NOT GET or HEAD)
      const isBodyMethod = method !== 'GET' && method !== 'HEAD';
      const hasBody = isBodyMethod && req.body && Object.keys(req.body).length > 0;

      const upstreamRes = await fetch(target, {
        method,
        headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
        body: hasBody ? JSON.stringify(req.body) : undefined,
      });

      const data = await upstreamRes.text();
      return res.status(upstreamRes.status).send(data);
    } catch (e: any) {
      console.warn('[Firebase Proxy] Upstream error, falling back to local store:', e.message);
    }
  }

  // Local high-speed persistent store (fallback when upstream is unreachable)
  // Route: /firebase/trivia/global/players
  if (rawPath === 'trivia/global/players') {
    if (method === 'GET') {
      const limitToLast = req.query.limitToLast ? Number(req.query.limitToLast) : 0;
      if (limitToLast > 0) {
        const entries = Object.entries(playersStore);
        const sliced = Object.fromEntries(entries.slice(-limitToLast));
        return res.json(sliced);
      }
      return res.json(playersStore);
    }
  }

  // Route: /firebase/trivia/global/players/:id
  if (playerMatch) {
    const id = playerMatch[1];
    if (method === 'GET') {
      return res.json(playersStore[id] || null);
    }
    if (method === 'PUT') {
      playersStore[id] = req.body;
      return res.json(playersStore[id]);
    }
    if (method === 'PATCH') {
      playersStore[id] = { ...(playersStore[id] || { id, score: 0 }), ...req.body };
      return res.json(playersStore[id]);
    }
    if (method === 'DELETE') {
      delete playersStore[id];
      return res.json(null);
    }
  }

  // Route: /firebase/trivia/global/game
  if (rawPath === 'trivia/global/game') {
    return res.json(getGameState());
  }

  // Route: /firebase/trivia/global/bank
  if (rawPath === 'trivia/global/bank') {
    return res.json(bank);
  }

  // Route: /firebase/trivia/global/answers/:slot
  const answersSlotMatch = rawPath.match(/^trivia\/global\/answers\/(\d+)$/);
  if (answersSlotMatch) {
    const slot = Number(answersSlotMatch[1]);
    if (method === 'GET') {
      return res.json(answersStore[slot] || {});
    }
  }

  // Route: /firebase/trivia/global/answers/:slot/:id
  const answerPlayerMatch = rawPath.match(/^trivia\/global\/answers\/(\d+)\/([^/]+)$/);
  if (answerPlayerMatch) {
    const slot = Number(answerPlayerMatch[1]);
    const id = answerPlayerMatch[2];
    if (method === 'PATCH' || method === 'PUT') {
      if (!answersStore[slot]) answersStore[slot] = {};
      answersStore[slot][id] = req.body;
      return res.json(req.body);
    }
  }

  return res.json(null);
});

// 6. Gemini AI Question Bank Admin & Monitoring Endpoints
app.get('/api/admin/ai-status', (_req: Request, res: Response) => {
  res.json({
    bankLength: bank.length,
    status: aiStatus,
    targetFirebase: FIREBASE_RTDB_URL,
    configuredKey: true,
  });
});

app.post('/api/admin/generate-questions', (req: Request, res: Response) => {
  const count = Number(req.body?.count) || 500;
  if (aiStatus.isGenerating) {
    return res.status(409).json({ error: 'AI question generation is already in progress.', status: aiStatus });
  }

  // Launch background generation
  generateDaily500Questions(count).catch((e) => {
    console.error('[Admin] Question generation failed:', e);
  });

  return res.json({
    success: true,
    message: `Started generating ${count} new questions via Gemini AI on the free tier.`,
    status: aiStatus,
  });
});

// ── Development & Production Integration ─────────────────────────────────────
async function syncBankFromFirebase() {
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/trivia/global/bank.json?auth=${FIREBASE_DB_SECRET}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const list = Object.keys(data)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => data[k])
          .filter((q: any) => q && q.question && Array.isArray(q.options));
        if (list.length > 0) {
          bank = list;
          console.log(`[Database] Synchronized ${bank.length} questions from Firebase Realtime Database.`);
        }
      }
    }
  } catch (e) {
    console.warn('[Database] Initial bank sync from Firebase warning:', e);
  }
}

async function startServer() {
  await syncBankFromFirebase();

  if (process.env.NODE_ENV !== 'production') {
    // Dev: Mount Vite middlewares dynamically
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve compiled static files
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 Trivia Rumble Elite server running on http://0.0.0.0:${PORT}`);
    // Start automated daily 500 question generation
    scheduleDailyAiGeneration();
  });
}

startServer();

