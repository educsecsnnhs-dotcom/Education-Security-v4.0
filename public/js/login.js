// public/js/login.js
import { caesarEncrypt, Auth } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // keep session cookie
        body: JSON.stringify({
          email,
          password: caesarEncrypt(password), // 🔐 match backend
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // ✅ Save session in frontend
      Auth.setUser(data.user);

      // ✅ Redirect by role
      switch (data.user.role) {
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
      console.error("Login error:", err);
      alert("❌ " + err.message);
    }
  });
});
