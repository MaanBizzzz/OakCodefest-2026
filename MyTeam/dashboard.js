const EVENT_DATE = new Date("2026-02-08T10:00:00");
const TEAM_ID = localStorage.getItem("team_id") || "T01";

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

async function loadExcelData() {
  const res = await fetch("./dashboard_data.xlsx");
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const j = (s) => XLSX.utils.sheet_to_json(wb.Sheets[s] || []);

  return {
    team: j("Team"),
    project: j("Project"),
    github: j("GitHub"),
    feedback: j("Feedback"),
    leaderboard: j("Leaderboard")
  };
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

function renderProject(p) {
  document.getElementById("project-info").innerHTML = p
    ? `
    <div class="info-block">
      <div class="info-title">${p.title}</div>
      <p class="info-desc">${p.description}</p>
    </div>
    `
    : `<div class="empty-state">No project submitted</div>`;
}

function renderGitHub(g) {
  document.getElementById("github-info").innerHTML = g
    ? `<a class="github-btn" href="${g.repo_url}" target="_blank">Open Repository</a>`
    : `<div class="empty-state">GitHub not linked</div>`;
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

  if (!rows || !rows.length) {
    body.innerHTML = `<div class="empty-state">No scores yet</div>`;
    return;
  }

  const sorted = rows
    .map(r => ({ ...r, points: Number(r.points) || 0 }))
    .sort((a, b) => b.points - a.points);

  body.innerHTML = sorted.map((r, i) => `
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

  c.innerHTML = rows.map(f => {
    const priority = (f.priority || "medium").toLowerCase();
    const resolved = f.resolved === "TRUE";

    return `
      <div class="feedback-card ${priority} ${resolved ? "done" : ""}">
        <strong>${f.judge}</strong>
        <p>${f.comment}</p>
        <button class="resolve-btn" onclick="this.parentElement.classList.toggle('done')">
          ${resolved ? "Resolved" : "Mark Resolved"}
        </button>
      </div>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  startCountdown();
  renderUpcoming();

  const data = await loadExcelData();

  const team = data.team.find(t => t.team_id === TEAM_ID);
  const project = data.project.find(p => p.team_id === TEAM_ID);
  const github = data.github.find(g => g.team_id === TEAM_ID);
  const feedback = data.feedback.filter(f => f.team_id === TEAM_ID);

  renderTeam(team);
  renderProject(project);
  renderGitHub(github);
  renderFeedback(feedback);
  renderLeaderboard(data.leaderboard);
});
