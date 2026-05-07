const express = require("express");
const path    = require("path");
const etudiantsRouter = require("./routes/etudiants");

const app = express();

// ── CORS ──────────────────────────────────────────────────
// Permet au frontend (même servi sur un autre port ou domaine)
// d'appeler l'API sans être bloqué par le navigateur.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// ── Frontend statique ─────────────────────────────────────
// Sert les fichiers HTML/CSS/JS du dossier frontend/
// Accessible sur http://<serveur>/ → ouvre index.html
app.use(express.static(path.join(__dirname, "frontend")));

// ── API Routes ────────────────────────────────────────────
app.use("/api/etudiants", etudiantsRouter);

// ── Santé de l'API ────────────────────────────────────────
app.get("/api", (req, res) => {
  res.json({
    message: "API Gestion des notes étudiants",
    version: "1.0.0",
    status:  "ok",
  });
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

module.exports = app;
