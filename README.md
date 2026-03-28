# CalAssist — AI-Powered Calendar Assistant

> Your AI calendar assistant. Just talk.

CalAssist lets you manage your Google Calendar through natural conversation. Type or speak naturally — "Schedule a dentist appointment next Thursday at 2pm" — and CalAssist creates the event, confirms it, and notifies you when the time approaches.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand |
| Backend | Node.js, Express.js, TypeScript |
| Auth | Google OAuth 2.0, JWT (access + refresh tokens) |
| AI / NLP | Gemini API (`gemini-2.5-flash-lite`) — free tier |
| Calendar | Google Calendar API v3 |
| Database | PostgreSQL (Supabase) + Prisma ORM |
| Cache | Redis (Upstash) |

---

## Project Structure

```
calassist/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── server/       # Express.js backend
└── packages/
    └── shared/       # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- A [Google Cloud Console](https://console.cloud.google.com) project with:
  - Google Calendar API enabled
  - OAuth 2.0 credentials (Web application type)
- A [Gemini API key](https://aistudio.google.com) (free)
- A [Supabase](https://supabase.com) project (free tier)
- (Optional) An [Upstash](https://upstash.com) Redis database (free tier)

### 1. Clone and install

```bash
git clone <repo-url>
cd calassist
npm install
```

### 2. Configure the backend

```bash
cd apps/server
cp .env.example .env
# Edit .env with your credentials (see comments in file for where to get each value)
```

**Key values to fill in:**

| Variable | Where to get it |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |
| `DATABASE_URL` / `DIRECT_URL` | Supabase → Project Settings → Database |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `ENCRYPTION_KEY` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

**Google Cloud Console setup:**
1. Create a project
2. Enable "Google Calendar API"
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URI: `http://localhost:4000/api/auth/google/callback`

### 3. Set up the database

```bash
cd apps/server
npm run db:migrate    # Creates tables in Supabase
npm run db:generate   # Generates Prisma client
```

### 4. Configure the frontend

```bash
cd apps/web
cp .env.local.example .env.local
# Edit .env.local (usually just the API URL)
```

### 5. Run in development

From the repo root:

```bash
npm run dev
```

This starts both the backend (port 4000) and frontend (port 3000) concurrently.

Or start them individually:

```bash
# Backend
cd apps/server && npm run dev

# Frontend (separate terminal)
cd apps/web && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — click "Continue with Google" to sign in.

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/auth/google` | No | Redirect to Google OAuth |
| `GET` | `/api/auth/google/callback` | No | OAuth callback |
| `POST` | `/api/auth/refresh` | No | Refresh access token (uses httpOnly cookie) |
| `POST` | `/api/auth/logout` | Yes | Revoke session |
| `GET` | `/api/auth/me` | Yes | Current user |

### Chat
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chat/message` | Yes | Send message → AI → calendar action |
| `GET` | `/api/chat/history` | Yes | Fetch message history |
| `DELETE` | `/api/chat/history` | Yes | Clear history |
| `POST` | `/api/chat/confirm/:messageId` | Yes | Confirm pending event creation |

### Calendar
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/calendar/events` | Yes | List events (`?start=ISO&end=ISO`) |
| `POST` | `/api/calendar/events` | Yes | Create event directly |
| `GET` | `/api/calendar/events/:id` | Yes | Get single event |

### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check (for UptimeRobot) |

---

## Deployment

### Frontend → Vercel

```bash
# Connect your GitHub repo to Vercel
# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL = https://your-backend.onrender.com
```

### Backend → Render

1. Create a new Web Service on Render
2. Set build command: `npm run build`
3. Set start command: `node dist/index.js`
4. Add all environment variables from `.env.example`
5. Update `GOOGLE_CALLBACK_URL` and `FRONTEND_URL` to production URLs

**Keep Render awake:** Add a [UptimeRobot](https://uptimerobot.com) monitor (free) pointing to `https://your-backend.onrender.com/api/health` with a 5-minute check interval. This prevents Render's free tier from sleeping.

---

## Architecture

```
User → Next.js (Vercel) → Express API (Render)
                              ↓
                    ┌─────────┴──────────┐
                    │                    │
              Gemini API           Google Calendar API
              (NLP parsing)        (event CRUD)
                    │                    │
                    └─────────┬──────────┘
                              │
                    PostgreSQL (Supabase)
                    + Redis (Upstash)
```

**How a message becomes an event:**
1. User types "Dentist appointment Friday at 10am"
2. Frontend sends to `POST /api/chat/message`
3. Backend sends message + conversation history to Gemini
4. Gemini returns structured JSON: `{ intent: "CREATE_EVENT", event: { title: "Dentist appointment", startDateTime: "2026-04-03T10:00:00Z", ... }, confidence: 0.96 }`
5. If confidence ≥ 0.85 → event created in Google Calendar immediately
6. If confidence < 0.85 → `EventConfirmCard` shown in chat, user confirms manually
7. Assistant reply returned and displayed in chat

---

## Development Notes

- **Token storage**: Access tokens live in Zustand memory only (XSS-safe). Refresh tokens are httpOnly Secure cookies.
- **Gemini free tier**: 1,000 req/day, 15 RPM. Sufficient for personal use. Rate limiter on `/api/chat/message` (30 req/min) protects quota.
- **Calendar caching**: Events cached in Redis with 5-min TTL to reduce Google Calendar API calls.
- **Token encryption**: Google OAuth tokens are AES-256-GCM encrypted before being stored in the database.
