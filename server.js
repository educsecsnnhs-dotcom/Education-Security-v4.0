// server.js
// Cloud-ready server with MongoDB session store, secure cookies, and route mounting

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

// Ensure runtime dirs exist
fs.mkdirSync(path.join(ROOT, 'uploads', 'enrollments'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'uploads', 'profilePics'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'exports'), { recursive: true });

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------
// CORS: Allow frontend to send cookies
// ------------------------------
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000', // must match frontend URL
  credentials: true, // allow cookies
}));

// ------------------------------
// MongoDB Connection
// ------------------------------
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI missing in .env. Exiting...');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
});
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected, retrying...');
});

// ------------------------------
// Trust Proxy (for HTTPS on Render/Heroku)
// ------------------------------
app.set('trust proxy', 1);

// ------------------------------
// Unified Cookie Options
// ------------------------------
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

// ------------------------------
// Session Setup (MongoDB-backed)
// ------------------------------
const SESSION_NAME = process.env.SESSION_NAME || 'sid';

app.use(session({
  name: SESSION_NAME,
  secret: process.env.SESSION_SECRET || 'change_me_now',  // set strong secret in .env
  resave: false,
  saveUninitialized: false,
  rolling: true, // refresh expiry on each request
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 60 * 60 * 24 * 7, // 7 days
    autoRemove: 'native',
    crypto: {
      secret: process.env.SESSION_SECRET || 'change_me_now',
    },
  }),
  cookie: cookieOptions,
}));

// Debug session middleware (useful for troubleshooting)
app.use((req, res, next) => {
  console.log('Cookie header:', req.headers.cookie);
  console.log('Session ID:', req.sessionID);
  next();
});

// ------------------------------
// Routes Auto-Mounting (generic)
// ------------------------------
const routesDir = path.join(ROOT, 'routes');
if (fs.existsSync(routesDir)) {
  fs.readdirSync(routesDir).forEach(f => {
    if (!f.endsWith('.js')) return;

    // skip SSG-specific routes (we mount them explicitly)
    if (['ssgElections.js', 'ssgAnnouncements.js', 'ssgProjects.js'].includes(f)) return;

    const base = '/' + path.basename(f, '.js');
    const router = require(path.join(routesDir, f));
    app.use('/api' + base, router);

    const plural = '/api/' + (base.slice(1) + 's');
    if (plural !== '/api' + base) {
      app.use(plural, router);
    }
  });
}

// ------------------------------
// Explicit SSG Routes
// ------------------------------
const ssgElections = require('./routes/ssgElections');
const ssgAnnouncements = require('./routes/ssgAnnouncements');
const ssgProjects = require('./routes/ssgProjects');

app.use('/api/ssg/elections', ssgElections);
app.use('/api/ssg/announcements', ssgAnnouncements);
app.use('/api/ssg/projects', ssgProjects);

// ------------------------------
// Compat routes for old frontend endpoints
// ------------------------------
try {
  const compat = require('./routes/compat');
  app.use('/api', compat);
} catch (err) {
  console.warn('Compat router not loaded:', err.message);
}

// ------------------------------
// Static Frontend
// ------------------------------
app.use(express.static(path.join(ROOT, 'public')));

// ------------------------------
// Unified Error Handler
// ------------------------------
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err.stack || err);
  res.status(500).json({
    message: 'Server error',
    error: err.message || String(err),
  });
});

// ------------------------------
// Fallback → login.html if exists
// ------------------------------
app.get('*', (req, res) => {
  const login = path.join(__dirname, 'public', 'html', 'login.html');
  if (fs.existsSync(login)) return res.sendFile(login);
  return res.status(404).send('Not Found');
});

// ------------------------------
// Start Server + Seed Admin
// ------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  try {
    const seed = require('./seedAdmin');
    if (typeof seed === 'function') {
      await seed();
      console.log('✅ SuperAdmin seeding complete');
    }
  } catch (err) {
    console.warn('⚠️ seedAdmin not executed:', err.message || err);
  }
});

module.exports = { cookieOptions }; // export for use in logout controller
