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
      // No encryption needed on frontend anymore
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })  // Send plain password
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Login failed");

      // Store user role in localStorage
      const userRole = data.user?.role || "User"; // Default to 'User' if role is undefined
      localStorage.setItem("user_role", userRole);

      // Store user's name in localStorage (optional, for user display in welcome page)
      localStorage.setItem("user_name", data.user?.name || email); 

      // Redirect to welcome page
      window.location.href = "../html/welcome.html";
    } catch (err) {
      console.error("Login error:", err);
      alert("❌ " + err.message);
    }
  });
});
