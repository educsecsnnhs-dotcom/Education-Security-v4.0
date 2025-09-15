// public/js/pages/grades.js
(async function () {
  const el = (id) => document.getElementById(id);

  async function loadViews() {
    const sel = el("gradeViewSelect");
    sel.innerHTML = '<option value="">Loading...</option>';

    const user = await PageUtils.currentUser();
    sel.innerHTML = "";

    if (!user) {
      sel.innerHTML = '<option value="">No user</option>';
      return;
    }

    if (user.role === "Student") {
      sel.innerHTML = '<option value="me">My Grades</option>';
    } else {
      // Teachers/Admins
      try {
        const sectionsRes = await PageUtils.fetchJson("/api/sections");
        if (sectionsRes.ok) {
          const sections = await sectionsRes.json();
          (sections.data || sections).forEach((it) => {
            const o = document.createElement("option");
            o.value = "section:" + (it._id || it.id);
            o.textContent = it.name || it.title;
            sel.appendChild(o);
          });
        }

        const subjectsRes = await PageUtils.fetchJson("/api/subjects");
        if (subjectsRes.ok) {
          const subjects = await subjectsRes.json();
          (subjects.data || subjects).forEach((it) => {
            const o = document.createElement("option");
            o.value = "subject:" + (it._id || it.id);
            o.textContent = "Subject: " + (it.name || it.title);
            sel.appendChild(o);
          });
        }
      } catch (e) {
        console.error("Error loading views", e);
      }

      sel.insertAdjacentHTML(
        "beforeend",
        '<option value="all">All Grades</option>'
      );
    }
  }

  async function loadGrades() {
    const v = el("gradeViewSelect").value;
    const container = el("gradesContainer");
    container.innerHTML = '<div class="muted small">Loading grades…</div>';

    try {
      let res = null;

      if (v === "me") {
        res = await PageUtils.fetchJson("/api/grades/me");
      } else if (v && v.startsWith("section:")) {
        const sec = v.split(":", 2)[1];
        res = await PageUtils.fetchJson(`/api/grades?section=${sec}`);
      } else if (v && v.startsWith("subject:")) {
        const sub = v.split(":", 2)[1];
        res = await PageUtils.fetchJson(`/api/grades?subject=${sub}`);
      } else if (v === "all") {
        res = await PageUtils.fetchJson("/api/grades");
      }

      if (!res || !res.ok) {
        container.innerHTML =
          '<div class="muted small">Grades endpoint not available</div>';
        return;
      }

      const data = await res.json();
      const items = data.data || data.grades || [];

      if (!items.length) {
        container.innerHTML =
          '<div class="muted small">No grades found.</div>';
        return;
      }

      // Render grades table
      const table = document.createElement("div");
      table.innerHTML = `
        <div style="overflow:auto">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr>
                <th>Student</th><th>Subject</th><th>Grade</th><th>Actions</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>`;

      const tbody = table.querySelector("tbody");

      items.forEach((g) => {
        const tr = document.createElement("tr");
        const student =
          g.studentName ||
          (g.student && g.student.name) ||
          g.name ||
          "Student";
        const subject =
          g.subjectName || (g.subject && g.subject.name) || g.subject || "";
        const grade = g.grade || g.score || "";

        tr.innerHTML = `
          <td style="padding:8px;border-top:1px solid #eef2ff">${PageUtils.escapeHtml(
            student
          )}</td>
          <td style="padding:8px;border-top:1px solid #eef2ff">${PageUtils.escapeHtml(
            subject
          )}</td>
          <td style="padding:8px;border-top:1px solid #eef2ff">
            <input data-id="${g._id || g.id}" value="${PageUtils.escapeHtml(
          String(grade)
        )}" class="input" style="width:80px"/>
          </td>
          <td style="padding:8px;border-top:1px solid #eef2ff">
            <button class="btn ghost updateBtn">Update</button>
          </td>`;

        tbody.appendChild(tr);
      });

      container.innerHTML = "";
      container.appendChild(table);

      container.querySelectorAll(".updateBtn").forEach((btn) => {
        btn.addEventListener("click", async (ev) => {
          const input = ev.target.closest("tr").querySelector("input");
          const id = input.getAttribute("data-id");
          const value = input.value;

          try {
            const r = await PageUtils.fetchJson(`/api/grades/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ grade: value }),
            });
            if (!r.ok) {
              alert("Update failed");
            } else {
              alert("Updated");
              loadGrades();
            }
          } catch (e) {
            console.error(e);
            alert("Error");
          }
        });
      });
    } catch (e) {
      console.error(e);
      container.innerHTML =
        '<div class="muted small">Failed to load grades.</div>';
    }
  }

  el("loadGrades").addEventListener("click", loadGrades);

  el("logoutBtn")?.addEventListener("click", async () => {
    try {
      await PageUtils.fetchJson("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    location.href = "/html/login.html";
  });

  loadViews();
})();
