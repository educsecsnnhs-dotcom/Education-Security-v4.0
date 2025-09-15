// public/js/auth.js

// 🔹 Caesar Cipher (must align with backend /utils/caesar.js)
function caesarEncrypt(str, shift = 3) {
  return str
    .split("")
    .map(char => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      }
      return char;
    })
    .join("");
}

// 🔹 Auth object for session management
const Auth = {
  /**
   * Save user session in sessionStorage
   */
  setUser(user) {
    sessionStorage.setItem("user", JSON.stringify(user));
  },

  /**
   * Get current logged-in user
   */
  getUser() {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },

  /**
   * Require login → redirect if not logged in
   */
  requireLogin(redirectTo = "/index.html") {
    const user = this.getUser();
    if (!user) {
      window.location.href = redirectTo;
    }
    return user;
  },

  /**
   * Logout → destroy session both frontend & backend
   */
  async logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      sessionStorage.removeItem("user");
      window.location.href = "/index.html";
    }
  },
};

/* ---------------------- 🔹 Login ---------------------- */
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
          credentials: "include",
          body: JSON.stringify({
            email: formData.email,
            password: encryptedPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        Auth.setUser(data.user);

        // Redirect based on role
        const role = data.user.role;
        switch (role) {
          case "Registrar":
            window.location.href = "/registrar.html";
            break;
          case "Admin":
            window.location.href = "/admin.html";
            break;
          case "Moderator":
            window.location.href = "/moderator.html";
            break;
          case "Student":
            window.location.href = "/student.html";
            break;
          case "SSG":
            window.location.href = "/ssg.html";
            break;
          case "SuperAdmin":
            window.location.href = "/superadmin.html";
            break;
          default:
            window.location.href = "/welcome.html";
        }
      } catch (err) {
        alert("❌ " + err.message);
      }
    });
  }

  // ✅ Register (basic User)
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
          body: JSON.stringify({
            email: formData.email,
            password: encryptedPassword,
          }),
        });

        const data = await res.json();
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
