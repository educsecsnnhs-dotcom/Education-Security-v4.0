// public/js/profile.js
// Profile Management for all users

document.addEventListener("DOMContentLoaded", () => {
  Auth.requireLogin();
  const user = Auth.getUser();

  const profileForm = document.getElementById("profileForm");
  const profilePicInput = document.getElementById("profilePic");
  const profilePreview = document.getElementById("profilePreview");
  const passwordForm = document.getElementById("passwordForm");

  const roleLabel = document.getElementById("profileRole");
  const statusLabel = document.getElementById("profileStatus");

  // Show role & status
  roleLabel.textContent = user.role || "User";
  statusLabel.textContent = user.status || "Active";

  // Pre-fill profile form
  document.getElementById("firstName").value = user.firstName || "";
  document.getElementById("middleName").value = user.middleName || "";
  document.getElementById("lastName").value = user.lastName || "";
  document.getElementById("lrn").value = user.lrn || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("contact").value = user.contact || "";

  if (user.profilePic) {
    profilePreview.src = `/uploads/profiles/${user.profilePic}`;
  }

  // 🔹 Update profile (basic info)
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(profileForm));

    try {
      const updated = await apiFetch("/api/profile/update", {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      alert("✅ Profile updated successfully");
      Auth.saveUser(updated); // update session storage
      window.location.reload();
    } catch (err) {
      console.error("Profile update error:", err);
      alert("❌ Failed to update profile");
    }
  });

  // 🔹 Upload / Change profile picture
  profilePicInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("⚠️ File too large (max 5MB)");
      return;
    }

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const updated = await fetch("/api/profile/uploadPic", {
        method: "POST",
        credentials: "include",
        body: formData,
      }).then((res) => res.json());

      if (!updated || !updated.profilePic) {
        throw new Error("Upload failed");
      }

      alert("✅ Profile picture updated");
      Auth.saveUser(updated);
      profilePreview.src = `/uploads/profiles/${updated.profilePic}`;
    } catch (err) {
      console.error("Profile pic upload error:", err);
      alert("❌ Failed to upload profile picture");
    }
  });

  // 🔹 Change password
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(passwordForm));

    if (!formData.oldPassword || !formData.newPassword) {
      return alert("⚠️ Please fill all password fields");
    }

    if (formData.newPassword.length < 6) {
      return alert("⚠️ Password must be at least 6 characters");
    }

    try {
      await apiFetch("/api/profile/changePassword", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      alert("✅ Password updated successfully");
      passwordForm.reset();
    } catch (err) {
      console.error("Password change error:", err);
      alert("❌ Failed to change password");
    }
  });
});
