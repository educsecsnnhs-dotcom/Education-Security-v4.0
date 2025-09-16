// public/js/pages/attendance.js
// Unified Attendance System: Student (view), Moderator (submit), Registrar/Admin (audit)

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));  // User info stored in localStorage

  // 🔹 Function to check if user has access
  function hasAccess(roles) {
    return roles.includes(user?.role);
  }

  const attendanceTable = document.getElementById("attendanceTable");
  const sectionSelect = document.getElementById("sectionSelect");
  const dateInput = document.getElementById("attendanceDate");
  const submitBtn = document.getElementById("submitAttendance");
  const auditTable = document.getElementById("auditTable");

  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }

  async function apiFetch(url, opts = {}) {
    const res = await fetch(url, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    });
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  }

  async function loadStudentAttendance() {
    try {
      const logs = await apiFetch("/api/attendance/my");
      attendanceTable.innerHTML = "";

      if (!logs || !logs.length) {
        attendanceTable.innerHTML = `<tr><td colspan="3">No attendance records found ✅</td></tr>`;
        return;
      }

      logs.forEach((log) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${new Date(log.date).toLocaleDateString()}</td>
          <td>${log.section?.name || "N/A"}</td>
          <td>${log.status}</td>
        `;
        attendanceTable.appendChild(row);
      });
    } catch (err) {
      console.error("Error loading student attendance:", err);
      attendanceTable.innerHTML = `<tr><td colspan="3">⚠️ Failed to load attendance</td></tr>`;
    }
  }

  async function loadSectionStudents(sectionId, date) {
    try {
      const section = await apiFetch(`/api/attendance/section/${sectionId}?date=${date}`);
      attendanceTable.innerHTML = "";

      if (!section.students || !section.students.length) {
        attendanceTable.innerHTML = `<tr><td colspan="3">No students found</td></tr>`;
        return;
      }

      section.students.forEach((s) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${s.lrn || "—"}</td>
          <td>${s.fullName || s.name}</td>
          <td>
            <select data-id="${s._id}" class="statusSelect">
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Excused">Excused</option>
            </select>
          </td>
        `;
        attendanceTable.appendChild(row);
      });
    } catch (err) {
      console.error("Error loading section students:", err);
      attendanceTable.innerHTML = `<tr><td colspan="3">⚠️ Failed to load section data</td></tr>`;
    }
  }

  async function submitAttendance() {
    const sectionId = sectionSelect.value;
    const date = dateInput.value;

    if (!sectionId || !date) {
      return alert("⚠️ Please select section and date");
    }

    const records = [];
    document.querySelectorAll(".statusSelect").forEach((sel) => {
      records.push({ studentId: sel.dataset.id, status: sel.value });
    });

    try {
      await apiFetch("/api/attendance/submit", {
        method: "POST",
        body: JSON.stringify({ sectionId, date, records }),
      });
      alert("✅ Attendance submitted successfully");
    } catch (err) {
      console.error("Submit attendance error:", err);
      alert("❌ Failed to submit attendance");
    }
  }

  async function loadAudit() {
    try {
      const logs = await apiFetch("/api/attendance/audit");
      auditTable.innerHTML = "";

      if (!logs || !logs.length) {
        auditTable.innerHTML = `<tr><td colspan="4">No logs found</td></tr>`;
        return;
      }

      logs.forEach((log) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${new Date(log.date).toLocaleDateString()}</td>
          <td>${log.section?.name || "N/A"}</td>
          <td>${log.student?.fullName || "N/A"}</td>
          <td>${log.status}</td>
        `;
        auditTable.appendChild(row);
      });
    } catch (err) {
      console.error("Error loading audit logs:", err);
      auditTable.innerHTML = `<tr><td colspan="4">⚠️ Failed to load logs</td></tr>`;
    }
  }

  // Load relevant data based on user role
  if (user.role === "Student") loadStudentAttendance();
  if (user.role === "Moderator") {
    apiFetch("/api/attendance/mySections")
      .then((sections) => {
        sectionSelect.innerHTML = `<option value="">-- Select Section --</option>`;
        sections.forEach((sec) => {
          sectionSelect.innerHTML += `<option value="${sec._id}">${sec.name}</option>`;
        });
      })
      .catch((err) => console.error("Error loading sections:", err));

    sectionSelect.addEventListener("change", () => {
      if (sectionSelect.value) loadSectionStudents(sectionSelect.value, dateInput.value);
    });

    dateInput.addEventListener("change", () => {
      if (sectionSelect.value) loadSectionStudents(sectionSelect.value, dateInput.value);
    });

    submitBtn.addEventListener("click", submitAttendance);
  }
  if (["Registrar", "Admin", "SuperAdmin"].includes(user.role)) loadAudit();

  // 🔹 Fix logout to clear localStorage and go to correct login page
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("user");  // Clear user data from localStorage
    location.href = "/html/login.html";  // Redirect to login page
  });
});
