document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Basic validation for empty fields
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    // Additional validation for email format (optional)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const encryptedPassword = caesarEncrypt(password); // Encrypt password with Caesar cipher

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: encryptedPassword })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Registration failed");

      alert("✅ Registration successful! Please log in.");
      window.location.href = "../html/login.html";
    } catch (err) {
      console.error("Registration error:", err);
      alert("❌ " + err.message);
    }
  });

  // Password toggle for visibility
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
