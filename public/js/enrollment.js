// public/js/enrollment.js
// Enrollment flow: User → Student
// - Auto-fills user profile (name + LRN).
// - Select level (junior/senior), strand, year level.
// - Uploads required documents (max 5MB each).
// - Submits via /api/registrar/enrollment.
// - Shows warnings + success/failure messages.

document.addEventListener("DOMContentLoaded", () => {
  // Ensure helpers exist
  if (!window.Auth || typeof Auth.getUser !== "function") {
    console.error("Auth.getUser() is required (auth.js)");
    return;
  }

  const user = Auth.getUser();
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  // Form elements
  const form = document.getElementById("enrollmentForm");
  const fullNameField = document.getElementById("fullName");
  const lrnField = document.getElementById("lrn");
  const yearField = document.getElementById("yearLevel");
  const levelSelect = document.getElementById("levelSelect");
  const strandSection = document.getElementById("strandSection");
  const strandSelect = document.getElementById("strandSelect");

  const juniorStrands = ["STE", "Regular", "TechVoc", "Sports", "SPA"];
  const seniorStrands = ["STEM", "CIT", "GAS", "HUMMS", "TVL", "ABM"];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // 🔹 Auto-fill user info
  if (fullNameField) fullNameField.value = user.fullName || "";
  if (lrnField) lrnField.value = user.lrn || "";

  // 🔹 Show strand options depending on level
  levelSelect.addEventListener("change", (e) => {
    strandSelect.innerHTML = "";
    if (e.target.value === "junior") {
      juniorStrands.forEach((s) => {
        strandSelect.innerHTML += `<option value="${s}">${s}</option>`;
      });
      strandSection.style.display = "block";
    } else if (e.target.value === "senior") {
      seniorStrands.forEach((s) => {
        strandSelect.innerHTML += `<option value="${s}">${s}</option>`;
      });
      strandSection.style.display = "block";
    } else {
      strandSection.style.display = "none";
    }
  });

  // 🔹 Validate file sizes
  function validateFiles(formData) {
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > MAX_FILE_SIZE) {
        alert(`⚠️ File "${value.name}" exceeds 5MB limit. Please upload a smaller file.`);
        return false;
      }
    }
    return true;
  }

  // 🔹 Submit enrollment
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    formData.append("fullName", user.fullName);
    formData.append("lrn", user.lrn);
    formData.append("schoolYear", "2025-2026"); // ⚠️ make dynamic later

    // Year level validation
    const yearLevel = yearField.value.trim();
    if (!yearLevel) {
      alert("⚠️ Please enter your Year Level (e.g., 7, 8, 11, 12).");
      return;
    }
    formData.append("yearLevel", yearLevel);

    // Level + strand validation
    const level = levelSelect.value;
    if (!level) {
      alert("⚠️ Please select a Level (junior/senior).");
      return;
    }
    formData.append("level", level);

    if ((level === "junior" || level === "senior") && !strandSelect.value) {
      alert("⚠️ Please select a Strand.");
      return;
    }
    if (strandSelect.value) {
      formData.append("strand", strandSelect.value);
    }

    // Validate files
    if (!validateFiles(formData)) return;

    try {
      const res = await fetch("/api/registrar/enrollment", {
        method: "POST",
        credentials: "include", // important for session cookies
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Enrollment failed");
      }

      alert("✅ Enrollment submitted successfully! Please wait for registrar approval.");
      window.location.href = "/welcome.html";
    } catch (err) {
      console.error("Enrollment error:", err);
      alert("❌ Failed to submit enrollment: " + err.message);
    }
  });
});
