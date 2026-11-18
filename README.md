# BlogHub API — Publishing Platform Backend

The BlogHub backend is a JavaScript REST API built with Express 5 and MongoDB/Mongoose. It currently provides JWT authentication, account profiles and author-owned story CRUD. The product roadmap describes the planned evolution toward a multi-author publishing platform; roadmap items are not yet implemented.

## Current capabilities

- Registration and login with bcrypt password hashing
- JWT-protected endpoints with server-side user lookup
- Create, list, read, update and delete stories
- Draft and published states; drafts are visible only through authenticated author endpoints
- Editorial metadata: unique slug identifier, excerpt, up to eight tags and estimated reading time
- Server-side ownership checks for story edits and deletion
- Bounded server-side pagination and escaped search across title, excerpt, body and tags
- Creator profile with published/draft counts
- Request size and CORS origin boundaries

## Stack

Node.js 20+, Express 5, MongoDB, Mongoose, JWT, bcryptjs, dotenv and Nodemon.

## Project layout

```text
server/
├── config/db.js
├── controllers/
├── middleware/
├── models/
├── routes/
├── tests/
├── utils/validation.js
├── server.js
└── package.json
```

## Run locally

```bash
git clone https://github.com/Nashid-k/bloghub-backend.git
cd bloghub-backend/server
npm ci
cp .env.example .env
npm run dev
```

The API defaults to port 5000.

## Environment

| Variable | Purpose |
|---|---|
| PORT | API port |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Required signing secret of at least 32 characters |
| CLIENT_URL | Comma-separated list of allowed frontend origins |
| NODE_ENV | Runtime environment |

Generate a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Never commit the resulting value.

## API routes

- `/api/auth` — registration, login and logout response
- `/api/blogs` — public published-story feed (`page`, `limit`, `search`); authenticated `/mine` and `/mine/:id`; author-owned CRUD
- `/api/users` — authenticated current-user profile
- `/api/health` — process health

## Quality checks

```bash
npm test
node --check server.js
```

The test suite currently covers shared request validators. Database-backed integration tests and full role-based publishing workflows are planned in the BlogHub 2.0 roadmap.
