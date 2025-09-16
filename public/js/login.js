// public/js/login.js
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
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Login failed");

      if (data.token) localStorage.setItem("edusec_token", data.token);

      window.location.href = "../html/welcome.html";
    } catch (err) {
      console.error("Login error:", err);
      alert("❌ " + err.message);
    }
  });
});
