# Chibi Bot Dashboard

A comprehensive web dashboard for [Chibi Bot](https://github.com/Powenwen/chibi-bot) — a Discord bot built with TypeScript, MongoDB, and Redis.

## Overview

The Chibi Bot Dashboard provides three distinct surfaces:

1. **Public Homepage** — Marketing landing page with features, stats, and command reference
2. **User Dashboard** — Guild management portal for server admins (Discord OAuth2)
3. **Developer Dashboard** — Restricted portal for bot owners with analytics and global management

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **State Management:** Zustand (local UI state)
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Icons:** Lucide React
- **Backend API:** Express/Fastify (Node.js + TypeScript)
- **Auth:** Discord OAuth2 with Redis-backed sessions
- **Database:** MongoDB (`chibibase`)
- **Cache:** Redis

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # Top navigation with auth
│   │   └── Sidebar.tsx         # Collapsible sidebar (user/dev modes)
│   ├── ui/
│   │   ├── StatCard.tsx        # Animated KPI card
│   │   ├── FeatureToggle.tsx   # Enable/disable toggle
│   │   ├── Toast.tsx           # Notification system
│   │   ├── ConfirmModal.tsx    # Danger-action confirmation
│   │   ├── DiscordEmbed.tsx    # Discord embed renderer
│   │   └── EmbedBuilder.tsx    # Live embed builder with preview
│   └── home/
│       ├── HeroSection.tsx
│       ├── FeaturesSection.tsx
│       ├── StatsBar.tsx
│       ├── FeatureDeepDive.tsx
│       ├── CommandPreview.tsx
│       └── Footer.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── CommandsPage.tsx
│   ├── dashboard/
│   │   ├── GuildSelectPage.tsx
│   │   ├── GuildDashboard.tsx
│   │   └── tabs/
│   │       ├── OverviewTab.tsx
│   │       ├── WelcomeTab.tsx
│   │       ├── StickyTab.tsx
│   │       ├── AutoReactionsTab.tsx
│   │       ├── AutoResponderTab.tsx
│   │       ├── SuggestionsTab.tsx
│   │       ├── AutoModTab.tsx
│   │       ├── EscalationTab.tsx
│   │       ├── LogsTab.tsx
│   │       └── SettingsTab.tsx
│   ├── dev/
│   │   ├── DevDashboard.tsx
│   │   ├── DevOverview.tsx
│   │   ├── DevStatus.tsx
│   │   ├── DevGuilds.tsx
│   │   ├── DevUsers.tsx
│   │   ├── DevCommands.tsx
│   │   ├── DevLogs.tsx
│   │   ├── DevConfig.tsx
│   │   └── DevAlerts.tsx
│   └── ErrorPages.tsx
├── services/
│   ├── api.ts                  # Main API client (axios)
│   ├── auth.ts                 # Discord OAuth2 handlers
│   ├── db.ts                   # MongoDB schemas & types
│   ├── redis.ts                # Redis cache & session store
│   ├── botApi.ts               # Bot internal API client
│   ├── websocket.ts            # WebSocket client
│   ├── audit.ts                # Audit logging
│   └── apiRoutes.ts            # Backend route documentation
├── types/
│   └── api.ts                  # Complete API type definitions
├── store/
│   └── useStore.ts             # Zustand global state
├── data/
│   └── mockData.ts             # Demo data
└── utils/
    └── cn.ts                   # Tailwind class merger
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Backend Server (in root .env)
SERVER_PORT=3000
SERVER_URL=http://localhost:3000
DASHBOARD_URL=http://localhost:5173
SESSION_SECRET=your_session_secret_here

# Discord OAuth2
CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Bot Token
TOKEN=your_discord_bot_token

# Owner IDs (JSON array)
OWNER_IDS=["your_owner_user_id"]

# Frontend (in chibi-bot-web-dashboard/.env)
VITE_API_BASE_URL=http://localhost:3000
```

## Database Collections

The dashboard reads/writes to these MongoDB collections in `chibibase`:

| Collection | Access |
|---|---|
| `welcomesystems` | Read/Write |
| `stickymessages` | Read/Write |
| `autoreactions` | Read/Write |
| `autoresponders` | Read/Write |
| `suggestionchannels` | Read/Write |
| `suggestions` | Read/Write |
| `automoderations` | Read/Write |
| `warningescalations` | Read/Write |
| `moderationlogs` | **Read-only** |
| `dashboardaudit` | Write-only (auto) |
| `globalconfig` | Developer only |
| `commandstats` | Developer only |

## Bot Internal API

The bot exposes these endpoints (secured with `X-Dashboard-Secret`):

```
GET  /api/stats                    → Bot runtime stats
GET  /api/guilds/:guildId          → Guild info
GET  /api/guilds/:guildId/channels → Channel list
GET  /api/guilds/:guildId/roles    → Role list
POST /api/guilds/:guildId/reload   → Hot-reload config
```

## Authentication Flow

1. User clicks "Login with Discord" on the dashboard
2. Redirected to Discord OAuth2 with scopes: `identify`, `guilds`, `guilds.members.read`
3. Backend exchanges code for tokens at `/auth/discord/callback`
4. Session stored in Redis (custom IoRedisStore), session cookie set
5. Dashboard validates session via `/auth/me` on each visit
6. Guild list fetched from `/auth/guilds` with bot cross-reference (cached 5 min)

## Role Hierarchy

| Role | Access |
|---|---|
| Anonymous | Public homepage only |
| User | Guilds where they have MANAGE_GUILD or ADMINISTRATOR |
| Developer | Full developer dashboard (OWNER_IDS) |

## Security

- All API routes authenticated via server-side session cookie
- Bot internal API called **only** from dashboard backend
- Rate limiting: 100 req/min per user (Redis)
- Zod validation on all request bodies
- CSP headers, CORS, HTTPS in production
- All writes logged to `dashboardaudit` collection
- Moderation logs are **read-only** from dashboard

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Docker

The dashboard can be deployed as a single container or split into API + SPA:

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN bun install --only=production
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["node", "server/index.js"]
```

### Environment

- `NODE_ENV=development` — Full error stacks
- `NODE_ENV=production` — Suppressed errors, caching headers

### Health Check

```
GET /health → { status: "ok", uptime: N }
```

## License

ISC
