// public/js/pages/archives.js
// Archives page: show archived records from registrar/admin
document.addEventListener("DOMContentLoaded", () => {
  const el = (id) => document.getElementById(id);
  const cont = el("archivesList");

  function authHeaders(extra={}) {
    const token = localStorage.getItem("token");
    return {
      ...extra,
      Authorization: token ? `Bearer ${token}` : ""
    };
  }

  async function loadArchives() {
    cont.innerHTML = '<div class="muted small">Loading archives…</div>';
    try {
      const res = await fetch("/api/archives", { headers: authHeaders() });
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

  el("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    location.href = "/html/login.html";
  });

  loadArchives();
});
