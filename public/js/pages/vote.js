// public/js/pages/vote.js
(async function(){
  const el=id=>document.getElementById(id);
  async function loadBallots(){
    const c = el('voteContainer'); c.innerHTML = '<div class="muted small">Loading ballots…</div>';
    try{
      const r = await PageUtils.fetchJson('/api/votes');
      if(!r.ok){ c.innerHTML = '<div class="muted small">No ballots.</div>'; return; }
      const j = await r.json(); const items = j.data || j.ballots || j || [];
      if(!items || items.length === 0){ c.innerHTML = '<div class="muted small">No ballots at this time.</div>'; return; }
      c.innerHTML = '';
      for(const b of items){
        const elb = document.createElement('div'); elb.className='announcement';
        elb.innerHTML = `<div style="font-weight:600">${PageUtils.escapeHtml(b.title||b.name||'Ballot')}</div><div class="small muted">${PageUtils.truncate(PageUtils.escapeHtml(b.description||b.details||''), 200)}</div>`;
        const opts = document.createElement('div'); opts.style.marginTop='8px';
        (b.options || b.candidates || []).forEach(opt=>{
          const label = document.createElement('label');
          label.style.display='block';
          label.innerHTML = `<input type="radio" name="vote_${b._id||b.id}" value="${PageUtils.escapeHtml(opt._id||opt.id||opt.value||opt.name||opt)}"/> ${PageUtils.escapeHtml(opt.name||opt.label||opt)}`;
          opts.appendChild(label);
        });
        const btn = document.createElement('button'); btn.className='btn'; btn.textContent='Vote';
        btn.addEventListener('click', async ()=>{
          const selected = elb.querySelector(`input[name="vote_${b._id||b.id}"]:checked`);
          if(!selected){ alert('Choose an option'); return; }
          try{
            const r2 = await PageUtils.fetchJson('/api/votes/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ballotId: b._id||b.id, optionId: selected.value }) });
            if(r2.ok) { alert('Vote recorded'); } else { alert('Vote failed'); }
          }catch(e){ console.error(e); alert('Error'); }
        });
        opts.appendChild(btn);
        elb.appendChild(opts);
        c.appendChild(elb);
      }
    }catch(e){ console.error(e); c.innerHTML = '<div class="muted small">Failed to load ballots.</div>'; }
  }

  el('logoutBtn')?.addEventListener('click', async ()=>{ try{ await PageUtils.fetchJson('/api/auth/logout',{method:'POST'}); }catch(e){} location.href='/html/login.html'; });
  loadBallots();
})();
