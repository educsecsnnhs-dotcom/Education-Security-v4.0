/*
 Combined SSG frontend (public/js/ssg.js)
 - Merges: public/js/pages/ssg.js (fetch-based) + public/js/ssg.js (dashboard features)
 - Works ONLY with these backend endpoints (session-based via PageUtils.fetchJson):
     POST /api/auth/login
     POST /api/auth/register
     POST /api/auth/logout
     GET  /api/auth/me
     GET    /api/ssg/members
     POST   /api/ssg/members
     DELETE /api/ssg/members/:id
     GET    /api/ssg/events
     POST   /api/ssg/events
     DELETE /api/ssg/events/:id
 - Does NOT invent new /api endpoints. If elections/announcements/projects endpoints are added in backend, replace the client fallback.
 - IMPORTANT: This file NEVER uses localStorage/sessionStorage for authentication. Session handling is done by the backend and PageUtils.fetchJson must carry cookies. LocalStorage is used *only* as a fallback persistence for elections/announcements/projects when backend endpoints are missing; this is explicitly documented and not used for auth.

 Usage: drop this file in public/js/ssg.js and include it on public/html/ssg.html. It expects PageUtils.fetchJson and PageUtils.currentUser conventions but will gracefully fallback to fetch + /api/auth/me if PageUtils isn't available.

 Author: Assistant
 Date: 2025-09-16
*/

(function () {
  'use strict';

  /* ---------- Helper utilities ---------- */

  // Prefer PageUtils.fetchJson for all requests so cookies/sessions are used by server-side express/mongo-session.
  async function fetchJson(url, options = {}) {
    if (typeof PageUtils !== 'undefined' && typeof PageUtils.fetchJson === 'function') {
      // page utils is assumed to handle credentials/session cookies correctly
      return PageUtils.fetchJson(url, options);
    }

    // Fallback: native fetch with same-origin credentials (still session-based)
    const opts = Object.assign({ credentials: 'same-origin', headers: {} }, options);
    if (opts.body && !(opts.body instanceof FormData)) {
      opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json';
    }
    const resp = await fetch(url, opts);
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      const err = new Error(`HTTP ${resp.status} ${resp.statusText}`);
      err.status = resp.status; err.body = text;
      throw err;
    }
    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('application/json')) return resp.json();
    return resp.text();
  }

  // Use PageUtils.currentUser() if available, otherwise GET /api/auth/me via fetchJson
  async function getCurrentUser() {
    if (typeof PageUtils !== 'undefined' && typeof PageUtils.currentUser === 'function') {
      try { return await PageUtils.currentUser(); } catch (e) { console.warn('PageUtils.currentUser failed, falling back to /api/auth/me', e); }
    }
    try { return await fetchJson('/api/auth/me', { method: 'GET' }); } catch (e) { console.warn('GET /api/auth/me failed', e); return null; }
  }

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
    if (rn === 'superadmin' && (user.isSuperAdmin || user.is_superadmin || user.superAdmin)) return true;
    if (rn === 'admin' && (user.isAdmin || user.is_admin)) return true;
    return false;
  }

  function $id(id) { return document.getElementById(id); }
  function escapeHtml(s) { if (s === null || s === undefined) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

  /* ---------- Members (server-backed) ---------- */
  async function loadMembers() {
    return await fetchJson('/api/ssg/members', { method: 'GET' });
  }

  async function createMember(payload) {
    // payload can be plain object or FormData. When object, send as JSON.
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
    } else {
      // generic list
      const ul = document.createElement('ul'); ul.className='ssg-members-list';
      members.forEach(m => { const li = document.createElement('li'); li.innerHTML = `<strong>${escapeHtml(m.name ?? [m.firstName,m.lastName].filter(Boolean).join(' '))}</strong> <small>${escapeHtml(m.position ?? m.role ?? '')}</small>`; ul.appendChild(li); });
      container.appendChild(ul);
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

  /* ---------- Elections / Announcements / Projects (BACKEND MISSING: fallback explained) ---------- */
  // The backend foundation you provided DOES NOT include endpoints for:
  //   GET/POST/DELETE /api/ssg/elections
  //   GET/POST/DELETE /api/ssg/announcements
  //   GET/POST/DELETE /api/ssg/projects
  // Therefore this file preserves the UI/features for these sections but does NOT invent routes.
  // Two choices were possible: (A) keep everything client-only (localStorage) OR (B) make them no-op and only surface warnings.
  // I implemented a safe client-side fallback that persists to localStorage (ONLY for these three features). This is
  // clearly documented and isolated so you can remove it once you add server routes.

  const FALLBACK_LS_KEYS = { elections: 'ssg:elections', announcements: 'ssg:announcements', projects: 'ssg:projects' };

  function lsRead(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : []; } catch (e) { console.error('ls read', e); return []; } }
  function lsWrite(key, arr) { try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) { console.error('ls write', e); } }

  const ClientFallback = {
    list(type) { return Promise.resolve(lsRead(FALLBACK_LS_KEYS[type])); },
    create(type, data) {
      const arr = lsRead(FALLBACK_LS_KEYS[type]);
      const id = 'c' + Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4);
      const rec = Object.assign({ id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, data);
      arr.unshift(rec); lsWrite(FALLBACK_LS_KEYS[type], arr); return Promise.resolve(rec);
    },
    remove(type, id) { let arr = lsRead(FALLBACK_LS_KEYS[type]); const before = arr.length; arr = arr.filter(i => String(i.id) !== String(id)); lsWrite(FALLBACK_LS_KEYS[type], arr); return Promise.resolve(arr.length < before); },
  };

  // Public managers for the three features. If you add real endpoints, replace these implementations.
  const Elections = {
    list() { console.warn('Elections: using client-side fallback (localStorage). Add /api/ssg/elections endpoints to persist server-side.'); return ClientFallback.list('elections'); },
    create(obj) { return ClientFallback.create('elections', obj); },
    remove(id) { return ClientFallback.remove('elections', id); }
  };
  const Announcements = { list() { console.warn('Announcements: using client-side fallback (localStorage).'); return ClientFallback.list('announcements'); }, create(o) { return ClientFallback.create('announcements', o); }, remove(id) { return ClientFallback.remove('announcements', id); } };
  const Projects = { list() { console.warn('Projects: using client-side fallback (localStorage).'); return ClientFallback.list('projects'); }, create(o) { return ClientFallback.create('projects', o); }, remove(id) { return ClientFallback.remove('projects', id); } };

  function renderList(container, items, type, opts = {}) {
    if (!container) return; container.innerHTML = '';
    if (!items || items.length === 0) { container.innerHTML = `<div class="ssg-empty">No ${type}</div>`; return; }
    const frag = document.createDocumentFragment();
    items.forEach(it => {
      const card = document.createElement('div'); card.className = `ssg-${type}-card`;
      card.innerHTML = `<h4>${escapeHtml(it.title ?? it.name ?? it.headline ?? '')}</h4><div>${escapeHtml(it.description ?? it.body ?? '')}</div><div class="ssg-meta">${escapeHtml(it.updatedAt ?? it.createdAt ?? '')}</div>`;
      if (opts.allowEdit) {
        const a = document.createElement('div'); a.className='ssg-actions'; const del = document.createElement('button'); del.className='btn btn-sm btn-danger'; del.type='button'; del.textContent='Delete';
        del.addEventListener('click', async () => { if (!confirm('Delete?')) return; await opts.onRemove(it.id); card.remove(); }); a.appendChild(del); card.appendChild(a);
      }
      frag.appendChild(card);
    });
    container.appendChild(frag);
  }

  /* ---------- Auto-initialization hooking into DOM (progressive) ---------- */
  async function initAuto() {
    const currentUser = await getCurrentUser();

    // MEMBERS
    const membersContainer = $id('ssg-members-table') || $id('ssg-members-list');
    if (membersContainer) {
      try { const ms = await loadMembers(); renderMembersTable(membersContainer, ms, { currentUser }); } catch (e) { console.error('loadMembers', e); if (membersContainer) membersContainer.innerHTML = '<div class="ssg-error">Failed to load members</div>'; }
    }
    const membersForm = $id('ssg-members-create-form');
    if (membersForm) {
      membersForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const fd = new FormData(membersForm); const obj = {}; for (const [k,v] of fd.entries()) obj[k]=v;
        try { await createMember(obj); if (membersContainer) { const ms = await loadMembers(); renderMembersTable(membersContainer, ms, { currentUser }); } membersForm.reset(); } catch (e) { console.error('createMember', e); alert('Failed to create member'); }
      });
    }

    // EVENTS
    const eventsContainer = $id('ssg-events-list');
    if (eventsContainer) {
      try { const es = await loadEvents(); renderEvents(eventsContainer, es, { currentUser }); } catch (e) { console.error('loadEvents', e); if (eventsContainer) eventsContainer.innerHTML = '<div class="ssg-error">Failed to load events</div>'; }
    }
    const eventsForm = $id('ssg-events-create-form');
    if (eventsForm) {
      eventsForm.addEventListener('submit', async (ev) => { ev.preventDefault(); const fd = new FormData(eventsForm); const obj = {}; for (const [k,v] of fd.entries()) obj[k]=v; try { await createEvent(obj); if (eventsContainer) { const es = await loadEvents(); renderEvents(eventsContainer, es, { currentUser }); } eventsForm.reset(); } catch (e) { console.error('createEvent', e); alert('Failed to create event'); } });
    }

    // ELECTIONS (fallback)
    const electionsContainer = $id('ssg-elections-list');
    if (electionsContainer) {
      const items = await Elections.list(); renderList(electionsContainer, items, 'elections', { allowEdit: hasRole(currentUser,'Admin')||hasRole(currentUser,'SuperAdmin')||hasRole(currentUser,'SSG'), onRemove: (id)=>Elections.remove(id) });
      const w = document.createElement('div'); w.className='ssg-warning'; w.style.color='#b35a00'; w.textContent='Note: elections are stored locally until backend endpoints are added (/api/ssg/elections).'; electionsContainer.parentNode && electionsContainer.parentNode.insertBefore(w, electionsContainer.nextSibling);
    }
    const electionsForm = $id('ssg-elections-create-form');
    if (electionsForm) electionsForm.addEventListener('submit', async (ev)=>{ ev.preventDefault(); const fd=new FormData(electionsForm); const obj={}; for(const [k,v] of fd.entries()) obj[k]=v; await Elections.create(obj); if (electionsContainer) { const items = await Elections.list(); renderList(electionsContainer, items, 'elections', { allowEdit: hasRole(currentUser,'Admin')||hasRole(currentUser,'SuperAdmin')||hasRole(currentUser,'SSG'), onRemove: (id)=>Elections.remove(id) }); } electionsForm.reset(); });

    // ANNOUNCEMENTS (fallback)
    const annContainer = $id('ssg-announcements-list');
    if (annContainer) {
      const items = await Announcements.list(); renderList(annContainer, items, 'announcements', { allowEdit: hasRole(currentUser,'Admin')||hasRole(currentUser,'SuperAdmin')||hasRole(currentUser,'SSG'), onRemove: (id)=>Announcements.remove(id) });
      const w = document.createElement('div'); w.className='ssg-warning'; w.style.color='#b35a00'; w.textContent='Note: announcements are stored locally until backend endpoints are added (/api/ssg/announcements).'; annContainer.parentNode && annContainer.parentNode.insertBefore(w, annContainer.nextSibling);
    }
    const annForm = $id('ssg-announcements-create-form');
    if (annForm) annForm.addEventListener('submit', async (ev)=>{ ev.preventDefault(); const fd=new FormData(annForm); const obj={}; for(const [k,v] of fd.entries()) obj[k]=v; await Announcements.create(obj); if (annContainer) { const items = await Announcements.list(); renderList(annContainer, items, 'announcements', { allowEdit: hasRole(currentUser,'Admin')||hasRole(currentUser,'SuperAdmin')||hasRole(currentUser,'SSG'), onRemove: (id)=>Announcements.remove(id) }); } annForm.reset(); });

    // PROJECTS (fallback)
    const projContainer = $id('ssg-projects-list');
    if (projContainer) {
      const items = await Projects.list(); renderList(projContainer, items, 'projects', { allowEdit: hasRole(currentUser,'Admin')||hasRole(currentUser,'SuperAdmin')||hasRole(currentUser,'SSG'), onRemove: (id)=>Projects.remove(id) });
      const w = document.createElement('div'); w.className='ssg-warning'; w.style.color='#b35a00'; w.textContent='Note: projects are stored locally until backend endpoints are added (/api/ssg/projects).'; projContainer.parentNode && projContainer.parentNode.insertBefore(w, projContainer.nextSibling);
    }
    const projForm = $id('ssg-projects-create-form');
    if (projForm) projForm.addEventListener('submit', async (ev)=>{ ev.preventDefault(); const fd=new FormData(projForm); const obj={}; for(const [k,v] of fd.entries()) obj[k]=v; await Projects.create(obj); if (projContainer) { const items = await Projects.list(); renderList(projContainer, items, 'projects', { allowEdit: hasRole(currentUser,'Admin')||hasRole(currentUser,'SuperAdmin')||hasRole(currentUser,'SSG'), onRemove: (id)=>Projects.remove(id) }); } projForm.reset(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAuto); else setTimeout(initAuto,0);

  /* ---------- Public API ---------- */
  window.SSG = Object.assign(window.SSG || {}, {
    // Members
    loadMembers, createMember, deleteMember, renderMembersTable,
    // Events
    loadEvents, createEvent, deleteEvent, renderEvents,
    // Feature managers (replace with server calls if endpoints added)
    Elections, Announcements, Projects,
    // utils
    fetchJson, getCurrentUser, hasRole
  });

const Votes = {
  async list() {
    try {
      return await fetchJson('/api/votes', { method: 'GET' });
    } catch (e) {
      console.error('Votes.list failed', e);
      return [];
    }
  },
  async submit(ballotId, optionId) {
    if (!ballotId || !optionId) throw new Error('ballotId and optionId required');
    return await fetchJson('/api/votes/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ballotId, optionId })
    });
  }
};

function renderVotes(container, ballots) {
  if (!container) return;
  container.innerHTML = '';
  if (!Array.isArray(ballots) || ballots.length === 0) {
    container.innerHTML = '<div class="muted small">No ballots at this time.</div>';
    return;
  }
  ballots.forEach(b => {
    const elb = document.createElement('div');
    elb.className = 'announcement';
    elb.innerHTML = `
      <div style="font-weight:600">${escapeHtml(b.title||b.name||'Ballot')}</div>
      <div class="small muted">${escapeHtml(b.description||b.details||'')}</div>`;
    const opts = document.createElement('div');
    opts.style.marginTop = '8px';
    (b.options || b.candidates || []).forEach(opt => {
      const label = document.createElement('label');
      label.style.display = 'block';
      label.innerHTML = `
        <input type="radio" name="vote_${b._id||b.id}"
               value="${escapeHtml(opt._id||opt.id||opt.value||opt.name||opt)}"/>
        ${escapeHtml(opt.name||opt.label||opt)}`;
      opts.appendChild(label);
    });
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Vote';
    btn.addEventListener('click', async () => {
      const selected = elb.querySelector(`input[name="vote_${b._id||b.id}"]:checked`);
      if (!selected) {
        alert('Choose an option');
        return;
      }
      try {
        await Votes.submit(b._id||b.id, selected.value);
        alert('Vote recorded');
      } catch (e) {
        console.error(e);
        alert('Vote failed');
      }
    });
    opts.appendChild(btn);
    elb.appendChild(opts);
    container.appendChild(elb);
  });
}

// ======================================================
// Hook into initAuto so votes render when page loads
// ======================================================
(async function extendInitAuto(){
  const orig = typeof initAuto === 'function' ? initAuto : null;
  window.initAuto = async function(){
    if(orig) await orig(); // run your existing initAuto first

    // Votes loader
    const voteContainer = $id('voteContainer');
    if (voteContainer) {
      try {
        const ballots = await Votes.list();
        const items = ballots.data || ballots.ballots || ballots || [];
        renderVotes(voteContainer, items);
      } catch (e) {
        console.error('loadBallots', e);
        voteContainer.innerHTML = '<div class="muted small">Failed to load ballots.</div>';
      }
    }
  };

})();
