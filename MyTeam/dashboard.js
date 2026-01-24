const EVENT_DATE = new Date("2026-02-08T10:00:00");
const TEAM_ID = localStorage.getItem("username") || "T01";

let feedbackData = [];

async function toggleResolve(index) {
  const item = feedbackData[index];
  const newValue = !item.resolved;

  feedbackData[index].resolved = newValue;
  renderFeedback(feedbackData);

  await fetch("/.netlify/functions/updateFeedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team_id: TEAM_ID,
      comment: item.comment,
      resolved: newValue
    })
  });
}

function startCountdown() {
  const el = document.getElementById("countdown");

  function tick() {
    const diff = EVENT_DATE - new Date();

    if (diff <= 0) {
      el.textContent = "EVENT LIVE";
      return;
    }

    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);

    el.textContent =
      `${String(h).padStart(2, "0")}:` +
      `${String(m).padStart(2, "0")}:` +
      `${String(s).padStart(2, "0")}`;
  }

  tick();
  setInterval(tick, 1000);
}

async function loadDashboardData() {
  const team_id = localStorage.getItem("username") || "T01";

  const res = await fetch("/.netlify/functions/getDashboardData", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team_id })
  });

  if (!res.ok) {
    throw new Error("Failed to load dashboard data");
  }

  return res.json();
}

function renderTeam(t) {
  document.getElementById("team-info").innerHTML = `
    <div class="info-block">
      <div class="info-title">${t.team_name}</div>
      <div class="info-sub">Team ID: ${t.team_id}</div>
      <div class="info-list">
        ${t.members.split(",").map(m => `<div class="chip">${m.trim()}</div>`).join("")}
      </div>
    </div>
  `;
}

function renderProject(team) {
  const el = document.getElementById("project-info");

  const hasTitle =
    team.project_title && team.project_title.trim() !== "";
  const hasDesc =
    team.project_description && team.project_description.trim() !== "";

  if (!hasTitle || !hasDesc) {
    el.innerHTML = `
      <div class="empty-state">
        <button onclick="showProjectForm()">
          Add project details
        </button>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="info-block">
      <div class="info-title">${team.project_title}</div>
      <p class="info-desc">${team.project_description}</p>
    </div>
  `;
}


function renderGitHub(team) {
  const el = document.getElementById("github-info");

  if (!team.repo_url || team.repo_url.trim() === "") {
    el.innerHTML = `
      <div class="empty-state">
        <button onclick="showGitHubForm()">Add GitHub link</button>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <a class="github-btn" href="${team.repo_url}" target="_blank">
      Open Repository
    </a>
  `;
}

function renderUpcoming() {
  const list = document.getElementById("event-timeline");

  const items = [
    { label: "Next Check-in", time: "11:00 AM" },
    { label: "Lunch Break", time: "1:00 PM" },
    { label: "Mid-Review", time: "3:30 PM" }
  ];

  list.innerHTML = items.map(i => `
    <li class="upcoming-item">
      <span class="u-label">${i.label}</span>
      <span class="u-time">${i.time}</span>
    </li>
  `).join("");
}

function renderLeaderboard(rows) {
  const body = document.getElementById("leaderboard-body");

  if (!rows || rows.length === 0) {
    body.innerHTML = `<div class="empty-state">No teams found</div>`;
    return;
  }

  const top5 = rows
    .map(r => ({
      team_id: r.team_id,
      team_name: r.team_name,
      points: Number(r.points) || 0
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  body.innerHTML = top5.map((r, i) => `
    <div class="leaderboard-row ${r.team_id === TEAM_ID ? "highlight" : ""}">
      <span>#${i + 1}</span>
      <span>${r.team_name}</span>
      <span>${r.points}</span>
    </div>
  `).join("");
}

function renderFeedback(rows) {
  const c = document.getElementById("feedback-list");

  if (!rows.length) {
    c.innerHTML = `<div class="empty-state">No feedback yet</div>`;
    return;
  }

  c.innerHTML = rows.map((f, idx) => {
    const priority = parseInt(String(f.priority).trim(), 10);
    const resolved = f.resolved === true || f.resolved === "TRUE";

    let priorityClass = "";

    if (priority === 1) priorityClass = "priority-red";
    else if (priority === 2) priorityClass = "priority-yellow";
    else if (priority === 3) priorityClass = "priority-blue";
    else {
      console.warn("Invalid priority value:", f.priority);
      priorityClass = "priority-red";
    }

    const showResolve = priority !== 3;

    return `
      <div class="feedback-card ${priorityClass} ${resolved ? "done" : ""}" data-index="${idx}">
        <strong>${f.judge}</strong>
        <p>${f.comment}</p>

        ${
          showResolve
            ? `<button class="resolve-btn" onclick="toggleResolve(${idx})">
                ${resolved ? "Unresolve Comment" : "Resolve Comment"}
              </button>`
            : ""
        }
      </div>
    `;
  }).join("");
}

function showProjectForm() {
  const el = document.getElementById("project-info");

  el.innerHTML = `
    <div class="form">
      <input id="ptitle" placeholder="Project title" />
      <textarea id="pdesc" placeholder="Project description"></textarea>
      <button onclick="saveProject()">Save</button>
    </div>
  `;
}

async function saveProject() {
  const project_title = document.getElementById("ptitle").value.trim();
  const project_description = document.getElementById("pdesc").value.trim();

  await fetch("/.netlify/functions/updateTeamProject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team_id: TEAM_ID,
      project_title,
      project_description
    })
  });

  location.reload();
}

function showGitHubForm() {
  const el = document.getElementById("github-info");

  el.innerHTML = `
    <div class="form">
      <input id="repo" placeholder="GitHub repo URL" />
      <button onclick="saveGitHub()">Save</button>
    </div>
  `;
}

async function saveGitHub() {
  const repo_url = document.getElementById("repo").value.trim();

  await fetch("/.netlify/functions/updateTeamProject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team_id: TEAM_ID,
      repo_url
    })
  });

  location.reload();
}


document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('/.netlify/functions/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const data = await response.json();

    if (!response.ok || !data.valid) {
      localStorage.removeItem('authToken');
      window.location.href = 'login.html';
      return;
    }

    // Token valid → load dashboard
    startCountdown();
    renderUpcoming();

    const { team, feedback } = await loadDashboardData();

    feedbackData = feedback.map(f => ({
      ...f,
      resolved: f.resolved === true
    }));

    renderTeam(team);
    renderProject(team);
    renderGitHub(team);
    renderFeedback(feedbackData);

  } catch (err) {
    console.error(err);
    window.location.href = 'login.html';
  }
});
