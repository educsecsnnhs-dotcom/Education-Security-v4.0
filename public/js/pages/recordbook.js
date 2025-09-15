// public/js/pages/recordbook.js
(async function(){
  const endpoints = {
    sections: ['/api/sections','/api/recordbook/sections'],
    subjects: ['/api/subjects','/api/recordbook/subjects'],
    records: ['/api/recordbook','/api/records'] // GET ?section=:id&subject=:id
  };
  const el=id=>document.getElementById(id);

  async function tryGet(paths){
    for(const p of paths){
      try{ const r = await PageUtils.fetchJson(p); if(r.ok) return r; }catch(e){} 
    }
    return null;
  }

  async function loadSelectors(){
    // sections
    const s = await tryGet(endpoints.sections);
    const secSel = el('selectSection'), subSel=el('selectSubject');
    if(s){
      const j = await s.json(); const items = j.data || j.sections || j || [];
      secSel.innerHTML = '<option value="">Select section</option>';
      items.forEach(it => { const o=document.createElement('option'); o.value = it._id||it.id; o.textContent = it.name || it.title || (it.level && it.name) || it; secSel.appendChild(o); });
    } else { secSel.innerHTML = '<option value="">No sections</option>'; }
    // subjects
    const sub = await tryGet(endpoints.subjects);
    if(sub){
      const j = await sub.json(); const items = j.data || j.subjects || j || [];
      subSel.innerHTML = '<option value="">Select subject</option>';
      items.forEach(it => { const o=document.createElement('option'); o.value = it._id||it.id; o.textContent = it.name || it.title || it; subSel.appendChild(o); });
    } else { subSel.innerHTML = '<option value="">No subjects</option>'; }
  }

  async function loadRecord(){
    const sec = el('selectSection').value;
    const sub = el('selectSubject').value;
    const container = el('recordContainer');
    if(!sec || !sub){ container.innerHTML = '<div class="muted small">Choose section and subject</div>'; return; }
    container.innerHTML = '<div class="muted small">Loading recordbook…</div>';
    try{
      // try different endpoints
      let res = null;
      for(const p of endpoints.records){ 
        try{
          const url = p + '?section=' + encodeURIComponent(sec) + '&subject=' + encodeURIComponent(sub);
          const r = await PageUtils.fetchJson(url);
          if(r.ok){ res = r; break; }
        }catch(e){}
      }
      if(!res){ container.innerHTML = '<div class="muted small">Recordbook endpoint not available</div>'; return; }
      const j = await res.json(); const items = j.data || j.records || j || [];
      if(!items || items.length === 0){ container.innerHTML = '<div class="muted small">No record entries.</div>'; return; }
      // generate table
      const table = document.createElement('div');
      table.innerHTML = `<div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left">Student</th><th>Grade</th><th>Actions</th></tr></thead><tbody></tbody></table></div>`;
      const tbody = table.querySelector('tbody');
      items.forEach(row => {
        const tr = document.createElement('tr');
        const student = row.studentName || row.name || row.student || (row.student && row.student.name) || 'Student';
        const grade = row.grade || row.score || '';
        tr.innerHTML = `<td style="padding:8px;border-top:1px solid #eef2ff">${PageUtils.escapeHtml(student)}</td>
                        <td style="padding:8px;border-top:1px solid #eef2ff"><input data-id="${row._id||row.id||''}" value="${PageUtils.escapeHtml(String(grade))}" class="input" style="width:80px"/></td>
                        <td style="padding:8px;border-top:1px solid #eef2ff"><button class="btn ghost updateBtn">Update</button></td>`;
        tbody.appendChild(tr);
      });
      container.innerHTML = ''; container.appendChild(table);

      container.querySelectorAll('.updateBtn').forEach(btn=>{
        btn.addEventListener('click', async (ev)=>{
          const input = ev.target.closest('tr').querySelector('input');
          const id = input.getAttribute('data-id'); const value = input.value;
          try{
            // attempt PUT to /api/recordbook/:id
            let ok=false;
            try{
              const r = await PageUtils.fetchJson('/api/recordbook/' + id, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ grade: value }) });
              if(r.ok) ok=true;
            }catch(e){}
            if(!ok) alert('Update failed');
            else { alert('Updated'); loadRecord(); }
          }catch(e){ console.error(e); alert('Error'); }
        });
      });

    }catch(e){ console.error(e); container.innerHTML = '<div class="muted small">Failed to load recordbook.</div>'; }
  }

  // events
  el('loadRecord').addEventListener('click', loadRecord);
  el('logoutBtn')?.addEventListener('click', async ()=>{ try{ await PageUtils.fetchJson('/api/auth/logout',{method:'POST'}); }catch(e){} location.href='/html/login.html'; });
  await loadSelectors();
})();
