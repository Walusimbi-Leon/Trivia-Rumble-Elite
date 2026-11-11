import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const DIST = path.join(ROOT, 'dist');
const ASSETS_DIR = path.join(DIST, 'assets');

if (!fs.existsSync(DIST)) {
  console.error('[bundle_worker] dist/ directory not found. Please run vite build first.');
  process.exit(1);
}

// 1. Read dist/index.html
const indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8');

// 2. Read all assets in dist/assets
const assets = {};
if (fs.existsSync(ASSETS_DIR)) {
  const files = fs.readdirSync(ASSETS_DIR);
  for (const f of files) {
    const fullPath = path.join(ASSETS_DIR, f);
    const content = fs.readFileSync(fullPath, 'utf-8');
    assets[`/assets/${f}`] = content;
    console.log(`[bundle_worker] Inlined asset /assets/${f} (${(content.length / 1024).toFixed(1)} KB)`);
  }
}

// 3. Read initial questions
const bankPath = path.join(ROOT, 'src', 'data', 'initial_bank.json');
let starterBank = [];
if (fs.existsSync(bankPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
    starterBank = Object.values(raw).slice(0, 500); // 500 questions in memory
    console.log(`[bundle_worker] Inlined ${starterBank.length} starter questions into worker memory.`);
  } catch (e) {
    console.warn('[bundle_worker] Failed to parse initial_bank.json:', e);
  }
}

// 4. Generate worker source file
const workerSource = `
// ── TRIVIA RUMBLE ELITE: CLOUDFLARE WORKER ──────────────────────────────────
// High-performance V8 edge isolate game engine for Discord Activities & Browser

const FIREBASE_RTDB_DEFAULT = "https://studio-3101124565-bd63c-default-rtdb.firebaseio.com";
const FIREBASE_SECRET_DEFAULT = "V6BCS2vL24IlYodAvZ6t6h5fbBYJEOdBM8JYUI30";
const SUPPORT_REDIRECT_URL = "https://donate-to-sgss.pages.dev";

const SLOT_DURATION = 20000; // 20s per question
const GAME_STARTED_AT = 1725488315000;

// Inlined Production Assets
const INDEX_HTML = ${JSON.stringify(indexHtml)};
const ASSETS = ${JSON.stringify(assets)};

// Inlined starter questions
const STARTER_BANK = ${JSON.stringify(starterBank)};

// In-Memory Fallback Store (for ephemeral state)
let memoryPlayers = {};
let memoryAnswers = {};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Fb-Method, Authorization",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function html(content, status = 200) {
  return new Response(content, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}

function getGameState(now = Date.now()) {
  const bankLen = Math.max(STARTER_BANK.length, 1);
  const elapsed = Math.max(now - GAME_STARTED_AT, 0);
  const currentSlot = Math.floor(elapsed / SLOT_DURATION);
  const slotStart = GAME_STARTED_AT + currentSlot * SLOT_DURATION;
  return {
    bankLen,
    slotDuration: SLOT_DURATION,
    questionStart: slotStart,
    startedAt: GAME_STARTED_AT,
    currentSlot,
    currentIndex: currentSlot % bankLen,
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Fb-Method, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    try {
      // 1. Support & Donation Redirect
      if (path === "/support") {
        return Response.redirect(SUPPORT_REDIRECT_URL, 302);
      }

      // 2. Synchronous Time & Slot Endpoint
      if (path === "/api/time") {
        const now = Date.now();
        return json({
          now,
          game: getGameState(now),
        });
      }

      // 3. Trivia Bank Info
      if (path === "/api/trivia") {
        return json({
          bankLen: STARTER_BANK.length,
          source: "cloudflare_edge_curated",
          requested: 20,
        });
      }

      // 4. Discord OAuth Code Exchange
      if (path === "/api/exchange" && method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const code = body?.code;
          const clientId = env?.DISCORD_CLIENT_ID || "1535428947624460328";
          const clientSecret = env?.DISCORD_CLIENT_SECRET;

          if (!code) {
            return json({ error: "Missing code" }, 400);
          }

          if (!clientSecret) {
            return json({ error: "Discord client secret not configured on edge" }, 501);
          }

          const params = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code,
          });

          const resp = await fetch("https://discord.com/api/v10/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
          });

          const tokenData = await resp.json();
          return json(tokenData, resp.status);
        } catch (err) {
          return json({ error: err.message || "Token exchange failed" }, 500);
        }
      }

      // 5. Database Status Endpoint
      if (path === "/api/database/status") {
        return json({
          status: "healthy",
          engine: "Cloudflare Workers V8 Isolate",
          totalStarterQuestions: STARTER_BANK.length,
          firebaseTarget: env?.FIREBASE_RTDB_URL || FIREBASE_RTDB_DEFAULT,
          timestamp: Date.now(),
        });
      }

      // 6. Firebase REST Proxy
      if (path.startsWith("/firebase/")) {
        const upstreamBase = (env?.FIREBASE_RTDB_URL || FIREBASE_RTDB_DEFAULT).replace(/\\/+$/, "");
        const secret = env?.FIREBASE_DB_SECRET || FIREBASE_SECRET_DEFAULT;
        const subPath = path.replace(/^\\/firebase\\//, "");
        const effectiveMethod = (request.headers.get("x-fb-method") || method).toUpperCase();

        // Query parameters
        const searchParams = new URLSearchParams(url.search);
        searchParams.delete("ns");
        if (secret && !searchParams.has("auth")) {
          searchParams.set("auth", secret);
        }
        if ((searchParams.has("limitToLast") || searchParams.has("limitToFirst")) && !searchParams.has("orderBy")) {
          searchParams.set("orderBy", '"$key"');
        }

        const target = \`\${upstreamBase}/\${subPath}\${searchParams.toString() ? "?" + searchParams.toString() : ""}\`;

        // Attempt upstream fetch
        try {
          const isBodyMethod = effectiveMethod !== "GET" && effectiveMethod !== "HEAD";
          let reqBody = null;
          if (isBodyMethod) {
            reqBody = await request.text();
          }

          const upstreamRes = await fetch(target, {
            method: effectiveMethod,
            headers: reqBody ? { "Content-Type": "application/json" } : undefined,
            body: reqBody || undefined,
          });

          if (upstreamRes.ok) {
            const data = await upstreamRes.text();
            return new Response(data, {
              status: upstreamRes.status,
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store",
              },
            });
          }
        } catch (e) {
          console.warn("[Firebase Proxy] Upstream unreachable, using edge fallback:", e.message);
        }

        // Local Edge Fallback for offline resilience
        const cleanRaw = subPath.replace(/\\.json$/, "");

        // Bank query
        if (cleanRaw === "trivia/global/bank") {
          return json(STARTER_BANK);
        }

        // Game query
        if (cleanRaw === "trivia/global/game") {
          return json(getGameState());
        }

        // Players list
        if (cleanRaw === "trivia/global/players") {
          return json(memoryPlayers);
        }

        // Specific player
        const pMatch = cleanRaw.match(/^trivia\\/global\\/players\\/([^/]+)$/);
        if (pMatch) {
          const pid = pMatch[1];
          if (effectiveMethod === "GET") {
            return json(memoryPlayers[pid] || null);
          }
          if (effectiveMethod === "PUT" || effectiveMethod === "PATCH") {
            const body = await request.json().catch(() => ({}));
            memoryPlayers[pid] = { ...(memoryPlayers[pid] || { id: pid }), ...body };
            return json(memoryPlayers[pid]);
          }
        }

        return json(null);
      }

      // 7. Static Inlined Assets (/assets/*)
      if (ASSETS[path]) {
        const ext = path.split(".").pop() || "";
        const mime = ext === "css" 
          ? "text/css; charset=utf-8" 
          : "application/javascript; charset=utf-8";

        return new Response(ASSETS[path], {
          status: 200,
          headers: {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // 8. Root & SPA Routes
      // /privacy, /terms, /, or unknown paths serve index.html
      return html(INDEX_HTML);

    } catch (fatal) {
      console.error("[TriviaRumbleElite] Worker uncaught error:", fatal);
      return json({ error: "Internal Edge Worker Error", details: fatal.message }, 500);
    }
  },
};
`;

const tempWorkerPath = path.join(ROOT, 'dist', 'raw_worker.ts');
fs.writeFileSync(tempWorkerPath, workerSource, 'utf-8');
console.log(`[bundle_worker] Generated ${tempWorkerPath}`);

// 5. Bundle with esbuild to produce standalone worker.js
const outPath = path.join(ROOT, 'dist', 'worker.js');
esbuild.buildSync({
  entryPoints: [tempWorkerPath],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  outfile: outPath,
});

console.log(`[bundle_worker] Successfully bundled to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)!`);
