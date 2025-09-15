// public/js/welcome.js
(function(){
  'use strict';

  const api = {
    me: '/api/auth/me',
    logout: '/api/auth/logout',
    announcements: '/api/announcements',
    superUsers: '/api/superadmin/users',
    impersonate: '/api/superadmin/impersonate'
  };

  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }
  function showModal(html){
    const root = qs('#modalRoot');
    root.innerHTML = '';
    root.style.display = 'block';
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `<div class="modal">${html}</div>`;
    backdrop.addEventListener('click', (ev)=>{ if(ev.target===backdrop){ root.style.display='none'; root.innerHTML=''; }});
    root.appendChild(backdrop);
  }
  function closeModal(){ const r = qs('#modalRoot'); r.style.display='none'; r.innerHTML=''; }

  async function fetchJson(url, opts = {}){
    const cfg = Object.assign({ credentials: 'include', headers: { 'Accept': 'application/json' } }, opts);
    return fetch(url, cfg);
  }

  function niceDate(dStr){
    try{
      const d = new Date(dStr);
      return d.toLocaleString('en-PH',{timeZone:'Asia/Manila',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
    }catch(e){ return dStr; }
  }

  // announcements loader
  async function loadAnnouncements(){
    const container = qs('#schoolAnnouncements');
    container.innerHTML = '<div class="muted small">Loading announcements…</div>';
    try{
      const res = await fetchJson(api.announcements);
      if(!res.ok){ container.innerHTML = '<div class="muted small">No announcements found.</div>'; return; }
      const json = await res.json();
      let items = [];
      if(Array.isArray(json)) items = json;
      else if(Array.isArray(json.announcements)) items = json.announcements;
      else if(Array.isArray(json.data)) items = json.data;
      else if(json.announcements) items = Object.values(json.announcements);
      if(!items || items.length === 0){ container.innerHTML = '<div class="muted small">No announcements.</div>'; return; }
      container.innerHTML = '';
      items.slice(0,8).forEach(a => {
        const title = a.title || a.subject || 'Announcement';
        const body = a.body || a.message || a.content || '';
        const date = a.createdAt || a.date || a.created || '';
        const el = document.createElement('div');
        el.className = 'announcement';
        el.innerHTML = `<div class="meta">${niceDate(date)}</div><div style="font-weight:600">${escapeHtml(title)}</div><div class="small muted">${truncate(escapeHtml(body),220)}</div>`;
        container.appendChild(el);
      });
    }catch(e){
      console.error('Announcements error',e);
      container.innerHTML = '<div class="muted small">Failed to load announcements.</div>';
    }
  }

  function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
  function truncate(s,n){ if(!s) return ''; return s.length>n? s.slice(0,n-1)+'…': s; }

  function updateClock(){
    const now = new Date();
    const optionsTime = { hour12:false, timeZone:'Asia/Manila' };
    const optionsDate = { weekday:'long', year:'numeric', month:'long', day:'numeric', timeZone:'Asia/Manila' };
    qs('#clock').textContent = now.toLocaleTimeString('en-PH', optionsTime);
    qs('#todayDate').textContent = 'Today is ' + now.toLocaleDateString('en-PH', optionsDate);
  }

  // impersonation attempts (tries multiple payload shapes)
  async function tryImpersonatePayloads(selected){
    const attempts = [
      { userId: selected._id || selected.id },
      { id: selected._id || selected.id },
      { email: selected.email },
      { emailAddress: selected.email },
      { user: selected._id || selected.id }
    ];
    for(const attempt of attempts){
      try{
        const res = await fetch(api.impersonate, { method: 'POST', credentials: 'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(attempt) });
        if(res.ok) return { ok:true };
        // continue trying
        const txt = await res.text();
        console.warn('Impersonate attempt failed', attempt, res.status, txt);
      }catch(err){ console.warn('Impersonate attempt error', err); }
    }
    return { ok:false };
  }

  async function tryStopImpersonationOnServer(){
    // attempt common stop variants; backend may or may not support them
    const candidates = [
      { url: api.impersonate + '/stop', opts: { method:'POST' } },
      { url: api.impersonate, opts: { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ stop: true }) } },
      { url: api.impersonate, opts: { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ restoreOriginal: true }) } },
      { url: api.impersonate + '/restore', opts: { method:'POST' } }
    ];
    for(const c of candidates){
      try{
        const res = await fetch(c.url, Object.assign({ credentials:'include' }, c.opts));
        if(res.ok) return true;
      }catch(e){ /* ignore */ }
    }
    return false;
  }

  // open impersonation modal and run
  async function openImpersonationModal(currentUser){
    try{
      const res = await fetchJson(api.superUsers);
      if(!res.ok){ const txt = await res.text(); showModal(`<h3>Unable to load users</h3><p class="small muted">${escapeHtml(txt||res.statusText||'server error')}</p><div class="actions"><button class="btn" onclick="document.querySelector('#modalRoot').style.display='none'">Close</button></div>`); return; }
      const j = await res.json();
      const users = j.users || j.data || j || [];
      let opts = '';
      users.forEach(u => {
        const id = u._id || u.id || u.userId || u._id;
        const label = (u.email || u.username || (u.name && (u.name.first || u.name.last)) || id);
        if(id && (id === (currentUser._id || currentUser.id || currentUser.userId))) return;
        opts += `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`;
      });

      const content = `
        <h3>Impersonate user</h3>
        <p class="small muted">Select a user to assume their session. This will change your current session to the selected user.</p>
        <div style="margin-top:10px">
          <div class="form-row">
            <select id="impersonateSelect" class="select">${opts}</select>
          </div>
          <div class="actions">
            <button id="impersonateCancel" class="btn ghost">Cancel</button>
            <button id="impersonateGo" class="btn">Impersonate</button>
          </div>
        </div>
      `;
      showModal(content);
      document.getElementById('impersonateCancel').addEventListener('click', closeModal);
      document.getElementById('impersonateGo').addEventListener('click', async ()=>{
        const sel = document.getElementById('impersonateSelect');
        const selectedId = sel.value;
        if(!selectedId){ alert('Please choose a user'); return; }
        const selectedUser = users.find(u => (u._id===selectedId||u.id===selectedId||u.userId===selectedId)) || { id:selectedId, _id:selectedId };
        // store original superadmin snapshot to sessionStorage so UI knows it's impersonating
        try{
          const orig = currentUser && { id: currentUser._id || currentUser.id, email: currentUser.email };
          if(orig) sessionStorage.setItem('EDUSEC_originalSuperAdmin', JSON.stringify(orig));
        }catch(e){}
        const res = await tryImpersonatePayloads(selectedUser);
        if(res.ok){
          closeModal();
          setTimeout(()=> location.reload(), 300);
        }else{
          alert('Impersonation failed. Check server logs or try another user.');
        }
      });
    }catch(err){
      console.error('Impersonation modal error', err);
      showModal('<h3>Error</h3><p class="small muted">Failed to open impersonation UI.</p>');
    }
  }

  async function restoreImpersonation(){
    // Try server-side stop endpoints
    const ok = await tryStopImpersonationOnServer();
    if(ok){
      sessionStorage.removeItem('EDUSEC_originalSuperAdmin');
      setTimeout(()=> location.reload(), 300);
      return;
    }
    // If server does not support stop, instruct user to logout & login again
    showModal(`<h3>Restore failed</h3>
      <p class="small muted">Unable to restore original SuperAdmin session automatically. Please logout and log back in as SuperAdmin to regain your original session.</p>
      <div class="actions"><button class="btn" onclick="document.querySelector('#modalRoot').style.display='none'">Close</button></div>`);
  }

  // Check if /school-info.pdf exists; if not show placeholder
  async function renderPdfOrPlaceholder(){
    const holder = qs('#pdfHolder');
    if(!holder) return;
    try{
      const res = await fetch('/school-info.pdf', { method: 'HEAD' });
      if(res.ok){
        holder.innerHTML = `<embed src="/school-info.pdf" type="application/pdf" />`;
      }else{
        holder.innerHTML = `<div class="small muted">School info PDF not available yet. Upload <code>public/school-info.pdf</code> to display here.</div>`;
      }
    }catch(e){
      // Some servers disallow HEAD — try GET but without downloading huge file
      try{
        const r2 = await fetch('/school-info.pdf', { method: 'GET' });
        if(r2.ok && r2.headers.get('content-type') && r2.headers.get('content-type').includes('pdf')){
          holder.innerHTML = `<embed src="/school-info.pdf" type="application/pdf" />`;
        }else{
          holder.innerHTML = `<div class="small muted">School info PDF not available yet. Upload <code>public/school-info.pdf</code> to display here.</div>`;
        }
      }catch(e2){
        holder.innerHTML = `<div class="small muted">School info PDF not available yet. Upload <code>public/school-info.pdf</code> to display here.</div>`;
      }
    }
  }

  // init
  document.addEventListener('DOMContentLoaded', async ()=>{
    try{
      const res = await fetchJson(api.me);
      if(!res.ok){
        // not logged in — redirect to login
        location.href = '/html/login.html';
        return;
      }
      const j = await res.json();
      const user = j.user || j;
      window.__EDUSEC__ = { user };

      // display user info
      qs('#userName').textContent = user.name || user.email || user.username || 'User';
      let roleText = user.role || 'User';
      if(user.extraRoles && Array.isArray(user.extraRoles) && user.extraRoles.length) roleText += ' (+' + user.extraRoles.join(',') + ')';
      qs('#userRole').textContent = roleText;

      // Build menu using menu.js utilities (global)
      const menuUtil = window.__EDUSEC_MENU;
      if(menuUtil){
        const finalMenu = menuUtil.buildMenuForUser(user);
        menuUtil.renderSidebar(finalMenu);
        menuUtil.renderQuickActions(finalMenu);
      }

      // Quick actions click handling (delegation)
      qs('#quickActions')?.addEventListener('click', (ev)=>{
        const a = ev.target.closest('a');
        if(a && a.getAttribute('href')) {
          // follow link relative to current page (these links are typically pages/...)
          window.location.href = a.getAttribute('href');
        }
      });

      // Add impersonation control if SuperAdmin
      if((user.role && user.role === 'SuperAdmin') || user.isSuperAdmin){
        const area = qs('#impersonationArea');
        if(area){
          const btn = document.createElement('button');
          btn.className = 'btn ghost';
          btn.textContent = 'Impersonate User';
          btn.title = 'Open SuperAdmin impersonation panel';
          btn.addEventListener('click', ()=> openImpersonationModal(user));
          area.appendChild(btn);
        }
      }

      // Show "Back to SuperAdmin" if flagged (server or sessionStorage)
      const serverFlag = user.originalSuperAdmin || user.isImpersonated || false;
      const localFlag = !!sessionStorage.getItem('EDUSEC_originalSuperAdmin');
      if(serverFlag || localFlag){
        const back = qs('#backToSuperBtn');
        if(back){
          back.style.display = 'inline-block';
          back.addEventListener('click', restoreImpersonation);
        }
      }

      // Load announcements and PDF area, clock
      loadAnnouncements();
      renderPdfOrPlaceholder();
      updateClock(); setInterval(updateClock, 1000);

    }catch(err){
      console.error('Welcome load error', err);
      location.href = '/html/login.html';
    }

    // logout binding
    const logoutBtn = qs('#logoutBtn');
    if(logoutBtn){
      logoutBtn.addEventListener('click', async ()=>{
        try{ await fetchJson(api.logout, { method: 'POST' }); }catch(e){}
        // clear any stored impersonation helper flags
        sessionStorage.removeItem('EDUSEC_originalSuperAdmin');
        location.href = '/html/login.html';
      });
    }
  });

})();
