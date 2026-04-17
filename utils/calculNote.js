/**
 * Utilitaire de calcul et de classification des notes.
 * Ce module est utilisé pour démontrer le pipeline CI :
 *   - Partie 2 du TP : on introduit volontairement un bug ici,
 *     on vérifie que GitHub Actions bloque la PR,
 *     puis on corrige et la PR redevient verte.
 */

/**
 * Calcule la moyenne d'un tableau de notes.
 * @param {number[]} notes - tableau de notes (entre 0 et 20)
 * @returns {number} moyenne arrondie à 2 décimales
 */
function calculerMoyenne(notes) {
  if (!Array.isArray(notes)) {
    throw new TypeError("Le paramètre doit être un tableau");
  }
  if (notes.length === 0) {
    return 0;
  }
  notes.forEach((n) => {
    if (typeof n !== "number" || Number.isNaN(n)) {
      throw new TypeError("Toutes les notes doivent être des nombres");
    }
    if (n < 0 || n > 20) {
      throw new RangeError("Les notes doivent être comprises entre 0 et 20");
    }
  });

  const somme = notes.reduce((acc, n) => acc + n, 0);
  const moyenne = somme / notes.length;
  return Math.round(moyenne * 100) / 100;
}

/**
 * Détermine la mention associée à une moyenne /20.
 */
function getMention(moyenne) {
  if (moyenne < 0 || moyenne > 20) {
    throw new RangeError("La moyenne doit être comprise entre 0 et 20");
  }
  if (moyenne < 10) return "Insuffisant";
  if (moyenne < 12) return "Passable";
  if (moyenne < 14) return "Assez bien";
  if (moyenne < 16) return "Bien";
  return "Très bien";
}

/**
 * Indique si l'étudiant est admis (moyenne >= 10).
 */
function estAdmis(moyenne) {
  return moyenne >= 10;
}

module.exports = {
  calculerMoyenne,
  getMention,
  estAdmis,
};
