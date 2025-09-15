// public/js/role-management.js
// Role management UI (SuperAdmin & Registrar).
// - SuperAdmin: can assign/remove Registrar, Admin, Moderator, SSG.
// - Registrar: can GIVE (only) Moderator, Admin, SSG (cannot remove; cannot assign Registrar or SuperAdmin).
// - Student is NOT in the role options (Student only via enrollment approval).
// - Uses apiFetch() (from utils.js) and Auth.getUser() (from auth.js).
// - Provides a small modal to collect name fields when required.

document.addEventListener("DOMContentLoaded", async () => {
  // Ensure helpers exist
  if (typeof apiFetch !== "function") throw new Error("apiFetch() is required (utils.js)");
  if (!window.Auth || typeof Auth.getUser !== "function") throw new Error("Auth.getUser() is required (auth.js)");

  const currentUser = Auth.getUser();
  if (!currentUser) {
    // not logged in
    window.location.href = "/login.html";
    return;
  }

  // DOM mounts (create simple table container if not present)
  const mount = document.getElementById("roleManagementMount") || (() => {
    const m = document.createElement("div");
    m.id = "roleManagementMount";
    document.body.appendChild(m);
    return m;
  })();

  // Build basic layout if not already present
  if (!mount.innerHTML.trim()) {
    mount.innerHTML = `
      <h2>Role Management</h2>
      <div style="margin-bottom:12px">
        <button id="rm-refresh">Refresh</button>
        <span style="margin-left:14px;color:#666">Logged in as: <strong>${escapeHtml(currentUser.fullName || currentUser.email || currentUser.username)}</strong> — <em>${escapeHtml(currentUser.role)}</em></span>
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

  // Role option sets (NO 'Student')
  const SUPERADMIN_ROLES = ["Registrar", "Admin", "Moderator", "SSG"];
  const REGISTRAR_GIVE_ROLES = ["Moderator", "Admin", "SSG"];

  // Utility: escape
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;")
              .replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Modal builder: returns Promise that resolves to object or null if cancelled
  function showNameModal(forRole, prefill = {}) {
    return new Promise((resolve) => {
      modalContainer.innerHTML = "";
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.left = 0;
      overlay.style.top = 0;
      overlay.style.right = 0;
      overlay.style.bottom = 0;
      overlay.style.background = "rgba(0,0,0,0.35)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = 99999;

      const box = document.createElement("div");
      box.style.background = "#fff";
      box.style.padding = "18px";
      box.style.borderRadius = "8px";
      box.style.width = "420px";
      box.style.boxShadow = "0 10px 30px rgba(0,0,0,0.12)";

      box.innerHTML = `
        <h3 style="margin:0 0 8px 0">Provide identity for ${escapeHtml(forRole)}</h3>
        <div style="margin-bottom:8px"><small>Last name and First name are required for this role.</small></div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input id="rm-last" placeholder="Last name" style="flex:1;padding:8px" value="${escapeHtml(prefill.lastName||'')}">
          <input id="rm-first" placeholder="First name" style="flex:1;padding:8px" value="${escapeHtml(prefill.firstName||'')}">
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input id="rm-middle" placeholder="Middle name (optional)" style="flex:1;padding:8px" value="${escapeHtml(prefill.middleName||'')}">
          <input id="rm-lrn" placeholder="LRN (optional)" style="flex:1;padding:8px" value="${escapeHtml(prefill.lrn||'')}">
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button id="rm-cancel">Cancel</button>
          <button id="rm-save">Save</button>
        </div>
      `;

      overlay.appendChild(box);
      modalContainer.appendChild(overlay);

      const cancelBtn = document.getElementById("rm-cancel");
      const saveBtn = document.getElementById("rm-save");

      cancelBtn.addEventListener("click", () => {
        overlay.remove();
        resolve(null);
      });

      saveBtn.addEventListener("click", () => {
        const last = document.getElementById("rm-last").value.trim();
        const first = document.getElementById("rm-first").value.trim();
        const middle = document.getElementById("rm-middle").value.trim();
        const lrn = document.getElementById("rm-lrn").value.trim();
        if (!last || !first) {
          showToast("Last name and First name are required.", "error");
          return;
        }
        overlay.remove();
        resolve({ lastName: last, firstName: first, middleName: middle || null, lrn: lrn || null });
      });
    });
  }

  // Try to fetch users from likely endpoints (try superadmin first, but fallback)
  async function fetchUsers() {
    const endpoints = [
      "/api/superadmin/users", // preferred (Chunk3)
      "/api/auth/users",
      "/api/users",
    ];
    for (const ep of endpoints) {
      try {
        const data = await apiFetch(ep);
        // accept array response or { users: [...] }
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.users)) return data.users;
      } catch (err) {
        // if 403 or 401, and current user is Registrar, continue fallbacks
        if (err && (err.status === 401 || err.status === 403)) {
          // continue to next endpoint
          continue;
        }
        // else ignore and try next
      }
    }
    // if nothing found, throw
    throw new Error("Unable to list users (no permitted endpoint)");
  }

  // Render table rows
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

      // Decide which role options to render based on currentUser role & target's role
      const targetIsSuperAdmin = (u.role === "SuperAdmin");
      const isSelf = (u._id === currentUser._id);

      // role select options (NO Student)
      let roleOptions = [];
      if (currentUser.role === "SuperAdmin") {
        roleOptions = SUPERADMIN_ROLES.slice(); // can give Registrar too
      } else if (currentUser.role === "Registrar") {
        roleOptions = REGISTRAR_GIVE_ROLES.slice(); // registrar give-only
      } else {
        roleOptions = []; // other roles cannot assign
      }

      // Build select HTML (preselect nothing)
      let selectHtml = `<select data-target="${escapeHtml(u._id)}" class="rm-role-select">`;
      selectHtml += `<option value="">-- Select --</option>`;
      roleOptions.forEach(r => {
        selectHtml += `<option value="${r}" ${u.role === r ? "selected" : ""}>${r}</option>`;
      });
      selectHtml += `</select>`;

      // Actions: Update button, Remove button (SuperAdmin only). Registrar will not see remove button.
      let actionsHtml = `<button class="rm-update-btn" data-id="${escapeHtml(u._id)}" ${roleOptions.length? "": "disabled"}>Give</button>`;
      if (currentUser.role === "SuperAdmin" && !targetIsSuperAdmin && !isSelf) {
        // allow SuperAdmin to remove elevated role by setting back to 'User'
        actionsHtml += ` <button class="rm-remove-btn" data-id="${escapeHtml(u._id)}">Remove</button>`;
      }

      // Render row
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

    // Bind events
    bindActions();
  }

  // Bind update/remove actions
  function bindActions() {
    // update/give role
    const updateBtns = Array.from(document.querySelectorAll(".rm-update-btn"));
    updateBtns.forEach(btn => {
      btn.removeEventListener("click", handleGive); // safe idempotent
      btn.addEventListener("click", handleGive);
    });

    // remove role (SuperAdmin)
    const removeBtns = Array.from(document.querySelectorAll(".rm-remove-btn"));
    removeBtns.forEach(btn => {
      btn.removeEventListener("click", handleRemove);
      btn.addEventListener("click", handleRemove);
    });
  }

  // Handler: giver
  async function handleGive(ev) {
    const id = ev.currentTarget.dataset.id;
    const select = document.querySelector(`select.rm-role-select[data-target="${id}"]`);
    if (!select) return showToast("Select a role first", "error");
    const newRole = select.value;
    if (!newRole) return showToast("Pick a role from the selector", "error");

    // Disallow assigning SuperAdmin via Registrar
    if (currentUser.role === "Registrar" && newRole === "Registrar") {
      return showToast("Registrars cannot assign Registrar role. Ask the Principal.", "error");
    }

    // If trying to give same role, do nothing
    // Need to find the target user's current role from the row
    const row = ev.currentTarget.closest("tr");
    const curRoleText = row ? row.children[3].textContent.trim() : "";
    if (curRoleText === newRole) {
      return showToast("User already has this role", "info");
    }

    // Roles requiring identity data
    const needsName = ["Registrar", "Admin", "Moderator"].includes(newRole);
    let namePayload = {};
    if (needsName) {
      const data = await showNameModal(newRole);
      if (!data) return; // cancelled
      namePayload = { lastName: data.lastName, firstName: data.firstName, middleName: data.middleName, lrn: data.lrn };
    }

    // Confirm
    if (!confirm(`Give role "${newRole}" to this user?`)) return;

    // Build payload
    const payload = Object.assign({ role: newRole }, namePayload);

    try {
      disableBtn(ev.currentTarget);
      // If currentUser is SuperAdmin -> call superadmin endpoint
      if (currentUser.role === "SuperAdmin") {
        await apiFetch(`/api/superadmin/roles/${id}`, { method: "POST", body: payload });
        showToast("Role assigned (Principal)", "success");
      } else if (currentUser.role === "Registrar") {
        // Try registrar /assign-role endpoint first (optional)
        try {
          const resp = await fetch("/api/registrar/assign-role", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.assign({ userId: id }, payload)),
          });
          if (resp.ok) {
            showToast("Role assigned (Registrar)", "success");
          } else {
            // fallback: attempt SuperAdmin endpoint (likely 403)
            const text = await resp.text();
            if (resp.status === 403) {
              showToast("Registrar cannot assign that role — ask Principal.", "error");
            } else {
              // attempt superadmin endpoint as fallback (may 403)
              try {
                await apiFetch(`/api/superadmin/roles/${id}`, { method: "POST", body: payload });
                showToast("Role assigned via Principal endpoint", "success");
              } catch (er) {
                showToast("Failed to assign role: " + (er.message || er), "error");
              }
            }
          }
        } catch (err) {
          // registrar endpoint unreachable -> fallback to superadmin attempt
          try {
            await apiFetch(`/api/superadmin/roles/${id}`, { method: "POST", body: payload });
            showToast("Role assigned via Principal endpoint", "success");
          } catch (er) {
            showToast("Registrar cannot assign this role (ask Principal).", "error");
          }
        }
      } else {
        showToast("You are not permitted to assign roles.", "error");
      }
      await loadAll(); // refresh
    } catch (err) {
      console.error("Assign failed:", err);
      showToast("Failed to assign role: " + (err.message || err), "error");
    } finally {
      enableBtn(ev.currentTarget);
    }
  }

  // Handler: remove (Principal only)
  async function handleRemove(ev) {
    const id = ev.currentTarget.dataset.id;
    if (!confirm("Remove elevated role(s) from this user? This will set role to 'User'.")) return;
    try {
      disableBtn(ev.currentTarget);
      await apiFetch(`/api/superadmin/roles/${id}`, { method: "POST", body: { role: "User" } });
      showToast("Role removed (set to User)", "success");
      await loadAll();
    } catch (err) {
      console.error("Remove failed:", err);
      showToast("Failed to remove role: " + (err.message || err), "error");
    } finally {
      enableBtn(ev.currentTarget);
    }
  }

  // Load + render sequence
  async function loadAll() {
    usersBody.innerHTML = `<tr><td colspan="6" style="padding:10px">Loading...</td></tr>`;
    try {
      const users = await fetchUsers();
      renderUsers(users);
    } catch (err) {
      console.error("Failed to load users:", err);
      usersBody.innerHTML = `<tr><td colspan="6" style="padding:12px;color:#a00">Failed to load users: ${escapeHtml(err.message || String(err))}</td></tr>`;
    }
  }

  // Wire refresh
  refreshBtn.addEventListener("click", loadAll);

  // Initial
  loadAll();
});
