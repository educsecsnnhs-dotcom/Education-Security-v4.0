// public/js/pages/archives.js
// Archives page: show archived records from registrar/admin
document.addEventListener("DOMContentLoaded", () => {
  const el = (id) => document.getElementById(id);
  const cont = el("archivesList");

  // 🔹 Get user role from localStorage (no JWT, just role in localStorage)
  function getUserRole() {
    const user = JSON.parse(localStorage.getItem('user')); // User info stored in localStorage
    return user ? user.role : null;
  }

  // 🔹 Function to check if user has access to archives
  function hasAccess() {
    const userRole = getUserRole();
    return ['Admin', 'Registrar', 'SuperAdmin'].includes(userRole);  // Only Admin, Registrar, and SuperAdmin can access
  }

  async function loadArchives() {
    if (!hasAccess()) {
      cont.innerHTML = '<div class="muted small">You do not have permission to view the archives.</div>';
      return;
    }

    cont.innerHTML = '<div class="muted small">Loading archives…</div>';
    try {
      const res = await fetch("/api/archives");
      if (!res.ok) {
        cont.innerHTML = '<div class="muted small">Archives not available</div>';
        return;
      }

      const j = await res.json();
      const items = j.data || j.archives || [];

      if (!items.length) {
        cont.innerHTML = '<div class="muted small">No archived records.</div>';
        return;
      }

      cont.innerHTML = "";
      items.forEach((it) => {
        const row = document.createElement("div");
        row.className = "announcement";
        row.innerHTML = `
          <div style="font-weight:600">
            ${PageUtils.escapeHtml(it.title || it.name || it._id || it.id)}
          </div>
          <div class="small muted">
            ${PageUtils.truncate(PageUtils.escapeHtml(it.summary || it.description || JSON.stringify(it)), 220)}
          </div>
        `;
        cont.appendChild(row);
      });
    } catch (err) {
      console.error("Archives load error:", err);
      cont.innerHTML = '<div class="muted small">Failed to load archives.</div>';
    }
  }

  // 🔹 Fix logout to use localStorage and correct href
  el("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("user");  // Clear user data from localStorage
    location.href = "/html/login.html";  // Redirect to login page
  });

  loadArchives();
});
