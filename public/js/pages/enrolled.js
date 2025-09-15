// public/js/pages/enrolled.js
(async function(){
  const el = id => document.getElementById(id);
  const endpoints = ['/api/registrar/enrolled','/api/registrar/enrolledList','/api/enrollment/enrolled','/api/students/enrolled'];

  async function tryGet(paths){
    for(const p of paths){
      try{ const r = await PageUtils.fetchJson(p); if(r.ok) return r; }catch(e){} 
    }
    return null;
  }

  async function loadEnrolled(){
    const cont = el('enrolledList');
    cont.innerHTML = '<div class="muted small">Loading enrolled students…</div>';
    try{
      const r = await tryGet(endpoints);
      if(!r){ cont.innerHTML = '<div class="muted small">No enrolled endpoint available</div>'; return; }
      const j = await r.json();
      const items = j.data || j.enrolled || j.students || j || [];
      if(!items || items.length===0){ cont.innerHTML = '<div class="muted small">No enrolled students.</div>'; return; }
      cont.innerHTML = '';
      items.forEach(i=>{
        const row = document.createElement('div'); row.className='announcement';
        const name = i.name || i.fullName || `${i.firstName||''} ${i.lastName||''}` || i.email || i._id || i.id;
        row.innerHTML = `<div style="font-weight:600">${PageUtils.escapeHtml(name)}</div><div class="small muted">ID: ${PageUtils.escapeHtml(i._id||i.id||'')}</div>`;
        cont.appendChild(row);
      });
    }catch(e){ console.error(e); cont.innerHTML = '<div class="muted small">Failed to load enrolled students.</div>'; }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    el('logoutBtn')?.addEventListener('click', async ()=>{ try{ await PageUtils.fetchJson('/api/auth/logout',{method:'POST'}); }catch(e){} location.href='/html/login.html'; });
    loadEnrolled();
  });
})();
