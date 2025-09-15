// public/js/pages/archives.js
(async function(){
  const el = id => document.getElementById(id);
  const candidates = ['/api/archives','/api/registrar/archives','/api/archives/list'];

  async function fetchFirst(paths){
    for(const p of paths){
      try{ const r = await PageUtils.fetchJson(p); if(r.ok) return r; }catch(e){} 
    }
    return null;
  }

  async function loadArchives(){
    const cont = el('archivesList');
    cont.innerHTML = '<div class="muted small">Loading archives…</div>';
    try{
      const r = await fetchFirst(candidates);
      if(!r){ cont.innerHTML = '<div class="muted small">No archives endpoint available</div>'; return; }
      const j = await r.json();
      const items = j.data || j.archives || j || [];
      if(!items || items.length===0){ cont.innerHTML = '<div class="muted small">No archived records.</div>'; return; }
      cont.innerHTML = '';
      items.forEach(it=>{
        const row = document.createElement('div'); row.className='announcement';
        row.innerHTML = `<div style="font-weight:600">${PageUtils.escapeHtml(it.title || it.name || it._id || it.id)}</div>
          <div class="small muted">${PageUtils.truncate(PageUtils.escapeHtml(it.summary || it.description || JSON.stringify(it)), 220)}</div>`;
        cont.appendChild(row);
      });
    }catch(e){ console.error(e); cont.innerHTML = '<div class="muted small">Failed to load archives.</div>'; }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    el('logoutBtn')?.addEventListener('click', async ()=>{ try{ await PageUtils.fetchJson('/api/auth/logout',{method:'POST'}); }catch(e){} location.href='/html/login.html'; });
    loadArchives();
  });
})();
