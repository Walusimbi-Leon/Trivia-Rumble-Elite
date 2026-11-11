# 🎮 Trivia Rumble Elite

<p align="center">
  <img src="https://img.shields.io/badge/Deploy%20Status-Live-10b981?style=for-the-badge&logo=cloudflare" alt="Cloudflare Worker" />
  <img src="https://img.shields.io/badge/Live%20Endpoint-trivia--rumble--elite.walusimbileon1.workers.dev-6366f1?style=for-the-badge" alt="Live URL" />
  <img src="https://img.shields.io/badge/Discord%20Activity-Ready-5865F2?style=for-the-badge&logo=discord" alt="Discord Activity" />
  <img src="https://img.shields.io/badge/Monthly%20Invocations-72,000%2B-purple?style=for-the-badge" alt="Invocations" />
</p>

**Trivia Rumble Elite** is a high-speed, competitive multiplayer trivia tournament game engineered for **Discord Activities (Embedded App SDK)** and **modern web browsers**. Deployed directly to the global Cloudflare edge via Cloudflare Workers V8 Isolates, the game delivers sub-millisecond round progression, real-time leaderboards, synchronized questions, and zero-cold-start performance for thousands of concurrent players.

🌐 **Live Game Endpoint**: [https://trivia-rumble-elite.walusimbileon1.workers.dev/](https://trivia-rumble-elite.walusimbileon1.workers.dev/)  
📊 **SGSS Live Telemetry**: [https://sgss-statistics.pages.dev](https://sgss-statistics.pages.dev)  
🏛 **Founder & Organization**: [Walusimbi Leon](https://github.com/Walusimbi-Leon) · [SGSS Org](https://walusimbi-leon-portifolio.pages.dev)  
💖 **Support Developer**: [https://donate-to-sgss.pages.dev](https://donate-to-sgss.pages.dev)  

---

## ⚡ Game Features & Architecture

- **Global Synchronized Game Loop**: All players worldwide share the exact same 20-second question slots, synchronized via the `/api/time` edge endpoint. 15 seconds to answer, 5 seconds reveal and scoring phase.
- **Dual Platform Support**:
  - **Discord Activity Mode**: Seamlessly authenticates with Discord Embedded App SDK (`@discord/embedded-app-sdk`), pulling the player's Discord avatar, username, and channel state. Supports both PKCE and confidential client OAuth code exchange.
  - **Browser Mode**: Instant play with persistent guest credentials (`Guest 123`) in localStorage—no account creation required.
- **1,250+ Question Bank**: Comprehensive question library spanning science, history, geography, arts, pop culture, sports, and literature.
- **Dynamic Scoring & Streaks**: Base points awarded for accuracy, speed bonuses awarded for quick reflexes, and streak multipliers for consecutive correct answers.
- **Real-Time Leaderboards**: Dual tabs displaying the **Global Top Players** (all-time hall of fame) and **Live In-Arena Players** (currently active challengers).
- **Edge Security & Privacy**: Sandboxed `/firebase` REST proxy enforcing auth secrets and CORS headers, with complete Privacy Policy and Terms of Service modals.

---

## 🛠 Technology Stack

- **Edge Runtime**: Cloudflare Workers (V8 Isolates)
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion
- **Tooling**: Vite 8, esbuild, Wrangler 4
- **Integrations**: Discord Embedded App SDK (`@discord/embedded-app-sdk`), Firebase Realtime Database REST API, Paystack 3DS Support Gateway

---

## 🚀 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Walusimbi-Leon/Trivia-Rumble-Elite.git
   cd Trivia-Rumble-Elite
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

---

## 📦 Cloudflare Worker Build & Deployment

To bundle the modern React frontend and Cloudflare Worker into a single high-performance edge isolate:

```bash
# 1. Build the React frontend
npm run build

# 2. Bundle the self-contained worker with inlined assets and starter questions
node scripts/bundle_worker.js

# 3. Deploy to Cloudflare Workers
npx wrangler deploy --config wrangler.toml
```

---

## 📄 License & Credits

Developed and operated by **Walusimbi Leon**, Founder and CEO of **SGSS Org**. Hosted on Cloudflare's global edge network.
