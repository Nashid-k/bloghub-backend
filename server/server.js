const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
}));
app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', require('./routes/authRoute'));
app.use('/api/blogs', require('./routes/blogRoute'));
app.use('/api/users', require('./routes/userRoute'));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptimeSeconds: Math.floor(process.uptime()) });
});
app.get('/', (_req, res) => res.json({ message: 'BlogHub API is running' }));

app.use((error, _req, res, _next) => {
  if (error.message === 'Origin is not allowed by CORS.') {
    return res.status(403).json({ error: 'Origin is not allowed.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  await connectDB();
  app.listen(PORT, () => {
    console.log('BlogHub API listening on port ' + PORT);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start BlogHub API:', error.message);
    process.exit(1);
  });
}

module.exports = { app, startServer };
