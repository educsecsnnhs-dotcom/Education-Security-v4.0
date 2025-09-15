// public/js/pages/enrollment.js
document.addEventListener("DOMContentLoaded", () => {
  // Require Auth
  if (!window.Auth || typeof Auth.getUser !== "function") {
    console.error("Auth.getUser() is required (auth.js)");
    return;
  }

  const user = Auth.getUser();
  if (!user) {
    window.location.href = "/login.html";
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

  const juniorStrands = ["STE", "Regular", "TechVoc", "Sports", "SPA"];
  const seniorStrands = ["STEM", "CIT", "GAS", "HUMMS", "TVL", "ABM"];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Auto-fill from logged-in user
  if (fullNameField) fullNameField.value = user.fullName || "";
  if (lrnField) lrnField.value = user.lrn || "";

  // Level → Strands
  levelSelect.addEventListener("change", (e) => {
    strandSelect.innerHTML = "";
    if (e.target.value === "junior") {
      juniorStrands.forEach((s) =>
        strandSelect.insertAdjacentHTML("beforeend", `<option value="${s}">${s}</option>`)
      );
      strandSection.style.display = "block";
    } else if (e.target.value === "senior") {
      seniorStrands.forEach((s) =>
        strandSelect.insertAdjacentHTML("beforeend", `<option value="${s}">${s}</option>`)
      );
      strandSection.style.display = "block";
    } else {
      strandSection.style.display = "none";
    }
  });

  // File size check
  function validateFiles(formData) {
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > MAX_FILE_SIZE) {
        alert(`⚠️ File "${value.name}" exceeds 5MB limit.`);
        return false;
      }
    }
    return true;
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      } catch (e) {}
      location.href = "/html/login.html";
    });
  }

  // Submit
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      formData.append("fullName", user.fullName);
      formData.append("lrn", user.lrn);
      formData.append("schoolYear", "2025-2026"); // dynamic later

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
        const res = await fetch("/api/registrar/enrollment", {
          method: "POST",
          credentials: "include", // important for session cookies
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Enrollment failed");

        msg.textContent = "✅ Enrollment submitted! Wait for registrar approval.";
        setTimeout(() => (window.location.href = "/welcome.html"), 1200);
      } catch (err) {
        console.error("Enrollment error:", err);
        msg.textContent = "❌ Failed to submit: " + err.message;
      }
    });
  }
});
