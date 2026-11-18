# BlogHub API — Express and MongoDB

The BlogHub backend is a JavaScript REST API built with Express 5 and MongoDB/Mongoose. It supports account authentication, blog CRUD and profile endpoints for the companion React frontend.

## Features

- JWT-based registration and login
- Blog creation, listing, editing and deletion
- User profile endpoint
- Mongoose models for users and blogs
- Centralized route, controller and middleware modules

## Stack

Node.js, Express 5, MongoDB, Mongoose, JWT, bcryptjs, dotenv and Nodemon.

## Project layout

```text
server/
├── config/db.js
├── controllers/
├── middleware/auth.js
├── models/
├── routes/
├── server.js
├── package.json
└── .env.example
```

## Run locally

```bash
git clone https://github.com/Nashid-k/bloghub-backend.git
cd bloghub-backend/server
npm install
cp .env.example .env
npm run dev
```

The API defaults to port `5000`.

## Environment

| Variable | Purpose |
| --- | --- |
| `PORT` | API port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `CLIENT_URL` | Allowed frontend origin for CORS |
| `NODE_ENV` | Runtime environment |

Never commit the local `.env` file. If a real MongoDB URI or JWT secret was present in a previously committed environment file, rotate those credentials.

## API routes

- `/api/auth` — registration and login
- `/api/blogs` — blog CRUD
- `/api/users` — user profile

## Commands

- `npm run dev` — start with Nodemon
- `npm start` — start the API
