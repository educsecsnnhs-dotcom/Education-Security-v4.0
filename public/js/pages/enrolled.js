// public/js/pages/enrolled.js
(async function(){
  const el = id => document.getElementById(id);

  // 🔹 Function to check if the user has a valid role
  function hasAccess(roles) {
    const user = JSON.parse(localStorage.getItem("user"));
    return roles.includes(user?.role);
  }

  async function loadEnrolled(){
    const cont = el('enrolledList');
    cont.innerHTML = '<div class="muted small">Loading enrolled students…</div>';
    try {
      // Use localStorage data for the user role (no JWT token involved)
      const j = await PageUtils.fetchJson('/api/registrar/enrolled', {
        method: 'GET',
        headers: {}  // No JWT required
      });

      const items = j.data || j.enrolled || j.students || j || [];
      if (!items || items.length === 0) {
        cont.innerHTML = '<div class="muted small">No enrolled students.</div>';
        return;
      }

      cont.innerHTML = '';
      items.forEach(i => {
        const row = document.createElement('div');
        row.className = 'announcement';
        const name = i.fullName || i.name || `${i.firstName||''} ${i.lastName||''}`.trim() || i.email || i._id || i.id;
        row.innerHTML = `
          <div style="font-weight:600">${PageUtils.escapeHtml(name)}</div>
          <div class="small muted">ID: ${PageUtils.escapeHtml(i._id||i.id||'')}</div>
        `;
        cont.appendChild(row);
      });
    } catch (e) {
      console.error('Enrolled load error:', e);
      cont.innerHTML = '<div class="muted small">Error loading enrolled students.</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // 🔹 Role-based access control: Allow only Registrar, Admin, and SuperAdmin to access this page
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !hasAccess(['Registrar', 'Admin', 'SuperAdmin'])) {
      location.href = '/html/login.html';  // Redirect if the role does not have access
      return;
    }

    // Add logout functionality
    el('logoutBtn')?.addEventListener('click', () => {
      localStorage.removeItem("user");
      location.href = '/html/login.html';
    });

    loadEnrolled();
  });
})();
