// public/js/role-management.js
// Final merged Role Management UI (aligned with backend).
// - SuperAdmin: can assign/remove Registrar, Admin, Moderator, SSG, and impersonate users
// - Registrar: can assign Moderator, Admin, SSG only (cannot remove, cannot assign Registrar/SuperAdmin)
// - No "Student" in dropdown (handled only by enrollment approval)
// - Uses apiFetch(), Auth.getUser(), and /api/superadmin/* endpoints

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof apiFetch !== "function") throw new Error("apiFetch() is required (utils.js)");
  if (!window.Auth || typeof Auth.getUser !== "function") throw new Error("Auth.getUser() is required (auth.js)");

  const currentUser = Auth.getUser();
  if (!currentUser) {
    window.location.href = "../html/login.html";
    return;
  }

  const mount = document.getElementById("roleManagementMount") || (() => {
    const m = document.createElement("div");
    m.id = "roleManagementMount";
    document.body.appendChild(m);
    return m;
  })();

  if (!mount.innerHTML.trim()) {
    mount.innerHTML = `
      <h2>Role Management</h2>
      <div style="margin-bottom:12px">
        <button id="rm-refresh">Refresh</button>
        <span style="margin-left:14px;color:#666">Logged in as: 
          <strong>${escapeHtml(currentUser.fullName || currentUser.email || currentUser.username)}</strong> 
          — <em>${escapeHtml(currentUser.role)}</em>
        </span>
      </div>
      <div style="overflow:auto">
        <table id="rm-users-table" style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="text-align:left">
              <th style="padding:8px;border-bottom:1px solid #ddd">Name</th>
              <th style="padding:8px;border-bottom:1px solid #ddd">Email</th>
              <th style="padding:8px;border-bottom:1px solid #ddd">LRN</th>
              <th style="padding:8px;border-bottom:1px solid #ddd">Role</th>
              <th style="padding:8px;border-bottom:1px solid #ddd">Change Role</th>
              <th style="padding:8px;border-bottom:1px solid #ddd">Actions</th>
            </tr>
          </thead>
          <tbody id="rm-users-body"><tr><td colspan="6">Loading...</td></tr></tbody>
        </table>
      </div>
      <div id="rm-modal-container"></div>
    `;
  }

  const usersBody = document.getElementById("rm-users-body");
  const refreshBtn = document.getElementById("rm-refresh");
  const modalContainer = document.getElementById("rm-modal-container");

  const SUPERADMIN_ROLES = ["Registrar", "Admin", "Moderator", "SSG"];
  const REGISTRAR_GIVE_ROLES = ["Moderator", "Admin", "SSG"];

  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  async function fetchUsers() {
    const endpoints = ["/api/superadmin/users", "/api/auth/users", "/api/users"];
    for (const ep of endpoints) {
      try {
        const data = await apiFetch(ep);
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.users)) return data.users;
      } catch (err) {
        if (err && (err.status === 401 || err.status === 403)) continue;
      }
    }
    throw new Error("Unable to list users (no permitted endpoint)");
  }

  function renderUsers(users) {
    usersBody.innerHTML = "";
    if (!users.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6" style="padding:10px">No users found</td>`;
      usersBody.appendChild(tr);
      return;
    }

    users.forEach((u) => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid #eee";

      const targetIsSuperAdmin = (u.role === "SuperAdmin");
      const isSelf = (u._id === currentUser._id);

      let roleOptions = [];
      if (currentUser.role === "SuperAdmin") {
        roleOptions = SUPERADMIN_ROLES.slice();
      } else if (currentUser.role === "Registrar") {
        roleOptions = REGISTRAR_GIVE_ROLES.slice();
      }

      let selectHtml = `<select data-target="${escapeHtml(u._id)}" class="rm-role-select">`;
      selectHtml += `<option value="">-- Select --</option>`;
      roleOptions.forEach(r => {
        selectHtml += `<option value="${r}" ${u.role === r ? "selected" : ""}>${r}</option>`;
      });
      selectHtml += `</select>`;

      let actionsHtml = `<button class="rm-update-btn" data-id="${escapeHtml(u._id)}" ${roleOptions.length? "": "disabled"}>Give</button>`;
      if (currentUser.role === "SuperAdmin" && !targetIsSuperAdmin && !isSelf) {
        actionsHtml += ` <button class="rm-remove-btn" data-id="${escapeHtml(u._id)}">Remove</button>`;
        actionsHtml += ` <button class="rm-impersonate-btn" data-id="${escapeHtml(u._id)}">Impersonate</button>`;
      }

      tr.innerHTML = `
        <td style="padding:8px">${escapeHtml(u.fullName || u.username || "")}</td>
        <td style="padding:8px">${escapeHtml(u.email || "-")}</td>
        <td style="padding:8px">${escapeHtml(u.lrn || "-")}</td>
        <td style="padding:8px"><strong>${escapeHtml(u.role || "User")}</strong></td>
        <td style="padding:8px">${selectHtml}</td>
        <td style="padding:8px">${actionsHtml}</td>
      `;
      usersBody.appendChild(tr);
    });

    bindActions();
  }

  function bindActions() {
    document.querySelectorAll(".rm-update-btn").forEach(btn => {
      btn.onclick = handleGive;
    });
    document.querySelectorAll(".rm-remove-btn").forEach(btn => {
      btn.onclick = handleRemove;
    });
    document.querySelectorAll(".rm-impersonate-btn").forEach(btn => {
      btn.onclick = handleImpersonate;
    });
  }

  async function handleGive(ev) {
    const id = ev.currentTarget.dataset.id;
    const select = document.querySelector(`select.rm-role-select[data-target="${id}"]`);
    if (!select) return showToast("Select a role first", "error");
    const newRole = select.value;
    if (!newRole) return showToast("Pick a role", "error");

    if (currentUser.role === "Registrar" && newRole === "Registrar") {
      return showToast("Registrars cannot assign Registrar role", "error");
    }

    const payload = { role: newRole };
    try {
      if (currentUser.role === "SuperAdmin") {
        await apiFetch(`/api/superadmin/roles/${id}`, { method: "POST", body: payload });
        showToast("Role assigned (Principal)", "success");
      } else if (currentUser.role === "Registrar") {
        const resp = await fetch("/api/registrar/assign-role", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id, role: newRole }),
        });
        if (!resp.ok) throw new Error(await resp.text());
        showToast("Role assigned (Registrar)", "success");
      }
      await loadAll();
    } catch (err) {
      console.error(err);
      showToast("Failed to assign role: " + (err.message || err), "error");
    }
  }

  async function handleRemove(ev) {
    const id = ev.currentTarget.dataset.id;
    if (!confirm("Remove role and set to User?")) return;
    try {
      await apiFetch(`/api/superadmin/roles/${id}`, { method: "POST", body: { role: "User" } });
      showToast("Role removed", "success");
      await loadAll();
    } catch (err) {
      console.error(err);
      showToast("Failed to remove role", "error");
    }
  }

  async function handleImpersonate(ev) {
    const id = ev.currentTarget.dataset.id;
    if (!confirm("Impersonate this user?")) return;
    try {
      const res = await apiFetch(`/api/superadmin/impersonate`, { method: "POST", body: { userId: id } });
      if (res && res.success !== false) {
        try { sessionStorage.setItem('EDUSEC_originalSuperAdmin', JSON.stringify({ id: currentUser._id })); } catch(e){}
        location.reload();
      } else {
        showToast("Impersonation failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Impersonation error: " + (err.message || err), "error");
    }
  }

  async function loadAll() {
    usersBody.innerHTML = `<tr><td colspan="6" style="padding:10px">Loading...</td></tr>`;
    try {
      const users = await fetchUsers();
      renderUsers(users);
    } catch (err) {
      console.error(err);
      usersBody.innerHTML = `<tr><td colspan="6" style="padding:12px;color:#a00">Failed: ${escapeHtml(err.message || String(err))}</td></tr>`;
    }
  }

  refreshBtn.addEventListener("click", loadAll);
  loadAll();
});
