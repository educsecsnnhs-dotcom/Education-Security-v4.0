// public/js/page-utils.js
(function(window){
  async function fetchJson(url, opts = {}) {
    const cfg = Object.assign({ credentials: 'include', headers: { 'Accept': 'application/json' } }, opts);
    return fetch(url, cfg);
  }

  function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
  function truncate(s,n){ if(!s) return ''; return s.length>n? s.slice(0,n-1)+'…': s; }
  function niceDate(dStr){
    try{ const d=new Date(dStr); return d.toLocaleString('en-PH',{timeZone:'Asia/Manila',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); }
    catch(e){ return dStr; }
  }

  function showModal(html){
    let root = document.getElementById('modalRoot');
    if(!root){
      root = document.createElement('div'); root.id = 'modalRoot'; document.body.appendChild(root);
    }
    root.innerHTML = '';
    root.style.display = 'block';
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `<div class="modal">${html}</div>`;
    backdrop.addEventListener('click', (ev)=>{ if(ev.target===backdrop){ root.style.display='none'; root.innerHTML=''; }});
    root.appendChild(backdrop);
  }
  function closeModal(){ const r=document.getElementById('modalRoot'); if(r){ r.style.display='none'; r.innerHTML=''; } }

  async function currentUser(){
    try{
      const r = await fetchJson('/api/auth/me');
      if(!r.ok) return null;
      const j = await r.json();
      return j.user || j;
    }catch(e){ return null; }
  }

  function roleCheck(user, allowedRoles = []){
    if(!user) return false;
    if(allowedRoles.includes(user.role)) return true;
    if(user.extraRoles && Array.isArray(user.extraRoles)) {
      return user.extraRoles.some(r => allowedRoles.includes(r));
    }
    return false;
  }

  window.PageUtils = {
    fetchJson, escapeHtml, truncate, niceDate, showModal, closeModal, currentUser, roleCheck
  };
})(window);
