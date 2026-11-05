/* © 2026 Nathanael Neuville, Fitzora. Banque mobilité de la méthode (05/11/2026).
   Rotation interne de hanche active en 90/90 : mieux descendre au squat (Base coaching NN § 6.9).
   WGS (World's Greatest Stretch) : échauffement principal pour ceux qui font une fente sans douleur (§ 6.10, 05/11).
   Vidéo vérifiée par son titre YouTube le 05/11/2026 : elle montre bien l'exercice nommé. */
"use strict";

const BANQUE = [
  {n: "WGS (World's Greatest Stretch)", v: "https://youtu.be/uIFKmkvgw8w", d: "x5 / côté",
    c: "Grande fente, main opposée au sol, le coude côté jambe avant descend vers la cheville, puis ouvre ce bras vers le plafond en suivant la main des yeux. 2 sec par position."},
  {n: "Rotation thoracique en quadrupédie", v: "https://youtu.be/8cTCo4oNFA0", d: "x8 / côté",
    c: "À quatre pattes, une main derrière la tête, tourne le coude vers le plafond en suivant des yeux, le bassin ne bouge pas."},
  {n: "90/90 lift-off rotation interne", v: "https://youtu.be/C3SY7eL0WUk", d: "x10 / côté",
    c: "Assis au sol en 90/90, genou arrière collé au sol : monte la cheville arrière le plus haut possible sans pencher le buste, tiens 3 à 4 sec, redescends lentement."},
  {n: "Rotation interne de hanche assis", v: "", d: "x10 / côté",
    c: "Assis droit au bord d'une chaise, genoux à 90°, la cuisse ne bouge pas : le pied part vers l'extérieur le plus loin possible, tiens 3 sec, reviens lentement."}
];

const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
/* vidéo vérifiée d'un exercice de la banque (nom exact ou qui commence par le nom), sinon null */
function videoBanque(nom){
  const x = norm(nom); if (!x) return null;
  const e = BANQUE.find(b => b.v && (x === norm(b.n) || x.startsWith(norm(b.n))));
  return e ? e.v : null;
}

const CONSIGNES = `ÉCHAUFFEMENT PRINCIPAL : LE WGS (méthode de Nathanael)
- « WGS (World's Greatest Stretch) » (x5 / côté débutant, jusqu'à x10 / côté confirmé) est le PREMIER exercice de l'A1 de presque toutes les séances, pour tous ceux qui peuvent faire une fente sans douleur. Il ouvre la hanche, étire la fesse et fait tourner le haut du dos : pas besoin d'y ajouter une autre rotation du dos.
- Genou sensible ou douleur au genou déclarée : pas de WGS (fente) ; « Rotation thoracique en quadrupédie » à la place (ou rotation du buste assis si à genoux impossible). Épaule douloureuse : pas d'ouverture du bras. Dos sensible : version douce, fente haute sans coude au sol, nombril rentré.

MOBILITÉ ACTIVE DE HANCHE (méthode de Nathanael, pour mieux descendre au squat)
- « 90/90 lift-off rotation interne » (x10 à 12 / côté, tenir 3 à 4 sec en haut, 1 à 2 tours) : en A1 des séances jambes (squat, fentes, soulevé de terre) quand il veut descendre plus bas au squat, se dit raide des hanches ou vise force / muscle des jambes. Pas dans toutes les séances. Consigne : assis au sol en 90/90, genou arrière collé au sol, on monte la cheville arrière le plus haut possible sans pencher le buste, on tient, on redescend lentement. Pincement dans l'aine ou douleur au genou = stop.
- Genou sensible ou douleur au genou déclarée, ou ne peut pas s'asseoir au sol : JAMAIS la version au sol (elle tord le genou arrière) ; « Rotation interne de hanche assis » sur une chaise à la place (x10 / côté). Hanche douloureuse ou opérée : aucun des deux.
- Utilise ces noms EXACTS (vidéos vérifiées).`;

module.exports = {BANQUE, CONSIGNES, videoBanque};
