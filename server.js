// Point d'entrée du serveur
// Utilise connectDB() depuis database.js (fourni par le prof).

require("dotenv").config();
const connectDB = require("./database");
const app = require("./app");

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Erreur de démarrage :", err.message);
    process.exit(1);
  }
})();
