# mon-projet-fullstack

## Mise à jour des dépendances dépréciées

Ce projet contient un script pour mettre à jour en toute sécurité les packages dépréciés :

```bash
# Créer le dossier scripts s'il n'existe pas
mkdir -p scripts

# Exécuter le script de mise à jour
node scripts/update-dependencies.js
```

Le script effectue les opérations suivantes :

1. Sauvegarde des fichiers package.json actuels
2. Mise à jour des packages dépréciés (glob, rimraf, packages ESLint, etc.)
3. Exécution des tests pour vérifier qu'il n'y a pas de régressions
4. Restauration des fichiers en cas d'erreur

Si vous préférez mettre à jour manuellement, voici les commandes à exécuter :

```bash
# Mise à jour de glob vers la dernière version
npm uninstall glob && npm install glob@latest --save-dev

# Mise à jour de rimraf vers la dernière version
npm uninstall rimraf && npm install rimraf@latest --save-dev

# Remplacement des packages ESLint dépréciés
npm uninstall @humanwhocodes/config-array && npm install @eslint/config-array --save-dev
npm uninstall @humanwhocodes/object-schema && npm install @eslint/object-schema --save-dev

# Mise à jour d'ESLint
npm install eslint@latest --save-dev
```

### Ignorer les avertissements de dépréciation dans Docker

Pour éviter les avertissements lors de la construction des images Docker, les Dockerfiles utilisent les options `--no-fund` et `--no-deprecation` avec npm.
