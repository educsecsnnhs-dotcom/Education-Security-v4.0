// public/js/moderator.js
// Moderator (Teacher) Dashboard
// Features: Assigned sections, attendance, grades, resources

document.addEventListener("DOMContentLoaded", () => {
  checkAccess(["Moderator"], { redirectTo: "/welcome.html" });
  const user = Auth.getUser();

  const sectionList = document.getElementById("sectionList");
  const attendanceForm = document.getElementById("attendanceForm");
  const gradeForm = document.getElementById("gradeForm");
  const resourceForm = document.getElementById("resourceForm");
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  let currentSectionId = null;

  /* -------------------- Assigned Sections -------------------- */
  async function loadSections() {
    sectionList.innerHTML = "<li>Loading...</li>";
    try {
      const sections = await apiFetch("/api/moderator/sections");
      sectionList.innerHTML = "";

      if (!sections.length) {
        sectionList.innerHTML = "<li>No assigned sections yet</li>";
        return;
      }

      sections.forEach((sec) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <b>${sec.name}</b> - ${sec.gradeLevel} ${sec.strand}
          <button data-id="${sec._id}" class="selectSection">📂 Select</button>
        `;
        sectionList.appendChild(li);
      });

      document.querySelectorAll(".selectSection").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          currentSectionId = e.target.dataset.id;
          alert(`✅ Selected section: ${currentSectionId}`);
          loadAttendanceStudents(currentSectionId);
        });
      });
    } catch (err) {
      console.error("Error loading sections:", err);
      sectionList.innerHTML = "<li>⚠️ Failed to load sections</li>";
    }
  }

  /* -------------------- Load Students for Attendance -------------------- */
  async function loadAttendanceStudents(sectionId) {
    const studentBox = document.getElementById("attendanceStudents");
    studentBox.innerHTML = "Loading...";
    try {
      const students = await apiFetch(`/api/moderator/sections/${sectionId}/students`);
      if (!students.length) {
        studentBox.innerHTML = "No students assigned to this section";
        return;
      }

      let html = "<ul>";
      students.forEach((s) => {
        html += `
          <li>
            ${s.fullName} (${s.lrn})
            <label>
              <input type="radio" name="attendance-${s._id}" value="present"> ✅ Present
            </label>
            <label>
              <input type="radio" name="attendance-${s._id}" value="absent"> ❌ Absent
            </label>
          </li>
        `;
      });
      html += "</ul>";
      studentBox.innerHTML = html;
    } catch (err) {
      console.error("Error loading students:", err);
      studentBox.innerHTML = "⚠️ Failed to load students";
    }
  }

  /* -------------------- Submit Attendance -------------------- */
  attendanceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentSectionId) return alert("⚠️ Please select a section first");

    const entries = [];
    document.querySelectorAll(`#attendanceStudents input:checked`).forEach((inp) => {
      const studentId = inp.name.split("-")[1];
      entries.push({ studentId, status: inp.value });
    });

    if (!entries.length) return alert("⚠️ Please mark at least one student");

    try {
      await apiFetch(`/api/attendance/${currentSectionId}`, {
        method: "POST",
        body: JSON.stringify({ entries }),
      });
      alert("✅ Attendance submitted");
    } catch (err) {
      console.error("Attendance error:", err);
      alert("❌ Failed to submit attendance");
    }
  });

  /* -------------------- Submit Grades -------------------- */
  gradeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentSectionId) return alert("⚠️ Please select a section first");

    const formData = Object.fromEntries(new FormData(gradeForm));
    if (!formData.studentId || !formData.grade) {
      return alert("⚠️ Student ID and grade are required");
    }

    try {
      await apiFetch(`/api/recordbook/${currentSectionId}`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      alert("✅ Grade recorded");
      gradeForm.reset();
    } catch (err) {
      console.error("Grade error:", err);
      alert("❌ Failed to record grade");
    }
  });

  /* -------------------- Upload Resources -------------------- */
  resourceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentSectionId) return alert("⚠️ Please select a section first");

    const formData = new FormData(resourceForm);

    // ✅ File size validation
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > MAX_FILE_SIZE) {
        alert(`⚠️ File "${value.name}" exceeds 5MB limit`);
        return;
      }
    }

    try {
      const res = await fetch(`/api/moderator/resources/${currentSectionId}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      alert("✅ Resource uploaded");
      resourceForm.reset();
    } catch (err) {
      console.error("Resource error:", err);
      alert("❌ Failed to upload resource: " + err.message);
    }
  });

  /* -------------------- Init -------------------- */
  loadSections();
});
