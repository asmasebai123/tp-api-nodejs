const mongoose = require("mongoose");

const etudiantSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
    },
    prenom: {
      type: String,
      required: [true, "Le prénom est obligatoire"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalide"],
    },
    notes: {
      type: [Number],
      default: [],
      validate: {
        validator: (arr) => arr.every((n) => n >= 0 && n <= 20),
        message: "Les notes doivent être comprises entre 0 et 20",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Etudiant", etudiantSchema);
