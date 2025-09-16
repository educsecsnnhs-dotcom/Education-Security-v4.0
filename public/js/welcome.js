(function(){
  'use strict';

  const api = {
    me: '/api/auth/me',
    logout: '/api/auth/logout', // unused for JWT
    announcements: '/api/announcements',
    ssgAnnouncements: '/api/ssgAnnouncements',
    ssgProjects: '/api/ssgProjects',
    superUsers: '/api/superadmin/users',
    impersonate: '/api/superadmin/impersonate'
  };

  function qs(sel) { return document.querySelector(sel); }

  // Fetch function (no JWT, relies on role stored in localStorage)
  async function fetchJson(url, opts = {}) {
    const role = localStorage.getItem("user_role"); // Get user role from localStorage
    const headers = { 'Accept': 'application/json', ...(opts.headers || {}) };
    if (role) headers["Role"] = role; // Send role in header

    const cfg = Object.assign({ headers }, opts);
    const res = await fetch(url, cfg);

    // Handle unauthorized responses (role may not match)
    if (res.status === 401) {
      localStorage.removeItem("user_role"); // clear role if unauthorized
      window.location.href = '/html/login.html'; // redirect to login
    }

    return res;
  }

  // Show modal (not used in this example, but preserved)
  function showModal(html){
    const root = qs('#modalRoot');
    root.innerHTML = '';
    root.style.display = 'block';
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `<div class="modal">${html}</div>`;
    backdrop.addEventListener('click', (ev) => {
      if (ev.target === backdrop) {
        root.style.display = 'none';
        root.innerHTML = '';
      }
    });
    root.appendChild(backdrop);
  }

  // Close modal
  function closeModal() {
    const r = qs('#modalRoot');
    r.style.display = 'none';
    r.innerHTML = '';
  }

  // Format date into a nice readable format
  function niceDate(dStr) {
    try {
      const d = new Date(dStr);
      return d.toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return dStr; }
  }

  // Load school announcements
  async function loadAnnouncements() {
    const container = qs('#schoolAnnouncements');
    if (!container) return;
    container.innerHTML = '<div class="muted small">Loading announcements…</div>';
    try {
      const res = await fetchJson(api.announcements);
      if (!res.ok) {
        container.innerHTML = '<div class="muted small">No announcements found.</div>';
        return;
      }
      const json = await res.json();
      let items = [];
      if (Array.isArray(json)) items = json;
      else if (Array.isArray(json.announcements)) items = json.announcements;
      else if (Array.isArray(json.data)) items = json.data;
      else if (json.announcements) items = Object.values(json.announcements);
      if (!items || items.length === 0) {
        container.innerHTML = '<div class="muted small">No announcements.</div>';
        return;
      }
      container.innerHTML = '';
      items.slice(0, 8).forEach(a => {
        const title = a.title || a.subject || 'Announcement';
        const body = a.body || a.message || a.content || '';
        const date = a.createdAt || a.date || a.created || '';
        const el = document.createElement('div');
        el.className = 'announcement';
        el.innerHTML =
          `<div class="meta">${niceDate(date)}</div>` +
          `<div style="font-weight:600">${escapeHtml(title)}</div>` +
          `<div class="small muted">${truncate(escapeHtml(body), 220)}</div>`;
        container.appendChild(el);
      });
    } catch (e) {
      console.error('Announcements error', e);
      container.innerHTML = '<div class="muted small">Failed to load announcements.</div>';
    }
  }

  // Load SSG announcements
  async function loadSSGAnnouncements() {
    const container = qs('#ssgAnnouncements');
    if (!container) return;
    container.innerHTML = '<div class="muted small">Loading SSG announcements…</div>';
    try {
      const res = await fetchJson(api.ssgAnnouncements);
      if (!res.ok) {
        container.innerHTML = '<div class="muted small">No SSG announcements found.</div>';
        return;
      }
      const items = await res.json();
      if (!items || !Array.isArray(items) || items.length === 0) {
        container.innerHTML = '<div class="muted small">No SSG announcements.</div>';
        return;
      }
      container.innerHTML = '';
      items.slice(0, 5).forEach(a => {
        const el = document.createElement('div');
        el.className = 'announcement';
        el.innerHTML =
          `<div class="meta">${niceDate(a.createdAt)}</div>` +
          `<div style="font-weight:600">${escapeHtml(a.title)}</div>` +
          `<div class="small muted">${truncate(escapeHtml(a.body), 180)}</div>`;
        container.appendChild(el);
      });
    } catch (err) {
      console.error('SSG announcements error', err);
      container.innerHTML = '<div class="muted small">Failed to load SSG announcements.</div>';
    }
  }

  // Load SSG projects
  async function loadSSGProjects() {
    const container = qs('#ssgProjects');
    if (!container) return;
    container.innerHTML = '<div class="muted small">Loading SSG projects…</div>';
    try {
      const res = await fetchJson(api.ssgProjects);
      if (!res.ok) {
        container.innerHTML = '<div class="muted small">No projects found.</div>';
        return;
      }
      const items = await res.json();
      if (!items || !Array.isArray(items) || items.length === 0) {
        container.innerHTML = '<div class="muted small">No projects available.</div>';
        return;
      }
      container.innerHTML = '';
      items.slice(0, 5).forEach(p => {
        const el = document.createElement('div');
        el.className = 'project';
        el.innerHTML =
          `<div style="font-weight:600">${escapeHtml(p.name)} <span class="small muted">(${escapeHtml(p.status)})</span></div>` +
          `<div class="small muted">${truncate(escapeHtml(p.description), 180)}</div>` +
          `<div class="meta">${niceDate(p.createdAt)}</div>`;
        container.appendChild(el);
      });
    } catch (err) {
      console.error('SSG projects error', err);
      container.innerHTML = '<div class="muted small">Failed to load projects.</div>';
    }
  }

  // Escape HTML (for security reasons)
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[s]);
  }

  // Truncate text to a given length
  function truncate(s, n) {
    if (!s) return '';
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  // Update the clock
  function updateClock() {
    const now = new Date();
    qs('#clock').textContent = now.toLocaleTimeString('en-PH', { hour12: false, timeZone: 'Asia/Manila' });
    qs('#todayDate').textContent = 'Today is ' + now.toLocaleDateString('en-PH', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila'
    });
  }

  // === INIT ===
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const role = localStorage.getItem("user_role");
      if (!role) {
        location.href = '/html/login.html'; // If no role is found, redirect to login
        return;
      }

      const user = {
        role: role,
        name: localStorage.getItem("user_name") || "User",
      };

      window.__EDUSEC__ = { user };

      qs('#userName').textContent = user.name || 'User';
      qs('#userRole').textContent = user.role || 'User';

      const menuUtil = window.__EDUSEC_MENU;
      if (menuUtil) {
        const finalMenu = menuUtil.buildMenuForUser(user);
        menuUtil.renderSidebar(finalMenu);
        menuUtil.renderQuickActions(finalMenu);
      }

      // Load base content
      loadAnnouncements();
      renderPdfOrPlaceholder();
      updateClock();
      setInterval(updateClock, 1000);

      // Load SSG extras
      if (user.role === 'SSG' || user.isSSG || (user.extraRoles || []).includes('SSG')) {
        loadSSGAnnouncements();
        loadSSGProjects();
      }

    } catch (err) {
      console.error('Welcome load error', err);
      location.href = '/html/login.html'; // Redirect to login on error
    }

    const logoutBtn = qs('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem("user_role");
        location.href = '/html/login.html'; // Redirect to login page on logout
      });
    }
  });
})();
