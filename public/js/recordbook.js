// public/js/recordbook.js
// Role-aware Record Book Management: Moderator, Student, Registrar

document.addEventListener("DOMContentLoaded", () => {
  Auth.requireLogin();
  const user = Auth.getUser();

  // DOM references
  const recordTable = document.getElementById("recordTable");
  const sectionSelect = document.getElementById("sectionSelect");
  const subjectInput = document.getElementById("subjectInput");
  const uploadBtn = document.getElementById("uploadGradesBtn");
  const finalizeBtn = document.getElementById("finalizeBtn");
  const studentTable = document.getElementById("studentGradesTable");

  /**
   * 🔹 Student: View my grades
   */
  async function loadMyGrades() {
    try {
      const grades = await apiFetch("/api/student/grades");
      studentTable.innerHTML = "";

      if (!grades.length) {
        studentTable.innerHTML = `<tr><td colspan="3">No grades available yet ✅</td></tr>`;
        return;
      }

      grades.forEach((g) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${g.section}</td>
          <td>${g.subject}</td>
          <td>${g.grades.join(", ") || "—"}</td>
        `;
        studentTable.appendChild(row);
      });
    } catch (err) {
      console.error("Error loading grades:", err);
      studentTable.innerHTML = `<tr><td colspan="3">⚠️ Failed to load grades</td></tr>`;
    }
  }

  /**
   * 🔹 Moderator: Load section students for grade entry
   */
  async function loadSectionForGrades(sectionId, subject) {
    try {
      const section = await apiFetch(`/api/recordbook/section/${sectionId}?subject=${subject}`);
      recordTable.innerHTML = "";

      if (!section.students || !section.students.length) {
        recordTable.innerHTML = `<tr><td colspan="3">No students found</td></tr>`;
        return;
      }

      section.students.forEach((s) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${s.lrn || "—"}</td>
          <td>${s.fullName || s.name}</td>
          <td><input type="number" min="0" max="100" class="gradeInput" data-id="${s._id}" placeholder="Enter grade"></td>
        `;
        recordTable.appendChild(row);
      });
    } catch (err) {
      console.error("Error loading section:", err);
      recordTable.innerHTML = `<tr><td colspan="3">⚠️ Failed to load section</td></tr>`;
    }
  }

  /**
   * 🔹 Moderator: Submit grades
   */
  async function uploadGrades() {
    const sectionId = sectionSelect.value;
    const subject = subjectInput.value.trim();

    if (!sectionId || !subject) {
      return alert("⚠️ Please select a section and enter subject name");
    }

    const grades = [];
    document.querySelectorAll(".gradeInput").forEach((input) => {
      const val = input.value.trim();
      if (val) {
        grades.push({ studentId: input.dataset.id, grade: Number(val) });
      }
    });

    if (!grades.length) {
      return alert("⚠️ No grades entered");
    }

    try {
      await apiFetch("/api/recordbook/upload", {
        method: "POST",
        body: JSON.stringify({ sectionId, subject, grades }),
      });
      alert("✅ Grades uploaded successfully and synced to Google Sheets!");
    } catch (err) {
      console.error("Upload grades error:", err);
      alert("❌ Failed to upload grades");
    }
  }

  /**
   * 🔹 Registrar: Finalize / Lock record book
   */
  async function finalizeRecordBook() {
    const sectionId = sectionSelect.value;
    const subject = subjectInput.value.trim();

    if (!sectionId || !subject) {
      return alert("⚠️ Please select section and subject to finalize");
    }

    if (!confirm("⚠️ Finalizing will lock this record book. Proceed?")) return;

    try {
      await apiFetch("/api/recordbook/finalize", {
        method: "POST",
        body: JSON.stringify({ sectionId, subject }),
      });
      alert("✅ Record book finalized successfully!");
    } catch (err) {
      console.error("Finalize error:", err);
      alert("❌ Failed to finalize record book");
    }
  }

  // 🔹 Role-based initialization
  if (user.role === "Student") {
    loadMyGrades();
  }

  if (user.role === "Moderator") {
    // Load sections assigned to this moderator
    apiFetch("/api/attendance/mySections")
      .then((sections) => {
        sectionSelect.innerHTML = `<option value="">-- Select Section --</option>`;
        sections.forEach((sec) => {
          sectionSelect.innerHTML += `<option value="${sec._id}">${sec.name}</option>`;
        });
      })
      .catch((err) => console.error("Error loading sections:", err));

    sectionSelect.addEventListener("change", () => {
      if (sectionSelect.value && subjectInput.value.trim()) {
        loadSectionForGrades(sectionSelect.value, subjectInput.value.trim());
      }
    });

    subjectInput.addEventListener("change", () => {
      if (sectionSelect.value && subjectInput.value.trim()) {
        loadSectionForGrades(sectionSelect.value, subjectInput.value.trim());
      }
    });

    uploadBtn.addEventListener("click", uploadGrades);
  }

  if (["Registrar", "SuperAdmin"].includes(user.role)) {
    finalizeBtn.addEventListener("click", finalizeRecordBook);
  }
});
