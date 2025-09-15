// public/js/pages/role-management.js
(async function(){
  const api = { users: '/api/superadmin/users', setRole: '/api/superadmin/role', impersonate:'/api/superadmin/impersonate' };
  const el = id => document.getElementById(id);

  async function loadUsers(){
    const cont = el('usersList');
    cont.innerHTML = '<div class="muted small">Loading users…</div>';
    try{
      const r = await PageUtils.fetchJson(api.users);
      if(!r.ok){ cont.innerHTML = '<div class="muted small">Unable to load users</div>'; return; }
      const j = await r.json();
      const users = j.users || j.data || j || [];
      if(!users || users.length===0){ cont.innerHTML = '<div class="muted small">No users found.</div>'; return; }
      cont.innerHTML = '';
      users.forEach(u=>{
        const row = document.createElement('div'); row.className='announcement';
        const id = u._id || u.id || u.userId || '';
        const email = u.email || u.emailAddress || u.username || id;
        row.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-weight:600">${PageUtils.escapeHtml(email)}</div><div class="small muted">Role: ${PageUtils.escapeHtml(u.role||'User')}</div></div>
          <div></div></div>`;
        const controls = document.createElement('div'); controls.style.marginTop='8px';
        const roleSel = document.createElement('select');
        const roleOptions = ['User','Student','Moderator','Registrar','Admin','SSG','SuperAdmin'];
        roleOptions.forEach(rOpt => { const o = document.createElement('option'); o.value = rOpt; o.textContent = rOpt; if((u.role||'')===rOpt) o.selected=true; roleSel.appendChild(o); });
        const save = document.createElement('button'); save.className='btn ghost'; save.textContent='Save role';
        const imp = document.createElement('button'); imp.className='btn ghost'; imp.textContent='Impersonate';
        save.addEventListener('click', ()=> setRole(id, roleSel.value));
        imp.addEventListener('click', ()=> impersonateUser(u));
        controls.appendChild(roleSel); controls.appendChild(save); controls.appendChild(imp);
        row.appendChild(controls);
        cont.appendChild(row);
      });
    }catch(e){ console.error(e); cont.innerHTML='<div class="muted small">Failed to load users.</div>'; }
  }

  async function setRole(userId, role){
    try{
      const r = await PageUtils.fetchJson(api.setRole, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId, role }) });
      if(!r.ok){ alert('Set role failed'); return; }
      loadUsers();
    }catch(e){ console.error(e); alert('Error'); }
  }

  async function impersonateUser(u){
    if(!confirm('Impersonate ' + (u.email||u.username||u._id) + '?')) return;
    try{
      const res = await PageUtils.fetchJson(api.impersonate, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: u._id || u.id }) });
      if(res.ok){
        // store original to local storage so Back to Super works
        try{ sessionStorage.setItem('EDUSEC_originalSuperAdmin', JSON.stringify({ id: u._id||u.id })); }catch(e){}
        location.reload();
      }else{
        const txt = await res.text(); alert('Impersonation failed: ' + txt);
      }
    }catch(e){ console.error(e); alert('Error'); }
  }

  const logout = el('logoutBtn'); if(logout) logout.addEventListener('click', async ()=>{ try{ await PageUtils.fetchJson('/api/auth/logout',{method:'POST'}); }catch(e){} location.href='/html/login.html'; });

  loadUsers();
})();
