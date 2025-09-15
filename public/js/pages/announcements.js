// public/js/pages/announcements.js
(async function(){
  const api = { list: '/api/announcements', create: '/api/announcements', edit: '/api/announcements', del: '/api/announcements' };
  const el = id => document.getElementById(id);

  async function load(){
    const list = el('annList');
    list.innerHTML = '<div class="muted small">Loading announcements…</div>';
    try{
      const res = await PageUtils.fetchJson(api.list);
      if(!res.ok){ list.innerHTML = '<div class="muted small">No announcements found.</div>'; return; }
      const j = await res.json();
      let items = Array.isArray(j) ? j : (j.announcements || j.data || []);
      if(!items || items.length===0){ list.innerHTML = '<div class="muted small">No announcements.</div>'; return; }
      list.innerHTML = '';
      items.forEach(a => {
        const title = a.title || a.subject || 'Announcement';
        const body = a.body || a.message || a.content || '';
        const date = a.createdAt || a.date || a.created || '';
        const wrapper = document.createElement('div');
        wrapper.className = 'announcement';
        wrapper.innerHTML = `<div class="meta">${PageUtils.niceDate(date)}</div>
          <div style="font-weight:600">${PageUtils.escapeHtml(title)}</div>
          <div class="small muted">${PageUtils.truncate(PageUtils.escapeHtml(body), 300)}</div>`;
        // admin controls if allowed
        const user = await PageUtils.currentUser();
        if(user && (user.role==='Admin' || user.role==='Registrar' || user.role==='Moderator' || user.role==='SuperAdmin')){
          const controls = document.createElement('div');
          controls.style.marginTop = '8px';
          const edit = document.createElement('button'); edit.className='btn ghost'; edit.textContent='Edit';
          const del = document.createElement('button'); del.className='btn ghost'; del.textContent='Delete';
          edit.addEventListener('click', ()=> openEditor(a));
          del.addEventListener('click', ()=> deleteAnnouncement(a));
          controls.appendChild(edit); controls.appendChild(del);
          wrapper.appendChild(controls);
        }
        list.appendChild(wrapper);
      });
    }catch(e){ console.error(e); list.innerHTML='<div class="muted small">Failed to load announcements.</div>'; }
  }

  function openEditor(item){
    const isNew = !item || !item._id;
    const html = `
      <h3>${isNew? 'Create' : 'Edit'} announcement</h3>
      <label>Title<br><input id="annTitle" class="input" value="${PageUtils.escapeHtml(item?.title||'')}" /></label><br>
      <label>Body<br><textarea id="annBody" class="input" rows="6">${PageUtils.escapeHtml(item?.body||item?.message||'')}</textarea></label>
      <div class="actions"><button id="cancel" class="btn ghost">Cancel</button><button id="save" class="btn">${isNew? 'Create':'Save'}</button></div>`;
    PageUtils.showModal(html);
    document.getElementById('cancel').addEventListener('click', PageUtils.closeModal);
    document.getElementById('save').addEventListener('click', async ()=>{
      const title = document.getElementById('annTitle').value.trim();
      const body = document.getElementById('annBody').value.trim();
      if(!title){ alert('Title required'); return; }
      try{
        const payload = { title, body };
        let url = api.create, method='POST';
        if(!isNew){ url = api.edit + '/' + (item._id||item.id); method='PUT'; }
        const r = await PageUtils.fetchJson(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        if(!r.ok){ alert('Failed'); return; }
        PageUtils.closeModal();
        load();
      }catch(e){ console.error(e); alert('Error'); }
    });
  }

  async function deleteAnnouncement(item){
    if(!confirm('Delete announcement?')) return;
    try{
      const id = item._id || item.id;
      const r = await PageUtils.fetchJson(api.del + '/' + id, { method:'DELETE' });
      if(!r.ok){ alert('Delete failed'); return; }
      load();
    }catch(e){ console.error(e); alert('Error'); }
  }

  // create button behavior
  const createBtn = el('createAnnouncementBtn');
  if(createBtn){
    createBtn.addEventListener('click', ()=> openEditor(null));
  }

  // Show create button for allowed roles
  const user = await PageUtils.currentUser();
  if(user && (user.role==='Admin' || user.role==='Registrar' || user.role==='Moderator' || user.role==='SuperAdmin')){
    if(createBtn) createBtn.style.display = 'inline-block';
  }

  // Wire logout (shared pattern)
  const logout = el('logoutBtn');
  if(logout) logout.addEventListener('click', async ()=>{ try{ await PageUtils.fetchJson('/api/auth/logout',{method:'POST'}); }catch(e){} location.href='/html/login.html'; });

  load();
})();
