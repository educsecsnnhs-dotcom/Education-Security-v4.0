// public/js/announcement.js
// School-wide Announcements

document.addEventListener("DOMContentLoaded", () => {
  Auth.requireLogin();
  const user = Auth.getUser();

  const ticker = document.getElementById("announcementTicker");
  const announcementForm = document.getElementById("announcementForm");
  const announcementList = document.getElementById("announcementList");

  // 🔹 Load announcements (anyone can view)
  async function loadAnnouncements() {
    ticker.innerHTML = "Loading...";
    announcementList.innerHTML = "Loading...";
    try {
      const anns = await apiFetch("/api/announcements");
      if (!anns.length) {
        ticker.innerHTML = "📢 No announcements";
        announcementList.innerHTML = "<p>No announcements yet</p>";
        return;
      }

      // Header ticker
      ticker.innerHTML = anns
        .map((a) => `<span class="ticker-item">📢 ${a.title}</span>`)
        .join(" | ");

      // Full list
      announcementList.innerHTML = "";
      anns.forEach((a) => {
        const div = document.createElement("div");
        div.classList.add("announcement-card");
        div.innerHTML = `
          <h3>${a.title}</h3>
          <p>${a.content}</p>
          <small>Posted by ${a.author?.name || "System"} on 
          ${new Date(a.createdAt).toLocaleString()}</small>
        `;
        announcementList.appendChild(div);
      });
    } catch (err) {
      console.error("Failed to load announcements:", err);
      ticker.innerHTML = "⚠️ Failed to load announcements";
      announcementList.innerHTML = "<p>Error loading announcements</p>";
    }
  }

  // 🔹 Create announcement (Registrar, Admin, Moderator, SSG only)
  if (announcementForm) {
    announcementForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!["Registrar", "Admin", "Moderator", "SSG"].includes(user.role)) {
        return alert("⚠️ You are not allowed to post announcements");
      }

      const formData = Object.fromEntries(new FormData(announcementForm));
      if (!formData.title || !formData.content)
        return alert("⚠️ Title and content required");

      try {
        await apiFetch("/api/announcements", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        alert("✅ Announcement posted");
        announcementForm.reset();
        loadAnnouncements();
      } catch (err) {
        console.error("Announcement post error:", err);
        alert("❌ Failed to post announcement");
      }
    });
  }

  // Initial load
  loadAnnouncements();
});
