/* © 2026 Nathanael Neuville, Fitzora. Disciplines en plus (04/11/2026) : Animal Flow, Pilates, pliométrie.
   Proposées seulement à ceux qui les demandent (note {type:"disciplines"}), et seulement si la place, le sol et la santé le permettent.
   Chaque vidéo a été vérifiée par son titre YouTube le 04/11/2026 : elle montre bien l'exercice nommé. */
"use strict";

const BANQUE = {
  animalflow: [
    {n: "Beast hold (la bête)", v: "https://youtu.be/sXvcySEHSKw", d: "20 à 30 sec", c: "À quatre pattes, genoux 2 cm au-dessus du sol, dos plat, on respire."},
    {n: "Beast reach", v: "https://youtu.be/g0fW8F9CSis", d: "x6 / côté", c: "Depuis la bête, une main touche l'épaule opposée sans bouger les hanches."},
    {n: "Loaded beast", v: "https://youtu.be/wCWspd4ThkE", d: "x8", c: "Depuis la bête, les fesses reculent vers les talons, puis on revient, dos long."},
    {n: "Crab reach", v: "https://youtu.be/UEZxSZWRiUE", d: "x5 / côté", c: "Assis, mains derrière, on pousse les hanches en haut et un bras passe au-dessus de la tête."},
    {n: "Side kick through", v: "https://youtu.be/W2O96qH7cgU", d: "x6 / côté", c: "Depuis la bête, une jambe passe sous le corps, l'autre main se lève, puis on revient."},
    {n: "Underswitch", v: "https://youtu.be/4trbWiJJ3IE", d: "x6 / côté", c: "Passage de la bête au crabe en pivotant sur un pied et une main, sans à-coup."},
    {n: "Scorpion reach", v: "https://youtu.be/GjyjSeRs2N4", d: "x5 / côté", c: "Depuis la bête, une jambe passe en arrière et en diagonale par-dessus l'autre, hanche ouverte."},
    {n: "Traveling ape", v: "https://youtu.be/_rDJDMQscPU", d: "4 allers-retours", c: "Accroupi, mains au sol sur le côté, on transfère le poids et les pieds suivent. 2 m de place."},
    {n: "Crab hold (le crabe)", v: "https://youtu.be/cwwmexzJE28", d: "20 à 30 sec", c: "Assis, mains derrière, doigts vers l'extérieur, fesses 2 cm au-dessus du sol, épaules basses."},
    {n: "Slow beast crawl", v: "https://youtu.be/yC6FLtKWuQI", d: "4 allers-retours", c: "Quatre pattes rasant le sol, main et pied opposés avancent ensemble, lentement, dos immobile."},
    {n: "Crab walk", v: "https://youtu.be/Dnxyr6moxbI", d: "4 allers-retours", c: "En crabe, main et pied opposés avancent, hanches hautes."},
    {n: "Lateral ape", v: "https://youtu.be/iWyQACRxATU", d: "4 allers-retours", c: "Accroupi profond, mains posées sur le côté, on saute les pieds à côté des mains. Niveau intermédiaire."},
    {n: "Forward ape et reverse ape", v: "https://youtu.be/4-yuPz8VlOU", d: "4 allers-retours", c: "Mains devant, petit saut des pieds vers les mains, puis en marche arrière. Niveau intermédiaire.", niv: "confirme"},
    {n: "Wave unload", v: "https://youtu.be/8JVfOiNoWfQ", d: "x6", c: "Depuis la loaded beast, la poitrine glisse vers l'avant en vague jusqu'en appui, puis on recule. Niveau confirmé.", niv: "confirme"},
    {n: "Front kick through", v: "https://youtu.be/gRN2-NP4Y80", d: "x6 / côté", c: "Depuis la bête, une jambe passe en avant sous le corps et se tend, le bras opposé se lève. Niveau confirmé.", niv: "confirme"},
    {n: "Full scorpion", v: "https://youtu.be/PV2PbFYVXZo", d: "x4 / côté", c: "Scorpion reach complet : la jambe passe loin par-dessus, le pied se pose de l'autre côté, poitrine ouverte. Niveau confirmé, très souple.", niv: "confirme"},
    {n: "Flow side kick through + crab reach", v: "https://youtu.be/Y9qwIZBGxp0", d: "1 à 2 min", c: "Enchaînement continu : bête, side kick through, crab reach, retour, de l'autre côté. Fluide, respiration régulière.", niv: "confirme"}
  ],
  pilates: [
    {n: "Hundred (le cent)", v: "https://youtu.be/cXxQB5ed4Xw", d: "1 min", c: "Allongé, tête et épaules levées, bras qui battent : 5 temps d'inspiration, 5 d'expiration. Pieds au sol ou genoux pliés pour débuter."},
    {n: "Roll up adapté", v: "https://youtu.be/KFJJfam7rzU", d: "x6", c: "Enroulé vertèbre par vertèbre, genoux pliés ou serviette derrière les cuisses. Pas pour un dos sensible."},
    {n: "Single leg stretch", v: "https://youtu.be/WFlYPWw3kQc", d: "x8 / jambe", c: "Allongé, tête levée, un genou vers la poitrine pendant que l'autre jambe s'allonge, bas du dos posé."},
    {n: "Leg circles", v: "https://youtu.be/xW8CKliDRdQ", d: "x6 / sens / jambe", c: "Allongé, une jambe en l'air dessine un petit cercle, le bassin ne bouge pas."},
    {n: "Shoulder bridge", v: "https://youtu.be/ZVMS9kgU2do", d: "x8", c: "Pont fessier en déroulant la colonne, bassin stable, on redescend lentement."},
    {n: "Swimming", v: "https://youtu.be/N8v41bBJ1tU", d: "30 sec", c: "Sur le ventre, bras et jambes opposés se lèvent en petits battements, nuque longue."},
    {n: "Side kick series", v: "https://youtu.be/nSw9GyK9YRM", d: "x10 / côté", c: "Allongé sur le côté, la jambe du dessus avance et recule sans que le buste bouge."},
    {n: "Spine stretch forward", v: "https://youtu.be/LJlMdJlAcac", d: "x5", c: "Assis jambes écartées, on enroule le dos vers l'avant en expirant, puis on se redresse."}
  ],
  plyo: [
    {n: "Snap down (apprendre à atterrir)", v: "https://youtu.be/WjssoRn7GcU", d: "x5", c: "Sur la pointe, on descend vite en position d'atterrissage : genoux dans l'axe des pieds, réception silencieuse. Toujours en premier."},
    {n: "Pogo hops", v: "https://youtu.be/c2LBofIzUqs", d: "2 x 15 sec", c: "Petits rebonds sur l'avant du pied, genoux presque tendus, rapides et silencieux."},
    {n: "Squat jump", v: "https://youtu.be/tZSYZdtbONc", d: "x5", c: "Squat puis saut vertical, réception souple dans le squat, on se stabilise 2 sec entre chaque."},
    {n: "Skater (sauts latéraux)", v: "https://youtu.be/usZgF8TBWcA", d: "x5 / côté", c: "Saut sur le côté d'un pied sur l'autre, on tient la réception 1 sec, genou dans l'axe."},
    {n: "Broad jump (saut en longueur)", v: "https://youtu.be/GR5JVcHHS_Q", d: "x4", c: "Saut en avant à deux pieds, on se réceptionne et on tient 2 sec avant de revenir en marchant."},
    {n: "Box jump bas", v: "https://youtu.be/v9cZQqGX1Xk", d: "x5", c: "Saut sur une marche ou une caisse basse et stable (30 cm max), on redescend en marchant, jamais en sautant."},
    {n: "Jump lunge (fentes sautées)", v: "https://youtu.be/_5kDxC0flg0", d: "x4 / jambe", c: "Niveau confirmé seulement. Fente, saut, changement de jambe en l'air, réception amortie."},
    {n: "Pompe pliométrique", v: "https://youtu.be/GR0ZL7f7u18", d: "x5", c: "Pompe explosive, les mains décollent. Sur les genoux ou mains sur un banc pour commencer. Pas si poignet ou épaule sensible."}
  ]
};

const NOMS = {animalflow: "Animal Flow", pilates: "Pilates", plyo: "Pliométrie"};

/* vidéo vérifiée d'un exercice de la banque (comparaison souple du nom), sinon null */
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
const INDEX = Object.values(BANQUE).flat().map(e => [norm(e.n), e.v]).sort((a, b) => b[0].length - a[0].length);
function videoBanque(nom){
  const x = norm(nom); if (!x) return null;
  const e = INDEX.find(([k]) => x === k || x.startsWith(k + " ") || x.includes(" " + k + " ") || x.endsWith(" " + k) || x.startsWith(k));
  return e ? e[1] : null;
}

const CONSIGNES = `DISCIPLINES EN PLUS : ANIMAL FLOW, PILATES, PLIOMÉTRIE (seulement si la note « Disciplines en plus souhaitées » les demande)
- Tu les intègres SEULEMENT pour celles qu'il a choisies et que l'appli a jugées possibles (« possible » ou « possible, adapté ») ; « pas possible » = tu n'en mets pas, même s'il insiste, et le mot du cycle explique pourquoi en une phrase.
- Place et sol : Animal Flow et pliométrie demandent environ 2 m × 2 m dégagés. Pas de sauts sur carrelage ou béton (herbe, tapis épais ou sol de salle). Pilates : un tapis ou une serviette épaisse.
- Dose : 1 à 2 fois par semaine, 8 à 15 min, jamais deux séances pliométriques à moins de 48 h. Animal Flow : en A1 (mobilité) ou en circuit B court, 20 à 40 sec par mouvement. Pilates : en A2 (activation du centre) ou en FIN, lent, contrôlé, respiration. Pliométrie : TOUJOURS en début de séance après l'échauffement (bloc B1, avant la fatigue), 40 à 80 appuis au total pour un débutant, repos 60 à 90 sec, qualité avant quantité : on arrête dès que la réception devient bruyante ou que les genoux rentrent.
- Progression de la pliométrie : snap down et pogo hops d'abord (semaines 1-2), puis squat jump, skater, broad jump, box jump bas (semaines 3-4), jump lunge et pompe pliométrique seulement pour un niveau confirmé.
- Sécurité : aucun saut si douleur ou fragilité au genou, à la cheville, à la hanche ou au dos, grossesse ou accouchement de moins d'un an, opération de moins d'un an, problème cardiaque, tension ou malaise. Poignet ou épaule sensible : Animal Flow sur les poings ou mains surélevées, pas de pompe pliométrique. Dos sensible : Pilates sans enroulé complet (pas de roll up).
- Profil arts martiaux, capoeira, judo, lutte, gym, danse, yoga ou bonne souplesse (questionnaire : sports pratiqués, autre) ET Animal Flow choisi : l'Animal Flow devient un fil rouge du cycle : dans presque chaque séance en A1 (5 min), plus un bloc « Flow » de 8 à 10 min 2 fois par semaine (B3 ou FIN). Semaine 1 : formes de base (bête, crabe, singe) et traveling forms ; dès la semaine 2 : mouvements notés « niveau confirmé » et enchaînements (flow side kick through + crab reach), en gardant la qualité. Le mot du cycle le dit.
- Profil arts martiaux, capoeira, gym, danse ou yoga SANS Animal Flow choisi : n'en mets pas, mais le mot du cycle peut lui suggérer d'essayer (carte « Animal Flow, Pilates, pliométrie ? » dans Séances).
- Utilise les noms EXACTS de la banque ci-dessous (ils ont une vidéo vérifiée) ; dose et consigne adaptées à son niveau :
${Object.entries(BANQUE).map(([k, L]) => `  ${NOMS[k]} : ${L.map(e => `« ${e.n} » (${e.d})`).join(", ")}`).join("\n")}`;

/* dernière note disciplines → une ligne pour la demande au modèle */
function ligne(notes){
  const n = (notes || []).filter(x => x.type === "disciplines").sort((a, b) => (a.at || 0) - (b.at || 0)).pop();
  if (!n || !n.texte) return "";
  return "DISCIPLINES EN PLUS : " + String(n.texte).slice(0, 600);
}

module.exports = {BANQUE, NOMS, CONSIGNES, videoBanque, ligne};
