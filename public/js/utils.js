// public/js/utils.js
// Global frontend utilities used across all pages
// - Centralized apiFetch (credentials included for session cookies)
// - Toasts, confirm dialog helper
// - Button disable/enable helpers
// - Recent activity log (local only)
// - Header injection (ticker + live clock + logout)
// - DOM helpers
// Place this file in public/js/ and include it FIRST on every page.

(function () {
  "use strict";

  /* ============================
     DOM helpers
     ============================ */
  window.qs = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  window.qsa = function (sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); };
  window.el = function (tag, attrs = {}, children = []) {
    const d = document.createElement(tag);
    for (const k in attrs) {
      if (k === "style" && typeof attrs[k] === "object") {
        Object.assign(d.style, attrs[k]);
      } else if (k.startsWith("on") && typeof attrs[k] === "function") {
        d.addEventListener(k.slice(2), attrs[k]);
      } else if (k === "dataset" && typeof attrs[k] === "object") {
        for (const ds in attrs[k]) d.dataset[ds] = attrs[k][ds];
      } else {
        d.setAttribute(k, attrs[k]);
      }
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c === null || c === undefined) return;
      d.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return d;
  };

  /* ============================
     API fetch wrapper
     ============================ */
  window.apiFetch = async function (path, options = {}) {
    // Ensure credentials are included for session cookies
    const baseOptions = { credentials: "include", headers: {} };

    // If options.body is a plain object (and not FormData), stringfy as JSON
    let body = options.body;
    if (body && !(body instanceof FormData) && typeof body === "object") {
      baseOptions.headers["Content-Type"] = "application/json";
      try {
        body = JSON.stringify(body);
      } catch (err) {
        // If stringify fails, we'll pass through and let fetch fail
      }
    }

    const fetchOpts = Object.assign({}, baseOptions, options, { body: body });
    // Merge headers (options.headers override)
    fetchOpts.headers = Object.assign({}, baseOptions.headers, options.headers || {});

    const res = await fetch(path, fetchOpts);

    // Try to parse JSON; fallback to text
    const txt = await res.text();
    let data = null;
    try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }

    if (!res.ok) {
      // Normalize error message
      const msg = (data && (data.message || data.error)) || res.statusText || "Request failed";
      const err = new Error(msg);
      err.status = res.status;
      err.body = data;
      throw err;
    }

    return data;
  };

  /* ============================
     Toast / Notification system
     ============================ */
  (function () {
    const CONTAINER_ID = "global-toast-container-v1";

    function ensureContainer() {
      let c = document.getElementById(CONTAINER_ID);
      if (!c) {
        c = document.createElement("div");
        c.id = CONTAINER_ID;
        c.style.position = "fixed";
        c.style.right = "20px";
        c.style.top = "20px";
        c.style.zIndex = 99999;
        c.style.maxWidth = "360px";
        c.style.display = "flex";
        c.style.flexDirection = "column";
        c.style.gap = "8px";
        document.body.appendChild(c);
      }
      return c;
    }

    window.showToast = function (message, type = "info", timeout = 4000) {
      try {
        const c = ensureContainer();
        const el = document.createElement("div");
        el.className = "global-toast";
        el.style.padding = "10px 12px";
        el.style.borderRadius = "8px";
        el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
        el.style.fontSize = "13px";
        el.style.lineHeight = "1.2";
        el.style.wordBreak = "break-word";
        el.style.background = (type === "error") ? "#ffe6e6" : (type === "success") ? "#eaffea" : "#f4f4f4";
        el.style.color = "#222";
        el.textContent = message;
        c.insertBefore(el, c.firstChild);
        setTimeout(() => {
          el.style.opacity = "0";
          setTimeout(() => el.remove(), 300);
        }, timeout);
      } catch (e) {
        console.warn("showToast fallback to alert:", message);
        alert(message);
      }
    };

    window.showConfirm = function (message) {
      // synchronous confirm wrapper (returns boolean)
      return window.confirm(message);
    };
  })();

  /* ============================
     Button enable/disable (prevent double submits)
     ============================ */
  window.disableBtn = function (btn) {
    if (!btn) return;
    try {
      btn.dataset._wasDisabled = btn.disabled ? "1" : "0";
      btn.disabled = true;
      btn.style.opacity = 0.6;
      btn.style.pointerEvents = "none";
    } catch (e) {}
  };
  window.enableBtn = function (btn) {
    if (!btn) return;
    try {
      if (btn.dataset._wasDisabled === "1") { btn.disabled = true; } else btn.disabled = false;
      btn.style.opacity = 1;
      btn.style.pointerEvents = "auto";
    } catch (e) {}
  };

  /* ============================
     Recent activity (local only)
     ============================ */
  window.logActivity = function (msg) {
    try {
      const key = "app_recent_activity_v1";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      arr.unshift({ time: new Date().toISOString(), msg: String(msg) });
      if (arr.length > 50) arr.length = 50;
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) { /* ignore */ }
  };

  window.getRecentActivity = function (limit = 5) {
    try {
      const key = "app_recent_activity_v1";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      return arr.slice(0, limit);
    } catch (e) { return []; }
  };

  /* ============================
     Date/time helpers
     ============================ */
  window.formatDateTime = function (isoOrDate) {
    try {
      const d = isoOrDate ? new Date(isoOrDate) : new Date();
      return d.toLocaleString();
    } catch (e) {
      return String(isoOrDate);
    }
  };

  /* ============================
     Header + ticker + clock injector
     ============================
     Usage:
       1) Add <div id="app-header"></div> near top of body in every HTML page
       2) After utils.js is loaded, call:
          initHeaderTickerClock({ schoolName: "Your School", mountId: "app-header" });
     Behavior:
       - shows School name, announcements ticker (fetched from /api/announcements),
       - shows logged-in user's name + role (read from sessionStorage 'user' stored by auth.js),
       - shows live clock and logout button
  */
  window.initHeaderTickerClock = async function (opts = {}) {
    const schoolName = opts.schoolName || "School Portal";
    const mountId = opts.mountId || "app-header";
    const mount = document.getElementById(mountId);
    if (!mount) return;

    // Base header layout
    mount.style.boxSizing = "border-box";
    mount.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid #e9e9e9;background:#ffffff">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="font-weight:700;font-size:18px">${escapeHtml(schoolName)}</div>
          <div id="${mountId}-ticker" style="font-size:13px;color:#555;max-width:640px;overflow:hidden;white-space:nowrap"></div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div id="${mountId}-role" style="font-size:13px;color:#333"></div>
          <div id="${mountId}-clock" style="font-size:13px;color:#333"></div>
          <button id="${mountId}-logout" style="padding:6px 10px;border-radius:6px;border:1px solid #ddd;background:#fff;cursor:pointer">Logout</button>
        </div>
      </div>
    `;

    // Clock
    const clockEl = document.getElementById(`${mountId}-clock`);
    function tick() { clockEl.textContent = new Date().toLocaleString(); }
    tick(); setInterval(tick, 1000);

    // Ticker: fetch announcements
    const tickerEl = document.getElementById(`${mountId}-ticker`);
    (async function loadTicker() {
      try {
        const anns = await apiFetch("/api/announcements");
        if (!Array.isArray(anns) || anns.length === 0) { tickerEl.textContent = "No announcements"; return; }
        // compact text
        const txt = anns.map(a => `${a.title}: ${a.content}`).join(" \u2022 ");
        tickerEl.textContent = txt;
        // marquee-ish: animate scroll using translateX
        let pos = 0;
        const width = 10;
        setInterval(() => {
          pos += 1;
          tickerEl.style.transform = `translateX(-${pos}px)`;
          // reset if moved too far — crude but effective
          if (pos > 2000) pos = 0;
        }, 150);
      } catch (e) {
        tickerEl.textContent = "Announcements unavailable";
      }
    })();

    // Role display (from sessionStorage 'user')
    const roleEl = document.getElementById(`${mountId}-role`);
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "null");
      if (user) {
        const displayName = user.fullName || user.username || user.email || "User";
        roleEl.textContent = `${displayName} — ${user.role || "User"}`;
      } else {
        roleEl.textContent = "Not logged in";
      }
    } catch (e) {
      roleEl.textContent = "Not logged in";
    }

    // Logout handler
    const logoutBtn = document.getElementById(`${mountId}-logout`);
    logoutBtn.addEventListener("click", async () => {
      try {
        await apiFetch("/api/auth/logout", { method: "POST" });
      } catch (e) { /* ignore errors */ }
      sessionStorage.removeItem("user");
      window.location.href = "/login.html";
    });
  };

  /* ============================
     small HTML escape helper
     ============================ */
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ============================
     Export some helpers to window so other scripts can use them
     ============================ */
  // (they're already on window by assigning above)
  // window.apiFetch, window.showToast, window.showConfirm, window.disableBtn, ...

  // End utils.js IIFE
})();
