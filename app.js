const express = require("express");
const etudiantsRouter = require("./routes/etudiants");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API Gestion des notes étudiants",
    version: "1.0.0",
    status: "ok",
  });
});

app.use("/api/etudiants", etudiantsRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

module.exports = app;
