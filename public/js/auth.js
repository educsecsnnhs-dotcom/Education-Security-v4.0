// 🔹 Caesar Cipher (MUST match backend /utils/caesar.js)
function caesarEncrypt(str, shift = 3) {
  return str.split("").map(char => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shift) % 26) + 65);
    if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift) % 26) + 97);
    if (code >= 48 && code <= 57) return String.fromCharCode(((code - 48 + shift) % 10) + 48);
    return char;
  }).join("");
}

// 🔹 Auth object (modified)
const Auth = {
  // No longer saving tokens, just the user's role
  saveRole(role) {
    localStorage.setItem("user_role", role);
  },
  getRole() {
    return localStorage.getItem("user_role");
  },
  clearRole() {
    localStorage.removeItem("user_role");
  },
  async logout() {
    Auth.clearRole();
    window.location.href = "/index.html"; // Always redirect to login page after logout
  }
};

/* ---------------------- 🔹 Forms ---------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const logoutBtn = document.getElementById("logoutBtn");

  // ✅ Login
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(loginForm));
      const encryptedPassword = caesarEncrypt(formData.password);

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: encryptedPassword })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Login failed");

        // Only store the user's role in localStorage
        const role = data.user?.role || "default";
        Auth.saveRole(role);

        // Redirect to welcome.html (no separate role-based pages)
        window.location.href = "/welcome.html";
      } catch (err) {
        alert("❌ " + err.message);
      }
    });
  }

  // ✅ Register
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(registerForm));
      const encryptedPassword = caesarEncrypt(formData.password);

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: encryptedPassword })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Registration failed");

        alert("✅ Registration successful. Please login.");
        window.location.href = "/index.html"; // redirect to login
      } catch (err) {
        alert("❌ " + err.message);
      }
    });
  }

  // ✅ Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => Auth.logout());
  }
});
