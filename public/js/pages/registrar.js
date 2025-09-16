// public/js/registrar.js
// Registrar Dashboard (Cloud + MongoDB + JWT-based auth)
//
// Features:
// - View enrollment stats
// - View pending enrollees, approve/reject with section assignment
// - Manage sections (create/list)
// - View archives & restore
// - Log registrar actions locally in activity log

document.addEventListener("DOMContentLoaded", () => {
  // ✅ Require Registrar role & valid token
  if (!window.Auth || typeof Auth.getUser !== "function" || typeof Auth.getToken !== "function") {
    console.error("Auth.getUser() and Auth.getToken() must be defined in auth.js");
    return;
  }

  const user = Auth.getUser();
  const token = Auth.getToken();

  if (!user || !token || user.role !== "Registrar") {
    window.location.href = "/welcome.html";
    return;
  }

  // 🔹 JWT fetch wrapper
  async function apiFetch(url, options = {}) {
    const opts = {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": options.body ? "application/json" : undefined,
      },
    };
    if (opts.body && typeof opts.body !== "string" && !(opts.body instanceof FormData)) {
      opts.body = JSON.stringify(opts.body);
    }

    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  const enrolledCountEl = document.getElementById("enrolledCount");
  const pendingCountEl = document.getElementById("pendingCount");
  const pendingTable = document.getElementById("pendingTable");
  const sectionList = document.getElementById("sectionList");
  const sectionForm = document.getElementById("sectionForm");
  const archiveList = document.getElementById("archiveList");
  const logList = document.getElementById("activityLog");

  /* -------------------- Activity Log -------------------- */
  function logAction(action) {
    const logs = JSON.parse(localStorage.getItem("registrarLogs") || "[]");
    const entry = {
      action,
      time: new Date().toLocaleString(),
    };
    logs.unshift(entry);
    localStorage.setItem("registrarLogs", JSON.stringify(logs));
    renderLogs();
  }

  function renderLogs() {
    logList.innerHTML = "";
    const logs = JSON.parse(localStorage.getItem("registrarLogs") || "[]");
    if (!logs.length) {
      logList.innerHTML = "<li>No actions logged yet</li>";
      return;
    }
    logs.forEach((log) => {
      const li = document.createElement("li");
      li.textContent = `[${log.time}] ${log.action}`;
      logList.appendChild(li);
    });
  }

  /* -------------------- Stats -------------------- */
  async function loadStats() {
    try {
      const stats = await apiFetch("/api/registrar/stats");
      enrolledCountEl.textContent = stats.enrolled || 0;
      pendingCountEl.textContent = stats.pending || 0;
    } catch (err) {
      console.error("Error loading stats:", err);
      enrolledCountEl.textContent = "⚠️";
      pendingCountEl.textContent = "⚠️";
    }
  }

  /* -------------------- Pending Enrollees -------------------- */
  async function loadPending() {
    pendingTable.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;
    try {
      const enrollees = await apiFetch("/api/registrar/enrollment/pending");
      pendingTable.innerHTML = "";

      if (!enrollees.length) {
        pendingTable.innerHTML = `<tr><td colspan="7">✅ No pending enrollees</td></tr>`;
        return;
      }

      enrollees.forEach((enrollee) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${enrollee.fullName}</td>
          <td>${enrollee.lrn}</td>
          <td>${enrollee.gradeLevel}</td>
          <td>${enrollee.strand || "-"}</td>
          <td>${enrollee.schoolYear}</td>
          <td>
            <input type="text" id="section-${enrollee._id}" placeholder="Assign section">
          </td>
          <td>
            <button data-id="${enrollee._id}" class="approveBtn">✅ Approve</button>
            <button data-id="${enrollee._id}" class="rejectBtn">❌ Reject</button>
          </td>
        `;
        pendingTable.appendChild(tr);
      });

      // Approve buttons
      document.querySelectorAll(".approveBtn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          const section = document.getElementById(`section-${id}`).value.trim();
          if (!section) return alert("⚠️ Please assign a section first.");
          try {
            await apiFetch(`/api/registrar/enrollment/${id}/approve`, {
              method: "POST",
              body: { section },
            });
            alert("✅ Enrollee approved");
            logAction(`Approved enrollee ID: ${id} → Section ${section}`);
            await loadStats();
            await loadPending();
          } catch (err) {
            console.error("Approve error:", err);
            alert("❌ Failed to approve enrollee");
          }
        });
      });

      // Reject buttons
      document.querySelectorAll(".rejectBtn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          if (!confirm("❌ Reject this enrollee?")) return;
          try {
            await apiFetch(`/api/registrar/enrollment/${id}/reject`, {
              method: "POST",
            });
            alert("✅ Enrollee rejected");
            logAction(`Rejected enrollee ID: ${id}`);
            await loadStats();
            await loadPending();
          } catch (err) {
            console.error("Reject error:", err);
            alert("❌ Failed to reject enrollee");
          }
        });
      });
    } catch (err) {
      console.error("Error loading pending enrollees:", err);
      pendingTable.innerHTML = `<tr><td colspan="7">⚠️ Error loading pending enrollees</td></tr>`;
    }
  }

  /* -------------------- Section Management -------------------- */
  async function loadSections() {
    sectionList.innerHTML = `<li>Loading...</li>`;
    try {
      const sections = await apiFetch("/api/registrar/sections");
      sectionList.innerHTML = "";

      if (!sections.length) {
        sectionList.innerHTML = `<li>No sections created yet</li>`;
        return;
      }

      sections.forEach((sec) => {
        const li = document.createElement("li");
        li.textContent = `${sec.gradeLevel.toUpperCase()} - ${sec.strand} - ${sec.name} (Limit: ${sec.capacity})`;
        sectionList.appendChild(li);
      });
    } catch (err) {
      console.error("Error loading sections:", err);
      sectionList.innerHTML = `<li>⚠️ Error loading sections</li>`;
    }
  }

  sectionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(sectionForm));
    try {
      await apiFetch("/api/registrar/sections", {
        method: "POST",
        body: formData,
      });
      alert("✅ Section created");
      logAction(`Created section: ${formData.name}`);
      sectionForm.reset();
      await loadSections();
    } catch (err) {
      console.error("Section create error:", err);
      alert("❌ Failed to create section");
    }
  });

  /* -------------------- Archives -------------------- */
  async function loadArchives() {
    archiveList.innerHTML = `<li>Loading...</li>`;
    try {
      const archived = await apiFetch("/api/registrar/enrollment/archived");
      archiveList.innerHTML = "";

      if (!archived.length) {
        archiveList.innerHTML = `<li>No archived students</li>`;
        return;
      }

      archived.forEach((student) => {
        const li = document.createElement("li");
        li.innerHTML = `
          ${student.fullName} (${student.lrn}) - Reason: ${student.archiveReason || "N/A"}
          <button data-id="${student._id}" class="restoreBtn">♻ Restore</button>
        `;
        archiveList.appendChild(li);
      });

      document.querySelectorAll(".restoreBtn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          if (!confirm("♻ Restore this student?")) return;
          try {
            await apiFetch(`/api/registrar/enrollment/${id}/restore`, {
              method: "POST",
            });
            alert("✅ Student restored from archives");
            logAction(`Restored archived student ID: ${id}`);
            await loadArchives();
          } catch (err) {
            console.error("Restore error:", err);
            alert("❌ Failed to restore student");
          }
        });
      });
    } catch (err) {
      console.error("Error loading archives:", err);
      archiveList.innerHTML = `<li>⚠️ Error loading archives</li>`;
    }
  }

  /* -------------------- Initial Load -------------------- */
  loadStats();
  loadPending();
  loadSections();
  loadArchives();
  renderLogs();
});
