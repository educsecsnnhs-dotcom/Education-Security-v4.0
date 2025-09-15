// public/js/pages/enrolled.js
(async function(){
  const el = id => document.getElementById(id);

  async function loadEnrolled(){
    const cont = el('enrolledList');
    cont.innerHTML = '<div class="muted small">Loading enrolled students…</div>';
    try{
      // 🔗 Only use the backend-confirmed route
      const res = await PageUtils.fetchJson('/api/registrar/enrolled', {
        method: 'GET',
        credentials: 'include', // keeps session cookie
      });

      if (!res.ok) {
        cont.innerHTML = '<div class="muted small">Failed to fetch enrolled students.</div>';
        return;
      }

      const j = await res.json();
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
    // 🔗 Logout → backend + redirect
    el('logoutBtn')?.addEventListener('click', async () => {
      try {
        await PageUtils.fetchJson('/api/auth/logout', { method:'POST', credentials:'include' });
      } catch(e){}
      location.href = '/html/login.html';
    });

    loadEnrolled();
  });
})();
