// public/js/ssg.js
// Student Supreme Government (SSG) Dashboard

document.addEventListener("DOMContentLoaded", () => {
  checkAccess(["SSG"], { redirectTo: "/welcome.html" });
  const user = Auth.getUser();

  /* ------------ Elements ------------ */
  const electionForm = document.getElementById("electionForm");
  const electionList = document.getElementById("electionList");
  const announcementForm = document.getElementById("announcementForm");
  const announcementList = document.getElementById("announcementList");
  const projectForm = document.getElementById("projectForm");
  const projectList = document.getElementById("projectList");

  /* ------------ Elections ------------ */
  async function loadElections() {
    electionList.innerHTML = "Loading elections...";
    try {
      const elections = await apiFetch("/api/ssg/elections");
      if (!elections.length) {
        electionList.innerHTML = "No active elections";
        return;
      }

      electionList.innerHTML = "";
      elections.forEach((el) => {
        const div = document.createElement("div");
        div.classList.add("election-card");
        div.innerHTML = `
          <h3>${el.title}</h3>
          <p>${el.description}</p>
          <p><b>Start:</b> ${new Date(el.startDate).toLocaleString()}</p>
          <p><b>End:</b> ${new Date(el.endDate).toLocaleString()}</p>
          <ul>
            ${el.candidates.map((c) => `<li>${c.name} - ${c.votes} votes</li>`).join("")}
          </ul>
        `;
        electionList.appendChild(div);
      });
    } catch (err) {
      console.error("Election load error:", err);
      electionList.innerHTML = "⚠️ Failed to load elections";
    }
  }

  electionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(electionForm));
    if (!formData.title) return alert("⚠️ Election title required");
    if (!formData.startDate || !formData.endDate)
      return alert("⚠️ Election must have start & end dates");

    try {
      await apiFetch("/api/ssg/elections", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      alert("✅ Election created");
      electionForm.reset();
      loadElections();
    } catch (err) {
      console.error("Election create error:", err);
      alert("❌ Failed to create election");
    }
  });

  /* ------------ Announcements ------------ */
  async function loadAnnouncements() {
    announcementList.innerHTML = "Loading announcements...";
    try {
      const anns = await apiFetch("/api/ssg/announcements");
      if (!anns.length) {
        announcementList.innerHTML = "No announcements yet";
        return;
      }

      announcementList.innerHTML = "";
      anns.forEach((a) => {
        const div = document.createElement("div");
        div.classList.add("announcement-card");
        div.innerHTML = `
          <h3>${a.title}</h3>
          <p>${a.content}</p>
          <p><i>Posted: ${new Date(a.createdAt).toLocaleString()}</i></p>
        `;
        announcementList.appendChild(div);
      });
    } catch (err) {
      console.error("Announcement load error:", err);
      announcementList.innerHTML = "⚠️ Failed to load announcements";
    }
  }

  announcementForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(announcementForm));
    if (!formData.title || !formData.content)
      return alert("⚠️ Title and content required");

    try {
      await apiFetch("/api/ssg/announcements", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      alert("✅ Announcement posted");
      announcementForm.reset();
      loadAnnouncements();
    } catch (err) {
      console.error("Announcement error:", err);
      alert("❌ Failed to post announcement");
    }
  });

  /* ------------ Projects ------------ */
  async function loadProjects() {
    projectList.innerHTML = "Loading projects...";
    try {
      const projects = await apiFetch("/api/ssg/projects");
      if (!projects.length) {
        projectList.innerHTML = "No projects yet";
        return;
      }

      projectList.innerHTML = "";
      projects.forEach((p) => {
        const div = document.createElement("div");
        div.classList.add("project-card");
        div.innerHTML = `
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          <p>Status: <b>${p.status}</b></p>
          <button data-id="${p._id}" class="approveBtn">✅ Approve</button>
          <button data-id="${p._id}" class="rejectBtn">❌ Reject</button>
        `;
        projectList.appendChild(div);
      });

      document.querySelectorAll(".approveBtn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          try {
            await apiFetch(`/api/ssg/projects/${id}/approve`, { method: "POST" });
            alert("✅ Project approved");
            loadProjects();
          } catch (err) {
            console.error("Project approve error:", err);
            alert("❌ Failed to approve project");
          }
        });
      });

      document.querySelectorAll(".rejectBtn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          if (!confirm("Reject this project?")) return;
          try {
            await apiFetch(`/api/ssg/projects/${id}/reject`, { method: "POST" });
            alert("✅ Project rejected");
            loadProjects();
          } catch (err) {
            console.error("Project reject error:", err);
            alert("❌ Failed to reject project");
          }
        });
      });
    } catch (err) {
      console.error("Projects load error:", err);
      projectList.innerHTML = "⚠️ Failed to load projects";
    }
  }

  projectForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(projectForm));
    if (!formData.title || !formData.description)
      return alert("⚠️ Title and description required");

    try {
      await apiFetch("/api/ssg/projects", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      alert("✅ Project proposal submitted");
      projectForm.reset();
      loadProjects();
    } catch (err) {
      console.error("Project submit error:", err);
      alert("❌ Failed to submit project");
    }
  });

  /* ------------ Init ------------ */
  loadElections();
  loadAnnouncements();
  loadProjects();
});
