// public/js/register.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Registration failed");
      }

      alert("✅ Registration successful! Please log in.");
      // ✅ Redirect to login page
      window.location.href = "html/login.html";
    } catch (err) {
      console.error("Registration error:", err);
      alert("❌ " + err.message);
    }
  });

  // Password toggle
  const toggle = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  if (toggle && passwordInput) {
    toggle.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
      toggle.textContent = type === "password" ? "👁️" : "🙈";
    });
  }
});
