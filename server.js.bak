// server.js
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const MongoStore = require("connect-mongo");

dotenv.config();
const app = express();

/* ---------------------- 🔐 Security & Middleware ---------------------- */

// CORS: allow frontend + backend on Render
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://education-security-v2-0.onrender.com",
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// ✅ Trust Render proxy (needed for secure cookies)
app.set("trust proxy", 1);

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only secure in prod
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 2, // 2h
    },
  })
);

/* ---------------------- 🔗 Database ---------------------- */
const connectDB = require("./config/db");
connectDB();

/* ---------------------- 🌱 Seeder ---------------------- */
const seedAdmin = require("./seedAdmin");

/* ---------------------- 📦 API Routes ---------------------- */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/superadmin", require("./routes/superAdmin")); // principal tools
app.use("/api/enrollment", require("./routes/enrollment")); // student submit + me
app.use("/api/registrar", require("./routes/registrar")); // registrar dashboard actions
app.use("/api/student", require("./routes/student"));
app.use("/api/recordbook", require("./routes/recordbook"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/announcements", require("./routes/announcement"));
app.use("/api/events", require("./routes/events"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/ssg", require("./routes/ssg"));

/* ---------------------- 📂 Static Files ---------------------- */
// Ensure uploads dir exists
if (!fs.existsSync("uploads/announcements")) {
  fs.mkdirSync("uploads/announcements", { recursive: true });
}
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Serve frontend files from /public
app.use(express.static(path.join(__dirname, "public")));

// ✅ Root route → splash screen
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "index.html"));
});

// ✅ Fallback → login page
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "login.html"));
});

/* ---------------------- 🚀 Start Server ---------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await seedAdmin(); // ensure SuperAdmin exists
});

