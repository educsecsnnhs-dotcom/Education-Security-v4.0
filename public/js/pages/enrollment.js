// public/js/pages/enrollment.js
document.addEventListener("DOMContentLoaded", () => {
  // 🔹 Check if user role exists and if they have access
  const user = JSON.parse(localStorage.getItem("user"));
  
  if (!user || !['Student', 'Registrar', 'Admin'].includes(user.role)) {
    // Only Students, Registrars, and Admins should access this page
    window.location.href = "/html/login.html"; // Redirect to login if no access
    return;
  }

  // Elements
  const form = document.getElementById("enrollmentForm");
  const msg = document.getElementById("enrollMsg");
  const fullNameField = document.getElementById("fullName");
  const lrnField = document.getElementById("lrn");
  const yearField = document.getElementById("yearLevel");
  const levelSelect = document.getElementById("levelSelect");
  const strandSection = document.getElementById("strandSection");
  const strandSelect = document.getElementById("strandSelect");
  const logoutBtn = document.getElementById("logoutBtn");

  // Prepopulate user information (No need for JWT)
  if (fullNameField) fullNameField.value = user.fullName || "";
  if (lrnField) lrnField.value = user.lrn || "";

  // Level → Strands Logic
  levelSelect.addEventListener("change", (e) => {
    strandSelect.innerHTML = ""; // Clear current strands
    if (e.target.value === "junior") {
      ["STE", "Regular", "TechVoc", "Sports", "SPA"].forEach((s) => {
        strandSelect.insertAdjacentHTML("beforeend", `<option value="${s}">${s}</option>`);
      });
      strandSection.style.display = "block";
    } else if (e.target.value === "senior") {
      ["STEM", "CIT", "GAS", "HUMMS", "TVL", "ABM"].forEach((s) => {
        strandSelect.insertAdjacentHTML("beforeend", `<option value="${s}">${s}</option>`);
      });
      strandSection.style.display = "block";
    } else {
      strandSection.style.display = "none";
    }
  });

  // File size check
  function validateFiles(formData) {
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 5 * 1024 * 1024) { // 5MB max size
        alert(`⚠️ File "${value.name}" exceeds 5MB limit.`);
        return false;
      }
    }
    return true;
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("user"); // Remove user data from localStorage
      location.href = "/html/login.html"; // Redirect to login
    });
  }

  // Form Submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      formData.append("fullName", user.fullName);
      formData.append("lrn", user.lrn);
      formData.append("schoolYear", "2025-2026"); // hardcoded school year for now

      // Validate year level
      const yearLevel = yearField.value.trim();
      if (!yearLevel) {
        alert("⚠️ Please enter your Year Level (e.g., 7, 8, 11, 12).");
        return;
      }
      formData.set("yearLevel", yearLevel);

      // Validate level + strand
      const level = levelSelect.value;
      if (!level) {
        alert("⚠️ Please select a Level (junior/senior).");
        return;
      }
      formData.set("level", level);

      if ((level === "junior" || level === "senior") && !strandSelect.value) {
        alert("⚠️ Please select a Strand.");
        return;
      }
      if (strandSelect.value) {
        formData.set("strand", strandSelect.value);
      }

      // Validate files
      if (!validateFiles(formData)) return;

      msg.textContent = "Submitting…";

      try {
        // No token in headers, using the user data directly for backend validation
        const res = await fetch("/api/registrar/enrollment", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Enrollment failed");

        msg.textContent = "✅ Enrollment submitted! Wait for registrar approval.";
        setTimeout(() => (window.location.href = "/html/welcome.html"), 1200); // fixed path for redirection
      } catch (err) {
        console.error("Enrollment error:", err);
        msg.textContent = "❌ Failed to submit: " + err.message;
      }
    });
  }
});
