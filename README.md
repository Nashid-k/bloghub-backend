# BlogHub API — Publishing Platform Backend

The BlogHub backend is a JavaScript REST API built with Express 5 and MongoDB/Mongoose. It provides JWT authentication, author-owned publishing, private drafts, paginated discovery, persistent likes, bookmarks and article discussion.

## Current capabilities

- Registration and login with bcrypt password hashing
- JWT-protected endpoints with server-side user lookup
- Create, list, read, update and delete stories
- Draft and published states; drafts are visible only through authenticated author endpoints
- Editorial metadata: unique slug identifier, excerpt, up to eight tags and estimated reading time
- Server-side ownership checks for story edits and deletion
- Bounded server-side pagination and escaped search across title, excerpt, body and tags
- Creator profile with published/draft counts
- Persistent likes and personal bookmarks with authenticated toggles
- Article comments with author/owner deletion permissions
- Public responses expose reaction counts rather than reader identity lists
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
- `/api/blogs/:id/like` — authenticated like/unlike toggle
- `/api/blogs/:id/bookmark` — authenticated save/unsave toggle
- `/api/blogs/:id/comments` — public list and authenticated comment creation
- `/api/blogs/comments/:commentId` — author/story-owner comment removal
- `/api/users/me` — authenticated creator profile
- `/api/users/bookmarks` — authenticated reading list
- `/api/health` — process health

## Quality checks

```bash
npm test
node --check server.js
```

The current unit suite covers request validation. Database-backed integration tests, comment pagination/moderation, follow graphs, and full role-based publishing workflows remain on the BlogHub 2.0 roadmap.
