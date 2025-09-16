// index.js (frontend helper script)
// Shared helpers: Caesar cipher + fetch wrapper

// ==========================
//  Caesar Cipher (Password)
// ==========================
function caesarEncrypt(text, shift = 3) {
  return text
    .split("")
    .map(char => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shift) % 26) + 65); // A–Z
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift) % 26) + 97); // a–z
      if (code >= 48 && code <= 57) return String.fromCharCode(((code - 48 + shift) % 10) + 48); // 0–9
      return char;
    })
    .join("");
}

// ==========================
//  Fetch Wrapper (session-based)
// ==========================
async function apiFetch(url, options = {}) {
  const defaultHeaders = { "Content-Type": "application/json" };
  const opts = {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
    credentials: "include", // 🔑 always send cookies
  };

  try {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Fetch failed:", err);
    throw err;
  }
}

// ==========================
//  Logout Handler
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await apiFetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login.html";
      } catch (err) {
        console.error("Logout failed:", err);
      }
    });
  }
});
