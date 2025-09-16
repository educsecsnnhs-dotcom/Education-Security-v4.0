// public/js/pages/management.js
document.addEventListener("DOMContentLoaded", async () => {
  // Check if user exists in localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.role !== "Admin") {
    window.location.href = "/html/index.html"; // Redirect if not Admin
    return;
  }

  // =======================
  // Load Students & Teachers
  // =======================
  async function loadUsers() {
    try {
      const response = await fetch(`/api/users?departmentId=${user.departmentId}`);
      const data = await response.json();

      const tbody = document.querySelector("#userTable tbody");
      tbody.innerHTML = "";
      data.forEach((u) => {
        const tr = el("tr", {}, [
          el("td", {}, u.fullName || u.username || "—"),
          el("td", {}, u.email || "—"),
          el("td", {}, u.role || "—"),
          el("td", {}, u.yearSection || "—"),
        ]);
        tbody.appendChild(tr);
      });
    } catch (e) {
      showToast("Failed to load users", "error");
    }
  }

  // =======================
  // Load Announcements
  // =======================
  async function loadAnnouncements() {
    try {
      const response = await fetch(`/api/announcements?departmentId=${user.departmentId}`);
      const anns = await response.json();

      const list = document.getElementById("announcementList");
      list.innerHTML = "";

      anns.forEach((a) => {
        const li = el("li", { class: "announcement" }, [
          el("strong", {}, a.title + ": "),
          document.createTextNode(a.content),
          el("span", { class: "meta" }, " — " + PageUtils.niceDate(a.createdAt)),
        ]);
        list.appendChild(li);
      });
    } catch (e) {
      showToast("Failed to load announcements", "error");
    }
  }

  // Handle new announcement
  const form = document.getElementById("announcementForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = qs("#annTitle").value.trim();
    const content = qs("#annContent").value.trim();
    if (!title || !content) return;

    disableBtn(form.querySelector("button"));
    try {
      await fetch("/api/announcements", {
        method: "POST",
        body: JSON.stringify({ title, content, audience: [user.departmentId] }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      showToast("Announcement posted", "success");
      form.reset();
      loadAnnouncements();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      enableBtn(form.querySelector("button"));
    }
  });

  // =======================
  // Load Activity Logs
  // =======================
  async function loadActivity() {
    try {
      const response = await fetch(`/api/activity?departmentId=${user.departmentId}`);
      const logs = await response.json();

      const list = document.getElementById("activityList");
      list.innerHTML = "";

      logs.forEach((log) => {
        const li = el("li", {}, [
          el("span", { class: "meta" }, PageUtils.niceDate(log.time) + ": "),
          document.createTextNode(log.user + " → " + log.action),
        ]);
        list.appendChild(li);
      });
    } catch (e) {
      // fallback: local storage activity
      const local = getRecentActivity(10);
      const list = document.getElementById("activityList");
      list.innerHTML = "";
      local.forEach((l) => {
        const li = el("li", {}, [
          el("span", { class: "meta" }, PageUtils.niceDate(l.time) + ": "),
          document.createTextNode(l.msg),
        ]);
        list.appendChild(li);
      });
    }
  }

  // =======================
  // Initial load
  // =======================
  loadUsers();
  loadAnnouncements();
  loadActivity();
});

// Helper functions
function el(tag, attrs = {}, children = []) {
  const d = document.createElement(tag);
  for (const k in attrs) {
    d.setAttribute(k, attrs[k]);
  }
  children.forEach((c) => {
    if (c) d.appendChild(c);
  });
  return d;
}

function qs(selector) {
  return document.querySelector(selector);
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function disableBtn(btn) {
  btn.disabled = true;
  btn.style.opacity = "0.6";
}

function enableBtn(btn) {
  btn.disabled = false;
  btn.style.opacity = "1";
}
