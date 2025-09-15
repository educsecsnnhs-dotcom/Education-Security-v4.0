// public/js/pages/grades.js
(async function(){
  const el=id=>document.getElementById(id);
  // tolerant endpoints
  const endpoints = {
    studentGrades: ['/api/grades','/api/grades/student','/api/grades/me'],
    allGrades: ['/api/grades/all','/api/grades/list'],
    update: ['/api/grades'] // PUT /api/grades/:id
  };

  async function loadViews(){
    const sel = el('gradeViewSelect');
    sel.innerHTML = '<option value="">Loading...</option>';
    // For students show "My grades", for teachers show sections - try to probe
    const user = await PageUtils.currentUser();
    sel.innerHTML = '';
    if(!user) { sel.innerHTML = '<option value="">No user</option>'; return; }
    if(user.role === 'Student'){
      sel.innerHTML = '<option value="me">My Grades</option>';
    } else {
      // teachers/admins: try to fetch subjects/sections
      try{
        const sRes = await PageUtils.fetchJson('/api/sections');
        if(sRes.ok){
          const j = await sRes.json(); const items = j.data || j || [];
          items.forEach(it => { const o=document.createElement('option'); o.value = 'section:'+ (it._id||it.id); o.textContent = it.name || it.title || it; sel.appendChild(o); });
        }
        const subRes = await PageUtils.fetchJson('/api/subjects');
        if(subRes.ok){
          const j = await subRes.json(); const items = j.data || j || [];
          items.forEach(it => { const o=document.createElement('option'); o.value = 'subject:'+ (it._id||it.id); o.textContent = 'Subject: ' + (it.name||it.title||it); sel.appendChild(o); });
        }
      }catch(e){}
      // fallback
      sel.insertAdjacentHTML('beforeend','<option value="all">All Grades</option>');
    }
  }

  async function loadGrades(){
    const v = el('gradeViewSelect').value;
    const container = el('gradesContainer');
    container.innerHTML = '<div class="muted small">Loading grades…</div>';
    try{
      let res = null;
      if(v === 'me'){
        for(const p of endpoints.studentGrades){
          try{ const r = await PageUtils.fetchJson(p); if(r.ok){ res=r; break; } }catch(e){}
        }
      } else if(v && v.startsWith('section:')){
        // try /api/grades?section=
        const sec = v.split(':',2)[1];
        for(const p of endpoints.allGrades){
          try{ const url = p + '?section=' + encodeURIComponent(sec); const r = await PageUtils.fetchJson(url); if(r.ok){ res=r; break; } }catch(e){}
        }
      } else if(v && v.startsWith('subject:')){
        const sub = v.split(':',2)[1];
        for(const p of endpoints.allGrades){
          try{ const url = p + '?subject=' + encodeURIComponent(sub); const r = await PageUtils.fetchJson(url); if(r.ok){ res=r; break; } }catch(e){}
        }
      } else {
        for(const p of endpoints.allGrades){ try{ const r = await PageUtils.fetchJson(p); if(r.ok){ res=r; break; } }catch(e){} }
      }
      if(!res){ container.innerHTML = '<div class="muted small">Grades endpoint not available</div>'; return; }
      const j = await res.json(); const items = j.data || j.grades || j || [];
      if(!items || items.length===0){ container.innerHTML = '<div class="muted small">No grades found.</div>'; return; }
      // render simple table
      const table = document.createElement('div');
      table.innerHTML = `<div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>Student</th><th>Subject</th><th>Grade</th><th>Actions</th></tr></thead><tbody></tbody></table></div>`;
      const tbody = table.querySelector('tbody');
      items.forEach(g=>{
        const tr = document.createElement('tr');
        const student = g.studentName || (g.student && (g.student.name||'')) || g.name || 'Student';
        const subject = g.subjectName || (g.subject && (g.subject.name||'')) || g.subject || '';
        const grade = g.grade || g.score || '';
        tr.innerHTML = `<td style="padding:8px;border-top:1px solid #eef2ff">${PageUtils.escapeHtml(student)}</td>
                        <td style="padding:8px;border-top:1px solid #eef2ff">${PageUtils.escapeHtml(subject)}</td>
                        <td style="padding:8px;border-top:1px solid #eef2ff"><input data-id="${g._id||g.id||''}" value="${PageUtils.escapeHtml(String(grade))}" class="input" style="width:80px"/></td>
                        <td style="padding:8px;border-top:1px solid #eef2ff"><button class="btn ghost updateBtn">Update</button></td>`;
        tbody.appendChild(tr);
      });
      container.innerHTML = ''; container.appendChild(table);
      container.querySelectorAll('.updateBtn').forEach(btn=>{
        btn.addEventListener('click', async (ev)=>{
          const input = ev.target.closest('tr').querySelector('input');
          const id = input.getAttribute('data-id'); const value = input.value;
          try{
            const r = await PageUtils.fetchJson('/api/grades/' + id, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ grade: value }) });
            if(!r.ok) alert('Update failed'); else { alert('Updated'); loadGrades(); }
          }catch(e){ console.error(e); alert('Error'); }
        });
      });
    }catch(e){ console.error(e); container.innerHTML = '<div class="muted small">Failed to load grades.</div>'; }
  }

  el('loadGrades').addEventListener('click', loadGrades);
  el('logoutBtn')?.addEventListener('click', async ()=>{ try{ await PageUtils.fetchJson('/api/auth/logout',{method:'POST'}); }catch(e){} location.href='/html/login.html'; });

  loadViews();
})();
