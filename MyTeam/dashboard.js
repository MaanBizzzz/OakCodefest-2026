const EVENT_END = new Date("2026-02-08T10:00:00");
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
    const diff = EVENT_END - new Date();

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

  el.innerHTML = `
    <div class="project-block">

      <div class="project-row">
        <div class="project-text">
          <div class="info-title">${team.project_title || "Not added yet"}</div>
        </div>
        <button class="btn secondary" onclick="editProjectTitle()">Edit</button>
      </div>

      <div class="project-row">
        <div class="project-text">
          <p class="info-desc">${team.project_description || "No description yet"}</p>
        </div>
        <button class="btn secondary" onclick="editProjectDesc()">Edit</button>
      </div>
    </div>
  `;
}

function renderGitHub(team) {
  const el = document.getElementById("github-info");

  const raw = team.repo_url?.trim();

  if (!raw) {
    el.innerHTML = `
      <div class="form github-form">
        <input id="repo" placeholder="GitHub repository URL" />
        <button class="btn primary full" onclick="saveGitHub()">Save</button>
      </div>
    `;
    return;
  }

  let repo_url = raw.startsWith("https://") ? raw : "https://" + raw;

  const cleanName = repo_url
    .replace("https://", "")
    .replace("github.com/", "");

  el.innerHTML = `
    <div class="github-card">
      <div class="github-meta">
        <span class="repo-label">Repository</span>
        <span class="repo-name">${cleanName}</span>
      </div>

      <div class="github-actions">
        <a class="btn secondary" href="${repo_url}" target="_blank">
          Open
        </a>
        <button class="btn primary" onclick="showGitHubForm()">
          Edit
        </button>
      </div>
    </div>
  `;
}

function renderUpcoming() {
  const list = document.getElementById("event-timeline");

  const schedule = [
    ["2026-02-07T07:45:00", "Participant Registrations"],
    ["2026-02-07T08:30:00", "Opening Ceremony"],
    ["2026-02-07T09:15:00", "Coding Starts"],
    ["2026-02-07T12:00:00", "Lunch"],
    ["2026-02-07T13:00:00", "First Audit"],
    ["2026-02-07T18:00:00", "Second Audit"],
    ["2026-02-07T20:00:00", "Dinner"],

    ["2026-02-08T00:00:00", "Midnight Hangout"],
    ["2026-02-08T02:00:00", "Third Audit"],
    ["2026-02-08T06:15:00", "Breakfast"],
    ["2026-02-08T07:00:00", "Fourth Audit"],
    ["2026-02-08T09:15:00", "Coding Ends"],
    ["2026-02-08T09:30:00", "Prep Presentations"],
    ["2026-02-08T20:00:00", "Presentations"],
    ["2026-02-08T11:00:00", "Closing Ceremony"]
  ].map(([time, label]) => ({
    time: new Date(time),
    label
  }));

  const now = new Date();

  const upcoming = schedule
    .filter(e => e.time > now)
    .slice(0, 6);

  if (!upcoming.length) {
    list.innerHTML = `<div class="empty-state">Event finished</div>`;
    return;
  }

  list.innerHTML = upcoming.map(e => `
    <li class="upcoming-item">
      <span class="u-label">${e.label}</span>
      <span class="u-time">
        ${e.time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
      </span>
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
    <div class="github-card">
      <div class="form">
        <input id="repo" placeholder="GitHub repository URL" />
        <div class="github-actions">
          <button class="btn primary" onclick="saveGitHub()">Save</button>
          <button class="btn secondary" onclick="location.reload()">Cancel</button>
        </div>
      </div>
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

function editProjectTitle() {
  const el = document.getElementById("project-info");
  const currentTitle = feedbackData.team?.project_title || '';
  
  el.innerHTML = `
    <div class="form">
      <input id="ptitle" placeholder="Project title" value="${currentTitle}" />
      <button class="btn primary" onclick="saveProjectTitle()">Save</button>
      <button class="btn secondary" onclick="location.reload()">Cancel</button>
    </div>
  `;
}

function editProjectDesc() {
  const el = document.getElementById("project-info");
  const currentDesc = feedbackData.team?.project_description || '';
  
  el.innerHTML = `
    <div class="form">
      <textarea id="pdesc" placeholder="Project description">${currentDesc}</textarea>
      <button class="btn primary" onclick="saveProjectDesc()">Save</button>
      <button class="btn secondary" onclick="location.reload()">Cancel</button>
    </div>
  `;
}

async function saveProjectTitle() {
  const project_title = document.getElementById("ptitle").value.trim();
  
  await fetch("/.netlify/functions/updateTeamProject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team_id: TEAM_ID,
      project_title
    })
  });
  
  location.reload();
}

async function saveProjectDesc() {
  const project_description = document.getElementById("pdesc").value.trim();
  
  await fetch("/.netlify/functions/updateTeamProject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team_id: TEAM_ID,
      project_description
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

    const { team, feedback, leaderboard } = await loadDashboardData();

    feedbackData = feedback.map(f => ({
      ...f,
      resolved: f.resolved === true
    }));
    setInterval(renderUpcoming, 60_000);

    renderTeam(team);
    renderProject(team);
    renderGitHub(team);
    renderFeedback(feedbackData);
    renderLeaderboard(leaderboard);

  } catch (err) {
    console.error(err);
    window.location.href = 'login.html';
  }
});
