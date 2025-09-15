// public/js/pages/ssg.js
(async function(){
  const el = id => document.getElementById(id);

  // tolerant endpoints
  const endpoints = {
    members: ['/api/ssg/members','/api/ssg/members/list','/api/ssg'],
    events: ['/api/ssg/events','/api/ssg/events/list'],
    createMember: '/api/ssg/members',
    createEvent: '/api/ssg/events',
    removeMember: '/api/ssg/members', // DELETE /api/ssg/members/:id
    removeEvent: '/api/ssg/events' // DELETE /api/ssg/events/:id
  };

  async function getFirst(paths){
    for(const p of paths){
      try{
        const r = await PageUtils.fetchJson(p);
        if(r.ok) return r;
      }catch(e){}
    }
    return null;
  }

  async function loadSSG(){
    const container = el('ssgList');
    container.innerHTML = '<div class="muted small">Loading SSG data…</div>';
    try{
      const memRes = await getFirst(endpoints.members);
      const evRes = await getFirst(endpoints.events);
      const members = memRes ? (await memRes.json()).data || (await memRes.json()).members || (await memRes.json()) : [];
      const events = evRes ? (await evRes.json()).data || (await evRes.json()).events || (await evRes.json()) : [];

      container.innerHTML = '';
      // Members section
      const membCard = document.createElement('div'); membCard.className='card';
      membCard.innerHTML = `<h3>Members (${(members && members.length)||0})</h3>`;
      const memList = document.createElement('div'); memList.style.display='flex'; memList.style.flexDirection='column'; memList.style.gap='8px';
      if(!members || members.length===0){
        memList.innerHTML = '<div class="muted small">No members</div>';
      } else {
        members.forEach(m=>{
          const row = document.createElement('div'); row.className='announcement';
          const name = m.name || m.fullName || m.email || m.username || m._id || m.id;
          row.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:600">${PageUtils.escapeHtml(name)}</div><div class="small muted">${PageUtils.escapeHtml(m.position||m.role||'')}</div></div><div></div></div>`;
          const actions = document.createElement('div'); actions.style.marginTop='8px';
          const remove = document.createElement('button'); remove.className='btn ghost'; remove.textContent='Remove';
          remove.addEventListener('click', ()=> removeMember(m));
          actions.appendChild(remove);
          row.appendChild(actions);
          memList.appendChild(row);
        });
      }
      membCard.appendChild(memList);
      container.appendChild(membCard);

      // Events card
      const evCard = document.createElement('div'); evCard.className='card'; evCard.style.marginTop='12px';
      evCard.innerHTML = `<h3>Events (${(events && events.length)||0})</h3>`;
      const evList = document.createElement('div'); evList.style.display='flex'; evList.style.flexDirection='column'; evList.style.gap='8px';
      if(!events || events.length===0){
        evList.innerHTML = '<div class="muted small">No events</div>';
      } else {
        events.forEach(ev=>{
          const r = document.createElement('div'); r.className='announcement';
          r.innerHTML = `<div style="font-weight:600">${PageUtils.escapeHtml(ev.title||ev.name||ev._id||ev.id)}</div><div class="small muted">${PageUtils.truncate(PageUtils.escapeHtml(ev.description||ev.details||''),180)}</div>`;
          const act = document.createElement('div'); act.style.marginTop='8px';
          const remove = document.createElement('button'); remove.className='btn ghost'; remove.textContent='Remove';
          remove.addEventListener('click', ()=> removeEvent(ev));
          act.appendChild(remove);
          r.appendChild(act);
          evList.appendChild(r);
        });
      }
      evCard.appendChild(evList);
      container.appendChild(evCard);

      // show quick actions for allowed roles
      const user = await PageUtils.currentUser();
      if(user && (user.role==='SSG' || user.role==='Admin' || user.role==='SuperAdmin')){
        el('createMemberBtn')?.style.display = 'inline-block';
        el('createEventBtn')?.style.display = 'inline-block';
      }

    }catch(e){
      console.error('SSG load error', e);
      container.innerHTML = '<div class="muted small">Failed to load SSG data.</div>';
    }
  }

  async function removeMember(m){
    if(!confirm('Remove member?')) return;
    const id = m._id || m.id;
    try{
      const r = await PageUtils.fetchJson(endpoints.removeMember + '/' + id, { method:'DELETE' });
      if(!r.ok){ alert('Remove failed'); return; }
      loadSSG();
    }catch(e){ console.error(e); alert('Error'); }
  }

  async function removeEvent(ev){
    if(!confirm('Remove event?')) return;
    const id = ev._id || ev.id;
    try{
      const r = await PageUtils.fetchJson(endpoints.removeEvent + '/' + id, { method:'DELETE' });
      if(!r.ok){ alert('Remove failed'); return; }
      loadSSG();
    }catch(e){ console.error(e); alert('Error'); }
  }

  function openCreateMember(){
    const html = `<h3>Create SSG Member</h3>
      <label>Name<br><input id="mName" class="input"/></label><br>
      <label>Position<br><input id="mPos" class="input"/></label>
      <div class="actions"><button id="mCancel" class="btn ghost">Cancel</button><button id="mSave" class="btn">Create</button></div>`;
    PageUtils.showModal(html);
    document.getElementById('mCancel').addEventListener('click', PageUtils.closeModal);
    document.getElementById('mSave').addEventListener('click', async ()=>{
      const name = document.getElementById('mName').value.trim();
      const pos = document.getElementById('mPos').value.trim();
      if(!name){ alert('Name required'); return; }
      try{
        const r = await PageUtils.fetchJson(endpoints.createMember, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, position: pos }) });
        if(!r.ok){ alert('Create failed'); return; }
        PageUtils.closeModal(); loadSSG();
      }catch(e){ console.error(e); alert('Error'); }
    });
  }

  function openCreateEvent(){
    const html = `<h3>Create Event</h3>
      <label>Title<br><input id="eTitle" class="input"/></label><br>
      <label>Description<br><textarea id="eDesc" class="input" rows="5"></textarea></label>
      <div class="actions"><button id="eCancel" class="btn ghost">Cancel</button><button id="eSave" class="btn">Create</button></div>`;
    PageUtils.showModal(html);
    document.getElementById('eCancel').addEventListener('click', PageUtils.closeModal);
    document.getElementById('eSave').addEventListener('click', async ()=>{
      const title = document.getElementById('eTitle').value.trim();
      const desc = document.getElementById('eDesc').value.trim();
      if(!title){ alert('Title required'); return; }
      try{
        const r = await PageUtils.fetchJson(endpoints.createEvent, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, description: desc }) });
        if(!r.ok){ alert('Create failed'); return; }
        PageUtils.closeModal(); loadSSG();
      }catch(e){ console.error(e); alert('Error'); }
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    el('createMemberBtn')?.addEventListener('click', openCreateMember);
    el('createEventBtn')?.addEventListener('click', openCreateEvent);
    el('logoutBtn')?.addEventListener('click', async ()=>{ try{ await PageUtils.fetchJson('/api/auth/logout',{method:'POST'}); }catch(e){} location.href='/html/login.html'; });
    loadSSG();
  });
})();
