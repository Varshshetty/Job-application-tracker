// ============================================================
// Pathway — Job Application Tracker
// ============================================================

const STORAGE_KEY = "pathway-applications";

const STATUSES = [
  { key: "Applied", color: "var(--applied)" },
  { key: "Interview", color: "var(--interview)" },
  { key: "Offer", color: "var(--offer)" },
  { key: "Rejected", color: "var(--rejected)" },
];

const board = document.getElementById("board");
const statsEl = document.getElementById("stats");

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const appForm = document.getElementById("appForm");
const addBtn = document.getElementById("addBtn");
const modalClose = document.getElementById("modalClose");
const deleteBtn = document.getElementById("deleteBtn");

const appIdInput = document.getElementById("appId");
const companyInput = document.getElementById("company");
const roleInput = document.getElementById("role");
const dateInput = document.getElementById("dateApplied");
const statusInput = document.getElementById("status");
const linkInput = document.getElementById("link");
const notesInput = document.getElementById("notes");

// ---------- Storage ----------

function getApplications() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveApplications(apps) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

// ---------- Modal control ----------

function openModal(app = null) {
  appForm.reset();
  if (app) {
    modalTitle.textContent = "Edit application";
    appIdInput.value = app.id;
    companyInput.value = app.company;
    roleInput.value = app.role;
    dateInput.value = app.dateApplied;
    statusInput.value = app.status;
    linkInput.value = app.link || "";
    notesInput.value = app.notes || "";
    deleteBtn.hidden = false;
  } else {
    modalTitle.textContent = "Add application";
    appIdInput.value = "";
    dateInput.value = new Date().toISOString().slice(0, 10);
    deleteBtn.hidden = true;
  }
  modalOverlay.hidden = false;
}

function closeModal() {
  modalOverlay.hidden = true;
}

addBtn.addEventListener("click", () => openModal());

document.getElementById("clearAllBtn").addEventListener("click", () => {
  if (getApplications().length === 0) return;
  const confirmed = confirm("Delete all applications? This can't be undone.");
  if (!confirmed) return;
  saveApplications([]);
  render();
});
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// ---------- Form submit (add or edit) ----------

appForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const apps = getApplications();
  const id = appIdInput.value;

  const data = {
    company: companyInput.value.trim(),
    role: roleInput.value.trim(),
    dateApplied: dateInput.value,
    status: statusInput.value,
    link: linkInput.value.trim(),
    notes: notesInput.value.trim(),
  };

  if (id) {
    const index = apps.findIndex((a) => a.id === id);
    if (index !== -1) apps[index] = { ...apps[index], ...data };
  } else {
    apps.push({ id: crypto.randomUUID(), ...data });
  }

  saveApplications(apps);
  closeModal();
  render();
});

deleteBtn.addEventListener("click", () => {
  const id = appIdInput.value;
  if (!id) return;
  const confirmed = confirm("Delete this application?");
  if (!confirmed) return;
  saveApplications(getApplications().filter((a) => a.id !== id));
  closeModal();
  render();
});

// ---------- Rendering ----------

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function truncate(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "…";
}

function renderStats(apps) {
  statsEl.innerHTML = STATUSES.map((s) => {
    const count = apps.filter((a) => a.status === s.key).length;
    return `
      <div class="stat-pill">
        <span class="stat-pill__dot" style="background:${s.color}"></span>
        <span>${s.key}</span>
        <span class="stat-pill__count">${count}</span>
      </div>
    `;
  }).join("");
}

function renderBoard(apps) {
  board.innerHTML = STATUSES.map((s) => {
    const items = apps.filter((a) => a.status === s.key);
    const cardsHTML = items.length
      ? items
          .map(
            (app) => `
        <div class="job-card" style="border-left-color:${s.color}" data-id="${app.id}">
          <div class="job-card__role">${escapeHtml(app.role)}</div>
          <div class="job-card__company">${escapeHtml(app.company)}</div>
          <div class="job-card__meta">
            <span>${formatDate(app.dateApplied)}</span>
            ${app.link ? `<a href="${app.link}" target="_blank" rel="noopener" class="job-card__link" onclick="event.stopPropagation()">Job link \u2197</a>` : ""}
          </div>
          ${app.notes ? `<div class="job-card__notes">${escapeHtml(truncate(app.notes, 60))}</div>` : ""}
        </div>
      `
          )
          .join("")
      : `<div class="column__empty">No applications yet</div>`;

    return `
      <div class="column">
        <div class="column__head">
          <span class="column__dot" style="background:${s.color}"></span>
          ${s.key}
          <span class="column__count">${items.length}</span>
        </div>
        <div class="column__list">${cardsHTML}</div>
      </div>
    `;
  }).join("");

  board.querySelectorAll(".job-card").forEach((card) => {
    card.addEventListener("click", () => {
      const app = getApplications().find((a) => a.id === card.dataset.id);
      if (app) openModal(app);
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function render() {
  const apps = getApplications();
  renderStats(apps);
  renderBoard(apps);
}

// ---------- Init ----------

render();