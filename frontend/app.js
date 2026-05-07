// ============================================================
// GestiNotes — app.js
// Gestion complète des étudiants via l'API Node.js/Express
//
// Routes consommées :
//   GET    /api/etudiants         → liste tous les étudiants
//   GET    /api/etudiants/:id     → détails + moyenne + mention
//   POST   /api/etudiants         → créer un étudiant
//   PUT    /api/etudiants/:id/notes → ajouter une note
//   DELETE /api/etudiants/:id     → supprimer un étudiant
// ============================================================

// ── Configuration ──────────────────────────────────────────
// En local : http://localhost:3000
// En production (EC2) : remplacer par l'IP publique de ton EC2
const API_BASE = "http://localhost:3000";

// ── État global ─────────────────────────────────────────────
let tousLesEtudiants = []; // cache local pour la recherche
let etudiantEnCours = null; // étudiant sélectionné pour ajout de note

// ════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════

function initiales(nom, prenom) {
  return ((prenom?.[0] || "") + (nom?.[0] || "")).toUpperCase() || "?";
}

function calculMoyenne(notes) {
  if (!notes || notes.length === 0) return null;
  const s = notes.reduce((a, b) => a + b, 0);
  return Math.round((s / notes.length) * 100) / 100;
}

function getMention(moy) {
  if (moy === null) return null;
  if (moy < 10) return "Insuffisant";
  if (moy < 12) return "Passable";
  if (moy < 14) return "Assez bien";
  if (moy < 16) return "Bien";
  return "Très bien";
}

function mentionClass(mention) {
  const map = {
    "Insuffisant": "m-insuffisant",
    "Passable":    "m-passable",
    "Assez bien":  "m-assez-bien",
    "Bien":        "m-bien",
    "Très bien":   "m-tres-bien",
  };
  return map[mention] || "m-aucune";
}

function moyenneClass(moy) {
  if (moy === null) return "";
  if (moy < 10) return "low";
  if (moy < 14) return "mid";
  return "high";
}

function notePillClass(note) {
  if (note < 10) return "low";
  if (note >= 14) return "high";
  return "";
}

function showToast(msg, type = "info") {
  const tc = document.getElementById("toastContainer");
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function setApiStatus(ok) {
  const el = document.getElementById("apiStatus");
  el.className = `api-status ${ok ? "ok" : "err"}`;
  el.innerHTML = `<span class="dot"></span> ${ok ? "API connectée" : "API inaccessible"}`;
}

// ════════════════════════════════════════════════════════════
// API — fonctions fetch
// ════════════════════════════════════════════════════════════

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

async function getEtudiants() {
  return apiFetch("/api/etudiants");
}

async function getEtudiant(id) {
  return apiFetch(`/api/etudiants/${id}`);
}

async function creerEtudiant(payload) {
  return apiFetch("/api/etudiants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function ajouterNote(id, note) {
  return apiFetch(`/api/etudiants/${id}/notes`, {
    method: "PUT",
    body: JSON.stringify({ note }),
  });
}

async function supprimerEtudiant(id) {
  return apiFetch(`/api/etudiants/${id}`, { method: "DELETE" });
}

// ════════════════════════════════════════════════════════════
// RENDU — tableau principal
// ════════════════════════════════════════════════════════════

function renderTableau(etudiants) {
  const tbody = document.getElementById("etudiantsBody");

  if (etudiants.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Aucun étudiant trouvé.</td></tr>`;
    return;
  }

  tbody.innerHTML = etudiants.map((e) => {
    const moy     = calculMoyenne(e.notes);
    const mention = getMention(moy);
    const admis   = moy !== null ? moy >= 10 : null;
    const avg     = moy !== null ? moy.toFixed(2) : "—";
    const mc      = moyenneClass(moy);

    const notesPills = e.notes.length > 0
      ? e.notes.map(n =>
          `<span class="note-pill ${notePillClass(n)}">${n}</span>`
        ).join("")
      : `<span class="notes-empty">Aucune note</span>`;

    const mentionHtml = mention
      ? `<span class="mention-badge ${mentionClass(mention)}">${mention}</span>`
      : `<span class="mention-badge m-aucune">—</span>`;

    const statutHtml = admis === null
      ? `<span class="statut-badge s-aucun"><span class="dot"></span>—</span>`
      : admis
        ? `<span class="statut-badge s-admis"><span class="dot"></span>Admis</span>`
        : `<span class="statut-badge s-refuse"><span class="dot"></span>Refusé</span>`;

    return `
    <tr>
      <td>
        <div class="cell-etudiant">
          <div class="avatar">${initiales(e.nom, e.prenom)}</div>
          <div>
            <div class="cell-name">${e.prenom} ${e.nom}</div>
          </div>
        </div>
      </td>
      <td><span class="cell-email">${e.email}</span></td>
      <td><div class="notes-list">${notesPills}</div></td>
      <td><span class="moyenne-val ${mc}">${avg}</span></td>
      <td>${mentionHtml}</td>
      <td>${statutHtml}</td>
      <td>
        <div class="cell-actions">
          <button class="btn btn-icon" title="Voir le détail" onclick="ouvrirDetail('${e._id}')">
            <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 9v5M10 7v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
          <button class="btn btn-icon" title="Ajouter une note" onclick="ouvrirModalNote('${e._id}', '${e.prenom} ${e.nom}')">
            <svg viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
          <button class="btn btn-icon btn-danger" title="Supprimer" onclick="confirmerSuppression('${e._id}', '${e.prenom} ${e.nom}')">
            <svg viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

function renderStats(etudiants) {
  const total = etudiants.length;
  let admisCount = 0, somme = 0, nbAvecNotes = 0;
  const aujourd = new Date().toDateString();
  let ajd = 0;

  etudiants.forEach((e) => {
    const moy = calculMoyenne(e.notes);
    if (moy !== null) { somme += moy; nbAvecNotes++; }
    if (moy !== null && moy >= 10) admisCount++;
    if (e.createdAt && new Date(e.createdAt).toDateString() === aujourd) ajd++;
  });

  const moyGen = nbAvecNotes > 0 ? (somme / nbAvecNotes).toFixed(2) : "—";

  document.getElementById("statTotal").textContent  = total;
  document.getElementById("statAdmis").textContent  = admisCount;
  document.getElementById("statMoyGen").textContent = moyGen;
  document.getElementById("statAjd").textContent    = ajd;
}

// ════════════════════════════════════════════════════════════
// CHARGEMENT PRINCIPAL
// ════════════════════════════════════════════════════════════

async function chargerEtudiants() {
  try {
    const etudiants = await getEtudiants();
    tousLesEtudiants = etudiants;
    setApiStatus(true);
    renderTableau(etudiants);
    renderStats(etudiants);
  } catch (err) {
    setApiStatus(false);
    document.getElementById("etudiantsBody").innerHTML =
      `<tr class="empty-row"><td colspan="7">Impossible de contacter l'API. Vérifie que le serveur tourne sur ${API_BASE}.</td></tr>`;
    console.error(err);
  }
}

// ════════════════════════════════════════════════════════════
// RECHERCHE
// ════════════════════════════════════════════════════════════

document.getElementById("searchInput").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) { renderTableau(tousLesEtudiants); return; }
  const filtres = tousLesEtudiants.filter((et) =>
    `${et.prenom} ${et.nom} ${et.email}`.toLowerCase().includes(q)
  );
  renderTableau(filtres);
});

// ════════════════════════════════════════════════════════════
// MODAL — Créer un étudiant
// ════════════════════════════════════════════════════════════

function ouvrirModalCreation() {
  document.getElementById("modalTitle").textContent = "Nouvel étudiant";
  document.getElementById("inputNom").value    = "";
  document.getElementById("inputPrenom").value = "";
  document.getElementById("inputEmail").value  = "";
  document.getElementById("inputNotes").value  = "";
  document.getElementById("modalError").hidden = true;
  document.getElementById("modalEtudiant").hidden = false;
}

function fermerModal() {
  document.getElementById("modalEtudiant").hidden = true;
}

async function sauvegarderEtudiant() {
  const nom    = document.getElementById("inputNom").value.trim();
  const prenom = document.getElementById("inputPrenom").value.trim();
  const email  = document.getElementById("inputEmail").value.trim();
  const notesTxt = document.getElementById("inputNotes").value.trim();
  const errEl  = document.getElementById("modalError");

  // Validation basique
  if (!nom || !prenom || !email) {
    errEl.textContent = "Nom, prénom et email sont obligatoires.";
    errEl.hidden = false;
    return;
  }

  // Parser les notes
  let notes = [];
  if (notesTxt) {
    notes = notesTxt.split(",").map((n) => parseFloat(n.trim()));
    if (notes.some(isNaN) || notes.some((n) => n < 0 || n > 20)) {
      errEl.textContent = "Les notes doivent être des nombres entre 0 et 20.";
      errEl.hidden = false;
      return;
    }
  }

  errEl.hidden = true;
  const btnSave = document.getElementById("btnSauvegarder");
  btnSave.disabled = true;
  btnSave.textContent = "Enregistrement…";

  try {
    await creerEtudiant({ nom, prenom, email, notes });
    fermerModal();
    showToast(`${prenom} ${nom} ajouté avec succès`, "success");
    await chargerEtudiants();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = "Sauvegarder";
  }
}

document.getElementById("btnNouvel").addEventListener("click", ouvrirModalCreation);
document.getElementById("btnFermerModal").addEventListener("click", fermerModal);
document.getElementById("btnAnnuler").addEventListener("click", fermerModal);
document.getElementById("btnSauvegarder").addEventListener("click", sauvegarderEtudiant);

// ════════════════════════════════════════════════════════════
// MODAL — Ajouter une note
// ════════════════════════════════════════════════════════════

function ouvrirModalNote(id, nom) {
  etudiantEnCours = id;
  document.getElementById("noteStudentName").textContent = nom;
  document.getElementById("inputNote").value = "";
  document.getElementById("noteError").hidden = true;
  document.getElementById("modalNote").hidden = false;
}

function fermerModalNote() {
  document.getElementById("modalNote").hidden = true;
  etudiantEnCours = null;
}

async function ajouterNoteHandler() {
  const noteVal = parseFloat(document.getElementById("inputNote").value);
  const errEl   = document.getElementById("noteError");

  if (isNaN(noteVal) || noteVal < 0 || noteVal > 20) {
    errEl.textContent = "Entrez un nombre valide entre 0 et 20.";
    errEl.hidden = false;
    return;
  }

  errEl.hidden = true;
  const btn = document.getElementById("btnAjouterNote");
  btn.disabled = true;

  try {
    await ajouterNote(etudiantEnCours, noteVal);
    fermerModalNote();
    showToast(`Note ${noteVal} ajoutée`, "success");
    await chargerEtudiants();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
  } finally {
    btn.disabled = false;
  }
}

document.getElementById("btnFermerNote").addEventListener("click", fermerModalNote);
document.getElementById("btnAnnulerNote").addEventListener("click", fermerModalNote);
document.getElementById("btnAjouterNote").addEventListener("click", ajouterNoteHandler);

// ════════════════════════════════════════════════════════════
// MODAL — Détail étudiant
// ════════════════════════════════════════════════════════════

async function ouvrirDetail(id) {
  try {
    const e       = await getEtudiant(id);
    const moy     = e.moyenne ?? calculMoyenne(e.notes);
    const mention = e.mention  ?? getMention(moy);
    const admis   = e.admis    ?? (moy !== null ? moy >= 10 : null);

    document.getElementById("detailNom").textContent = `${e.prenom} ${e.nom}`;

    const notesPills = e.notes.length > 0
      ? e.notes.map(n =>
          `<span class="note-pill ${notePillClass(n)}">${n}</span>`
        ).join(" ")
      : `<span class="notes-empty">Aucune note enregistrée</span>`;

    const statutHtml = admis === null
      ? `<span class="statut-badge s-aucun"><span class="dot"></span>—</span>`
      : admis
        ? `<span class="statut-badge s-admis"><span class="dot"></span>Admis</span>`
        : `<span class="statut-badge s-refuse"><span class="dot"></span>Refusé</span>`;

    document.getElementById("detailBody").innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-item-label">Moyenne</div>
          <div class="detail-item-value moyenne-val ${moyenneClass(moy)}">${moy !== null ? moy.toFixed(2) : "—"}/20</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Mention</div>
          <div style="margin-top:6px">${mention ? `<span class="mention-badge ${mentionClass(mention)}">${mention}</span>` : "—"}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Statut</div>
          <div style="margin-top:6px">${statutHtml}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Nombre de notes</div>
          <div class="detail-item-value">${e.notes.length}</div>
        </div>
      </div>
      <div class="detail-notes-section">
        <div class="detail-notes-title">Toutes les notes</div>
        <div class="notes-list">${notesPills}</div>
      </div>
      <div style="margin-top:14px;font-size:12px;color:var(--ink-3);font-family:var(--font-mono)">
        Email : ${e.email}
      </div>
    `;

    document.getElementById("modalDetail").hidden = false;
  } catch (err) {
    showToast("Impossible de charger le détail", "error");
  }
}

document.getElementById("btnFermerDetail").addEventListener("click", () => {
  document.getElementById("modalDetail").hidden = true;
});

// ════════════════════════════════════════════════════════════
// SUPPRESSION
// ════════════════════════════════════════════════════════════

async function confirmerSuppression(id, nom) {
  if (!confirm(`Supprimer ${nom} ? Cette action est irréversible.`)) return;
  try {
    await supprimerEtudiant(id);
    showToast(`${nom} supprimé`, "info");
    await chargerEtudiants();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ════════════════════════════════════════════════════════════
// FERMETURE modales au clic sur le backdrop
// ════════════════════════════════════════════════════════════

["modalEtudiant", "modalNote", "modalDetail"].forEach((id) => {
  document.getElementById(id).addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.hidden = true;
      if (id === "modalNote") etudiantEnCours = null;
    }
  });
});

// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════

chargerEtudiants();
