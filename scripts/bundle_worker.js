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

// 3. Read all initial questions in deterministic numeric key order
const bankPath = path.join(ROOT, 'src', 'data', 'initial_bank.json');
let starterBank = [];
if (fs.existsSync(bankPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
    starterBank = Object.keys(raw)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => raw[k])
      .filter((q) => q && q.question && Array.isArray(q.options));
    console.log(`[bundle_worker] Inlined ${starterBank.length} starter questions into worker memory.`);
  } catch (e) {
    console.warn('[bundle_worker] Failed to parse initial_bank.json:', e);
  }
}

// 4. Generate worker source file
const workerSource = `// ── TRIVIA RUMBLE ELITE: CLOUDFLARE WORKER ──────────────────────────────────
// High-performance V8 edge isolate game engine for Discord Activities & Browser

const SUPPORT_REDIRECT_URL = "https://donate-to-sgss.pages.dev";
const DEFAULT_DISCORD_CLIENT_ID = "1535428947624460328";
const SLOT_DURATION = 20000; // 20s per question
// Stable global tournament epoch matching server.ts and Firebase /trivia/global/game
const GAME_STARTED_AT = 1793995178901;

// Inlined Production Assets
const INDEX_HTML = ${JSON.stringify(indexHtml)};
const ASSETS = ${JSON.stringify(assets)};

// Inlined starter questions
const STARTER_BANK = ${JSON.stringify(starterBank)};

// In-Memory Cached Google OAuth2 Token (for Firebase Admin Service Account auth)
let cachedGoogleToken = null;

function toBase64Url(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8Buffer(pem) {
  const cleaned = String(pem)
    .replace(/\\\\n/g, "\\n")
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\\s+/g, "");
  const bin = atob(cleaned);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function parseServiceAccount(env) {
  const raw = String(env?.FIREBASE_SERVICE_ACCOUNT_JSON || "").trim();
  if (raw) {
    try {
      const jsonStr = raw.startsWith("{") ? raw : atob(raw);
      const parsed = JSON.parse(jsonStr);
      if (parsed?.client_email && parsed?.private_key) {
        return {
          clientEmail: String(parsed.client_email).trim(),
          privateKey: String(parsed.private_key),
          tokenUri: String(parsed.token_uri || "https://oauth2.googleapis.com/token"),
        };
      }
    } catch (e) {
      console.warn("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e.message);
    }
  }
  const email = String(env?.FIREBASE_CLIENT_EMAIL || "").trim();
  const key = String(env?.FIREBASE_PRIVATE_KEY || "").trim();
  if (email && key) {
    return {
      clientEmail: email,
      privateKey: key,
      tokenUri: "https://oauth2.googleapis.com/token",
    };
  }
  return null;
}

async function getFirebaseAccessToken(env) {
  const sa = parseServiceAccount(env);
  if (!sa) return null;

  const nowMs = Date.now();
  if (cachedGoogleToken && cachedGoogleToken.email === sa.clientEmail && nowMs < cachedGoogleToken.expiresAt - 120000) {
    return cachedGoogleToken.accessToken;
  }

  const nowSec = Math.floor(nowMs / 1000);
  const headerB64 = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payloadB64 = toBase64Url(
    JSON.stringify({
      iss: sa.clientEmail,
      scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/firebase.database",
      aud: sa.tokenUri,
      iat: nowSec,
      exp: nowSec + 3600,
    })
  );
  const signingInput = headerB64 + "." + payloadB64;

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8Buffer(sa.privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  const assertion = signingInput + "." + toBase64Url(sigBuf);

  const tokenResp = await fetch(sa.tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });

  if (!tokenResp.ok) {
    const errTxt = await tokenResp.text().catch(() => "");
    throw new Error("OAuth2 token error (" + tokenResp.status + "): " + errTxt);
  }

  const tokenData = await tokenResp.json();
  if (!tokenData?.access_token) {
    throw new Error("OAuth2 response missing access_token");
  }

  cachedGoogleToken = {
    email: sa.clientEmail,
    accessToken: tokenData.access_token,
    expiresAt: Date.now() + (Number(tokenData.expires_in) || 3600) * 1000,
  };
  return cachedGoogleToken.accessToken;
}

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
    // Always return fixed epoch so clients compute identical global slot indices
    questionStart: GAME_STARTED_AT,
    startedAt: GAME_STARTED_AT,
    slotStart,
    slotEnd: slotStart + SLOT_DURATION,
    currentSlot,
    currentIndex: currentSlot % bankLen,
  };
}

async function exchangeDiscordCode(clientId, clientSecret, code, redirectUri) {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
  });
  if (redirectUri) {
    params.set("redirect_uri", redirectUri);
  }
  const resp = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, data };
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

      // 3b. Discord Client Config
      if (path === "/api/discord-config" && method === "GET") {
        return json({
          clientId: (env?.DISCORD_CLIENT_ID || DEFAULT_DISCORD_CLIENT_ID).trim(),
        });
      }

      // 4. Discord OAuth Code Exchange
      if (path === "/api/exchange" && method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const code = typeof body?.code === "string" ? body.code.trim() : "";
          const clientId = String(
            body?.client_id || body?.clientId || env?.DISCORD_CLIENT_ID || DEFAULT_DISCORD_CLIENT_ID
          ).trim();
          const clientSecret = String(env?.DISCORD_CLIENT_SECRET || "").trim();
          const redirectUri = String(
            body?.redirect_uri || body?.redirectUri || env?.REDIRECT_URI || url.origin
          ).trim();

          if (!code) {
            return json({ error: "Missing code" }, 400);
          }
          if (!clientSecret) {
            return json({ error: "Discord client secret not configured on edge" }, 501);
          }

          let result = await exchangeDiscordCode(clientId, clientSecret, code, redirectUri);

          // If Discord Activity exchange succeeded/failed specifically on redirect_uri mismatch,
          // retry without redirect_uri (Discord Embedded App SDK exchanges often omit it).
          if (!result.ok && redirectUri && result.status === 400) {
            result = await exchangeDiscordCode(clientId, clientSecret, code, "");
          }

          return json(result.data, result.status);
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
          firebaseConfigured: Boolean(env?.FIREBASE_RTDB_URL && (parseServiceAccount(env) || env?.FIREBASE_DB_SECRET)),
          firebaseAuthMode: parseServiceAccount(env) ? "service_account_oauth2" : (env?.FIREBASE_DB_SECRET ? "legacy_secret" : "none"),
          timestamp: Date.now(),
        });
      }

      // 6. Firebase REST Proxy (uses encrypted Worker secrets + enforces strict path/method rules)
      if (path.startsWith("/firebase/")) {
        const upstreamBase = String(env?.FIREBASE_RTDB_URL || "").replace(/\\/+$/, "");
        const legacySecret = String(env?.FIREBASE_DB_SECRET || "").trim();
        const subPath = path.replace(/^\\/firebase\\//, "");
        const cleanRaw = subPath.replace(/\\.json$/, "");
        const effectiveMethod = (request.headers.get("x-fb-method") || method).toUpperCase();

        const isAllowedRead =
          effectiveMethod === "GET" &&
          (cleanRaw === "trivia/global/bank" ||
            cleanRaw === "trivia/global/game" ||
            cleanRaw === "trivia/global/players" ||
            /^trivia\\/global\\/players\\/[^/]+$/.test(cleanRaw) ||
            /^trivia\\/global\\/answers\\/\\d+$/.test(cleanRaw));

        const isAllowedWrite =
          (effectiveMethod === "PUT" || effectiveMethod === "PATCH") &&
          (/^trivia\\/global\\/players\\/[^/]+$/.test(cleanRaw) ||
            /^trivia\\/global\\/answers\\/\\d+\\/[^/]+$/.test(cleanRaw));

        if (!isAllowedRead && !isAllowedWrite) {
          return json({ error: "Forbidden Firebase operation" }, 403);
        }

        let reqBody = null;
        if (effectiveMethod !== "GET" && effectiveMethod !== "HEAD") {
          reqBody = await request.text();
        }

        let oauthToken = null;
        if (upstreamBase) {
          try {
            oauthToken = await getFirebaseAccessToken(env);
          } catch (authErr) {
            console.warn("[Firebase Admin] OAuth token mint error:", authErr.message);
          }
        }

        if (upstreamBase && (oauthToken || legacySecret)) {
          const searchParams = new URLSearchParams(url.search);
          searchParams.delete("ns");
          searchParams.delete("auth");
          searchParams.delete("access_token");
          if (!oauthToken && legacySecret) {
            searchParams.set("auth", legacySecret);
          }
          if ((searchParams.has("limitToLast") || searchParams.has("limitToFirst")) && !searchParams.has("orderBy")) {
            searchParams.set("orderBy", '"$key"');
          }

          const target = \`\${upstreamBase}/\${subPath}\${searchParams.toString() ? "?" + searchParams.toString() : ""}\`;
          const headers = {};
          if (reqBody) headers["Content-Type"] = "application/json";
          if (oauthToken) headers["Authorization"] = \`Bearer \${oauthToken}\`;

          try {
            const upstreamRes = await fetch(target, {
              method: effectiveMethod,
              headers: Object.keys(headers).length ? headers : undefined,
              body: reqBody || undefined,
            });
            if (upstreamRes.status === 401 || upstreamRes.status === 403) {
              cachedGoogleToken = null;
            }
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
        }

        if (cleanRaw === "trivia/global/bank") {
          return json(STARTER_BANK);
        }
        if (cleanRaw === "trivia/global/game") {
          return json(getGameState());
        }
        if (cleanRaw === "trivia/global/players") {
          return json(memoryPlayers);
        }
        const pMatch = cleanRaw.match(/^trivia\\/global\\/players\\/([^/]+)$/);
        if (pMatch) {
          const pid = pMatch[1];
          if (effectiveMethod === "GET") {
            return json(memoryPlayers[pid] || null);
          }
          if (effectiveMethod === "PUT" || effectiveMethod === "PATCH") {
            const body = reqBody ? JSON.parse(reqBody) : {};
            memoryPlayers[pid] = { ...(memoryPlayers[pid] || { id: pid }), ...body };
            return json(memoryPlayers[pid]);
          }
        }

        const aSlotMatch = cleanRaw.match(/^trivia\\/global\\/answers\\/(\\d+)$/);
        if (aSlotMatch) {
          const slot = aSlotMatch[1];
          return json(memoryAnswers[slot] || {});
        }
        const aPlayerMatch = cleanRaw.match(/^trivia\\/global\\/answers\\/(\\d+)\\/([^/]+)$/);
        if (aPlayerMatch) {
          const [, slot, pid] = aPlayerMatch;
          const body = reqBody ? JSON.parse(reqBody) : {};
          if (!memoryAnswers[slot]) memoryAnswers[slot] = {};
          memoryAnswers[slot][pid] = body;
          return json(body);
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
