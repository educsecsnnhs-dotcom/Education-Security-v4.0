// public/js/pages/management.js
document.addEventListener("DOMContentLoaded", async () => {
  // Require Auth
  if (!window.Auth || typeof Auth.getUser !== "function" || typeof Auth.getToken !== "function") {
    console.error("Auth.getUser() and Auth.getToken() are required (auth.js)");
    return;
  }

  const user = Auth.getUser();
  const token = Auth.getToken();

  if (!user || user.role !== "Admin" || !token) {
    window.location.href = "/index.html";
    return;
  }

  // Wrapper for fetch with JWT
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

  // =======================
  // Load Students & Teachers
  // =======================
  async function loadUsers() {
    try {
      const data = await apiFetch(`/api/users?departmentId=${user.departmentId}`);
      const tbody = document.querySelector("#userTable tbody");
      tbody.innerHTML = "";
      data.forEach(u => {
        const tr = el("tr", {}, [
          el("td", {}, u.fullName || u.username || "—"),
          el("td", {}, u.email || "—"),
          el("td", {}, u.role || "—"),
          el("td", {}, u.yearSection || "—")
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
      const anns = await apiFetch(`/api/announcements?departmentId=${user.departmentId}`);
      const list = document.getElementById("announcementList");
      list.innerHTML = "";
      anns.forEach(a => {
        const li = el("li", { class: "announcement" }, [
          el("strong", {}, a.title + ": "),
          document.createTextNode(a.content),
          el("span", { class: "meta" }, " — " + PageUtils.niceDate(a.createdAt))
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
      await apiFetch("/api/announcements", {
        method: "POST",
        body: { title, content, audience: [user.departmentId] }
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
      const logs = await apiFetch(`/api/activity?departmentId=${user.departmentId}`);
      const list = document.getElementById("activityList");
      list.innerHTML = "";
      logs.forEach(log => {
        const li = el("li", {}, [
          el("span", { class: "meta" }, PageUtils.niceDate(log.time) + ": "),
          document.createTextNode(log.user + " → " + log.action)
        ]);
        list.appendChild(li);
      });
    } catch (e) {
      // fallback: local storage activity
      const local = getRecentActivity(10);
      const list = document.getElementById("activityList");
      list.innerHTML = "";
      local.forEach(l => {
        const li = el("li", {}, [
          el("span", { class: "meta" }, PageUtils.niceDate(l.time) + ": "),
          document.createTextNode(l.msg)
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
