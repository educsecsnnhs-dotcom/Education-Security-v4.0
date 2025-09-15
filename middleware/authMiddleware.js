// middleware/authMiddleware.js
// Role normalization + session-based guards with SuperAdmin bypass

const roleMap = {
  user: "User",
  users: "User",
  student: "Student",
  students: "Student",
  registrar: "Registrar",
  registrars: "Registrar",
  admin: "Admin", // Department Head
  admins: "Admin",
  superadmin: "SuperAdmin", // Principal (god mode)
  ssg: "SSG",
  moderator: "Moderator",
  moderators: "Moderator",
};

function normalizeRole(role) {
  if (!role) return null;
  return roleMap[String(role).toLowerCase()] || role;
}

function authRequired(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.user = req.session.user; // minimal session user object (id, role, fullName, username, lrn)
  next();
}

// require a single role, principal (SuperAdmin) bypasses
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userRole = normalizeRole(req.user.role);
    if (userRole === "SuperAdmin") return next(); // god-mode
    if (userRole !== normalizeRole(role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }
    next();
  };
}

// require any role from list, principal bypasses
function requireAnyRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userRole = normalizeRole(req.user.role);
    if (userRole === "SuperAdmin") return next(); // god-mode
    const normalized = roles.map(r => normalizeRole(r));
    if (!normalized.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }
    next();
  };
}

module.exports = { authRequired, requireRole, requireAnyRole, normalizeRole };
