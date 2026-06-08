document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and current selection options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participants = Array.isArray(details.participants) ? details.participants : [];
        const participantList = participants.length
          ? `<div class="participants-list">${participants
              .map(
                (participant) => `
                  <button type="button" class="participant-chip" data-activity="${name}" data-email="${participant}" aria-label="Remove ${participant} from ${name}">
                    <span class="participant-name">${participant}</span>
                    <span class="participant-remove" aria-hidden="true">×</span>
                  </button>
                `
              )
              .join("")}</div>`
          : `<p class="participants-empty">No one has signed up yet — be the first!</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p class="activity-description">${details.description}</p>
          <p class="activity-meta"><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-meta"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-box">
            <h5>Participants</h5>
            ${participantList}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Unable to unregister participant.");
      }

      messageDiv.textContent = result.message;
      messageDiv.className = "success";
      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);

      await fetchActivities();
    } catch (error) {
      messageDiv.textContent = error.message || "Failed to unregister participant.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering participant:", error);
    }
  }

  activitiesList.addEventListener("click", (event) => {
    const chip = event.target.closest(".participant-chip");

    if (!chip) {
      return;
    }

    event.preventDefault();
    unregisterParticipant(chip.dataset.activity, chip.dataset.email);
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
