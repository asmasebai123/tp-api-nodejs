const express = require("express");
const Etudiant = require("../models/Etudiant");
const { calculerMoyenne, getMention, estAdmis } = require("../utils/calculNote");

const router = express.Router();

// GET /api/etudiants - Liste tous les étudiants
router.get("/", async (req, res) => {
  try {
    const etudiants = await Etudiant.find();
    res.json(etudiants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/etudiants/:id - Détails + moyenne + mention
router.get("/:id", async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.params.id);
    if (!etudiant) {
      return res.status(404).json({ error: "Étudiant non trouvé" });
    }
    const moyenne = calculerMoyenne(etudiant.notes);
    res.json({
      ...etudiant.toObject(),
      moyenne,
      mention: getMention(moyenne),
      admis: estAdmis(moyenne),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/etudiants - Créer un étudiant
router.post("/", async (req, res) => {
  try {
    const etudiant = await Etudiant.create(req.body);
    res.status(201).json(etudiant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/etudiants/:id/notes - Ajouter une note
router.put("/:id/notes", async (req, res) => {
  try {
    const { note } = req.body;
    if (typeof note !== "number" || note < 0 || note > 20) {
      return res
        .status(400)
        .json({ error: "La note doit être un nombre entre 0 et 20" });
    }
    const etudiant = await Etudiant.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: note } },
      { new: true, runValidators: true }
    );
    if (!etudiant) {
      return res.status(404).json({ error: "Étudiant non trouvé" });
    }
    res.json(etudiant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/etudiants/:id
router.delete("/:id", async (req, res) => {
  try {
    const etudiant = await Etudiant.findByIdAndDelete(req.params.id);
    if (!etudiant) {
      return res.status(404).json({ error: "Étudiant non trouvé" });
    }
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
