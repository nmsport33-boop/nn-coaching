# NN Coaching

Appli web de coaching privé de Nathanael : réservation des créneaux, séances A1/A2/B1/B2/FIN, coches, ressenti, notes et macro-cycle par adhérent.

- `index.html` : toute l'appli (HTML, CSS, JS), Firebase compat 10.12.2 depuis gstatic.
- `config.js` : configuration Firebase publique + adresse Gmail du coach.
- `firestore.rules` : règles de sécurité à coller dans la console Firebase (Firestore › Règles).
- Import unique des fiches existantes : fichier chiffré choisi par le coach dans l'onglet Adhérents (jamais stocké dans ce dépôt).

Le coach se connecte avec Google. Chaque adhérent ouvre son lien perso `?c=<code>` : connexion anonyme, aucun compte. Un nouveau lien depuis sa fiche révoque l'ancien.
