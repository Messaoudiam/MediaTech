/**
 * Script pour mettre à jour les packages dépréciés
 * Exécutez avec: node scripts/update-dependencies.js
 */

const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

// La liste des mises à jour à effectuer
const updates = [
  // Remplacements globaux
  {
    cmd: "npm uninstall glob && npm install glob@latest --save-dev",
    cwd: "backend",
  },
  {
    cmd: "npm uninstall rimraf && npm install rimraf@latest --save-dev",
    cwd: "backend",
  },

  // Remplacement des packages eslint dépréciés
  {
    cmd: "npm uninstall @humanwhocodes/config-array && npm install @eslint/config-array --save-dev",
    cwd: "backend",
  },
  {
    cmd: "npm uninstall @humanwhocodes/object-schema && npm install @eslint/object-schema --save-dev",
    cwd: "backend",
  },

  // Mise à jour d'ESLint
  { cmd: "npm install eslint@latest --save-dev", cwd: "backend" },

  // Test après mises à jour pour valider qu'il n'y a pas de régressions
  { cmd: "npm test -- --passWithNoTests", cwd: "backend" },
  { cmd: "npm run build", cwd: "backend" },
];

async function runUpdates() {
  console.log("=== Démarrage des mises à jour des dépendances ===");

  // Création d'une sauvegarde des fichiers package.json
  backupFile(path.join(__dirname, "../backend/package.json"));

  let success = true;

  // Exécution de chaque mise à jour
  for (const update of updates) {
    try {
      console.log(`Exécution de: ${update.cmd} dans ${update.cwd}`);

      execSync(update.cmd, {
        cwd: path.join(__dirname, "..", update.cwd),
        stdio: "inherit",
      });

      console.log("✅ Commande exécutée avec succès");
    } catch (error) {
      console.error(`❌ Erreur lors de l'exécution de: ${update.cmd}`);
      console.error(error.message);
      success = false;
      break;
    }
  }

  if (success) {
    console.log("✅ Toutes les mises à jour ont été effectuées avec succès");
  } else {
    console.log(
      "⚠️ Des erreurs sont survenues - restauration des fichiers de sauvegarde"
    );
    restoreBackup(
      path.join(__dirname, "../backend/package.json.bak"),
      path.join(__dirname, "../backend/package.json")
    );
  }
}

function backupFile(filePath) {
  const backupPath = `${filePath}.bak`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`Sauvegarde créée: ${backupPath}`);
}

function restoreBackup(backupPath, originalPath) {
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, originalPath);
    console.log(`Fichier restauré: ${originalPath}`);
  }
}

// Exécution du script
runUpdates().catch((err) => {
  console.error("Erreur non gérée:", err);
  process.exit(1);
});
