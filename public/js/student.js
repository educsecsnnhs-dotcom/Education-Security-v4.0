// public/js/student.js
// Student Dashboard
// Features:
// - View enrollment status (pending/approved)
// - View grades
// - View class schedule
// - See announcements & events
// - Show attendance record

document.addEventListener("DOMContentLoaded", () => {
  checkAccess(["Student"], { redirectTo: "/welcome.html" });

  const user = Auth.getUser();

  const statusBox = document.getElementById("statusBox");
  const gradesList = document.getElementById("gradesList");
  const scheduleBox = document.getElementById("scheduleBox");
  const announcementsList = document.getElementById("announcementsList");
  const eventsList = document.getElementById("eventsList");
  const attendanceList = document.getElementById("attendanceList");

  /* -------------------- Enrollment Status -------------------- */
  async function loadStatus() {
    try {
      const status = await apiFetch("/api/registrar/enrollment/status");
      statusBox.textContent = `📌 Enrollment Status: ${status.status || "Unknown"}`;

      if (status.status === "pending") {
        statusBox.style.color = "orange";
      } else if (status.status === "approved") {
        statusBox.style.color = "green";
      } else if (status.status === "rejected") {
        statusBox.style.color = "red";
      }
    } catch (err) {
      console.error("Error loading enrollment status:", err);
      statusBox.textContent = "⚠️ Error fetching enrollment status";
      statusBox.style.color = "red";
    }
  }

  /* -------------------- Grades -------------------- */
  async function loadGrades() {
    gradesList.innerHTML = "<li>Loading...</li>";
    try {
      const grades = await apiFetch("/api/student/grades");
      gradesList.innerHTML = "";

      if (!grades.length) {
        gradesList.innerHTML = "<li>No grades available yet</li>";
        return;
      }

      grades.forEach((g) => {
        const li = document.createElement("li");
        li.textContent = `${g.subject} (${g.section}): ${g.grades.join(", ")}`;
        gradesList.appendChild(li);
      });
    } catch (err) {
      console.error("Error loading grades:", err);
      gradesList.innerHTML = "<li>⚠️ Failed to load grades</li>";
    }
  }

  /* -------------------- Schedule -------------------- */
  async function loadSchedule() {
    scheduleBox.innerHTML = "Loading...";
    try {
      const schedule = await apiFetch("/api/student/schedule");
      if (!schedule || !schedule.length) {
        scheduleBox.innerHTML = "No class schedule assigned yet";
        return;
      }

      let html = "<ul>";
      schedule.forEach((s) => {
        html += `<li>${s.day} - ${s.subject} (${s.time}) @ ${s.room || "TBA"}</li>`;
      });
      html += "</ul>";
      scheduleBox.innerHTML = html;
    } catch (err) {
      console.error("Error loading schedule:", err);
      scheduleBox.innerHTML = "⚠️ Failed to load schedule";
    }
  }

  /* -------------------- Announcements -------------------- */
  async function loadAnnouncements() {
    announcementsList.innerHTML = "<li>Loading...</li>";
    try {
      const announcements = await apiFetch("/api/announcements");
      announcementsList.innerHTML = "";

      if (!announcements.length) {
        announcementsList.innerHTML = "<li>No announcements yet</li>";
        return;
      }

      announcements.forEach((a) => {
        const li = document.createElement("li");
        li.innerHTML = `<b>${a.title}</b> - ${a.content} <small>(${new Date(
          a.createdAt
        ).toLocaleDateString()})</small>`;
        announcementsList.appendChild(li);
      });
    } catch (err) {
      console.error("Error loading announcements:", err);
      announcementsList.innerHTML = "<li>⚠️ Failed to load announcements</li>";
    }
  }

  /* -------------------- Events -------------------- */
  async function loadEvents() {
    eventsList.innerHTML = "<li>Loading...</li>";
    try {
      const events = await apiFetch("/api/events");
      eventsList.innerHTML = "";

      if (!events.length) {
        eventsList.innerHTML = "<li>No upcoming events</li>";
        return;
      }

      events.forEach((e) => {
        const li = document.createElement("li");
        li.innerHTML = `<b>${e.name}</b> - ${e.date} @ ${e.location || "TBA"}`;
        eventsList.appendChild(li);
      });
    } catch (err) {
      console.error("Error loading events:", err);
      eventsList.innerHTML = "<li>⚠️ Failed to load events</li>";
    }
  }

  /* -------------------- Attendance -------------------- */
  async function loadAttendance() {
    attendanceList.innerHTML = "<li>Loading...</li>";
    try {
      const records = await apiFetch("/api/student/attendance");
      attendanceList.innerHTML = "";

      if (!records.length) {
        attendanceList.innerHTML = "<li>No attendance records available</li>";
        return;
      }

      records.forEach((r) => {
        const li = document.createElement("li");
        li.textContent = `${r.date}: ${r.status}`;
        attendanceList.appendChild(li);
      });
    } catch (err) {
      console.error("Error loading attendance:", err);
      attendanceList.innerHTML = "<li>⚠️ Failed to load attendance</li>";
    }
  }

  /* -------------------- Initial Load -------------------- */
  loadStatus();
  loadGrades();
  loadSchedule();
  loadAnnouncements();
  loadEvents();
  loadAttendance();
});
