(function () {
  'use strict';

  /* ---------- Auth helper ---------- */
  const Auth = {
    getUser() {
      try { return JSON.parse(localStorage.getItem('edusec_user')); } catch { return null; }
    },
    setUser(u) {
      if (u) localStorage.setItem('edusec_user', JSON.stringify(u));
      else localStorage.removeItem('edusec_user');
    },
    logout() {
      this.setUser(null);
      window.location.href = '/html/login.html'; // Redirect to login after logout
    }
  };
  window.Auth = Auth; // expose globally

  /* ---------- Role-check helper ---------- */
  function hasRole(user, roleName) {
    if (!user) return false;
    const rn = String(roleName || '').toLowerCase();
    if (typeof user.role === 'string' && user.role.toLowerCase() === rn) return true;
    if (Array.isArray(user.roles)) {
      for (const r of user.roles) {
        if (!r) continue;
        if (typeof r === 'string' && r.toLowerCase() === rn) return true;
        if (typeof r === 'object' && (r.name || r.role) && String(r.name || r.role).toLowerCase() === rn) return true;
      }
    }
    return false;
  }

  function $id(id) { return document.getElementById(id); }
  function escapeHtml(s) { if (s === null || s === undefined) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

  /* ---------- Members (server-backed) ---------- */
  async function loadMembers() {
    return await fetchJson('/api/ssg/members', { method: 'GET' });
  }

  async function createMember(payload) {
    const opts = {};
    if (payload instanceof FormData) {
      opts.method = 'POST'; opts.body = payload;
    } else {
      opts.method = 'POST'; opts.body = JSON.stringify(payload); opts.headers = { 'Content-Type': 'application/json' };
    }
    return await fetchJson('/api/ssg/members', opts);
  }

  async function deleteMember(id) {
    if (!id) throw new Error('Member id required');
    return await fetchJson(`/api/ssg/members/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  function renderMembersTable(container, members, opts = {}) {
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(members) || members.length === 0) { container.innerHTML = '<div class="ssg-empty">No members</div>'; return; }
    if (container.tagName.toLowerCase() === 'tbody') {
      const frag = document.createDocumentFragment();
      members.forEach(m => {
        const tr = document.createElement('tr');
        const idCell = document.createElement('td'); idCell.textContent = m.id ?? m._id ?? '';
        const nameCell = document.createElement('td'); nameCell.textContent = m.name ?? [m.firstName, m.lastName].filter(Boolean).join(' ') || '';
        const roleCell = document.createElement('td'); roleCell.textContent = m.position ?? m.role ?? (m.roles && m.roles.join ? m.roles.join(', ') : '') ?? '';
        const emailCell = document.createElement('td'); emailCell.textContent = m.email ?? m.contact ?? '';
        const actions = document.createElement('td');
        if (opts.currentUser && (hasRole(opts.currentUser,'Admin') || hasRole(opts.currentUser,'SuperAdmin') || hasRole(opts.currentUser,'SSG'))) {
          const del = document.createElement('button'); del.type='button'; del.className='btn btn-sm btn-danger'; del.textContent='Remove';
          del.addEventListener('click', async () => {
            if (!confirm('Remove this member?')) return;
            try { await deleteMember(m.id ?? m._id); tr.remove(); } catch (e) { alert('Failed to remove member'); console.error(e); }
          });
          actions.appendChild(del);
        } else {
          actions.textContent = '-';
        }
        tr.appendChild(idCell); tr.appendChild(nameCell); tr.appendChild(roleCell); tr.appendChild(emailCell); tr.appendChild(actions);
        frag.appendChild(tr);
      });
      container.appendChild(frag);
    }
  }

  /* ---------- Events (server-backed) ---------- */
  async function loadEvents() { return await fetchJson('/api/ssg/events', { method: 'GET' }); }
  async function createEvent(payload) {
    const opts = {};
    if (payload instanceof FormData) { opts.method='POST'; opts.body = payload; }
    else { opts.method='POST'; opts.body = JSON.stringify(payload); opts.headers = { 'Content-Type': 'application/json' }; }
    return await fetchJson('/api/ssg/events', opts);
  }
  async function deleteEvent(id) { if (!id) throw new Error('Event id required'); return await fetchJson(`/api/ssg/events/${encodeURIComponent(id)}`, { method: 'DELETE' }); }

  function renderEvents(container, events, opts = {}) {
    if (!container) return; container.innerHTML = '';
    if (!Array.isArray(events) || events.length === 0) { container.innerHTML = '<div class="ssg-empty">No events</div>'; return; }
    const wrap = document.createElement('div'); wrap.className='ssg-events-grid';
    events.forEach(e => {
      const card = document.createElement('div'); card.className='ssg-event-card';
      const title = e.title ?? e.name ?? '';
      const when = e.date ?? e.when ?? e.datetime ?? '';
      const desc = e.description ?? e.desc ?? '';
      card.innerHTML = `<h4>${escapeHtml(title)}</h4><div class="ssg-event-when">${escapeHtml(when)}</div><div class="ssg-event-desc">${escapeHtml(desc)}</div>`;
      if (opts.currentUser && (hasRole(opts.currentUser,'Admin') || hasRole(opts.currentUser,'SuperAdmin') || hasRole(opts.currentUser,'SSG'))) {
        const actions = document.createElement('div'); actions.className='ssg-event-actions';
        const del = document.createElement('button'); del.type='button'; del.className='btn btn-sm btn-danger'; del.textContent='Delete';
        del.addEventListener('click', async () => { if (!confirm('Delete event?')) return; try { await deleteEvent(e.id ?? e._id); card.remove(); } catch (err) { alert('Failed to delete event'); console.error(err); } });
        actions.appendChild(del); card.appendChild(actions);
      }
      wrap.appendChild(card);
    });
    container.appendChild(wrap);
  }

  /* ---------- Auto-init ---------- */
  async function initAuto() {
    const currentUser = Auth.getUser();

    const membersContainer = $id('ssg-members-table') || $id('ssg-members-list');
    if (membersContainer) { try { const ms = await loadMembers(); renderMembersTable(membersContainer, ms, { currentUser }); } catch (e) { membersContainer.innerHTML = '<div class="ssg-error">Failed to load members</div>'; } }

    const eventsContainer = $id('ssg-events-list');
    if (eventsContainer) { try { const es = await loadEvents(); renderEvents(eventsContainer, es, { currentUser }); } catch (e) { eventsContainer.innerHTML = '<div class="ssg-error">Failed to load events</div>'; } }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAuto); else setTimeout(initAuto,0);

  /* ---------- Public API ---------- */
  window.SSG = Object.assign(window.SSG || {}, {
    loadMembers, createMember, deleteMember, renderMembersTable,
    loadEvents, createEvent, deleteEvent, renderEvents
  });

})();
