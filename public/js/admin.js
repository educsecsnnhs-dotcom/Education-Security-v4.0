// public/js/admin.js
// Department Head Dashboard (Admin role)

document.addEventListener("DOMContentLoaded", () => {
  checkAccess(["Admin"], { redirectTo: "/welcome.html" });
  const user = Auth.getUser();

  const deptInfoBox = document.getElementById("deptInfo");
  const updateDeptForm = document.getElementById("updateDeptForm");
  const moderatorsBox = document.getElementById("moderatorsList");
  const studentsBox = document.getElementById("studentsList");
  const statsBox = document.getElementById("deptStats");
  const eventsBox = document.getElementById("deptEvents");

  /* -------------------- Department Info -------------------- */
  async function loadDeptInfo() {
    deptInfoBox.innerHTML = "Loading...";
    try {
      const info = await apiFetch("/api/admin/department");
      deptInfoBox.innerHTML = `
        <p><b>Name:</b> ${info.name}</p>
        <p><b>Description:</b> ${info.description || "-"}</p>
      `;
    } catch (err) {
      console.error("Dept info error:", err);
      deptInfoBox.innerHTML = "⚠️ Failed to load department info";
    }
  }

  updateDeptForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(updateDeptForm));

    if (!formData.name) return alert("⚠️ Department name is required");

    try {
      await apiFetch("/api/admin/department", {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      alert("✅ Department updated");
      loadDeptInfo();
    } catch (err) {
      console.error("Update dept error:", err);
      alert("❌ Failed to update department");
    }
  });

  /* -------------------- Moderators & Students -------------------- */
  async function loadDeptUsers() {
    moderatorsBox.innerHTML = "Loading...";
    studentsBox.innerHTML = "Loading...";
    try {
      const users = await apiFetch("/api/admin/department/users");

      moderatorsBox.innerHTML = "";
      studentsBox.innerHTML = "";

      const moderators = users.filter((u) => u.role === "Moderator");
      const students = users.filter((u) => u.role === "Student");

      if (!moderators.length) moderatorsBox.innerHTML = "No moderators";
      else
        moderators.forEach((m) => {
          moderatorsBox.innerHTML += `<li>${m.fullName} (${m.email})</li>`;
        });

      if (!students.length) studentsBox.innerHTML = "No students";
      else
        students.forEach((s) => {
          studentsBox.innerHTML += `<li>${s.fullName} (${s.lrn})</li>`;
        });
    } catch (err) {
      console.error("Dept users error:", err);
      moderatorsBox.innerHTML = "⚠️ Failed to load moderators";
      studentsBox.innerHTML = "⚠️ Failed to load students";
    }
  }

  /* -------------------- Department Stats -------------------- */
  async function loadDeptStats() {
    statsBox.innerHTML = "Loading...";
    try {
      const stats = await apiFetch("/api/admin/stats");
      statsBox.innerHTML = `
        <p><b>Students:</b> ${stats.students || 0}</p>
        <p><b>Moderators:</b> ${stats.moderators || 0}</p>
        <p><b>Sections:</b> ${stats.sections || 0}</p>
      `;
    } catch (err) {
      console.error("Stats error:", err);
      statsBox.innerHTML = "⚠️ Failed to load stats";
    }
  }

  /* -------------------- Approve Events -------------------- */
  async function loadDeptEvents() {
    eventsBox.innerHTML = "Loading...";
    try {
      const events = await apiFetch("/api/admin/events");

      if (!events.length) {
        eventsBox.innerHTML = "No pending events";
        return;
      }

      eventsBox.innerHTML = "";
      events.forEach((ev) => {
        const div = document.createElement("div");
        div.classList.add("event-card");
        div.innerHTML = `
          <p><b>${ev.title}</b> (${ev.date})</p>
          <p>${ev.description}</p>
          <button data-id="${ev._id}" class="approveBtn">✅ Approve</button>
          <button data-id="${ev._id}" class="rejectBtn">❌ Reject</button>
        `;
        eventsBox.appendChild(div);
      });

      document.querySelectorAll(".approveBtn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          try {
            await apiFetch(`/api/admin/events/${id}/approve`, { method: "POST" });
            alert("✅ Event approved");
            loadDeptEvents();
          } catch (err) {
            console.error("Approve error:", err);
            alert("❌ Failed to approve event");
          }
        });
      });

      document.querySelectorAll(".rejectBtn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          if (!confirm("Reject this event?")) return;
          try {
            await apiFetch(`/api/admin/events/${id}/reject`, { method: "POST" });
            alert("✅ Event rejected");
            loadDeptEvents();
          } catch (err) {
            console.error("Reject error:", err);
            alert("❌ Failed to reject event");
          }
        });
      });
    } catch (err) {
      console.error("Events error:", err);
      eventsBox.innerHTML = "⚠️ Failed to load events";
    }
  }

  /* -------------------- Init -------------------- */
  loadDeptInfo();
  loadDeptUsers();
  loadDeptStats();
  loadDeptEvents();
});
