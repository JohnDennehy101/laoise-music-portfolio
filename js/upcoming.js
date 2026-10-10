async function renderGigs() {
  const listContainer = document.getElementById("events-list");

  try {
    const response = await fetch("data/events.json");
    const data = await response.json();
    const gigs = data.events || [];

    if (gigs.length === 0) {
      listContainer.innerHTML = `
        <div class="no-gigs">
          <p>No upcoming gigs announced right now.</p>
          <p>Follow on <a href="https://instagram.com/marmaleemusic" target="_blank" rel="noopener noreferrer">Instagram</a> for live updates!</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = gigs
      .map((gig) => {
        const [dayStr, monthStr, yearStr] = gig.date.split("-");
        const d = new Date(yearStr, parseInt(monthStr, 10) - 1, dayStr);

        const day = dayStr;
        const month = d
          .toLocaleString("en-US", { month: "short" })
          .toUpperCase();

        let actionHtml = "";
        if (gig.soldOut) {
          actionHtml = `<span class="status-badge">Sold Out</span>`;
        } else if (gig.ticketUrl) {
          const buttonText =
            gig.ticketText && gig.ticketText.trim() !== ""
              ? gig.ticketText
              : "Get Tickets";
          actionHtml = `<a href="${gig.ticketUrl}" target="_blank" rel="noopener noreferrer" class="ticket-btn">${buttonText}</a>`;
        }

        return `
        <div class="event-card ${gig.soldOut ? "sold-out" : ""}">
          <div class="event-date">
            <span class="day">${day}</span>
            <span class="month">${month}</span>
          </div>

          <div class="event-details">
            <h3 class="event-venue">${gig.venue}</h3>
            <p class="event-location">${gig.city}</p>
          </div>

          <div class="event-action">
            ${actionHtml}
          </div>
        </div>
      `;
      })
      .join("");
  } catch (err) {
    console.error("Error loading events:", err);
    listContainer.innerHTML = `
      <div class="no-gigs">
        <p>Unable to load dates at this time.</p>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", renderGigs);
