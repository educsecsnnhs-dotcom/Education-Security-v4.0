(function () {
  "use strict";

  /* ============================
     DOM helpers
     ============================ */
  window.qs = (sel, ctx) => (ctx || document).querySelector(sel);
  window.qsa = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
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
     API fetch wrapper (always includes credentials)
     ============================ */
  window.apiFetch = async function (path, options = {}) {
    const baseOptions = { credentials: "include", headers: {} };

    let body = options.body;
    if (body && !(body instanceof FormData) && typeof body === "object") {
      baseOptions.headers["Content-Type"] = "application/json";
      try { body = JSON.stringify(body); } catch (err) {}
    }

    const fetchOpts = {
      ...baseOptions,
      ...options,
      body,
      headers: { ...baseOptions.headers, ...(options.headers || {}) },
    };

    const res = await fetch(path, fetchOpts);

    const txt = await res.text();
    let data = null;
    try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }

    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || res.statusText || "Request failed";
      const err = new Error(msg);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  };

  /* ============================
     Toast / Notification
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
        el.style.background = (type === "error") ? "#ffe6e6" :
                              (type === "success") ? "#eaffea" : "#f4f4f4";
        el.style.color = "#222";
        el.textContent = message;
        c.insertBefore(el, c.firstChild);
        setTimeout(() => {
          el.style.opacity = "0";
          setTimeout(() => el.remove(), 300);
        }, timeout);
      } catch {
        alert(message);
      }
    };

    window.showConfirm = function (message) {
      return window.confirm(message);
    };
  })();

  /* ... rest of utils.js unchanged ... */

})(); // End IIFE
