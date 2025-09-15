// server.js (fixed)
// Rebuilt server to mount all routes and provide compatibility endpoints and runtime folder creation
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const app = express();
const ROOT = __dirname;

// ensure runtime dirs exist
fs.mkdirSync(path.join(ROOT, 'uploads', 'enrollments'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'uploads', 'profilePics'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'exports'), { recursive: true });

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));

// connect to DB if MONGO_URI exists
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {});
  mongoose.connection.on('connected', () => console.log('MongoDB connected'));
  mongoose.connection.on('error', (err) => console.error('MongoDB error', err));
}

// session
app.use(session({
  name: process.env.SESSION_NAME || 'sid',
  secret: process.env.SESSION_SECRET || 'change_me',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sessions' }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 4
  }
}));

// mount all route files under /api/<basename> and also plural variants
const routesDir = path.join(ROOT, 'routes');
fs.readdirSync(routesDir).forEach(f => {
  if (!f.endsWith('.js')) return;
  const base = '/' + path.basename(f, '.js');
  const router = require(path.join(routesDir, f));
  app.use('/api' + base, router);
  // mount plural form if different
  const plural = '/api/' + (base.slice(1) + 's');
  if (plural !== '/api' + base) {
    app.use(plural, router);
  }
});

// mount compat router for frontend-expecting endpoints
try {
  const compat = require('./routes/compat');
  app.use('/api', compat);
} catch (err) {
  console.warn('Compat router not loaded:', err.message);
}

// serve static frontend (public)
app.use(express.static(path.join(ROOT, 'public')));

// unified error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ message: 'Server error', error: err && err.message ? err.message : String(err) });
});

// fallback - serve login page if any (preserve existing behavior)
app.get('*', (req, res) => {
  const login = path.join(__dirname, 'public', 'html', 'login.html');
  if (fs.existsSync(login)) return res.sendFile(login);
  return res.status(404).send('Not Found');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on ${PORT}`);
  // attempt to run seedAdmin if exists
  try {
    const seed = require('./seedAdmin');
    if (seed && typeof seed === 'function') {
      await seed();
    }
  } catch (err) {
    console.warn('seedAdmin not executed:', err && err.message ? err.message : err);
  }
});
