const jwt = require("jsonwebtoken");

const roleMap = {
  user: "User",
  users: "User",
  student: "Student",
  students: "Student",
  registrar: "Registrar",
  registrars: "Registrar",
  admin: "Admin",
  admins: "Admin",
  superadmin: "SuperAdmin",
  ssg: "SSG",
  moderator: "Moderator",
  moderators: "Moderator",
};

function normalizeRole(role) {
  if (!role) return null;
  return roleMap[String(role).toLowerCase()] || role;
}

// Middleware to check JWT and attach req.user
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized: Missing token" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized: Invalid token" });

  jwt.verify(token, process.env.JWT_SECRET || "change_me_now", (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden: Invalid token" });
    req.user = decoded;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userRole = normalizeRole(req.user.role);
    if (userRole === "SuperAdmin") return next();
    if (userRole !== normalizeRole(role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }
    next();
  };
}

function requireAnyRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userRole = normalizeRole(req.user.role);
    if (userRole === "SuperAdmin") return next();
    const normalized = roles.map(r => normalizeRole(r));
    if (!normalized.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }
    next();
  };
}

module.exports = { authRequired, requireRole, requireAnyRole, normalizeRole };
