// index.js (frontend helper script)
// Shared helpers: Caesar cipher + fetch wrapper

// ==========================
//  Caesar Cipher (Password)
// ==========================
// IMPORTANT: must match backend's CIPHER_KEY in .env (default = 3)
function caesarEncrypt(text, shift = 3) {
  return text
    .split("")
    .map(char => {
      const code = char.charCodeAt(0);
      // Uppercase A–Z
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      }
      // Lowercase a–z
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      }
      // Digits 0–9
      if (code >= 48 && code <= 57) {
        return String.fromCharCode(((code - 48 + shift) % 10) + 48);
      }
      return char;
    })
    .join("");
}

// ==========================
//  Fetch Wrapper (session-based)
// ==========================
// Backend uses express-session + cookies, NOT JWT
async function apiFetch(url, options = {}) {
  const defaultHeaders = { "Content-Type": "application/json" };
  options.headers = { ...defaultHeaders, ...(options.headers || {}) };

  // Ensure cookies (session) are sent and received
  options.credentials = "include";

  try {
    const res = await fetch(url, options);
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
        // Call backend logout
        await apiFetch("/auth/logout", { method: "POST" });
        // Redirect to login page
        window.location.href = "/login.html";
      } catch (err) {
        console.error("Logout failed:", err);
      }
    });
  }
});
