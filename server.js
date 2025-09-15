// server.js 
// Rebuilt server with improved Mongo connection, session handling, and route mounting

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
app.use(cors({ origin: true, credentials: true }));

// ------------------------------
// MongoDB Connection
// ------------------------------
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // fail fast
  });

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected, attempting reconnect...');
  });
} else {
  console.warn('⚠️ No MONGO_URI provided, database features disabled.');
}

// ------------------------------
// Session Setup
// ------------------------------
app.use(session({
  name: process.env.SESSION_NAME || 'sid',
  secret: process.env.SESSION_SECRET || 'change_me_now',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sessions',
    ttl: 60 * 60 * 24 * 7, // 7 days
    autoRemove: 'native',
    crypto: {
      secret: process.env.SESSION_SECRET || 'change_me_now',
    },
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  }
}));

// Debug session middleware (can be silenced later)
app.use((req, res, next) => {
  if (!req.session) {
    console.error('⚠️ Session not available!');
  }
  next();
});

// ------------------------------
// Routes Auto-Mounting
// ------------------------------
const routesDir = path.join(ROOT, 'routes');
if (fs.existsSync(routesDir)) {
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
}

// Compat routes for frontend-expecting endpoints
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

  // seed SuperAdmin user
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
