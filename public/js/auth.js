// public/js/auth.js

// 🔹 Caesar Cipher (MUST match backend /utils/caesar.js)
function caesarEncrypt(str, shift = 3) {
  return str
    .split("")
    .map(char => {
      const code = char.charCodeAt(0);

      // A–Z
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      }
      // a–z
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      }
      // 0–9
      if (code >= 48 && code <= 57) {
        return String.fromCharCode(((code - 48 + shift) % 10) + 48);
      }

      return char;
    })
    .join("");
}

// 🔹 Auth object (purely backend-session based)
const Auth = {
  async logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "/index.html";
    }
  },
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
          credentials: "include", // required for cookie session
          body: JSON.stringify({ email: formData.email, password: encryptedPassword }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Login failed");

        // ✅ No frontend storage — rely on backend cookie
        const role = data.user?.role || "default";
        switch (role) {
          case "Registrar": window.location.href = "/registrar.html"; break;
          case "Admin": window.location.href = "/admin.html"; break;
          case "Moderator": window.location.href = "/moderator.html"; break;
          case "Student": window.location.href = "/student.html"; break;
          case "SSG": window.location.href = "/ssg.html"; break;
          case "SuperAdmin": window.location.href = "/superadmin.html"; break;
          default: window.location.href = "/welcome.html";
        }
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
          credentials: "include",
          body: JSON.stringify({ email: formData.email, password: encryptedPassword }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Registration failed");

        alert("✅ Registration successful. Please login.");
        window.location.href = "/index.html";
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
