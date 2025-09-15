// public/js/pages/attendance.js
(async function(){
  const el=id=>document.getElementById(id);
  async function loadSections(){
    try{
      const r = await PageUtils.fetchJson('/api/sections');
      if(!r.ok){ el('attSection').innerHTML = '<option value="">No sections</option>'; return; }
      const j = await r.json(); const items = j.data || j.sections || j || [];
      const sel = el('attSection'); sel.innerHTML = '<option value="">Select section</option>';
      items.forEach(it => { const o = document.createElement('option'); o.value = it._id||it.id; o.textContent = it.name || it.title || it; sel.appendChild(o); });
    }catch(e){ el('attSection').innerHTML = '<option value="">No sections</option>'; }
  }

  async function loadAttendance(){
    const sec = el('attSection').value; const date = el('attDate').value;
    const cont = el('attContainer');
    if(!sec || !date){ cont.innerHTML = '<div class="muted small">Select section and date.</div>'; return; }
    cont.innerHTML = '<div class="muted small">Loading attendance…</div>';
    try{
      // try common endpoints
      const paths = ['/api/attendance?section='+encodeURIComponent(sec)+'&date='+encodeURIComponent(date), '/api/attendance/list?section='+encodeURIComponent(sec)+'&date='+encodeURIComponent(date)];
      let res=null;
      for(const p of paths){ try{ const r = await PageUtils.fetchJson(p); if(r.ok){ res = r; break; } }catch(e){} }
      if(!res){ cont.innerHTML = '<div class="muted small">Attendance endpoint not available.</div>'; return; }
      const j = await res.json(); const items = j.data || j.attendance || j.records || j || [];
      if(!items || items.length===0){ cont.innerHTML = '<div class="muted small">No attendance records.</div>'; return; }
      cont.innerHTML = '';
      items.forEach(row=>{
        const wr = document.createElement('div'); wr.className='announcement';
        const name = row.studentName || row.name || (row.student && row.student.name) || '';
        const status = row.status || row.present ? 'Present' : 'Absent';
        wr.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:600">${PageUtils.escapeHtml(name)}</div><div class="small muted">${PageUtils.escapeHtml(row._id||row.id||'')}</div></div><div><select class="attSel"><option value="present" ${status==='Present'?'selected':''}>Present</option><option value="absent" ${status==='Absent'?'selected':''}>Absent</option></select></div></div>`;
        cont.appendChild(wr);
      });
      // add save button
      const save = document.createElement('button'); save.className='btn'; save.textContent='Save attendance'; save.style.marginTop='12px';
      save.addEventListener('click', async ()=>{
        const rows = Array.from(cont.querySelectorAll('.announcement'));
        const payload = [];
        rows.forEach((r,idx)=>{
          const id = (j.data||j.attendance||j)[idx]._id || (j.data||j.attendance||j)[idx].id;
          const sel = r.querySelector('.attSel'); payload.push({ id, status: sel.value });
        });
        try{
          const r2 = await PageUtils.fetchJson('/api/attendance/mark', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date, section: sec, records: payload }) });
          if(r2.ok) { alert('Saved'); } else { alert('Save failed'); }
        }catch(e){ console.error(e); alert('Error'); }
      });
      cont.appendChild(save);
    }catch(e){ console.error(e); cont.innerHTML = '<div class="muted small">Failed to load attendance.</div>'; }
  }

  el('loadAtt').addEventListener('click', loadAttendance);
  el('logoutBtn')?.addEventListener('click', async ()=>{ try{ await PageUtils.fetchJson('/api/auth/logout',{method:'POST'}); }catch(e){} location.href='/html/login.html'; });

  await loadSections();
})();
