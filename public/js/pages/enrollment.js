// public/js/pages/enrollment.js
(async function(){
  const form = document.getElementById('enrollForm');
  const msg = document.getElementById('enrollMsg');
  const logoutBtn = document.getElementById('logoutBtn');

  // Logout button
  if(logoutBtn){
    logoutBtn.addEventListener('click', async ()=>{
      try { await PageUtils.fetchJson('/api/auth/logout',{method:'POST'}); }catch(e){}
      location.href = '/html/login.html';
    });
  }

  // Enrollment form submit
  if(form){
    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      msg.textContent = "Submitting…";

      try {
        // Try multiple endpoints to match backend
        const endpoints = [
          '/api/enrollment/submit',
          '/api/enrollment',
          '/api/registrar/enroll'
        ];
        let ok = false, resText = '';
        for(const ep of endpoints){
          try {
            const r = await PageUtils.fetchJson(ep, {
              method:'POST',
              headers:{'Content-Type':'application/json'},
              body: JSON.stringify(data)
            });
            resText = await r.text();
            if(r.ok){ ok=true; break; }
          }catch(e){}
        }

        if(ok){
          msg.textContent = "✅ Submitted! Registrar will process your enrollment.";
          form.reset();
        } else {
          msg.textContent = "❌ Submission failed: " + (resText || "server error");
        }
      } catch(err){
        console.error("Enrollment submit error:", err);
        msg.textContent = "❌ Error submitting enrollment.";
      }
    });
  }
})();
