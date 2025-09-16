// middleware/authMiddleware.js

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

// Placeholder auth (always allow for now)
function authRequired(req, res, next) {
  // No authentication logic, just pass through
  next();
}

// Require a single role
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRole = normalizeRole(req.user.role);
    if (userRole === "SuperAdmin") return next(); // bypass all restrictions

    if (userRole !== normalizeRole(role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }
    next();
  };
}

// Require one of multiple roles
function requireAnyRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRole = normalizeRole(req.user.role);
    if (userRole === "SuperAdmin") return next(); // bypass all restrictions

    const normalized = roles.map(r => normalizeRole(r));
    if (!normalized.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }
    next();
  };
}

module.exports = { authRequired, requireRole, requireAnyRole, normalizeRole };
