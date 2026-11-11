import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIREBASE_RTDB_URL = 'https://studio-3101124565-bd63c-default-rtdb.firebaseio.com';
const FIREBASE_DB_SECRET = 'V6BCS2vL24IlYodAvZ6t6h5fbBYJEOdBM8JYUI30';
const BANK_BACKUP_PATH = path.join(__dirname, '..', 'src', 'data', 'initial_bank.json');

function decodeHtml(html) {
  if (!html) return '';
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&eacute;/g, 'é')
    .replace(/&ouml;/g, 'ö')
    .replace(/&uuml;/g, 'ü')
    .replace(/&auml;/g, 'ä')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '—')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const CATEGORIES_TO_QUERY = [
  15, // Video Games
  17, // Science & Nature
  18, // Computers
  22, // Geography
  23, // History
  11, // Film
  12, // Music
  14, // Television
  21, // Sports
  31, // Anime & Manga
  20, // Mythology
  9,  // General Knowledge
  32, // Cartoons & Animations
];

async function fetchOpenTdbBatch(categoryId, amount = 50) {
  const url = `https://opentdb.com/api.php?amount=${amount}&category=${categoryId}&type=multiple`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.response_code !== 0 || !Array.isArray(data.results)) return [];

    return data.results.map((r) => {
      const questionText = decodeHtml(r.question).trim();
      const correctText = decodeHtml(r.correct_answer).trim();
      const incorrect = r.incorrect_answers.map((a) => decodeHtml(a).trim());
      const rawOptions = [correctText, ...incorrect];
      const shuffledOptions = shuffle(rawOptions);
      const correctIndex = shuffledOptions.indexOf(correctText);

      return {
        question: questionText,
        options: shuffledOptions,
        correctAnswer: correctIndex >= 0 ? correctIndex : 0,
        category: decodeHtml(r.category) || 'General',
      };
    });
  } catch (err) {
    console.warn(`[OpenTDB] Fetch error for category ${categoryId}:`, err.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting 1,000 Questions Boost Pipeline (Zero User Quota Consumption)...');

  // Load existing bank to prevent duplicates
  let existingBank = {};
  const existingNormalized = new Set();

  if (fs.existsSync(BANK_BACKUP_PATH)) {
    try {
      existingBank = JSON.parse(fs.readFileSync(BANK_BACKUP_PATH, 'utf-8'));
      Object.values(existingBank).forEach((q) => {
        if (q && q.question) {
          existingNormalized.add(q.question.toLowerCase().replace(/[^a-z0-9]/g, ''));
        }
      });
      console.log(`Loaded ${Object.keys(existingBank).length} existing questions from local backup.`);
    } catch (e) {
      console.warn('Backup parse error:', e);
    }
  }

  // Also query Firebase shallow keys to find current next index
  let nextIndex = 7203;
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
  } catch (e) {
    console.warn('Shallow keys fetch warning, using default nextIndex:', nextIndex);
  }
  console.log(`Next Firebase bank index starting at: ${nextIndex}`);

  const TARGET_NEW_COUNT = 1000;
  const newQuestions = [];
  let categoryIdx = 0;

  while (newQuestions.length < TARGET_NEW_COUNT && categoryIdx < CATEGORIES_TO_QUERY.length * 3) {
    const catId = CATEGORIES_TO_QUERY[categoryIdx % CATEGORIES_TO_QUERY.length];
    categoryIdx++;

    console.log(`[Fetching] Querying category ${catId}... (Collected so far: ${newQuestions.length}/${TARGET_NEW_COUNT})`);
    const batch = await fetchOpenTdbBatch(catId, 50);

    let addedFromBatch = 0;
    for (const q of batch) {
      if (newQuestions.length >= TARGET_NEW_COUNT) break;
      const norm = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!norm || existingNormalized.has(norm)) continue;

      // Verify question validity
      if (
        q.question.length > 5 &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        new Set(q.options).size === 4 &&
        q.correctAnswer >= 0 &&
        q.correctAnswer <= 3
      ) {
        existingNormalized.add(norm);
        newQuestions.push(q);
        addedFromBatch++;
      }
    }

    console.log(`Added ${addedFromBatch} unique questions from batch. Total collected: ${newQuestions.length}`);

    // Wait 5 seconds between OpenTDB requests to respect rate limit
    if (newQuestions.length < TARGET_NEW_COUNT) {
      await new Promise((r) => setTimeout(r, 5100));
    }
  }

  console.log(`\n🎉 Successfully collected ${newQuestions.length} unique trivia questions!`);

  // Now upload in chunks of 50 to Firebase Realtime Database
  console.log('\n📤 Uploading questions to Firebase Realtime Database in chunks of 50...');
  const CHUNK_SIZE = 50;
  for (let i = 0; i < newQuestions.length; i += CHUNK_SIZE) {
    const slice = newQuestions.slice(i, i + CHUNK_SIZE);
    const chunkObj = {};
    slice.forEach((q, idx) => {
      const key = String(nextIndex + i + idx);
      chunkObj[key] = q;
      existingBank[key] = q;
    });

    const patchRes = await fetch(`${FIREBASE_RTDB_URL}/trivia/global/bank.json?auth=${FIREBASE_DB_SECRET}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chunkObj),
    });

    if (patchRes.ok) {
      process.stdout.write(`✅ Uploaded chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(newQuestions.length / CHUNK_SIZE)}\r`);
    } else {
      console.error(`\n❌ Failed chunk at index ${i}:`, patchRes.status, await patchRes.text());
    }
  }

  console.log('\n\n💾 Saving updated bank to local backup initial_bank.json...');
  fs.writeFileSync(BANK_BACKUP_PATH, JSON.stringify(existingBank, null, 2));

  const totalBankLen = Object.keys(existingBank).length;
  console.log(`Updated initial_bank.json with ${totalBankLen} total questions.`);

  // Update game bankLen in Firebase
  console.log(`Updating trivia/global/game.json (bankLen: ${totalBankLen})...`);
  await fetch(`${FIREBASE_RTDB_URL}/trivia/global/game.json?auth=${FIREBASE_DB_SECRET}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bankLen: totalBankLen }),
  });

  console.log('🏁 1,000 Questions Boost Complete! Everything is synchronized in Firebase and local storage.');
}

main().catch(console.error);
