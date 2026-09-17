# FlyRank Backend AI & Auth API

A secure, production-ready Node.js + Express API combining the FlyRank AI Summarizer feature with Supabase Authentication, JWT Bearer verification, reusable Express auth middleware, protected profile/dashboard routes, protected logout, and interactive Swagger/OpenAPI documentation.

---

## Features

- **Supabase Auth Integration**: Full user signup (`POST /auth/signup`) and login (`POST /auth/login`).
- **JWT Access-Token Verification**: Centralized token verification using `supabase.auth.getUser(token)`.
- **Reusable Express Auth Middleware**: Single-source-of-truth authentication middleware (`src/middleware/auth.js`) protecting sensitive routes.
- **Protected Profile Route**: `GET /protected/profile` returning safe user metadata (`id`, `email`, `created_at`).
- **Protected Dashboard Route**: `GET /protected/dashboard` returning dashboard welcome message and safe user info.
- **Protected Logout Route**: `POST /auth/logout` invalidating current session context.
- **Public Endpoint**: `GET /public/info` accessible without authentication.
- **AI Summarization Engine**: `POST /summarize` summarizing input text into exactly 3 schema-validated bullet points via swappable LLM providers (Groq, Gemini, Ollama).
- **Interactive Swagger/OpenAPI 3.0 Documentation**: Served at `/docs` with `bearerAuth` security scheme and lock icons on protected routes.

---

## Tech Stack

- **Runtime**: Node.js (v25+)
- **Framework**: Express (v5.2.1)
- **Authentication**: Supabase Auth (`@supabase/supabase-js` v2.116.0)
- **API Documentation**: Swagger UI Express (`swagger-ui-express` v5.0.1) & OpenAPI 3.0.0
- **Validation**: Zod (v4.4.3)
- **AI Provider Seam**: Node Fetch (v2.7.0) supporting Groq, Gemini, and Ollama backends

---

## Project Structure

```text
.
├── .env.example            # Environment variables template with placeholders
├── .gitignore              # Git ignore rules (ignoring .env, node_modules)
├── package.json            # Dependencies and scripts configuration
├── README.md               # Project documentation
├── docs/
│   └── assets/
│       └── swagger-ui.png  # Swagger UI screenshot
└── src/
    ├── ai/                 # Swappable AI provider seam & pricing logic
    ├── middleware/
    │   └── auth.js         # Reusable JWT authentication middleware
    ├── routes/
    │   ├── auth.js         # Auth routes (/auth/signup, /auth/login, /auth/logout)
    │   ├── protected.js    # Public & Protected routes (/public/info, /protected/profile, /protected/dashboard)
    │   └── summarize.js    # AI summarizer route (/summarize)
    ├── schemas/
    │   └── summarySchema.js# Zod schema for structured output validation
    ├── swagger/
    │   └── openapi.json    # OpenAPI 3.0.0 specification
    ├── app.js              # Express app initialization & server entrypoint
    └── supabase.js         # Supabase client setup & env validation
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (v25+ recommended)
- **Supabase Account & Project**: Active project URL and anon API key
- **AI Provider API Key (Optional)**: Groq or Gemini API key if using cloud AI providers

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. Never commit `.env` to source control.

```env
PORT=3000

# Supabase configuration
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key

# Which provider the seam should use: groq | gemini | ollama
AI_PROVIDER=groq

# Only the key for your chosen provider is required
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.1-8b-instant

GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-1.5-flash

OLLAMA_URL=http://localhost:11434/api/chat
OLLAMA_MODEL=llama3.1

AI_TIMEOUT_MS=10000
```

---

## Installation

Install project dependencies using `npm`:

```bash
npm install
```

Copy environment template:

```bash
cp .env.example .env
```

---

## Running the API

Start the server using `npm start` or development mode:

```bash
npm start
# or:
npm run dev
```

By default, the server runs on `http://localhost:3000` (or the `PORT` specified in your `.env`).

---

## API Reference

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| `GET` | `/health` | None | Health check returning status and active AI provider |
| `POST` | `/summarize` | None | Summarizes text into 3 bullet points via AI |
| `POST` | `/auth/signup` | None | Registers a new user via Supabase Auth |
| `POST` | `/auth/login` | None | Authenticates user and returns JWT access & refresh tokens |
| `POST` | `/auth/logout` | `Bearer <access_token>` | Protected: Invalidates current session |
| `GET` | `/public/info` | None | Unauthenticated public info route |
| `GET` | `/protected/profile` | `Bearer <access_token>` | Protected: Returns safe user profile metadata (`id`, `email`, `created_at`) |
| `GET` | `/protected/dashboard` | `Bearer <access_token>` | Protected: Returns dashboard welcome message and basic user info |
| `GET` | `/docs` | None | Interactive Swagger UI API documentation |

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Express as Express API (app.js)
    participant Middleware as Auth Middleware (src/middleware/auth.js)
    participant Supabase as Supabase Auth SDK

    Client->>Express: POST /auth/signup (email, password)
    Express->>Supabase: supabase.auth.signUp()
    Supabase-->>Client: 201 Created (safe user object)

    Client->>Express: POST /auth/login (email, password)
    Express->>Supabase: supabase.auth.signInWithPassword()
    Supabase-->>Client: 200 OK (access_token, refresh_token)

    Client->>Express: GET /protected/profile (Authorization: Bearer <access_token>)
    Express->>Middleware: Extract Bearer token
    Middleware->>Supabase: supabase.auth.getUser(token)
    Supabase-->>Middleware: Returns verified user object
    Middleware->>Express: Attach req.user & next()
    Express-->>Client: 200 OK (safe user profile metadata)
```

---

## HTTP Status Codes

- **`200 OK`**: Successful GET / POST processing.
- **`201 Created`**: User account successfully created via `POST /auth/signup`.
- **`204 No Content`**: Successful logout via `POST /auth/logout`.
- **`400 Bad Request`**: Missing required input fields (e.g. missing email/password or non-string text).
- **`401 Unauthorized`**: Missing, malformed, invalid, expired, or tampered JWT access token, or invalid login credentials.

---

## Swagger UI

Interactive Swagger documentation is available at:

`http://localhost:3000/docs/`

### How to Authenticate in Swagger UI:
1. Open `http://localhost:3000/docs/` in your browser.
2. Obtain a valid JWT `access_token` by calling `POST /auth/login`.
3. Click the green **Authorize** button at the top right of the Swagger UI.
4. Enter your `access_token` into the `Value` field and click **Authorize**.
5. Test protected endpoints (`/protected/profile`, `/protected/dashboard`, `/auth/logout`) directly in the interactive UI.

![Swagger UI](docs/assets/swagger-ui.png)

---

## Testing

Comprehensive testing commands using `curl`:

### 1. Health Check
```bash
curl http://localhost:3000/health
# Response 200: {"status":"ok","provider":"groq"}
```

### 2. Public Info
```bash
curl http://localhost:3000/public/info
# Response 200: {"message":"Welcome stranger! This info is public."}
```

### 3. User Signup
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
# Response 201: {"user":{"id":"...","email":"user@example.com"}}
```

### 4. User Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
# Response 200: {"access_token":"...","refresh_token":"...","user":{...}}
```

### 5. Access Protected Profile (Valid JWT)
```bash
curl http://localhost:3000/protected/profile \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
# Response 200: {"user":{"id":"...","email":"...","created_at":"..."}}
```

### 6. Access Protected Profile (Missing / Tampered Token)
```bash
curl http://localhost:3000/protected/profile
# Response 401: {"error":"Access token required"}

curl http://localhost:3000/protected/profile \
  -H "Authorization: Bearer invalid_or_tampered_token"
# Response 401: {"error":"Invalid or expired token"}
```

### 7. Access Protected Dashboard
```bash
curl http://localhost:3000/protected/dashboard \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
# Response 200: {"message":"Welcome to the protected dashboard","user":{...}}
```

### 8. User Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
# Response 204 No Content
```

---

## Security Practices

- **Password Security**: User authentication and password management are handled directly by Supabase Auth. Passwords are never stored, hashed manually, or logged by Express.
- **Token Verification**: Protected routes require valid `Bearer <access_token>` headers and are verified via `supabase.auth.getUser(token)`.
- **Centralized Middleware**: Reusable Express middleware (`src/middleware/auth.js`) eliminates duplicate authentication logic.
- **Environment Isolation**: `.env` is strictly gitignored (`.gitignore:2:.env`) and absent from all Git history.
- **No Service Role Keys**: Only public anon keys are used; `service_role` keys are never used in the application.

---

## Git Stage History

| Stage | Commit Message | Commit Hash |
|---|---|---|
| Stage 0 | `Stage 0: setup server and supabase client` | `ef7c4e70c9beba20861898e4be4cae9f487c3c31` |
| Stage 1 | `Stage 1: signup and login routes working` | `ad4ea15a1a618531948ed42060fa45956ee21113` |
| Stage 2 | `Stage 2: public route and unverified protected route` | `9e2d20d4ace8591551fa17e74c189ee22390df02` |
| Stage 3 | `Stage 3: profile route token verification` | `c283ddee7bf1cab3f0f12559d10b65658ff88a91` |
| Stage 4 | `Stage 4: auth middleware and logout endpoint` | `37d8aad9533fa97810f97929be71fb90c1009b8f` |
| Stage 5 | `Stage 5: Swagger UI documentation with bearer auth` | `c6a515c64d4578532b650300d61ef8f0b1ef3254` |
| Stage 6 | `Stage 6: publish to GitHub and write README` | *(Current commit)* |

---

## Project Status

Stages 0 through 6 have been fully implemented, verified, and committed incrementally.
