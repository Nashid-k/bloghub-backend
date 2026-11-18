# BlogHub API — Publishing Platform Backend

<p align="center">
  <strong>A REST API for publishing stories, managing readers, and powering creator communities.</strong>
</p>

<p align="center">
  <a href="https://github.com/Nashid-k/bloghub-backend">Backend</a>
  ·
  <a href="https://github.com/Nashid-k/bloghub-frontend">Frontend</a>
</p>

BlogHub API is the server-side application for BlogHub. It provides authentication, author-owned publishing, public story discovery, reader engagement, author relationships, and a persistent notification inbox. It is built with **Node.js, Express 5, MongoDB, and Mongoose**.

---

## Contents

- [Capabilities](#capabilities)
- [Architecture](#architecture)
- [Technology](#technology)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Run and test](#run-and-test)
- [API reference](#api-reference)
- [Authentication and authorization](#authentication-and-authorization)
- [Pagination](#pagination)
- [Error handling](#error-handling)
- [Security considerations](#security-considerations)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
- [Related project](#related-project)

## Capabilities

### Accounts and authentication
- Account registration and login.
- Password hashing with bcryptjs.
- JWT-based authentication middleware for protected endpoints.
- Optional authentication for public author-profile responses.

### Publishing
- Create, retrieve, update, and delete stories.
- Draft and published story states.
- Author-only access to private drafts and ownership-protected mutations.
- Editorial metadata including slug, excerpt, tags, publication time, and estimated reading time.
- Public discovery and search over published stories.
- Bounded page-based pagination for the main story feed.

### Reader engagement
- Persistent likes with server-calculated counts.
- Personal bookmarks and a saved-story endpoint.
- Article comments with authenticated creation.
- Comment deletion restricted to the comment author or story author.
- Public engagement responses expose counts rather than lists of reader identities.

### Authors and community
- Public author profiles.
- Follower and following counts and paginated directories.
- Follow/unfollow relationships with duplicate-pair protection and self-follow prevention.
- Persistent notifications for new followers, comments, likes, and bookmarks.
- Notification inbox with cursor pagination, unread-only filtering, unread count, and read-state updates.

### API operations
- Configurable CORS origin allowlist.
- JSON request body size limit.
- Health endpoint for basic process availability.
- Generic server error responses that avoid exposing internal exception details.

## Architecture

The API follows a conventional Express structure:

```text
HTTP request
    │
    ▼
Express application
    │
    ├── CORS and JSON body parsing
    │
    ├── Route modules
    │     ├── Authentication
    │     ├── Stories and engagement
    │     └── Users, authors and notifications
    │
    ├── Authentication middleware
    │
    ├── Controllers and validation utilities
    │
    ├── Mongoose models and indexes
    │
    ▼
MongoDB
```

The frontend is maintained separately in [bloghub-frontend](https://github.com/Nashid-k/bloghub-frontend).

## Technology

| Area | Technology |
|---|---|
| Runtime | Node.js 20+ |
| HTTP framework | Express 5 |
| Database | MongoDB |
| ODM | Mongoose 8 |
| Authentication | JSON Web Tokens |
| Password hashing | bcryptjs |
| Configuration | dotenv |
| CORS | cors |
| Development | Nodemon |
| Tests | Node.js built-in test runner |

## Getting started

### Prerequisites

- Node.js 20 or newer.
- npm.
- MongoDB running locally or a MongoDB connection string.
- Git.

### 1. Clone the repository

```bash
git clone https://github.com/Nashid-k/bloghub-backend.git
cd bloghub-backend/server
```

### 2. Install dependencies

```bash
npm ci
```

If no lockfile is available in your checkout, use `npm install`.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with a valid MongoDB URI and a unique JWT secret. See [Environment variables](#environment-variables).

### 4. Start MongoDB

For a local MongoDB installation, make sure the database service is running and the configured URI is reachable.

### 5. Start the API

Development mode with automatic restart:

```bash
npm run dev
```

Production-style process:

```bash
npm start
```

The API listens on port `5000` by default.

### 6. Verify the server

Open:

```text
GET http://localhost:5000/api/health
```

A healthy running process responds with a JSON status and uptime value. This endpoint confirms process availability; it should not be treated as a full dependency/readiness check.

## Environment variables

Configure these in `server/.env`:

| Variable | Required | Description | Example |
|---|---:|---|---|
| `PORT` | No | HTTP port; defaults to 5000 | `5000` |
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb://127.0.0.1:27017/bloghub` |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs; must be at least 32 characters | Generated secret |
| `CLIENT_URL` | Recommended | Comma-separated allowed browser origins | `http://localhost:5173` |
| `NODE_ENV` | No | Runtime environment | `development` |

Example local configuration:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/bloghub
JWT_SECRET=replace-with-a-unique-random-secret-of-at-least-32-characters
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not commit `.env`, production secrets, or real database credentials. The placeholder in `.env.example` is not suitable for production.

For multiple frontend origins, separate them with commas:

```env
CLIENT_URL=http://localhost:5173,https://your-frontend.example
```

The server compares browser origins against this allowlist.

## Run and test

Run commands from `server/`:

| Command | Purpose |
|---|---|
| `npm run dev` | Start with Nodemon |
| `npm start` | Start the API process |
| `npm test` | Run Node's built-in test suite |

Run the current automated tests:

```bash
npm test
```

The existing suite covers validation rules, pagination boundaries and cursors, follow relationship indexes, and notification schema/index expectations. It is not a substitute for database-backed integration, authorization, or end-to-end tests.

## API reference

All endpoints are prefixed with `/api`. Protected routes require a bearer token:

```http
Authorization: Bearer <token>
```

### Authentication — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register an account |
| POST | `/login` | Public | Authenticate and obtain a session token |
| POST | `/logout` | Public/token-aware client flow | Logout endpoint |

### Stories — `/api/blogs`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List published stories; supports feed pagination and search |
| GET | `/:id` | Public | Retrieve a published story |
| GET | `/mine` | Authenticated | List the current author's stories |
| GET | `/mine/:id` | Authenticated | Retrieve the current author's story, including private draft access |
| POST | `/` | Authenticated | Create a story |
| PUT | `/:id` | Authenticated, owner | Update an owned story |
| DELETE | `/:id` | Authenticated, owner | Delete an owned story |

### Engagement — `/api/blogs`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/:id/engagement` | Authenticated | Retrieve the current reader's engagement state |
| POST | `/:id/like` | Authenticated | Toggle a story like |
| POST | `/:id/bookmark` | Authenticated | Toggle a story bookmark |
| GET | `/:id/comments` | Public | List story comments |
| POST | `/:id/comments` | Authenticated | Add a comment |
| DELETE | `/comments/:commentId` | Authenticated, comment/story owner | Delete a comment |

Comment listing supports a bounded cursor-paginated response when pagination parameters are supplied. Use `limit` from 1 to 50 and pass the returned `pagination.nextCursor` as `cursor` for the next page. Requests without pagination parameters retain the legacy array response, capped at 50 comments.

### Users, authors and notifications — `/api/users`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/me` | Authenticated | Current user's profile |
| GET | `/bookmarks` | Authenticated | Current user's saved stories |
| GET | `/:userId` | Public; optional auth | Public author profile and signed-in follow state |
| GET | `/:userId/followers` | Public | Paginated followers directory |
| GET | `/:userId/following` | Public | Paginated following directory |
| POST | `/:userId/follow` | Authenticated | Follow an author |
| DELETE | `/:userId/follow` | Authenticated | Unfollow an author |
| GET | `/notifications` | Authenticated | Notification inbox |
| GET | `/notifications/unread-count` | Authenticated | Unread notification count |
| PATCH | `/notifications/:notificationId/read` | Authenticated | Mark one notification as read |
| PATCH | `/notifications/read-all` | Authenticated | Mark all current user's notifications as read |

Notification inbox query parameters:

| Parameter | Description |
|---|---|
| `limit` | Page size; defaults to 20 and is capped at 50 |
| `cursor` | Cursor returned by the previous page |
| `unreadOnly` | When `true`, return only unread notifications |

Follower/following directories use `page` and `limit`, with a maximum of 20 profiles per page.

### Health

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Basic process health and uptime |
| GET | `/` | Public | Simple API running message |

## Authentication and authorization

- Passwords are hashed before storage; plaintext passwords should never be persisted.
- Protected routes use authentication middleware to identify the current user.
- Story updates and deletion are restricted to the story owner.
- Private drafts are retrieved through authenticated author-scoped routes.
- Comment deletion is limited to the comment author or story author.
- Follow relationships prevent self-follow and enforce a unique follower/following pair.
- Notification reads and updates are scoped to the authenticated recipient.

A frontend route guard or hidden button is not authorization. Every protected operation must be validated by the API.

## Pagination

BlogHub uses bounded pagination to avoid unbounded list responses.

- The main story feed uses page-based pagination and supports search.
- Public author story lists and follower/following directories use bounded page-based pagination.
- Comment and notification inbox endpoints support cursor-based pagination.
- Cursor-based feeds use stable creation-time and identifier ordering to avoid ambiguous page boundaries.
- Invalid pagination values are rejected or normalized according to the relevant endpoint's validator.

Use the response's pagination metadata rather than constructing cursors on the client.

## Error handling

The Express application handles disallowed CORS origins and oversized JSON request bodies explicitly. Unexpected server errors return a generic response rather than leaking internal stack traces.

Typical HTTP status categories:

| Status | Meaning |
|---|---|
| 200 | Request completed |
| 201 | Resource created |
| 400 | Invalid request or validation failure |
| 401 | Authentication required or invalid |
| 403 | Operation or origin not permitted |
| 404 | Resource not found |
| 413 | Request body exceeds configured limit |
| 500 | Unexpected server error |

The exact response body depends on the route and error path.

## Security considerations

- Keep `JWT_SECRET` private, unique, and at least 32 characters long.
- Use HTTPS in production.
- Configure `CLIENT_URL` with only trusted frontend origins.
- Never trust client-provided user IDs for ownership checks.
- Keep authorization and validation in the API layer.
- Do not expose password hashes, tokens, or private user data in public responses.
- Keep dependencies updated and review security advisories.
- Add rate limiting and broader abuse protections before exposing high-traffic public endpoints.

The current server configures CORS, disables the Express identification header, limits JSON bodies to 100 KB, and returns generic unexpected-error messages. Additional production controls such as rate limiting, security headers, structured logging, and comprehensive audit coverage remain areas for hardening.

## Project structure

```text
server/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── authorController.js
│   ├── blogController.js
│   ├── engagementController.js
│   ├── notificationController.js
│   └── userController.js
├── middleware/
│   ├── auth.js
│   └── optionalAuth.js
├── models/
│   ├── Blog.js
│   ├── Comment.js
│   ├── Follow.js
│   ├── Notification.js
│   └── ...
├── routes/
│   ├── authRoute.js
│   ├── blogRoute.js
│   └── userRoute.js
├── tests/
│   └── validation.test.js
├── utils/
│   ├── authorPagination.js
│   ├── commentPagination.js
│   ├── notificationPagination.js
│   └── validation.js
├── .env.example
├── package.json
└── server.js
```

## Development workflow

1. Create a focused feature or fix branch from `main`.
2. Keep route handlers thin and put domain behavior in the relevant controller or utility.
3. Validate external input at the API boundary.
4. Enforce permissions on the server for every private operation.
5. Add or update tests for success, invalid input, and unauthorized access.
6. Update this README when endpoints, configuration, or behavior change.
7. Run `npm test` before opening a pull request.

## Related project

- **Frontend:** [Nashid-k/bloghub-frontend](https://github.com/Nashid-k/bloghub-frontend)
- **Backend repository:** [Nashid-k/bloghub-backend](https://github.com/Nashid-k/bloghub-backend)

---

BlogHub is an actively evolving project. This document describes the current API surface and distinguishes implemented behavior from additional production-hardening work.
