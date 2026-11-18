# BlogHub API — Publishing Platform Backend

The BlogHub backend is a JavaScript REST API built with Express 5 and MongoDB/Mongoose. It provides JWT authentication, author-owned publishing, private drafts, paginated discovery, persistent likes, bookmarks and article discussion.

## Current capabilities

- Registration and login with bcrypt password hashing
- JWT-protected endpoints with server-side user lookup
- Create, list, read, update and delete stories
- Draft and published states; drafts are visible only through authenticated author endpoints
- Editorial metadata: generated slug identifier, excerpt, up to eight tags and estimated reading time
- Server-side ownership checks for story edits and deletion
- Bounded server-side pagination and escaped search across title, excerpt, body and tags
- Creator profile with published/draft counts
- Persistent likes and personal bookmarks with authenticated toggles
- Article comments with author/owner deletion permissions and bounded cursor pagination (up to 50 per page)
- Public author profiles with published-story pagination and follower/following counts\n- Public followers and following directories with bounded pagination and minimal profile fields
- Persistent follow/unfollow relationships with unique-pair protection and self-follow prevention
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
- `/api/blogs/:id/comments` — public list and authenticated comment creation; pass `limit` (1–50) for a paginated `{ items, pagination }` response, then pass `pagination.nextCursor` as `cursor` to load the next page. Requests without pagination parameters retain the legacy array response (capped at 50 comments).
- `/api/blogs/comments/:commentId` — author/story-owner comment removal
- `/api/users/me` — authenticated creator profile
- `/api/users/bookmarks` — authenticated reading list
- `/api/users/:userId` — public author profile, published stories (`page`, `limit`), follower/following counts and optional signed-in follow state
- `GET /api/users/:userId/followers?page=1&limit=12` and `GET /api/users/:userId/following?page=1&limit=12` — public, bounded directories (maximum 20 profiles per page)\n- `POST /api/users/:userId/follow` and `DELETE /api/users/:userId/follow` — authenticated, idempotent follow/unfollow
- `/api/health` — process health

## Quality checks

```bash
npm test
node --check server.js
```

The current unit suite covers request validation. Database-backed integration tests, comment moderation, notifications, and full role-based publishing workflows remain on the BlogHub 2.0 roadmap.
