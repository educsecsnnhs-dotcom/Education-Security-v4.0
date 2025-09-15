// public/js/event.js
// School Events Management

document.addEventListener("DOMContentLoaded", () => {
  Auth.requireLogin();
  const user = Auth.getUser();

  const eventForm = document.getElementById("eventForm");
  const eventList = document.getElementById("eventList");

  // 🔹 Load events
  async function loadEvents() {
    eventList.innerHTML = "Loading events...";
    try {
      const events = await apiFetch("/api/events");
      if (!events.length) {
        eventList.innerHTML = "<p>No events yet</p>";
        return;
      }

      eventList.innerHTML = "";
      events.forEach((ev) => {
        const div = document.createElement("div");
        div.classList.add("event-card");
        div.innerHTML = `
          <h3>${ev.title}</h3>
          <p>${ev.description}</p>
          <p><b>When:</b> ${new Date(ev.date).toLocaleString()}</p>
          <p><b>Participants:</b> ${ev.participants?.join(", ") || "All students"}</p>
          <small>Created by ${ev.author?.name || "System"}</small>
        `;
        eventList.appendChild(div);
      });
    } catch (err) {
      console.error("Event load error:", err);
      eventList.innerHTML = "<p>⚠️ Failed to load events</p>";
    }
  }

  // 🔹 Create event (Registrar, Admin, Moderator, SSG only)
  if (eventForm) {
    eventForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!["Registrar", "Admin", "Moderator", "SSG"].includes(user.role)) {
        return alert("⚠️ You are not allowed to create events");
      }

      const formData = Object.fromEntries(new FormData(eventForm));
      if (!formData.title || !formData.description || !formData.date) {
        return alert("⚠️ Title, description, and date are required");
      }

      try {
        await apiFetch("/api/events", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        alert("✅ Event created");
        eventForm.reset();
        loadEvents();
      } catch (err) {
        console.error("Event create error:", err);
        alert("❌ Failed to create event");
      }
    });
  }

  // Initial load
  loadEvents();
});
