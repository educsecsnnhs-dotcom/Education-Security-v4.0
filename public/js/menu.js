window.__EDUSEC_MENU = (function(){
  const menus = {
    User: [
      { name: "Enrollment", link: "pages/enrollment.html", icon: "📝" }
    ],
    Student: [
      { name: "Grades", link: "pages/grades.html", icon: "📊" },
      { name: "Attendance", link: "pages/attendance.html", icon: "🕒" },
      { name: "Vote", link: "pages/vote.html", icon: "🗳️" },
      { name: "Announcements", link: "pages/announcements.html", icon: "📢" },
    ],
    Moderator: [
      { name: "Record Book", link: "pages/recordbook.html", icon: "📚" },
      { name: "Announcements", link: "pages/announcements.html", icon: "📢" },
    ],
    Registrar: [
      { name: "Enrollee", link: "pages/registrar.html", icon: "🧾" },
      { name: "Enrolled", link: "pages/enrolled.html", icon: "✅" },
      { name: "Archives", link: "pages/archives.html", icon: "📂" },
      { name: "Role Management", link: "pages/role-management.html", icon: "👥" },
      { name: "Announcements", link: "pages/announcements.html", icon: "📢" },
    ],
    Admin: [
      { name: "Management", link: "pages/admin.html", icon: "⚙️" },
      { name: "Announcements", link: "pages/announcements.html", icon: "📢" },
    ],
    SuperAdmin: [],
    SSG: [
      { name: "SSG Management", link: "pages/ssg.html", icon: "🏛️" },
      { name: "SSG Announcements", link: "pages/ssg-announcements.html", icon: "📢" },
      { name: "SSG Projects", link: "pages/ssg-projects.html", icon: "🛠️" }
    ],
  };

  // Build the menu based on the user's role stored in localStorage
  function buildMenuForUser() {
    const role = localStorage.getItem("user_role"); // Get user role from localStorage
    if (!role) return []; // If no role found, return empty menu

    let finalMenu = [...menus.User]; // Default menu for all users

    // Add role-specific menu items
    if (role === "SuperAdmin") {
      Object.keys(menus).forEach(r => {
        if (r !== "SuperAdmin") finalMenu.push(...menus[r]);
      });
    } else if (menus[role]) {
      finalMenu = [...finalMenu, ...menus[role]];
    }

    // Include extra roles (e.g., if the user has extra roles like SSG)
    const extraRoles = JSON.parse(localStorage.getItem("extra_roles") || "[]");
    extraRoles.forEach(r => { if (menus[r]) finalMenu.push(...menus[r]); });

    // Include SSG if user is in SSG or has the `isSSG` flag
    if (localStorage.getItem("isSSG") === "true" || role === "SSG") {
      finalMenu.push(...menus.SSG);
    }

    // Remove duplicate items
    const seen = new Set();
    return finalMenu.filter(item => {
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });
  }

  // Render the sidebar menu based on the generated menu
  function renderSidebar(menu) {
    const menuList = document.getElementById("menuList");
    if (!menuList) return;
    menuList.innerHTML = "";
    menu.forEach(item => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = item.link;
      a.className = "menu-link";
      a.innerHTML = `<span class="icon">${item.icon || "📄"}</span><span class="label">${item.name}</span>`;
      li.appendChild(a);
      menuList.appendChild(li);
    });
  }

  // Render quick actions (buttons) based on the menu
  function renderQuickActions(menu) {
    const container = document.getElementById("quickActions");
    if (!container) return;
    container.innerHTML = "";
    menu.forEach(item => {
      const btn = document.createElement("a");
      btn.className = "btn ghost";
      btn.href = item.link;
      btn.textContent = item.name;
      container.appendChild(btn);
    });
  }

  // Initialize the menu rendering after DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    const menu = buildMenuForUser(); // Get the menu based on the user's role
    renderSidebar(menu); // Render sidebar menu
    renderQuickActions(menu); // Render quick action buttons
  });

  return {
    buildMenuForUser,
    renderSidebar,
    renderQuickActions
  };
})();
