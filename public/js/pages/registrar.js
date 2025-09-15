// public/js/pages/registrar.js
(async function(){
  const endpoints = {
    enrollees: ['/api/registrar/enrollees','/api/enrollment/enrollees'],
    enroll: '/api/registrar/enroll', // POST { id } -> move to enrolled
    enrolled: ['/api/registrar/enrolled','/api/registrar/enrolledList'],
    reject: '/api/registrar/reject'
  };
  const el=id=>document.getElementById(id);

  async function tryGet(paths){
    for(const p of paths){
      try{ const r = await PageUtils.fetchJson(p); if(r.ok) return r; }catch(e){}
    }
    return null;
  }

  async function loadEnrollees(){
    const cont = el('enrolleeList');
    cont.innerHTML = '<div class="muted small">Loading enrollees…</div>';
    try{
      const r = await tryGet(endpoints.enrollees);
      if(!r){ cont.innerHTML = '<div class="muted small">No enrollee endpoint available</div>'; return; }
      const j = await r.json();
      const items = j.data || j.enrollees || j || [];
      if(!items || items.length===0){ cont.innerHTML = '<div class="muted small">No enrollees.</div>'; return; }
      cont.innerHTML = '';
      items.forEach(i=>{
        const row = document.createElement('div'); row.className='announcement';
        const name = i.name || i.fullName || `${i.firstName||''} ${i.lastName||''}`;
        row.innerHTML = `<div style="font-weight:600">${PageUtils.escapeHtml(name)}</div><div class="small muted">ID: ${PageUtils.escapeHtml(i._id||i.id||'')}</div>`;
        const actions = document.createElement('div'); actions.style.marginTop='8px';
        const accept = document.createElement('button'); accept.className='btn ghost'; accept.textContent='Accept';
        const reject = document.createElement('button'); reject.className='btn ghost'; reject.textContent='Reject';
        accept.addEventListener('click', ()=> acceptEnrollee(i));
        reject.addEventListener('click', ()=> rejectEnrollee(i));
        actions.appendChild(accept); actions.appendChild(reject);
        row.appendChild(actions);
        cont.appendChild(row);
      });
    }catch(e){ console.error(e); cont.innerHTML = '<div class="muted small">Failed to load enrollees.</div>'; }
  }

  async function loadEnrolled(){
    const cont = el('enrolledList');
    cont.innerHTML = '<div class="muted small">Loading enrolled students…</div>';
    try{
      const r = await tryGet(endpoints.enrolled);
      if(!r){ cont.innerHTML = '<div class="muted small">No enrolled endpoint available</div>'; return; }
      const j = await r.json();
      const items = j.data || j.enrolled || j || [];
      if(!items || items.length===0){ cont.innerHTML = '<div class="muted small">No enrolled students.</div>'; return; }
      cont.innerHTML = '';
      items.forEach(i=>{
        const row = document.createElement('div'); row.className='announcement';
        const name = i.name || i.fullName || `${i.firstName||''} ${i.lastName||''}`;
        row.innerHTML = `<div style="font-weight:600">${PageUtils.escapeHtml(name)}</div><div class="small muted">ID: ${PageUtils.escapeHtml(i._id||i.id||'')}</div>`;
        cont.appendChild(row);
      });
    }catch(e){ console.error(e); cont.innerHTML = '<div class="muted small">Failed to load enrolled students.</div>'; }
  }

  async function acceptEnrollee(i){
    if(!confirm('Accept enrollee?')) return;
    try{
      const r = await PageUtils.fetchJson(endpoints.enroll, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: i._id || i.id }) });
      if(!r.ok){ alert('Accept failed'); return; }
      loadEnrollees(); loadEnrolled();
    }catch(e){ console.error(e); alert('Error'); }
  }

  async function rejectEnrollee(i){
    if(!confirm('Reject enrollee?')) return;
    try{
      const r = await PageUtils.fetchJson(endpoints.reject, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: i._id || i.id }) });
      if(!r.ok){ alert('Reject failed'); return; }
      loadEnrollees();
    }catch(e){ console.error(e); alert('Error'); }
  }

  // logout binding
  const logoutBtn = el('logoutBtn'); if(logoutBtn) logoutBtn.addEventListener('click', async ()=>{ try{ await PageUtils.fetchJson('/api/auth/logout',{method:'POST'}); }catch(e){} location.href='/html/login.html'; });

  // init
  loadEnrollees(); loadEnrolled();
})();
