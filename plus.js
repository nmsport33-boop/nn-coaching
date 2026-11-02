/* © 2026 Nathanael Neuville, NN Coaching. Tous droits réservés.
   « Plus » (02/11/2026) : intro pas à pas au premier lancement, accueil « Aujourd'hui », Nutrition,
   Corps (bonhomme musclé, forme du jour, mensurations, photos), question au coach.
   Chargé après le script principal de index.html : il remplace view(), renderTabs(), act(), fiche() en les enveloppant.
   Données de l'adhérent (sans toucher aux règles) : des notes typées, sans « texte » (donc pas d'alerte SMS) :
     notes/j-AAAA-MM-JJ {type:"jour", date, repas:[{id,r,n,kcal,p,g,l}], eau, forme:{sommeil,energie,courbatures,moral,score,at}}
     notes/m-<horodatage> {type:"mesure", date, poids, zones:{cou,epaules,poitrine,bras,taille,hanches,cuisse,mollet}}
     notes/profil {type:"profil", sexe, naissance, taille, poids, quotidien, but, poidsVise, rythmePoids}
   Photos : members/<id>/photos/<id> {at, date, vue, img} (règle à coller une fois, voir firestore.rules).
   Cibles réglées par le coach : members/<id>.nutrition {kcal, p, g, l, mot}. */
(function(){
"use strict";
const P = {seg: "muscles", vue: "face", muscle: null, periode: "faites", nutDay: null, photos: null, photosErr: null, sheet: null, wz: null, introLater: false};
const DATA_TYPES = ["jour", "mesure", "profil"];
window.NN_DATA_TYPES = DATA_TYPES;
const today = () => iso(new Date());
const num = v => { const n = Number(String(v ?? "").replace(",", ".")); return isFinite(n) ? n : 0; };
const r0 = n => Math.round(n), r10 = n => Math.round(n / 10) * 10;
const fr = (n, d = 0) => Number(n || 0).toLocaleString("fr-FR", {maximumFractionDigits: d, minimumFractionDigits: 0});
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const memberUI = () => S.mode === "ready" && !isCoachUI() && !!S.cur.member;
const lundi = (d = new Date()) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const JOURS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

/* ================= données ================= */
const notesType = t => S.cur.notes.filter(n => n.type === t);
const jourDoc = date => S.cur.notes.find(n => n.id === "j-" + date) || null;
const mesures = () => notesType("mesure").slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.at - b.at);
function profil(){
  const obj = notesType("objectifs").pop()?.reponses || {}, pr = S.cur.notes.find(n => n.id === "profil") || {};
  const ms = mesures().filter(x => x.poids), lastP = ms.length ? ms[ms.length - 1].poids : null;
  const naissance = pr.naissance || obj.naissance || "";
  let age = obj.age || null;
  if (naissance) { const b = parseIso(naissance), n = new Date(); age = n.getFullYear() - b.getFullYear() - ((n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) ? 1 : 0); }
  const buts = obj.buts || [];
  const but = pr.but || (buts.includes("Perdre du poids") && (buts.includes("Prendre du muscle") || buts.includes("Prendre des fessiers")) ? "recompo"
    : buts.includes("Perdre du poids") ? "perte" : (buts.includes("Prendre du muscle") || buts.includes("Prendre des fessiers")) ? "prise" : buts.length ? "maintien" : "");
  return {sexe: pr.sexe || obj.sexe || "", naissance, age, taille: pr.taille || obj.taille || null, poids: lastP || pr.poids || obj.poids || null, poidsDepart: pr.poids || obj.poids || null,
    quotidien: pr.quotidien || obj.quotidien || "", but, poidsVise: pr.poidsVise || obj.poidsVise || null, rythmePoids: pr.rythmePoids || obj.rythmePoids || "modere",
    seances: Number(obj.rythme) || Number(String(S.cur.member?.cycle?.rythme || "").match(/\d/)?.[0]) || 2, principal: obj.principal || buts[0] || "", buts, at: pr.at || 0};
}
const profilOk = p => !!(p.sexe && p.age && p.taille && p.poids);
/* cibles du jour : calcul (Mifflin-St Jeor) sauf si Nathanael a réglé les chiffres dans la fiche */
const FQ = {assis: 1.3, debout: 1.45, physique: 1.6};
const ADJ = {perte: {modere: -.18, leger: -.1}, prise: {modere: .1, leger: .05}, recompo: {modere: -.07, leger: -.04}, maintien: {modere: 0, leger: 0}};
function depense(p){
  const bmr = 10 * p.poids + 6.25 * p.taille - 5 * p.age + (p.sexe === "F" ? -161 : 5);
  return {bmr, quot: bmr * ((FQ[p.quotidien] || 1.35) - 1), seance: 5 * p.poids * 1.0};   /* une séance d'1 h de renfo ≈ 5 MET */
}
function cibles(p, m){
  m = m || S.cur.member || {};
  const c = m.nutrition;
  if (c && Number(c.kcal) > 0) return {kcal: Number(c.kcal), p: Number(c.p) || 0, g: Number(c.g) || 0, l: Number(c.l) || 0, coach: true, mot: c.mot || ""};
  if (!profilOk(p)) return null;
  const e = depense(p), tdee = e.bmr + e.quot + e.seance * p.seances / 7;
  let adj = (ADJ[p.but] || ADJ.maintien)[p.rythmePoids === "leger" ? "leger" : "modere"];
  const mineur = p.age < 18; if (mineur) adj = Math.max(0, Math.min(adj, .05));
  let kcal = r10(tdee * (1 + adj)); kcal = Math.max(kcal, r10(e.bmr * 1.05), p.sexe === "F" ? 1300 : 1600);
  const h = p.taille / 100, pRef = Math.min(p.poids, 27 * h * h);
  const prot = r0(pRef * ({perte: 2, recompo: 2, prise: 1.8}[p.but] || 1.6));
  const lip = r0(Math.max(pRef * .9, kcal * .25 / 9));
  const glu = Math.max(0, r0((kcal - prot * 4 - lip * 9) / 4));
  return {kcal, p: prot, g: glu, l: lip, coach: false, mineur, bmr: r10(e.bmr), tdee: r10(tdee)};
}
const totJour = j => (j?.repas || []).reduce((t, x) => ({kcal: t.kcal + num(x.kcal), p: t.p + num(x.p), g: t.g + num(x.g), l: t.l + num(x.l)}), {kcal: 0, p: 0, g: 0, l: 0});
async function saveJour(date, patch){
  const ex = jourDoc(date), mid = memberId();
  const doc = {...patch, type: "jour", auteur: "adherent", seance: null, date, at: ex?.at || Date.now()};
  return run(S.db.doc(`members/${mid}/notes/j-${date}`).set(doc, {merge: true}));
}
async function saveProfil(patch){
  const ex = S.cur.notes.find(n => n.id === "profil");
  return run(S.db.doc(`members/${memberId()}/notes/profil`).set({...patch, type: "profil", auteur: "adherent", seance: null, at: ex?.at || Date.now(), maj: Date.now()}, {merge: true}));
}

/* ================= muscles ================= */
const MUSCLES = {
  pecs: "Pectoraux", epaules: "Épaules", biceps: "Biceps", triceps: "Triceps", avantbras: "Avant-bras", abdos: "Abdos", obliques: "Obliques",
  quadriceps: "Quadriceps", adducteurs: "Adducteurs", mollets: "Mollets", trapezes: "Trapèzes", dorsaux: "Dorsaux", lombaires: "Lombaires",
  fessiers: "Fessiers", ischios: "Ischios"};
const FACE = ["pecs","epaules","biceps","avantbras","abdos","obliques","quadriceps","adducteurs","mollets","trapezes"];
const DOS = ["trapezes","epaules","dorsaux","triceps","avantbras","lombaires","fessiers","ischios","mollets"];
/* mots-clés → muscles (1 = muscle principal, 0,5 = il aide). Le premier qui correspond gagne. */
const SKIP = /etirement|stretch|massage|rouleau|respiration|posture de l'enfant|child's pose|chat-vache|cat-camel|open book|rotation du buste|rotation thoracique|rotation du dos|balancier|rentre du menton|lumbar|90\/90|shin box|dragon|wgs|world's greatest|pnf|sleeper|series legeres|equilibre|montees de genoux|step jacks|jumping|marche (sur|inclinee)|velo|elliptique|rameur|course|corde a sauter/;
const MAP = [
  [/leg curl|curl ischio|nordic|pont ischios/, {ischios: 1}],
  [/souleve de terre roumain|roumain|rdl|good morning/, {ischios: 1, fessiers: .7, lombaires: .5}],
  [/souleve de terre|deadlift/, {fessiers: 1, ischios: .6, quadriceps: .5, lombaires: .5, adducteurs: .3}],
  [/hip thrust|pont fessier|glute|frog pump|kickback|fire hydrant|clamshell|abduction|monster walk|hip raise|cook/, {fessiers: 1, ischios: .3}],
  [/fente bulgare|bulgare/, {quadriceps: 1, fessiers: 1, adducteurs: .3}],
  [/fente|lunge|step-up|step-down|step up|montee|marche basse/, {quadriceps: 1, fessiers: .7}],
  [/squat|chaise|assis-debout|leg extension|presse|wall sit|contraction du quadriceps/, {quadriceps: 1, fessiers: .5, adducteurs: .3}],
  [/adducteur|copenhag|serrage/, {adducteurs: 1}],
  [/mollet|pointes de pied|tibialis|calf/, {mollets: 1}],
  [/developpe couche|developpe poitrine|developpe incline|pompe|ecarte(?!.*pull-apart)|dips|chest/, {pecs: 1, triceps: .5, epaules: .4}],
  [/developpe (militaire|epaule)|landmine|elevation|oiseau|face pull|rotation externe|y-t-w|\bw allong|pull-apart|ecarte elastique/, {epaules: 1, trapezes: .4}],
  [/rowing|tirage|traction|pull-down|pulldown|pull over|tirage/, {dorsaux: 1, biceps: .5, trapezes: .3}],
  [/superman|extension (du )?dos|lombaire|bird dog/, {lombaires: 1, fessiers: .3}],
  [/curl|biceps/, {biceps: 1, avantbras: .3}],
  [/triceps|barre au front|extension nuque/, {triceps: 1}],
  [/shrug|haussement/, {trapezes: 1}],
  [/fermier|farmer/, {avantbras: 1, trapezes: .5, abdos: .3}],
  [/planche laterale|pallof|oblique|rotation russe|russian/, {obliques: 1, abdos: .5}],
  [/planche|gainage|dead bug|crunch|abdo|hollow|releve de jambes|mountain|ab wheel/, {abdos: 1, obliques: .4}],
  [/shadow boxing|boxe/, {epaules: .5, abdos: .3}]
];
function musclesOf(nom){
  const n = norm(nom); if (!n || SKIP.test(n)) return null;
  for (const [re, m] of MAP) if (re.test(n)) return m;
  return null;
}
const toursOf = b => nbTours(b?.tours) || 1;
const seanceFaite = s => s.statut === "faite" || !!s.bilan?.at || !!s.ressenti?.at || Object.values(s.coches || {}).some(Boolean);
/* séries par muscle : séances faites (7 derniers jours) ou prévues (semaine en cours) */
function volume(periode){
  const out = {}, last = {}, exos = {}, t0 = iso(addD(new Date(), -6)), L = lundi(), w0 = iso(L), w1 = iso(addD(L, 6));
  for (const s of allSeances()) {
    const faite = seanceFaite(s);
    if (periode === "faites" ? !(faite && s.date && s.date >= t0 && s.date <= today()) : !(s.date && s.date >= w0 && s.date <= w1)) continue;
    (s.blocs || []).forEach(b => (b.exos || []).forEach(e => { const m = musclesOf(e.n); if (!m) return;
      for (const [k, w] of Object.entries(m)) { out[k] = (out[k] || 0) + w * toursOf(b); (exos[k] ||= new Set()).add(courtNom(e.n));
        if (w >= 1 && faite && (!last[k] || s.date > last[k])) last[k] = s.date; } }));
  }
  return {sets: out, last, exos};
}
/* dernière fois qu'un muscle a travaillé (toutes séances faites) */
function dernierTravail(){
  const last = {};
  for (const s of allSeances()) { if (!seanceFaite(s) || !s.date) continue;
    (s.blocs || []).forEach(b => (b.exos || []).forEach(e => { const m = musclesOf(e.n); if (!m) return;
      for (const [k, w] of Object.entries(m)) if (w >= 1 && (!last[k] || s.date > last[k])) last[k] = s.date; })); }
  return last;
}
const courtNom = n => String(n || "").split(/[(,]/)[0].trim();
const couleurSeries = n => n <= 0 ? null : n < 4 ? "var(--px-c1)" : n < 8 ? "var(--px-c2)" : n < 12 ? "var(--px-c3)" : "var(--px-c4)";
/* zones à ménager : douleurs signalées (questionnaire objectifs, bilans récents) */
function zonesSensibles(){
  const z = new Set(), lim = iso(addD(new Date(), -21));
  const obj = notesType("objectifs").pop()?.reponses; const txt = norm((obj?.douleurs || "") + " " + (obj?.santeDetail || ""));
  const T = [["Genou gauche", /genou g/], ["Genou droit", /genou d/], ["Épaule gauche", /epaule g/], ["Épaule droite", /epaule d/], ["Bas du dos", /bas du dos|lombaire|hernie/], ["Nuque / haut du dos", /nuque|cervical|torticolis/], ["Hanche", /hanche/], ["Cheville / pied", /cheville|pied/], ["Poignet / coude", /poignet|coude/]];
  for (const [k, re] of T) if (re.test(txt)) z.add(k);
  if (/genou/.test(txt) && !/genou [gd]/.test(txt)) z.add("Genou gauche");
  for (const s of allSeances()) for (const x of [s.bilan, s.avant]) if (x?.douleur === "oui" && (s.date || "") >= lim) (x.zones || []).forEach(v => z.add(v));
  return [...z].filter(v => v !== "Autre");
}

/* ================= le corps (dessin NN Coaching, vue de face / de dos) =================
   Planche anatomique : silhouette à contour lumineux, chaque muscle en plusieurs faisceaux séparés,
   modelé par un dégradé. Moitié gauche de l'écran dessinée, l'autre en miroir. viewBox 0 0 200 400. */
const rr = (x1, y1, x2, y2, r) => `M${x1 + r},${y1} L${x2 - r},${y1} Q${x2},${y1} ${x2},${y1 + r} L${x2},${y2 - r} Q${x2},${y2} ${x2 - r},${y2} L${x1 + r},${y2} Q${x1},${y2} ${x1},${y2 - r} L${x1},${y1 + r} Q${x1},${y1} ${x1 + r},${y1} Z`;
const BRAS = {
  avantbras: ["M50,148 C46,158 44.5,170 44,182 C44,187 45,191 47,194 L51,194 C52,180 54,165 56.5,150 C54.5,148 52,147 50,148 Z",
              "M58,149 C56,163 54,178 53,194 L57,194 C60,180 63,165 64,151 C62,149 60,148 58,149 Z"]};
const HALF = {
  face: {
    trapezes: ["M90,53 C89,60 84,66 72,70 C80,72 88,72 94,71 C95,65 94,59 92,53 Z", "M92.5,48 C94.5,56 97,64 99,72 L96.5,72 C94.5,65 92.5,58 91.5,50 Z"],
    epaules: ["M74,72 C67,73 62,78 60,86 C59,92 60,98 63,104 C66,97 70,92 76,89 C78,83 78,77 74,72 Z",
              "M71,71 C60,70 52,78 50.5,90 C50,98 51.5,105 55.5,110 C57,101 58,93 59.5,86 C61.5,79 65.5,74 71,71 Z"],
    pecs: ["M98.5,74 L79,73.5 C76,76 75.5,80 76.5,85 C84,84 91,85 98.5,88 Z",
           "M98.5,90 C90,87 83,86 77,87.5 C74.5,93 74.5,99 77,104 C82,110 90,112 98.5,110 Z"],
    biceps: ["M57,106 C52,114 50.5,124 51,134 C51.5,141 55,146 60,146 C65,141 67,129 67.5,116 C66,110 62,106 57,106 Z"],
    ...BRAS,
    obliques: ["M76,106 L82.5,108 L81.5,113 L75,112 Z", "M75,114.5 L82.5,116.5 L81.5,121.5 L75,120.5 Z", "M75.5,123 L82.5,125 L81.5,130 L76,129 Z",
               "M76.5,132 C75.5,143 77,154 80.5,164 C82.5,169 85,172 88.5,174 C86.5,158 85.5,144 85.5,131 C82.5,130 79.5,131 76.5,132 Z"],
    abdos: [rr(88, 112, 98.5, 125, 3), rr(87.5, 127, 98.5, 140, 3), rr(87.5, 142, 98.5, 155, 3), "M98.5,157 L88.5,157 C88.5,166 92,174 98.5,180 Z"],
    quadriceps: ["M75,186 C70,204 68,228 69,252 C70,265 74,275 79,281 C79,262 78,240 79,216 C79,204 78,194 75,186 Z",
                 "M81,192 C86,208 89.5,230 89.5,252 C89.5,264 88,273 85.5,279 C81.5,268 80.5,250 80.5,230 C80.5,216 80.5,203 81,192 Z",
                 "M91,248 C95,256 96.5,266 94.5,276 C92.5,282 88,284 86.5,281 C88.5,271 90,260 91,248 Z"],
    adducteurs: ["M90,200 C95,206 98.5,216 98.5,230 C98.5,240 95.5,248 91,253 C91,236 90,220 87.5,206 C88,203 89,201 90,200 Z"],
    mollets: ["M74,296 C71,308 70.5,322 72,336 C73,342 75,346 77,348 C76.5,330 76.5,312 77.5,297 Z",
              "M78.5,296 C77.5,312 77.5,330 79.5,348 C80.5,356 81.5,362 82.5,366 L85,366 C85.5,346 86,326 85.5,306 C84,300 81.5,297 78.5,296 Z",
              "M87,297 C90.5,306 91.5,320 90,334 C89,342 88,348 86.5,352 C86.5,334 86.5,314 87,297 Z"]},
  dos: {
    trapezes: ["M98.5,54 C94,60 87,65 71,71 C82,74 90,80 98.5,91 Z", "M98.5,93 C92,85 85,80 76.5,77.5 C81,89 89,103 98.5,120 Z"],
    epaules: ["M70,71 C60,70 52,78 50.5,90 C50,98 51.5,105 55.5,110 C58.5,99 63.5,90 74,85 C75,79 74,74 70,71 Z"],
    dorsaux: ["M75.5,87 C71.5,93 71.5,101 75.5,107 C82,105 88,102 92.5,100 C87.5,93 82,89 75.5,87 Z",
              "M74.5,109 C74,123 77,137 83,149 C87,154 91,157 95.5,158 L95.5,122 C88.5,117 82,112 74.5,109 Z"],
    triceps: ["M55,110 C51,118 50,128 50.5,138 C51.5,144 55,147 59,146 C59,133 59,121 58.5,109 Z",
              "M60.5,107 C62.5,120 62.5,133 61,146 C64.5,145 67,138 67.5,127 C67.5,117 65.5,110 60.5,107 Z"],
    ...BRAS,
    obliques: ["M83.5,150 C80.5,157 80,165 81,172 L91,173 C90,165 88.5,158 87,153 Z"],
    lombaires: ["M98.5,120 L96.5,122 L96.5,159 C94,163 92.5,167 92.5,173 L98.5,176 Z"],
    fessiers: ["M88,174 C81,175 76,180 74.5,188 C81,186 88.5,185 96.5,186 C95.5,180 93,176 88,174 Z",
               "M98.5,188 C88,187 79.5,189 74,195 C71,204 72,214 77.5,220 C84,225 92,225 98.5,222 Z"],
    ischios: ["M73,222 C69.5,238 69,256 72,272 C74,279 77,284 81,286 C82,268 83,248 84,227 C80,227 76,225 73,222 Z",
              "M85.5,227 C85.5,248 85.5,267 84.5,286 C89,286 92.5,282 94,275 C96,260 97.5,242 98,224 C94,227 89.5,228 85.5,227 Z"],
    mollets: ["M76,293 C71,303 70,318 72,331 C74,338 77,341 81,339 C82,324 82,309 81,295 Z",
              "M83,295 C84,309 84,324 83,340 C87.5,342 91,337 91.5,329 C92.5,316 91.5,303 87.5,295 Z",
              "M73,338 C74,348 76,356 78,362 L86,362 C87,354 89,346 90,338 C87,344 78,344 73,338 Z"]}
};
/* silhouette complète (moitié) : cou, épaule, bras, main, flanc, jambe, pied */
const SIL = "M90,44 C90,52 89,59 86,64 C82,67 76,69 70,70 C59,71 52,79 50,91 C49,103 49,118 50,132 L48,147 C46,160 44,174 43,188 C41,198 41,210 44,218 C47,223 53,222 55,215 C57,207 57,199 57,194 C60,180 63,164 64,150 C66,136 67,122 69,112 C71,108 73,106 74,105 C75,118 76,132 78,146 C79,156 80,163 80,168 C77,176 74,184 73,194 C69,214 67,238 69,262 C70,274 72,282 73,290 C71,304 70,320 72,338 C73,348 74,356 75,364 C72,372 69,382 70,388 C72,392 82,393 89,391 C90,384 89,374 88,366 C90,346 92,322 91,300 C91,294 92,289 93,284 C95,262 97,236 98.5,212 L100,206 L100,44 Z";
const DECO = {
  face: `<path d="M84,70 C88,72 94,73 99,73" /><path d="M91,48 C93,55 96,62 99,70"/><path d="M100,112 L100,178"/><path d="M86,170 C90,180 95,190 100,198"/>`,
  dos: `<path d="M100,60 L100,180"/><path d="M80,282 C84,286 90,286 94,283"/>`};
const TETE_D = "M100,7 C89,7 84.5,15 84.5,26 C84.5,36 88,44 94,48 L106,48 C112,44 115.5,36 115.5,26 C115.5,15 111,7 100,7 Z";
const TETE = {face: `<path d="${TETE_D}"/>`, dos: `<path d="${TETE_D}"/>`};
/* fibres (traits fins dans le sens des muscles) */
const FIB = {
  face: "M80,80 L97,84 M78,94 L97,100 M80,102 L97,106 M66,78 C62,86 60,94 61,100 M57,80 C54.5,88 54,96 55,104 M56,114 C55,124 56,134 58,142 M62,112 C63,122 63,132 62,142 M73,206 C72,226 73,248 76,268 M84.5,210 C86.5,230 87,250 86,270 M93,214 C95,226 95,236 93,246 M79,140 L84,150 M80,152 L85,162 M81.5,308 C81.5,324 81.5,340 82.5,356 M49,160 C48,170 47,180 47,188 M60,156 C59,168 58,178 56,188",
  dos: "M80,72 L96,80 M86,84 L97,100 M80,118 C82,130 86,140 92,150 M86,116 C88,128 91,140 94,152 M80,200 C86,206 92,210 97,212 M78,210 C84,216 90,218 97,218 M76,236 C76,250 77,264 79,278 M90.5,236 C90.5,250 90.5,264 89.5,278 M54.5,120 C53.5,128 53.5,136 54.5,142 M64.5,116 C65,124 65,132 64,140 M77,305 C76,315 76,325 78,333 M88,305 C89,315 89,325 87,333 M58,82 C56,90 55,98 56,104 M49,160 C48,170 47,180 47,188 M60,156 C59,168 58,178 56,188"};
const OS = {face: `<ellipse cx="82" cy="288" rx="6" ry="7"/><ellipse cx="118" cy="288" rx="6" ry="7"/>`, dos: ""};
const DEFS = `<defs><linearGradient id="pxsh" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>
  <linearGradient id="pxsil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(var(--a1r))" stop-opacity=".16"/><stop offset="1" stop-color="rgb(var(--a2r))" stop-opacity=".07"/></linearGradient></defs>`;
/* points des articulations sensibles (vue de face : la gauche de la personne est à droite de l'écran) */
const JOINTS = {
  "Genou gauche": {face: [118, 288], dos: [82, 286]}, "Genou droit": {face: [82, 288], dos: [118, 286]},
  "Épaule gauche": {face: [140, 86], dos: [60, 86]}, "Épaule droite": {face: [60, 86], dos: [140, 86]},
  "Bas du dos": {dos: [100, 162]}, "Nuque / haut du dos": {dos: [100, 60], face: [100, 58]},
  "Hanche": {face: [126, 190], dos: [126, 190]}, "Cheville / pied": {face: [121, 364], dos: [121, 362]},
  "Poignet / coude": {face: [151, 192], dos: [49, 192]}};
const MIR = `transform="translate(200,0) scale(-1,1)"`;
function bodySVG(vue, fills, o = {}){
  const half = HALF[vue], tap = !!o.tap;
  const part = (k, d, mir) => { const f = fills[k], sel = o.sel === k, m = mir ? MIR : "";
    return `<g class="px-m ${f ? "on" : ""} ${sel ? "sel" : ""}" style="${f ? `--f:${f}` : ""}" ${tap ? `data-a="px-muscle" data-v="${k}"` : ""}><path d="${d}" ${m}/><path class="px-sh" d="${d}" ${m}/></g>`; };
  const muscles = Object.entries(half).map(([k, ds]) => ds.map(d => part(k, d, false) + part(k, d, true)).join("")).join("");
  const joints = (o.joints || []).map(z => { const p = JOINTS[z]?.[vue]; return p ? `<circle class="px-j" cx="${p[0]}" cy="${p[1]}" r="9"/><circle class="px-jc" cx="${p[0]}" cy="${p[1]}" r="3.5"/>` : ""; }).join("");
  return `<svg class="px-body ${o.cls || ""}" viewBox="${o.vb || "0 0 200 400"}" role="img" aria-label="${o.label || "Corps, vue de " + (vue === "face" ? "face" : "dos")}">${DEFS}
    <g class="px-sil"><path d="${SIL}"/><path d="${SIL}" ${MIR}/>${TETE[vue]}</g><g class="px-os">${OS[vue]}</g>
    ${muscles}<g class="px-fib"><path d="${FIB[vue]}"/><path d="${FIB[vue]}" ${MIR}/></g><g class="px-deco">${DECO[vue]}<g ${MIR}>${DECO[vue]}</g></g>${o.extra || ""}${joints}</svg>`;
}
/* petit bonhomme pour une carte d'exercice */
function miniBody(nom){
  const m = musclesOf(nom) || {}, f = sum => Object.entries(m).filter(([k]) => sum.includes(k)).reduce((t, [, w]) => t + w, 0);
  const vue = f(DOS.filter(k => !FACE.includes(k))) > f(FACE.filter(k => !DOS.includes(k))) ? "dos" : "face";
  const fills = {}; for (const [k, w] of Object.entries(m)) fills[k] = w >= 1 ? "var(--px-c3)" : "var(--px-c1)";
  /* cadrage : haut du corps, bas du corps, ou les deux */
  const HAUT = ["pecs","epaules","biceps","triceps","avantbras","abdos","obliques","trapezes","dorsaux","lombaires"], ks = Object.keys(m);
  const h = ks.some(k => HAUT.includes(k)), b = ks.some(k => !HAUT.includes(k));
  const vb = h && b ? "30 40 140 270" : h ? "38 44 124 160" : b ? "48 160 104 220" : "20 0 160 400";
  return bodySVG(vue, fills, {cls: "mini", label: "Muscles travaillés", vb});
}

/* ================= petits composants ================= */
function ring(val, max, size, stroke, col, inner){
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, f = max > 0 ? Math.max(0, Math.min(1, val / max)) : 0;
  return `<svg class="px-ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(var(--ov),.1)" stroke-width="${stroke}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c * f} ${c}" transform="rotate(-90 ${size/2} ${size/2})"/>${inner || ""}</svg>`;
}
function gauge(score, label){
  const a0 = Math.PI * .85, a1 = Math.PI * 2.15, R = 80, cx = 100, cy = 100, pt = a => [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a1), f = score == null ? 0 : Math.max(0, Math.min(1, score / 100)), ak = a0 + (a1 - a0) * f, [xk, yk] = pt(ak);
  return `<svg class="px-gauge" viewBox="0 0 200 170"><defs><linearGradient id="pxg" x1="0" x2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset=".5" stop-color="#ffc83d"/><stop offset="1" stop-color="var(--a4)"/></linearGradient></defs>
    <path d="M${x0},${y0} A${R},${R} 0 1 1 ${x1},${y1}" fill="none" stroke="url(#pxg)" stroke-width="14" stroke-linecap="round" opacity="${score == null ? .25 : 1}"/>
    ${score == null ? "" : `<circle cx="${xk}" cy="${yk}" r="10" fill="#fff" stroke="rgba(0,0,0,.35)" stroke-width="3"/>`}
    <text x="100" y="${score == null ? 104 : 100}" text-anchor="middle" class="px-gv">${score == null ? "–" : score}</text><text x="100" y="128" text-anchor="middle" class="px-gl">${esc(label)}</text></svg>`;
}
const formeLbl = s => s == null ? "Pas encore noté" : s >= 80 ? "Pleine forme" : s >= 60 ? "En forme" : s >= 40 ? "Moyen" : "Fatigué·e";
const bar = (v, max, col) => `<div class="px-bar"><i style="width:${max > 0 ? Math.min(100, v / max * 100) : 0}%;background:${col}"></i></div>`;
const seg = (cur, items, act) => `<div class="px-seg">${items.map(([k, l]) => `<button class="${cur === k ? "on" : ""}" data-a="${act}" data-v="${k}">${esc(l)}</button>`).join("")}</div>`;
function askBar(){
  if (window.NN_IA) return window.NN_IA.bar();   /* assistant (ia.js) */
  return `<button class="px-ask" data-a="px-ask"><span class="px-ask-av">NN</span><span>Une question ? Écris à Nathanael</span><span class="px-ask-go">›</span></button>`;
}

/* ================= Accueil « Aujourd'hui » ================= */
function semaine(){
  const L = lundi(), t = today(), all = allSeances().filter(s => !hiddenFor(s) || isCoachUI());
  return Array.from({length: 7}, (_, i) => { const d = addD(L, i), k = iso(d), ss = all.filter(s => s.date === k);
    return {k, d, j: JOURS[i], n: d.getDate(), ss, faite: ss.some(seanceFaite), prevue: ss.length > 0, nut: (jourDoc(k)?.repas || []).length > 0, auj: k === t}; });
}
function weekStrip(onTap){
  return `<div class="px-week">${semaine().map(x => `<button class="px-day ${x.auj ? "auj" : ""} ${x.faite ? "faite" : x.prevue ? "prevue" : ""}" ${onTap ? `data-a="${onTap}" data-v="${x.k}"` : "disabled"}>
    <span class="j">${x.j}</span><span class="n">${x.n}</span><span class="o">${x.faite ? "✓" : ""}</span>${x.nut ? `<i class="nut"></i>` : ""}</button>`).join("")}</div>`;
}
function seanceCard(s){
  const exos = (s.blocs || []).flatMap(b => (b.exos || []).map(e => ({e, b}))).filter(x => x.e.n);
  const renfo = exos.filter(x => musclesOf(x.e.n) && x.b.code !== "A1");
  const series = (s.blocs || []).reduce((t, b) => t + toursOf(b) * (b.exos || []).length, 0);
  const min = s.duree || Math.max(30, Math.min(75, r10(series * 1.4 + 8)));
  const quand = s.date ? (s.date === today() ? "Aujourd'hui" : fmtLong(parseIso(s.date))) : "À programmer";
  const tiles = (renfo.length >= 3 ? renfo : exos).slice(0, 8);
  return `<div class="card px-sc ${seanceFaite(s) ? "faite" : ""}"><button class="px-sc-h" data-a="open-seance" data-v="${s.id}">
      <span class="eyebrow" style="color:var(--a1)">${esc(quand)}${esc(heureLbl(s.heure))}${seanceFaite(s) ? " · faite ✓" : ""}</span>
      <b>${esc(s.titre || "Séance " + s.num)}</b><span class="small muted">${exos.length} exercices · ${series} séries · ~${min} min · ${esc(lieuLbl(s))}</span></button>
    <div class="px-tiles">${tiles.map(({e, b}) => `<button class="px-tile" data-a="open-seance" data-v="${s.id}">${miniBody(e.n)}<b>${esc(courtNom(e.n))}</b><span>${esc(e.d || b.tours || "")}</span></button>`).join("")}</div></div>`;
}
function accueil(){
  const m = S.cur.member, p = profil(), c = cibles(p, m), jt = jourDoc(today()), tot = totJour(jt), fo = jt?.forme;
  const L = lundi(), w0 = iso(L), w1 = iso(addD(L, 6));
  const vis = seancesSorted(), cette = vis.filter(s => s.date && s.date >= w0 && s.date <= w1);
  const nx = nextSeance(vis), cartes = cette.length ? cette : nx ? [nx] : [];
  const motCoach = S.cur.notes.filter(n => n.auteur === "coach" && n.texte && !n.seance).pop();
  const h = new Date().getHours(), salut = h < 12 ? "Bonjour" : h < 18 ? "Salut" : "Bonsoir";
  const wk = semaine(), faites = wk.filter(x => x.faite).length, prevues = wk.filter(x => x.prevue).length;
  return `<section class="sec px-hello"><span class="eyebrow">${esc(fmtLong(new Date()))}</span><h2 class="px-h1">${salut} ${esc(m.prenom || "")} 👋</h2></section>
  ${objectifsCard()}${rappelBilan()}${heroAdh()}
  <section class="sec"><div class="sec-h"><h2>Ta semaine</h2><span class="small muted">${faites}/${Math.max(prevues, p.seances)} séances</span></div>
    <div class="card">${weekStrip(null)}</div>
    ${cartes.map(seanceCard).join("") || `<div class="empty">Nathanael prépare tes séances. Elles apparaîtront ici.</div>`}
    ${cette.length ? "" : `<button class="btn sm ghost" data-a="tab" data-v="reserver" style="align-self:flex-start">Programmer une séance ›</button>`}</section>
  <section class="sec"><div class="sec-h"><h2>Ta forme</h2>${fo ? `<button class="btn link sm" data-a="px-forme">Modifier</button>` : ""}</div>
    ${fo ? `<button class="card tap px-forme" data-a="tab" data-v="corps" data-seg="forme">${gauge(fo.score, formeLbl(fo.score))}<span class="small muted" style="text-align:center">${esc(formeMot(fo))}</span></button>`
      : `<button class="card tap px-forme-ask" data-a="px-forme"><span class="px-emo">🌤️</span><span><b>Comment tu te sens aujourd'hui ?</b><span class="small muted" style="display:block">15 secondes : sommeil, énergie, courbatures, moral. Nathanael adapte ta séance si besoin.</span></span><span class="px-go">›</span></button>`}</section>
  <section class="sec"><div class="sec-h"><h2>Nutrition</h2><button class="btn link sm" data-a="tab" data-v="nutrition">Ouvrir ›</button></div>
    ${c ? `<button class="card tap px-nutmini" data-a="tab" data-v="nutrition">${ring(tot.kcal, c.kcal, 92, 10, "var(--a1)", `<text x="46" y="48" text-anchor="middle" class="px-rv">${fr(tot.kcal)}</text><text x="46" y="62" text-anchor="middle" class="px-rl">/ ${fr(c.kcal)}</text>`)}
      <div class="px-macros">${macroLine("Protéines", tot.p, c.p, "var(--a3)")}${macroLine("Glucides", tot.g, c.g, "var(--a2)")}${macroLine("Lipides", tot.l, c.l, "var(--a4)")}
      ${(jt?.repas || []).length ? "" : `<span class="small muted">Rien de noté aujourd'hui · ajoute ton premier repas</span>`}</div></button>`
    : `<button class="card tap" data-a="tab" data-v="nutrition"><b>Tes calories et protéines du jour</b><span class="small muted">Réponds à 6 questions et l'appli calcule tes repères. Nathanael peut les ajuster.</span><span class="small" style="color:var(--a1);font-weight:700">Commencer ›</span></button>`}</section>
  ${trajCard(p)}
  ${motCoach ? `<section class="sec"><div class="eyebrow">Le dernier mot de Nathanael</div><div class="note coach"><div class="meta"><b style="color:var(--ink)">Coach</b><span>${esc(fmtWhen(motCoach.at))}</span></div><div class="txt">${esc(motCoach.texte)}</div></div></section>` : ""}
  <section class="sec"><div class="px-links"><button class="card tap" data-a="tab" data-v="cycle"><span class="px-li">↻</span><b>Mon cycle</b><span class="small muted">${esc(m.cycle?.nom || "Ton programme")}</span></button>
    <button class="card tap" data-a="tab" data-v="offres"><span class="px-li">◆</span><b>Offres</b><span class="small muted">Formules et options</span></button></div></section>
  ${askBar()}`;
}
const macroLine = (l, v, max, col) => `<div class="px-ml"><span>${l}</span><b>${fr(v)}<small> / ${fr(max)} g</small></b>${bar(v, max, col)}</div>`;
function formeMot(f){
  const s = f.score;
  return s >= 80 ? "Tout est au vert : séance normale, tu peux pousser." : s >= 60 ? "Bonne forme. Écoute tes sensations sur les dernières séries."
    : s >= 40 ? "Forme moyenne : garde de la marge sur les charges aujourd'hui." : "Grosse fatigue : préviens Nathanael, on allège la séance.";
}
/* objectif de poids : trajectoire */
function trajInfo(p){
  if (!p.poidsVise || !p.poids || !p.poidsDepart) return null;
  const sens = p.poidsVise > p.poidsDepart ? 1 : -1, pct = (sens > 0 ? {modere: .0025, leger: .0012} : {modere: .005, leger: .0025})[p.rythmePoids === "leger" ? "leger" : "modere"];
  const reste = Math.abs(p.poidsVise - p.poids), sem = Math.ceil(reste / (p.poids * pct));
  const fait = Math.abs(p.poids - p.poidsDepart), total = Math.abs(p.poidsVise - p.poidsDepart) || 1;
  return {sens, pct, sem, arrivee: addD(new Date(), sem * 7), f: Math.max(0, Math.min(1, (sens * (p.poids - p.poidsDepart) > 0 ? fait : 0) / total))};
}
function trajCard(p){
  const t = trajInfo(p); if (!t) return "";
  return `<section class="sec"><div class="sec-h"><h2>Ton objectif</h2><button class="btn link sm" data-a="px-mesure">Noter mon poids</button></div>
    <div class="card px-traj"><div class="px-traj-row"><div><span class="eyebrow">Aujourd'hui</span><b>${fr(p.poids, 1)} kg</b></div><span class="px-arrow">→</span><div style="text-align:right"><span class="eyebrow">Objectif</span><b>${fr(p.poidsVise, 1)} kg</b></div></div>
    ${bar(t.f, 1, "linear-gradient(90deg,var(--a2),var(--a1))")}
    <span class="small muted">${t.sem > 0 ? `Au rythme choisi (${t.sens > 0 ? "+" : "−"}${fr(t.pct * 100, 2)} % par semaine), arrivée vers le ${esc(t.arrivee.toLocaleDateString("fr-FR", {day: "numeric", month: "long"}))}.` : "Objectif atteint 🎉 Parle à Nathanael de la suite."}</span></div></section>`;
}

/* ================= Nutrition ================= */
const REPAS = [["matin", "Petit-déjeuner"], ["midi", "Déjeuner"], ["collation", "Collation"], ["soir", "Dîner"]];
/* valeurs moyennes par portion : [nom, portion, kcal, protéines, glucides, lipides] */
const ALIMENTS = [
  ["Œuf", "1 gros", 75, 6.5, .5, 5], ["Blanc de poulet", "120 g", 145, 30, 0, 2.5], ["Steak haché 5 %", "125 g", 155, 26, 0, 6], ["Steak haché 15 %", "125 g", 250, 23, 0, 17.5],
  ["Saumon", "120 g", 245, 24, 0, 16], ["Thon au naturel", "1 boîte 100 g", 115, 26, 0, 1], ["Poisson blanc", "150 g", 125, 28, 0, 1], ["Jambon blanc", "2 tranches", 90, 16, 1, 2.5],
  ["Tofu", "100 g", 125, 13, 2, 7], ["Skyr", "150 g", 95, 16, 6, .3], ["Fromage blanc 0 %", "150 g", 75, 11, 6, .3], ["Yaourt nature", "1 pot", 65, 5, 6, 2],
  ["Lait demi-écrémé", "1 bol 250 ml", 115, 8, 12, 4], ["Fromage", "30 g", 115, 7, 0, 9.5], ["Protéine en poudre (whey)", "1 dose 30 g", 120, 24, 3, 1.5],
  ["Riz cuit", "150 g", 195, 4, 42, .5], ["Pâtes cuites", "200 g", 290, 10, 58, 1.5], ["Pommes de terre", "200 g", 160, 4, 34, .2], ["Patate douce", "200 g", 170, 3, 39, .2],
  ["Flocons d'avoine", "50 g", 185, 6.5, 30, 3.5], ["Quinoa cuit", "150 g", 180, 6.5, 32, 3], ["Lentilles cuites", "150 g", 170, 13, 25, 1], ["Pois chiches cuits", "150 g", 210, 11, 30, 4],
  ["Pain (baguette)", "1 morceau 40 g", 110, 3.5, 22, .5], ["Pain complet", "1 tranche 40 g", 100, 4, 18, 1.2], ["Céréales du petit-déj", "40 g", 150, 3, 32, 1.5], ["Croissant", "1", 230, 4.5, 26, 12],
  ["Banane", "1", 105, 1.3, 24, .4], ["Pomme", "1", 80, .4, 19, .3], ["Orange", "1", 65, 1.2, 14, .2], ["Fruits rouges", "150 g", 60, 1, 11, .5], ["Compote sans sucre ajouté", "1 pot", 55, .3, 13, .1],
  ["Légumes verts", "200 g", 60, 4, 8, .6], ["Salade verte + vinaigrette", "1 bol", 90, 1, 2, 9], ["Avocat", "1/2", 120, 1.5, 1.5, 11.5],
  ["Amandes / noix", "30 g", 175, 6, 3, 15], ["Beurre de cacahuète", "1 c. à soupe", 95, 4, 2.5, 7.5], ["Huile d'olive", "1 c. à soupe", 90, 0, 0, 10], ["Beurre", "10 g", 75, 0, 0, 8.2],
  ["Confiture / miel", "1 c. à soupe", 50, 0, 12, 0], ["Chocolat noir", "2 carreaux", 110, 2, 7, 8.5], ["Biscuits", "3", 140, 2, 20, 6], ["Barre de céréales", "1", 100, 1.5, 16, 3], ["Houmous", "2 c. à soupe", 90, 2.5, 4, 7],
  ["Sandwich jambon-beurre", "1", 400, 18, 45, 15], ["Pizza", "1/2", 450, 18, 52, 18], ["Burger", "1", 500, 25, 40, 25], ["Frites", "1 portion", 340, 4, 42, 17], ["Kebab", "1", 650, 30, 65, 28],
  ["Café au lait / cappuccino", "1 tasse", 80, 4, 6, 4], ["Jus d'orange", "1 verre 25 cl", 110, 1.5, 25, .3], ["Soda", "1 canette", 140, 0, 35, 0], ["Bière", "25 cl", 105, 1, 9, 0], ["Vin", "1 verre", 85, 0, 2.5, 0]
];
function nutrition(){
  const m = S.cur.member, p = profil();
  if (!profilOk(p) && !(m.nutrition?.kcal > 0)) return `<section class="sec"><h2>Nutrition</h2>
    <div class="card px-intro-card"><span class="px-emo">🍽️</span><b>Tes repères de la journée</b>
      <span class="small muted">6 questions rapides (taille, poids, ton quotidien, ton objectif) et l'appli calcule tes calories et tes protéines. Nathanael les voit et peut les ajuster pour toi.</span>
      <button class="btn solid" data-a="px-wz" data-v="nutrition">C'est parti</button></div></section>${askBar()}`;
  const c = cibles(p, m), day = P.nutDay || today(), j = jourDoc(day), tot = totJour(j), reste = c.kcal - tot.kcal;
  const L = lundi(parseIso(day));
  const days = Array.from({length: 7}, (_, i) => { const d = addD(L, i), k = iso(d), t = totJour(jourDoc(k));
    return `<button class="px-nd ${k === day ? "on" : ""}" data-a="px-nday" data-v="${k}"><span>${JOURS[i][0]}</span>${ring(t.kcal, c.kcal, 40, 4, t.kcal > c.kcal * 1.1 ? "var(--warn)" : "var(--a1)", `<text x="20" y="24" text-anchor="middle" class="px-ndn">${d.getDate()}</text>`)}</button>`; }).join("");
  const e = profilOk(p) ? depense(p) : null, sport = allSeances().some(s => s.date === day) ? e?.seance || 0 : 0;
  const dep = e ? r10(e.bmr + e.quot + sport) : null;
  return `<section class="sec"><div class="sec-h"><h2>Nutrition</h2><button class="btn link sm" data-a="px-wz" data-v="nutrition">Mes infos</button></div>
    <div class="px-ndays"><button class="px-nav" data-a="px-nweek" data-v="-7" aria-label="Semaine précédente">‹</button>${days}<button class="px-nav" data-a="px-nweek" data-v="7" aria-label="Semaine suivante">›</button></div>
    <div class="card px-apports"><div class="px-ap-l"><span class="eyebrow">${day === today() ? "Aujourd'hui" : esc(fmtLong(parseIso(day)))}</span>
      <b class="px-big">${reste >= 0 ? fr(reste) : "+" + fr(-reste)}<small> kcal</small></b><span class="small muted">${reste >= 0 ? "il te reste" : "au-dessus de ta cible"}</span>
      <span class="small"><i class="px-dot" style="background:var(--a1)"></i>Cible ${fr(c.kcal)} kcal${c.coach ? " · réglée par Nathanael" : ""}</span></div>
      ${ring(tot.kcal, c.kcal, 120, 12, tot.kcal > c.kcal * 1.1 ? "var(--warn)" : "var(--a1)", `<text x="60" y="62" text-anchor="middle" class="px-rv" style="font-size:24px">${fr(tot.kcal)}</text><text x="60" y="80" text-anchor="middle" class="px-rl">/ ${fr(c.kcal)}</text>`)}</div>
    ${c.mot ? `<div class="note coach"><div class="meta"><b style="color:var(--ink)">Nathanael</b></div><div class="txt">${esc(c.mot)}</div></div>` : ""}
    <div class="px-mac3">${[["Protéines", "p", "var(--a3)"], ["Glucides", "g", "var(--a2)"], ["Lipides", "l", "var(--a4)"]].map(([l, k, col]) => `<div class="card"><span class="small muted">${l}</span><b>${fr(tot[k])}<small> / ${fr(c[k])} g</small></b>${bar(tot[k], c[k], col)}</div>`).join("")}</div>
    ${c.mineur ? `<span class="small muted">Avant 18 ans, pas de régime : ces chiffres sont des repères pour bien manger et bien grandir.</span>` : ""}</section>
  <section class="sec"><div class="sec-h"><h2>Ton journal</h2><button class="btn sm solid" data-a="px-add" data-v="">+ Ajouter</button></div>
    ${REPAS.map(([k, l]) => { const xs = (j?.repas || []).filter(x => x.r === k), t = xs.reduce((s, x) => s + num(x.kcal), 0);
      return `<div class="card px-repas"><div class="h"><b>${l}</b><span class="small muted">${t ? fr(t) + " kcal" : ""}</span><button class="btn link sm" data-a="px-add" data-v="${k}">+ Ajouter</button></div>
        ${xs.map(x => `<div class="px-item"><span><b>${esc(x.n)}</b><span class="small muted">${fr(x.kcal)} kcal${x.p || x.g || x.l ? ` · P ${fr(x.p)} · G ${fr(x.g)} · L ${fr(x.l)}` : ""}</span></span><button class="px-del" data-a="px-del" data-v="${esc(x.id)}" aria-label="Retirer">✕</button></div>`).join("")}</div>`; }).join("")}
    <div class="card px-eau"><div class="h"><b>Eau</b><span class="small muted">${(j?.eau || 0) * .25} L</span></div><div class="px-verres">${Array.from({length: 10}, (_, i) => `<button class="${i < (j?.eau || 0) ? "on" : ""}" data-a="px-eau" data-v="${i + 1}" aria-label="${i + 1} verres">💧</button>`).join("")}</div></div></section>
  ${e ? `<section class="sec"><h2>Ton équilibre</h2><div class="card px-bilan"><b>Dépense prévue sur la journée</b>
    <div class="px-dep"><div><span><i class="px-dot" style="background:#ff4d6d"></i>Repos</span><b>${fr(r10(e.bmr))} kcal</b></div><div><span><i class="px-dot" style="background:#ffc83d"></i>Quotidien</span><b>${fr(r10(e.quot))} kcal</b></div><div><span><i class="px-dot" style="background:var(--a4)"></i>Séance</span><b>${fr(r10(sport))} kcal</b></div></div>
    <div class="px-stack"><i style="flex:${e.bmr};background:#ff4d6d"></i><i style="flex:${e.quot};background:#ffc83d"></i><i style="flex:${Math.max(sport, 1)};background:var(--a4)"></i></div>
    <div class="h"><span class="small muted">Total</span><b class="px-big" style="font-size:26px">${fr(dep)} kcal</b></div>
    ${tot.kcal ? `<span class="small">${tot.kcal < dep ? `Bilan du jour : <b>−${fr(dep - tot.kcal)} kcal</b> (tu manges moins que tu ne dépenses)` : `Bilan du jour : <b>+${fr(tot.kcal - dep)} kcal</b> (tu manges plus que tu ne dépenses)`}</span>` : `<span class="small muted">Ajoute tes repas pour voir ton bilan.</span>`}
    <details class="px-why"><summary>D'où viennent ces chiffres ?</summary><p>Repos : la formule de Mifflin-St Jeor (poids, taille, âge, sexe). Quotidien : ce que tu bouges hors sport, selon ton métier. Séance : environ 5 kcal par kilo et par heure de renfo. Ta cible part de ta dépense moyenne, puis s'ajuste à ton objectif. Ce sont des estimations : on ajuste ensemble selon l'évolution de ton poids.</p></details></div></section>` : ""}
  ${askBar()}`;
}
function addSheet(){
  const sh = P.sheet, q = norm(sh.q || ""), list = q ? ALIMENTS.filter(a => norm(a[0]).includes(q)) : ALIMENTS;
  return `<div class="px-sh-in"><div class="px-sh-top"><b>Ajouter</b><button class="px-x" data-a="px-close">Fermer</button></div>
    <div class="px-seg">${REPAS.map(([k, l]) => `<button class="${sh.r === k ? "on" : ""}" data-a="px-repas" data-v="${k}">${l}</button>`).join("")}</div>
    <div class="px-qte"><span class="small muted">Quantité</span>${[.5, 1, 1.5, 2].map(x => `<button class="${(sh.x || 1) === x ? "on" : ""}" data-a="px-qx" data-v="${x}">×${fr(x, 1)}</button>`).join("")}</div>
    <input type="search" class="px-search" placeholder="Chercher un aliment (riz, œuf, skyr…)" value="${esc(sh.q || "")}" data-px="q" autocomplete="off">
    <div class="px-alis">${list.map(a => `<button class="px-ali" data-a="px-ali" data-v="${ALIMENTS.indexOf(a)}"><span><b>${esc(a[0])}</b><span class="small muted">${esc(a[1])}</span></span><span class="px-k">${fr(a[2] * (sh.x || 1))} kcal</span><span class="px-plus">+</span></button>`).join("") || `<div class="small muted">Aucun aliment trouvé. Ajoute-le à la main ci-dessous.</div>`}</div>
    <details class="card" ${sh.manuel ? "open" : ""}><summary><b>Les calories que je connais</b> <span class="small muted">(étiquette, appli, restaurant)</span></summary>
      <label class="f">Nom<input type="text" data-px="n" value="${esc(sh.n || "")}" placeholder="Ex. salade du midi"></label>
      <div class="px-g4"><label class="f">kcal<input type="number" inputmode="decimal" data-px="kcal" value="${esc(sh.kcal || "")}"></label><label class="f">Prot. g<input type="number" inputmode="decimal" data-px="p" value="${esc(sh.p || "")}"></label>
      <label class="f">Gluc. g<input type="number" inputmode="decimal" data-px="g" value="${esc(sh.g || "")}"></label><label class="f">Lip. g<input type="number" inputmode="decimal" data-px="l" value="${esc(sh.l || "")}"></label></div>
      <button class="btn solid" data-a="px-manuel">Ajouter</button></details>
    <span class="small muted">Valeurs moyennes par portion, pour se repérer. Pas besoin d'être précis au gramme près.</span></div>`;
}

/* ================= Corps ================= */
function corps(){
  const tabs = [["muscles", "Muscles"], ["forme", "Forme"], ["mesures", "Mensurations"], ["photos", "Photos"]];
  let body = "";
  if (P.seg === "muscles") body = vueMuscles();
  if (P.seg === "forme") body = vueForme();
  if (P.seg === "mesures") body = vueMesures();
  if (P.seg === "photos") body = vuePhotos();
  return `<section class="sec"><h2>Mon corps</h2>${seg(P.seg, tabs, "px-seg")}</section>${body}${askBar()}`;
}
function vueMuscles(){
  const v = volume(P.periode), last = dernierTravail(), zs = zonesSensibles(), fills = {};
  for (const [k, n] of Object.entries(v.sets)) fills[k] = couleurSeries(n);
  const sel = P.muscle, list = (P.vue === "face" ? FACE : DOS);
  const top = Object.entries(v.sets).sort((a, b) => b[1] - a[1]);
  const recup = k => { const d = last[k]; if (!d) return null; const h = (Date.now() - parseIso(d).getTime()) / 36e5 - 12;
    return h < 24 ? ["Récupère", "var(--warn)", .3] : h < 48 ? ["Bientôt prêt", "#ffc83d", .7] : ["Prêt", "var(--a4)", 1]; };
  const detail = sel ? (() => { const n = v.sets[sel] || 0, r = recup(sel), ex = [...(v.exos[sel] || [])];
    return `<div class="card px-mdet"><div class="h"><b>${esc(MUSCLES[sel])}</b><button class="btn link sm" data-a="px-muscle" data-v="">Fermer</button></div>
      <div class="px-mstats"><div><span class="small muted">Séries ${P.periode === "faites" ? "7 derniers jours" : "prévues cette semaine"}</span><b>${fr(n, 1)}</b></div>
      <div><span class="small muted">Dernière fois</span><b>${last[sel] ? esc(fmtDay(parseIso(last[sel]))) : "–"}</b></div>
      <div><span class="small muted">Récupération</span><b style="color:${r ? r[1] : "var(--muted)"}">${r ? r[0] : "–"}</b></div></div>
      ${ex.length ? `<span class="small muted">Avec : ${esc(ex.join(", "))}</span>` : `<span class="small muted">Pas travaillé sur cette période.</span>`}</div>`; })() : "";
  return `<section class="sec"><div class="card px-bodycard">
      <div class="px-bodytop">${seg(P.periode, [["faites", "7 derniers jours"], ["prevues", "Cette semaine"]], "px-per")}</div>
      <div class="px-bodywrap">${bodySVG(P.vue, fills, {tap: true, sel, joints: zs})}
        <button class="px-flip" data-a="px-vue">${P.vue === "face" ? "Voir de dos" : "Voir de face"} ↻</button></div>
      <div class="px-leg"><span><i style="background:var(--px-c1)"></i>1-3</span><span><i style="background:var(--px-c2)"></i>4-7</span><span><i style="background:var(--px-c3)"></i>8-11</span><span><i style="background:var(--px-c4)"></i>12+ séries</span>${zs.length ? `<span><i class="px-jl"></i>à ménager</span>` : ""}</div>
      <span class="small muted" style="text-align:center">Touche un muscle pour voir le détail.</span></div>
    ${detail}
    ${zs.length ? `<div class="banner warn"><span><b>Zones à ménager :</b> ${esc(zs.join(", "))}. Nathanael en tient compte dans chaque séance. Une gêne ? Dis-le dans le questionnaire après ta séance.</span></div>` : ""}
    <div class="card"><b>${P.periode === "faites" ? "Tes muscles cette semaine" : "Ce qui est prévu cette semaine"}</b>
      ${top.length ? top.slice(0, 8).map(([k, n]) => { const r = recup(k); return `<button class="px-mrow" data-a="px-muscle" data-v="${k}"><span>${esc(MUSCLES[k])}</span>${bar(n, Math.max(12, top[0][1]), couleurSeries(n))}<b>${fr(n, 1)}</b>${P.periode === "faites" && r ? `<i class="px-dot" style="background:${r[1]}" title="${r[0]}"></i>` : ""}</button>`; }).join("")
        : `<span class="small muted">${P.periode === "faites" ? "Pas encore de séance faite ces 7 derniers jours. Après ta prochaine séance, tes muscles s'allument ici." : "Pas de séance datée cette semaine."}</span>`}</div></section>`;
}
function vueForme(){
  const t = today(), fo = jourDoc(t)?.forme;
  const hist = Array.from({length: 14}, (_, i) => { const k = iso(addD(new Date(), i - 13)); return {k, s: jourDoc(k)?.forme?.score ?? null}; });
  const notes = hist.filter(x => x.s != null), moy = notes.length ? r0(notes.reduce((a, x) => a + x.s, 0) / notes.length) : null;
  return `<section class="sec"><div class="card px-formecard">${gauge(fo?.score ?? null, fo ? formeLbl(fo.score) : "Pas encore noté aujourd'hui")}
      ${fo ? `<span class="small muted" style="text-align:center">${esc(formeMot(fo))}</span>
        <div class="px-mstats"><div><span class="small muted">Sommeil</span><b>${fo.sommeil}/5</b></div><div><span class="small muted">Énergie</span><b>${fo.energie}/5</b></div><div><span class="small muted">Courbatures</span><b>${fo.courbatures}/5</b></div><div><span class="small muted">Moral</span><b>${fo.moral}/5</b></div></div>` : ""}
      <button class="btn ${fo ? "ghost" : "solid"}" data-a="px-forme">${fo ? "Modifier" : "Noter ma forme (15 s)"}</button></div>
    <div class="card"><div class="h"><b>Tes 14 derniers jours</b><span class="small muted">${moy != null ? "moyenne " + moy : ""}</span></div>
      <div class="px-hist">${hist.map(x => `<div title="${esc(x.k)}"><i style="height:${x.s != null ? Math.max(6, x.s) : 4}%;background:${x.s == null ? "rgba(var(--ov),.08)" : x.s >= 60 ? "var(--a4)" : x.s >= 40 ? "#ffc83d" : "#ff5a5a"}"></i><span>${parseIso(x.k).getDate()}</span></div>`).join("")}</div>
      <span class="small muted">Note ta forme le matin des jours de séance : Nathanael voit tout de suite si on doit alléger.</span></div></section>`;
}
function formeSheet(){
  const f = P.sheet.f;
  const Q = [["sommeil", "Ta nuit", ["Très mauvaise", "Mauvaise", "Correcte", "Bonne", "Excellente"], ["😫", "😕", "😐", "🙂", "😴"]],
    ["energie", "Ton énergie", ["À plat", "Faible", "Normale", "Bonne", "Au top"], ["🪫", "😩", "😐", "💪", "⚡"]],
    ["courbatures", "Tes courbatures", ["Très fortes", "Fortes", "Un peu", "Légères", "Aucune"], ["🥵", "😣", "😐", "🙂", "😀"]],
    ["moral", "Ton moral / stress", ["Très stressé·e", "Stressé·e", "Ça va", "Bien", "Très bien"], ["😟", "😕", "😐", "🙂", "😁"]]];
  const ok = Q.every(q => f[q[0]]);
  const sc = ok ? r0(Q.reduce((t, q) => t + (f[q[0]] - 1) / 4, 0) / 4 * 100) : null;
  return `<div class="px-sh-in"><div class="px-sh-top"><b>Ta forme du jour</b><button class="px-x" data-a="px-close">Fermer</button></div>
    ${Q.map(([k, l, lbls, emo]) => `<div class="px-fq"><b>${l}</b><div class="px-five">${[1, 2, 3, 4, 5].map(v => `<button class="${f[k] === v ? "on" : ""}" data-a="px-fset" data-k="${k}" data-v="${v}"><span>${emo[v - 1]}</span><small>${esc(lbls[v - 1])}</small></button>`).join("")}</div></div>`).join("")}
    ${ok ? `<div class="px-fres">${gauge(sc, formeLbl(sc))}</div>` : ""}
    <button class="btn solid" data-a="px-fsave" ${ok ? "" : "disabled"}>Enregistrer</button>
    ${ok && sc < 40 ? `<span class="small" style="text-align:center">Grosse fatigue : un mot à Nathanael pour alléger ta séance ? <button class="btn link sm" data-a="px-ask" data-v="Je suis très fatigué·e aujourd'hui (forme ${sc}/100).">Lui écrire</button></span>` : ""}</div>`;
}
const ZONES = [["cou", "Tour de cou", 100, 62], ["epaules", "Tour d'épaules", 100, 82], ["poitrine", "Tour de poitrine", 100, 100], ["bras", "Tour de bras", 57, 124],
  ["taille", "Tour de taille", 100, 150], ["hanches", "Tour de hanches", 100, 190], ["cuisse", "Tour de cuisse", 83, 228], ["mollet", "Tour de mollet", 81, 322]];
function vueMesures(){
  const ms = mesures(), last = {}, first = {};
  for (const x of ms) for (const [k, v] of Object.entries(x.zones || {})) if (v) { if (first[k] == null) first[k] = {v, d: x.date}; last[k] = {v, d: x.date}; }
  const poids = ms.filter(x => x.poids).map(x => ({d: x.date, v: x.poids}));
  const nb = ZONES.filter(([k]) => last[k]).length;
  const bands = ZONES.map(([k, l, x, y]) => { const w = {cou: 14, epaules: 44, poitrine: 30, bras: 9, taille: 22, hanches: 28, cuisse: 13, mollet: 9}[k];
    return `<g class="px-band ${last[k] ? "on" : ""}"><ellipse cx="${x}" cy="${y}" rx="${w}" ry="${Math.max(2.5, w / 6)}"/></g>`; }).join("");
  return `<section class="sec"><div class="card px-bodycard"><div class="px-mesgrid"><div class="px-bodywrap sm">${bodySVG("face", {}, {extra: bands, label: "Zones de mesure"})}</div>
      <div class="px-mlist">${ZONES.map(([k, l]) => { const a = last[k], f0 = first[k], dl = a && f0 && a.d !== f0.d ? a.v - f0.v : null;
        return `<div><span class="small muted">${(x => x[0].toUpperCase() + x.slice(1))(l.replace("Tour de ", "").replace("Tour d'", ""))}</span><b>${a ? fr(a.v, 1) + " cm" : "–"}</b>${dl ? `<small class="${dl < 0 ? "dn" : "up"}">${dl > 0 ? "+" : ""}${fr(dl, 1)}</small>` : ""}</div>`; }).join("")}</div></div>
      <span class="small muted">${nb}/8 zones renseignées${ms.length ? " · dernier relevé le " + esc(fmtDay(parseIso(ms[ms.length - 1].date))) : ""}</span>
      <button class="btn solid" data-a="px-mesure">Nouveau relevé</button></div>
    <div class="card"><div class="h"><b>Poids</b><span class="small muted">${poids.length ? fr(poids[poids.length - 1].v, 1) + " kg" : ""}</span></div>${spark(poids)}</div>
    <div class="card"><b>Comment bien se mesurer</b><span class="small muted">Le matin, à jeun, avant le sport. Mètre ruban souple, bien à plat, sans serrer. Toujours au même endroit : taille au niveau du nombril, cuisse et bras au plus large. Une fois toutes les 2 à 4 semaines suffit.</span></div></section>`;
}
function spark(pts){
  if (pts.length < 2) return `<span class="small muted">${pts.length ? "Encore un relevé et ta courbe apparaît." : "Note ton poids dans « Nouveau relevé » pour suivre ta courbe."}</span>`;
  const vs = pts.map(p => p.v), mn = Math.min(...vs), mx = Math.max(...vs), W = 300, H = 90, sp = mx - mn || 1;
  const xy = pts.map((p, i) => [10 + i * (W - 20) / (pts.length - 1), H - 12 - (p.v - mn) / sp * (H - 30)]);
  return `<svg viewBox="0 0 ${W} ${H}" class="px-spark"><polyline points="${xy.map(p => p.join(",")).join(" ")}" fill="none" stroke="var(--a1)" stroke-width="2.5" stroke-linejoin="round"/>
    ${xy.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="var(--a1)"/>${i === 0 || i === xy.length - 1 ? `<text x="${p[0]}" y="${p[1] - 8}" text-anchor="${i ? "end" : "start"}" class="px-st">${fr(pts[i].v, 1)}</text>` : ""}`).join("")}</svg>`;
}
function mesureSheet(){
  const f = P.sheet.f, last = mesures().pop() || {};
  return `<div class="px-sh-in"><div class="px-sh-top"><b>Nouveau relevé</b><button class="px-x" data-a="px-close">Fermer</button></div>
    <label class="f">Date<input type="date" data-px="date" value="${esc(f.date || today())}"></label>
    <label class="f">Poids (kg)<input type="number" inputmode="decimal" step="0.1" data-px="poids" value="${esc(f.poids ?? "")}" placeholder="${esc(last.poids || "")}"></label>
    <span class="eyebrow">Tours (cm), remplis ceux que tu veux</span>
    <div class="px-g2">${ZONES.map(([k, l]) => `<label class="f">${l}<input type="number" inputmode="decimal" step="0.5" data-px="z.${k}" value="${esc(f["z." + k] ?? "")}" placeholder="${esc(last.zones?.[k] || "")}"></label>`).join("")}</div>
    <button class="btn solid" data-a="px-msave">Enregistrer</button></div>`;
}
function vuePhotos(){
  if (P.photos === null && !P.photosErr) chargerPhotos();
  const ph = P.photos || [];
  return `<section class="sec"><div class="card"><div class="h"><b>Photos de progression</b><label class="btn sm solid px-up">+ Photo<input type="file" accept="image/*" capture="environment" data-px-file="1" hidden></label></div>
    <span class="small muted">Visibles seulement par toi et Nathanael. Même endroit, même lumière, même tenue : face, profil, dos. Une série toutes les 4 semaines.</span>
    ${P.photosErr ? `<div class="banner warn"><span>${esc(P.photosErr)}</span></div>` : P.photos === null ? `<span class="small muted">Chargement…</span>`
      : ph.length ? `${ph.length >= 2 ? `<div class="px-avap"><figure><img src="${ph[ph.length - 1].img}" alt="Première photo"><figcaption>${esc(fmtDay(parseIso(ph[ph.length - 1].date)))}</figcaption></figure><figure><img src="${ph[0].img}" alt="Dernière photo"><figcaption>${esc(fmtDay(parseIso(ph[0].date)))}</figcaption></figure></div>` : ""}
        <div class="px-photos">${ph.map(x => `<figure><img src="${x.img}" alt="Photo du ${esc(x.date)}" loading="lazy"><figcaption>${esc(fmtDay(parseIso(x.date)))}<button class="px-del" data-a="px-pdel" data-v="${esc(x.id)}" aria-label="Supprimer">✕</button></figcaption></figure>`).join("")}</div>`
      : `<div class="px-empty-ph">📸<span class="small muted">Ta première photo sera ton point de départ.</span></div>`}</div></section>`;
}
async function chargerPhotos(){
  P.photos = []; P.photosErr = null;
  try { const q = await S.db.collection(`members/${memberId()}/photos`).orderBy("at", "desc").limit(60).get();
    P.photos = q.docs.map(x => ({id: x.id, ...x.data()})); }
  catch (e) { P.photos = null; P.photosErr = e && e.code === "permission-denied" ? "Les photos s'activent dès que Nathanael a mis à jour la sécurité de l'appli (1 minute de son côté)." : "Photos indisponibles pour l'instant."; }
  render(true);
}
async function ajouterPhoto(file){
  try {
    const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = URL.createObjectURL(file); });
    const k = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement("canvas");
    c.width = r0(img.width * k); c.height = r0(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    let q = .75, data = c.toDataURL("image/jpeg", q); while (data.length > 700000 && q > .3) { q -= .1; data = c.toDataURL("image/jpeg", q); }
    await S.db.collection(`members/${memberId()}/photos`).add({at: Date.now(), date: today(), img: data, auteur: S.owner ? "coach" : "adherent"});
    toast("Photo ajoutée 📸"); P.photos = null; chargerPhotos();
  } catch (e) { toast(e && e.code === "permission-denied" ? "Les photos ne sont pas encore activées : Nathanael doit mettre à jour la sécurité." : "Photo non ajoutée : " + (e && (e.code || e.message) || "erreur")); }
}

/* ================= intro pas à pas (premier lancement) ================= */
const ICO = {"Perdre du poids": "🔥", "Prendre des fessiers": "🍑", "Prendre du muscle": "💪", "Me tonifier": "✨", "Gagner en force": "🏋️", "Être plus souple / mobile": "🧘", "Avoir moins mal (dos, genou, épaule…)": "🩹", "Améliorer mon cardio": "❤️", "Me remettre en forme": "🌱", "Préparer un sport ou une épreuve": "🏁"};
const INFO = {
  "Perdre du poids": ["Perdre du gras, sans se priver", "On mange un peu moins que ce qu'on dépense, sans régime strict. La muscu garde tes muscles pendant ce temps : c'est elle qui change ta silhouette, pas seulement la balance."],
  "Prendre des fessiers": ["Des fessiers, ça se construit", "Des exercices ciblés (pont, hip thrust, fentes) 2 à 3 fois par semaine, avec une vraie contraction à chaque répétition. On commence par bien les sentir travailler, puis on charge."],
  "Prendre du muscle": ["Le muscle aime la régularité", "Assez de séries chaque semaine pour chaque muscle, des charges qui montent petit à petit, des protéines à chaque repas et du sommeil. Nathanael règle tout ça séance après séance."],
  "Me tonifier": ["Tonique = plus de muscle, un peu moins de gras", "Des séances de renfo complètes et régulières, et une alimentation équilibrée. Les résultats se voient en quelques semaines."],
  "Gagner en force": ["La force, c'est aussi de la technique", "On apprend d'abord les bons gestes, puis on monte les charges sur peu de répétitions. Ton système nerveux progresse vite au début."],
  "Être plus souple / mobile": ["Bouger mieux, tous les jours", "Un peu de mobilité à chaque séance vaut mieux qu'une grosse séance d'étirements de temps en temps. On travaille l'amplitude et le contrôle."],
  "Avoir moins mal (dos, genou, épaule…)": ["On renforce autour, sans forcer", "Bouger intelligemment soulage. On renforce la zone et ce qui l'entoure, jamais dans la douleur. Après chaque séance tu dis comment ça s'est passé et on ajuste."],
  "Améliorer mon cardio": ["Le cœur s'entraîne aussi", "Des efforts réguliers, d'abord tranquilles puis plus intenses par intervalles. Ton souffle progresse vite si tu restes régulier·e."],
  "Me remettre en forme": ["On reprend en douceur", "Les premières semaines posent les bases : bons gestes, régularité, plaisir. Ensuite on augmente petit à petit."],
  "Préparer un sport ou une épreuve": ["Une préparation sur mesure", "On part de ta date et de ton sport, et on construit les qualités dont tu as besoin : force, explosivité, endurance, prévention des blessures."]};
const silhouette = sexe => `<svg viewBox="0 0 200 400" class="px-sil">${sexe === "F"
  ? `<ellipse cx="100" cy="34" rx="17" ry="22"/><path d="M92,54 L108,54 L109,66 L91,66 Z"/><path d="M76,72 C88,68 112,68 124,72 C136,76 142,90 144,110 L150,180 L142,182 L130,116 C128,140 126,150 120,166 C132,180 136,196 134,214 L128,292 L130,370 L114,372 L108,296 L104,214 L96,214 L92,296 L86,372 L70,370 L72,292 L66,214 C64,196 68,180 80,166 C74,150 72,140 70,116 L58,182 L50,180 L56,110 C58,90 64,76 76,72 Z"/>`
  : `<ellipse cx="100" cy="33" rx="18" ry="23"/><path d="M91,54 L109,54 L111,66 L89,66 Z"/><path d="M70,70 C84,66 116,66 130,70 C146,74 152,88 154,110 L160,184 L151,186 L138,118 C136,140 132,156 128,172 C130,190 130,200 128,216 L124,292 L127,370 L111,372 L106,296 L103,218 L97,218 L94,296 L89,372 L73,370 L76,292 L72,216 C70,200 70,190 72,172 C68,156 64,140 62,118 L49,186 L40,184 L46,110 C48,88 54,74 70,70 Z"/>`}</svg>`;
function etapesObjectifs(){
  const niv = Object.entries(BQ.niv).map(([f, [q, os]]) => ({id: "niv_" + f, k: "single", q, sub: "Ton niveau : réponds au plus juste, c'est ce qui règle tes charges.", opts: os}));
  return [
    {id: "hello", k: "info", emo: "👋", q: "Bienvenue dans ton espace", sub: "Quelques questions, une par écran, pour que Nathanael prépare ton programme. Compte 3 minutes. Tu peux revenir en arrière à tout moment."},
    {id: "sexe", k: "sexe", q: "Tu es…"},
    {id: "naissance", k: "date", q: "Ta date de naissance ?"},
    {id: "taille", k: "nombre", q: "Ta taille ?", u: "cm", min: 120, max: 220, pas: 1, def: d => d.sexe === "F" ? 165 : 176},
    {id: "poids", k: "nombre", q: "Ton poids ?", u: "kg", min: 30, max: 250, pas: .5, dec: 1, def: d => d.sexe === "F" ? 62 : 75},
    {id: "buts", k: "multi", q: "Quels sont tes objectifs ?", sub: "Jusqu'à trois, le plus important en premier.", max: 3, opts: BQ.buts.map(b => [b, b, ICO[b]])},
    {id: "info", k: "infoBut"},
    {id: "poidsVise", k: "traj", q: "Vise ta trajectoire", show: d => (d.buts || []).some(b => /poids|muscle|fessiers|tonifier/i.test(b))},
    {id: "rythmePoids", k: "rythmeP", q: "À quel rythme ?", show: d => d.poidsVise && Math.abs(d.poidsVise - d.poids) >= .5},
    {id: "cibles", k: "multi", q: "Les zones à travailler en priorité ?", opts: BQ.ciblesObj.map(c => [c, c])},
    {id: "quotidien", k: "single", q: "Ton quotidien, c'est plutôt…", opts: BQ.quotidien},
    {id: "sport", k: "single", q: "Ta dernière activité sportive régulière ?", opts: BQ.sport},
    {id: "sports", k: "texte", q: "Quels sports tu as pratiqués ?", sub: "Facultatif.", ph: "Ex. foot 5 ans, muscu un peu, rien…", opt: true},
    ...niv,
    {id: "charges", k: "texte", q: "Tes charges en salle, si tu les connais", sub: "Facultatif.", ph: "Ex. squat 60 kg x8, développé couché 50 kg x8", opt: true},
    {id: "sante", k: "multi", q: "Ta santé : coche ce qui te concerne", sub: "Nathanael lit chaque réponse pour adapter tes séances.", opts: BQ.sante.map(([v, l]) => [v, l]), excl: "aucune"},
    {id: "santeDetail", k: "texte", q: "Précise (quoi, depuis quand, traitement…)", show: d => (d.sante || []).some(x => x !== "aucune"), opt: true, long: true},
    {id: "medecin", k: "single", q: "Ton médecin est d'accord pour que tu fasses du sport ?", opts: BQ.medecin},
    {id: "douleurs", k: "texte", q: "Une douleur ou une blessure en ce moment ?", sub: "Écris « rien » si tout va bien.", ph: "Ex. genou gauche en descente d'escalier", long: true},
    {id: "rythme", k: "single", q: "Combien de séances par semaine tu peux faire ?", opts: ["1","2","3","4","5"].map(n => [n, n + (n === "1" ? " séance" : " séances")])},
    {id: "jours", k: "multi", q: "Les jours où tu peux t'entraîner ?", opts: BQ.jours.map(j => [j, j]), row: true},
    {id: "lieu", k: "single", q: "Où tu vas faire tes séances ?", opts: BQ.lieux},
    {id: "materiel", k: "texte", q: "Ton matériel à la maison ?", show: d => ["maison", "mixte"].includes(d.lieu), ph: "Ex. rien, un tapis, 2 haltères de 5 kg, des élastiques…", opt: true, long: true},
    {id: "autre", k: "texte", q: "Autre chose à dire à Nathanael ?", sub: "Facultatif.", ph: "Ex. un mariage en juin, je déteste les burpees…", opt: true, long: true},
    {id: "fin", k: "fin"}];
}
function etapesNutrition(){
  return [
    {id: "sexe", k: "sexe", q: "Tu es…"},
    {id: "naissance", k: "date", q: "Ta date de naissance ?"},
    {id: "taille", k: "nombre", q: "Ta taille ?", u: "cm", min: 120, max: 220, pas: 1, def: d => d.sexe === "F" ? 165 : 176},
    {id: "poids", k: "nombre", q: "Ton poids ?", u: "kg", min: 30, max: 250, pas: .5, dec: 1, def: d => d.sexe === "F" ? 62 : 75},
    {id: "quotidien", k: "single", q: "Ton quotidien, c'est plutôt…", opts: BQ.quotidien},
    {id: "but", k: "single", q: "Côté alimentation, tu veux…", opts: [["perte", "🔥 Perdre du gras"], ["prise", "💪 Prendre du muscle"], ["recompo", "↕️ Les deux : recomposer"], ["maintien", "⚖️ Garder mon poids"]]},
    {id: "poidsVise", k: "traj", q: "Vise ta trajectoire", show: d => d.but && d.but !== "maintien"},
    {id: "rythmePoids", k: "rythmeP", q: "À quel rythme ?", show: d => d.poidsVise && Math.abs(d.poidsVise - d.poids) >= .5},
    {id: "fin", k: "finNut"}];
}
function ouvrirWz(kind){
  const p = profil(), d = {sexe: p.sexe, naissance: p.naissance, taille: p.taille, poids: p.poids, quotidien: p.quotidien, but: p.but, poidsVise: p.poidsVise, rythmePoids: p.rythmePoids};
  if (kind === "objectifs") { const o = S.drafts; for (const k of Object.keys(o)) if (k.startsWith("obj.")) d[k.slice(4)] ??= o[k]; }
  P.wz = {kind, i: 0, d, steps: kind === "nutrition" ? etapesNutrition() : etapesObjectifs()};
}
const wzSteps = () => P.wz.steps.filter(s => !s.show || s.show(P.wz.d));
function wzValide(st, d){
  const v = d[st.id];
  if (st.opt || ["info", "infoBut", "fin", "finNut"].includes(st.k)) return true;
  if (st.k === "multi") return (v || []).length > 0;
  if (st.k === "traj") return true;
  if (st.k === "texte") return String(v || "").trim().length > 0;
  return v !== undefined && v !== null && v !== "";
}
function renderWz(){
  let el = $("px-wz"); const w = P.wz;
  if (!w) { if (el) el.remove(); document.documentElement.classList.remove("px-lock"); return; }
  if (!el) { el = document.createElement("div"); el.id = "px-wz"; document.body.appendChild(el); }
  document.documentElement.classList.add("px-lock");
  const steps = wzSteps(), i = Math.min(w.i, steps.length - 1), st = steps[i], d = w.d, prog = (i + 1) / steps.length;
  if (st.k === "nombre" && d[st.id] == null) d[st.id] = st.def(d);
  if (st.k === "traj" && d.poidsVise == null) d.poidsVise = Math.round((d.poids || 70) + ((d.but === "prise" || (d.buts || []).some(b => /muscle|fessiers/i.test(b)) && !(d.buts || []).includes("Perdre du poids")) ? 3 : -4));
  let body = "", btn = "Continuer", ok = wzValide(st, d);
  const opt1 = (v, l, on, ic) => `<button class="px-opt ${on ? "on" : ""}" data-a="px-wpick" data-v="${esc(v)}">${ic ? `<span class="px-oi">${ic}</span>` : ""}<span>${esc(l)}</span>${on ? `<span class="px-ok">✓</span>` : ""}</button>`;
  if (st.k === "info") body = `<div class="px-wemo">${st.emo}</div><h2>${esc(st.q)}</h2><p>${esc(st.sub)}</p><p class="px-wmot">« ${esc(MOT_SUIVI)} »</p>`;
  if (st.k === "infoBut") { const b = (d.buts || [])[0], t = INFO[b] || ["On avance ensemble", "Nathanael construit ton programme à partir de tes réponses."];
    body = `<div class="px-wbody">${bodySVG("face", {}, {cls: "glow"})}</div><h2>${esc(t[0])}</h2><p>${esc(t[1])}</p>`; }
  if (st.k === "sexe") body = `<h2>${esc(st.q)}</h2><div class="px-sexe">${[["F", "Femme"], ["H", "Homme"]].map(([v, l]) => `<button class="${d.sexe === v ? "on" : ""}" data-a="px-wpick" data-v="${v}">${silhouette(v)}<span>${l}<i></i></span></button>`).join("")}</div>`;
  if (st.k === "date") body = `<h2>${esc(st.q)}</h2><input type="date" class="px-wdate" data-pxw="naissance" value="${esc(d.naissance || "")}" max="${iso(new Date())}" min="1930-01-01">${d.naissance ? `<p class="px-wsub">${(() => { const a = profilAge(d.naissance); return a ? a + " ans" : ""; })()}</p>` : `<p class="px-wsub">Touche le champ pour choisir.</p>`}`;
  if (st.k === "nombre") body = `<h2>${esc(st.q)}</h2><div class="px-num"><button data-a="px-wstep" data-v="-1" aria-label="Moins">−</button><label><input type="number" inputmode="decimal" data-pxw="${st.id}" value="${esc(d[st.id])}" min="${st.min}" max="${st.max}" step="${st.pas}"><span>${st.u}</span></label><button data-a="px-wstep" data-v="1" aria-label="Plus">+</button></div>`;
  if (st.k === "single") body = `<h2>${esc(st.q)}</h2>${st.sub ? `<p class="px-wsub">${esc(st.sub)}</p>` : ""}<div class="px-opts">${st.opts.map(([v, l, ic]) => opt1(v, l, d[st.id] === v, ic)).join("")}</div>`;
  if (st.k === "multi") { const cur = d[st.id] || [];
    body = `<h2>${esc(st.q)}</h2>${st.sub ? `<p class="px-wsub">${esc(st.sub)}</p>` : ""}<div class="px-opts ${st.row ? "row" : ""}">${st.opts.map(([v, l, ic]) => { const n = cur.indexOf(v);
      return `<button class="px-opt ${n >= 0 ? "on" : ""}" data-a="px-wtog" data-v="${esc(v)}">${ic ? `<span class="px-oi">${ic}</span>` : ""}<span>${esc(l)}</span>${n >= 0 ? `<span class="px-ok">${st.max ? n + 1 : "✓"}</span>` : ""}</button>`; }).join("")}</div>`; }
  if (st.k === "texte") body = `<h2>${esc(st.q)}</h2>${st.sub ? `<p class="px-wsub">${esc(st.sub)}</p>` : ""}${st.long ? `<textarea class="px-wtxt" rows="4" maxlength="400" data-pxw="${st.id}" placeholder="${esc(st.ph || "")}">${esc(d[st.id] || "")}</textarea>` : `<input type="text" class="px-wtxt" maxlength="200" data-pxw="${st.id}" placeholder="${esc(st.ph || "")}" value="${esc(d[st.id] || "")}">`}`;
  if (st.k === "traj") { const dep = d.poids || 70, vis = d.poidsVise, diff = vis - dep, f = Math.max(-1, Math.min(1, diff / 15));
    const R = 88, a = -Math.PI / 2 + f * Math.PI * .9, x = 110 + R * Math.cos(a), y = 110 + R * Math.sin(a), big = Math.abs(f * Math.PI * .9) > Math.PI ? 1 : 0;
    body = `<h2>${esc(st.q)}</h2><p class="px-wsub">Ton poids visé. Tu pourras le changer plus tard.</p>
      <div class="px-trajw"><svg viewBox="0 0 220 220"><circle cx="110" cy="110" r="${R}" fill="none" stroke="rgba(var(--ov),.08)" stroke-width="20"/>
        ${Math.abs(diff) > .01 ? `<path d="M110,${110 - R} A${R},${R} 0 ${big} ${diff > 0 ? 1 : 0} ${x},${y}" fill="none" stroke="url(#pxt)" stroke-width="20" stroke-linecap="round"/>` : ""}
        <defs><linearGradient id="pxt" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="var(--a2)"/><stop offset="1" stop-color="var(--a1)"/></linearGradient></defs>
        <circle cx="${x}" cy="${y}" r="11" fill="#fff"/><text x="110" y="78" text-anchor="middle" class="px-tsm">${fr(dep, 1)} kg</text>
        <text x="110" y="122" text-anchor="middle" class="px-tbig">${fr(vis, 1)} kg</text><text x="110" y="148" text-anchor="middle" class="px-tsm">objectif · ${diff > 0 ? "+" : ""}${fr(diff, 1)} kg</text></svg></div>
      <div class="px-num slim"><button data-a="px-wvise" data-v="-0.5" aria-label="Moins">−</button><span>${diff === 0 ? "Garder mon poids" : diff > 0 ? "Prendre" : "Perdre"}</span><button data-a="px-wvise" data-v="0.5" aria-label="Plus">+</button></div>
      <button class="btn link" data-a="px-wnovise">Je ne veux pas suivre mon poids</button>`; }
  if (st.k === "rythmeP") { const dep = d.poids, diff = d.poidsVise - dep, sens = diff > 0 ? 1 : -1;
    const ch = sens > 0 ? [["modere", "Modéré", .0025], ["leger", "Léger", .0012]] : [["modere", "Modéré", .005], ["leger", "Léger", .0025]];
    body = `<h2>${esc(st.q)}</h2><div class="px-opts">${ch.map(([v, l, pct]) => { const sem = Math.ceil(Math.abs(diff) / (dep * pct)), arr = addD(new Date(), sem * 7);
      return `<button class="px-opt big ${d.rythmePoids === v ? "on" : ""}" data-a="px-wpick" data-v="${v}"><span><b>${l}</b><small>${sens > 0 ? "+" : "−"}${fr(pct * 100, 2)} % de ton poids par semaine<br>Arrivée vers le ${esc(arr.toLocaleDateString("fr-FR", {day: "numeric", month: "long"}))}</small></span>${d.rythmePoids === v ? `<span class="px-ok">✓</span>` : ""}</button>`; }).join("")}</div>
      <p class="px-wsub">${sens > 0 ? "Plus lent = plus de muscle et moins de gras pris." : "Plus lent = plus facile à tenir, et tu gardes tes muscles."}</p>`; }
  if (st.k === "fin" || st.k === "finNut") { const p = {...profil(), ...d, age: profilAge(d.naissance) || null, seances: Number(d.rythme) || profil().seances,
      but: st.k === "finNut" ? d.but : (d.buts || []).includes("Perdre du poids") && (d.buts || []).some(b => /muscle|fessiers/i.test(b)) ? "recompo" : (d.buts || []).includes("Perdre du poids") ? "perte" : (d.buts || []).some(b => /muscle|fessiers/i.test(b)) ? "prise" : "maintien"};
    const c = cibles(p, {});
    body = `<div class="px-wemo">🎯</div><h2>${st.k === "fin" ? "Ton point de départ" : "Tes repères du jour"}</h2>
      <div class="px-sum">${st.k === "fin" ? `<div><span>Objectif</span><b>${esc((d.buts || [])[0] || "")}</b></div><div><span>Séances</span><b>${esc(d.rythme || "")} / semaine</b></div>` : ""}
      ${c ? `<div><span>Calories</span><b>${fr(c.kcal)} kcal / jour</b></div><div><span>Protéines</span><b>${fr(c.p)} g / jour</b></div>` : ""}
      ${d.poidsVise ? `<div><span>Poids visé</span><b>${fr(d.poidsVise, 1)} kg</b></div>` : ""}</div>
      <p>${st.k === "fin" ? "Nathanael lit tes réponses une par une et prépare ton programme. Tu le retrouves dans « Séances »." : "Ce sont des repères, pas un régime. Nathanael les voit et peut les ajuster pour toi."}</p>`;
    btn = st.k === "fin" ? "Envoyer à Nathanael" : "C'est noté"; }
  el.innerHTML = `<div class="px-wz-in"><div class="px-wtop"><button class="px-wback" data-a="px-wback" aria-label="Retour">‹</button><div class="px-wprog"><i style="width:${prog * 100}%"></i></div>
      <button class="px-wclose" data-a="px-wclose" aria-label="Plus tard">✕</button></div>
    <div class="px-wmain">${body}</div>
    <div class="px-wfoot"><button class="px-wnext" data-a="px-wnext" ${ok ? "" : "disabled"}>${btn}</button>${st.opt && !(d[st.id]) ? `<button class="btn link" data-a="px-wnext">Passer</button>` : ""}</div></div>`;
}
function profilAge(n){ if (!n) return null; const b = parseIso(n), t = new Date(); if (!b || isNaN(b)) return null;
  return t.getFullYear() - b.getFullYear() - ((t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) ? 1 : 0); }
async function wzFin(){
  const w = P.wz, d = w.d;
  if (w.kind === "nutrition") {
    if (!(await saveProfil({sexe: d.sexe, naissance: d.naissance, taille: num(d.taille), poids: num(d.poids), quotidien: d.quotidien, but: d.but, poidsVise: d.poidsVise ? num(d.poidsVise) : null, rythmePoids: d.rythmePoids || "modere"}))) return;
    P.wz = null; toast("C'est noté 👍"); return;
  }
  /* objectifs : on remplit le brouillon du questionnaire d'origine et on réutilise son enregistrement (mêmes données pour Nathanael) */
  const k = "obj.";
  const map = {age: profilAge(d.naissance), taille: d.taille, poids: d.poids, quotidien: d.quotidien, sante: d.sante, santeDetail: d.santeDetail, medecin: d.medecin, sport: d.sport, sports: d.sports,
    charges: d.charges, buts: d.buts, principal: (d.buts || [])[0], cibles: d.cibles, rythme: d.rythme, lieu: d.lieu, materiel: d.materiel, jours: d.jours, douleurs: d.douleurs, autre: d.autre};
  for (const f of Object.keys(BQ.niv)) map["niv_" + f] = d["niv_" + f];
  for (const [f, v] of Object.entries(map)) if (v !== undefined) S.drafts[k + f] = Array.isArray(v) ? [...v] : v;
  await saveProfil({sexe: d.sexe, naissance: d.naissance, taille: num(d.taille), poids: num(d.poids), quotidien: d.quotidien, poidsVise: d.poidsVise ? num(d.poidsVise) : null, rythmePoids: d.rythmePoids || "modere"});
  await saveObjectifs();
  /* saveObjectifs affiche ses propres messages et vide le brouillon quand la note est partie */
  if (Object.keys(S.drafts).every(x => !x.startsWith("obj."))) { P.wz = null; P.introLater = true; }
}

/* ================= feuilles (ajout repas, forme, mesures, question) ================= */
function renderSh(){
  let el = $("px-sh");
  if (!P.sheet) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement("div"); el.id = "px-sh"; el.className = "px-sh"; document.body.appendChild(el); }
  const t = P.sheet.type, keep = el.querySelector(".px-sh-in")?.scrollTop || 0;
  el.innerHTML = t === "add" ? addSheet() : t === "forme" ? formeSheet() : t === "mesure" ? mesureSheet() : t === "ask" ? askSheet() : "";
  const inn = el.querySelector(".px-sh-in"); if (inn) inn.scrollTop = keep;
}
function askSheet(){
  return `<div class="px-sh-in"><div class="px-sh-top"><b>Écrire à Nathanael</b><button class="px-x" data-a="px-close">Fermer</button></div>
    <span class="small muted">Une question sur un exercice, ta nutrition, une douleur, ton planning ? Nathanael reçoit ton message et te répond dans l'appli.</span>
    <textarea rows="5" maxlength="1500" data-px="t" placeholder="Ton message…">${esc(P.sheet.t || "")}</textarea>
    <div class="px-chips">${["Je peux remplacer un exercice ?", "Combien de protéines après la séance ?", "J'ai une courbature qui ne passe pas", "Je dois décaler ma séance"].map(x => `<button data-a="px-askchip" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div>
    <button class="btn solid" data-a="px-asksend">Envoyer</button></div>`;
}

/* ================= coach : fiche « Corps & nutrition » ================= */
function ficheCorps(){
  const m = S.cur.member; if (!m) return "";
  const p = profil(), c = cibles(p, m), calc = cibles(p, {}), k = "pxn.", fo = notesType("jour").filter(j => j.forme).pop(), ms = mesures();
  const sem = Array.from({length: 7}, (_, i) => { const dd = iso(addD(new Date(), i - 6)); return {dd, t: totJour(jourDoc(dd))}; });
  const v = volume("faites"), top = Object.entries(v.sets).sort((a, b) => b[1] - a[1]).slice(0, 5), zs = zonesSensibles();
  return `<section class="sec"><div class="sec-h"><h2>Corps & nutrition</h2></div><div class="card">
    <dl class="kv"><dt>Profil</dt><dd>${profilOk(p) ? `${p.sexe === "F" ? "Femme" : "Homme"}, ${p.age} ans, ${p.taille} cm, ${fr(p.poids, 1)} kg` : "incomplet (l'adhérent n'a pas encore rempli ses infos)"}</dd>
      ${p.poidsVise ? `<dt>Poids visé</dt><dd>${fr(p.poidsVise, 1)} kg (${p.rythmePoids === "leger" ? "léger" : "modéré"})</dd>` : ""}
      ${calc ? `<dt>Calcul auto</dt><dd>${fr(calc.kcal)} kcal · P ${calc.p} · G ${calc.g} · L ${calc.l} <span class="small muted">(repos ${fr(calc.bmr)}, dépense ${fr(calc.tdee)})</span></dd>` : ""}
      ${fo ? `<dt>Forme</dt><dd>${fo.forme.score}/100 le ${esc(fmtDay(parseIso(fo.date)))}</dd>` : ""}
      ${ms.length ? `<dt>Mesures</dt><dd>${esc(fmtDay(parseIso(ms[ms.length - 1].date)))}${ms[ms.length - 1].poids ? " · " + fr(ms[ms.length - 1].poids, 1) + " kg" : ""}</dd>` : ""}
      ${zs.length ? `<dt>À ménager</dt><dd>${esc(zs.join(", "))}</dd>` : ""}
      ${top.length ? `<dt>Muscles 7 j</dt><dd>${top.map(([x, n]) => esc(MUSCLES[x]) + " " + fr(n, 1)).join(" · ")}</dd>` : ""}</dl>
    <span class="eyebrow">Journal des 7 derniers jours</span>
    <div class="px-cj">${sem.map(x => `<div><i style="height:${c ? Math.min(100, x.t.kcal / c.kcal * 100) : 0}%"></i><span>${parseIso(x.dd).getDate()}</span><small>${x.t.kcal ? fr(x.t.kcal) : ""}</small></div>`).join("")}</div>
    <span class="eyebrow">Ses cibles${m.nutrition?.kcal ? " (réglées par toi)" : " (calcul auto)"}</span>
    <div class="px-g4"><label class="f">kcal<input type="number" data-d="${k}kcal" value="${esc(d(k + "kcal", m.nutrition?.kcal ?? c?.kcal ?? ""))}"></label><label class="f">Prot.<input type="number" data-d="${k}p" value="${esc(d(k + "p", m.nutrition?.p ?? c?.p ?? ""))}"></label>
      <label class="f">Gluc.<input type="number" data-d="${k}g" value="${esc(d(k + "g", m.nutrition?.g ?? c?.g ?? ""))}"></label><label class="f">Lip.<input type="number" data-d="${k}l" value="${esc(d(k + "l", m.nutrition?.l ?? c?.l ?? ""))}"></label></div>
    <label class="f">Ton mot nutrition (il le voit dans son onglet Nutrition)<textarea rows="2" data-d="${k}mot" placeholder="Ex. vise 30 g de protéines à chaque repas">${esc(d(k + "mot", m.nutrition?.mot || ""))}</textarea></label>
    <div class="row"><button class="btn sm solid" data-a="px-ncoach">Enregistrer ses cibles</button>${m.nutrition?.kcal ? `<button class="btn sm ghost" data-a="px-nauto">Revenir au calcul auto</button>` : ""}</div></div></section>`;
}

/* ================= branchements sur l'appli ================= */
const _view = view, _renderTabs = renderTabs, _act = act, _fiche = fiche, _render = render, _startData = startData, _objectifsCard = objectifsCard;
const IC = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>`,
  dumb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 7v10M3.5 9.5v5M18 7v10M20.5 9.5v5M6 12h12"/></svg>`,
  fork: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 21V3c-2.5 1.5-3.5 4-3.5 8h3.5"/></svg>`,
  body: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="4.5" r="2.2"/><path d="M5 8.5c4 1 10 1 14 0M12 9.5v5M9 21l1.5-6.5h3L15 21"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`};
window.objectifsCard = objectifsCard = function(){
  const m = S.cur.member; if (!m || S.owner || m.objectifsRequis !== true || objNote()) return "";
  return `<section class="sec"><button class="card tap" data-a="px-wz" data-v="objectifs" style="border:2px solid var(--a1)">
    <span class="eyebrow">Nouveau cycle · 3 minutes</span><b>Parle-moi de toi et de tes objectifs</b><span class="small">Une question par écran. Nathanael construit tes séances à partir de tes réponses.</span>${motSuivi()}
    <span class="small" style="color:var(--a1);font-weight:700">Commencer ›</span></button></section>`;
};
window.view = view = function(){
  if (memberUI() && S.cur.member) {
    const pre = S.asMember ? `<div class="banner mag"><span>Tu vois l'appli comme <b>${esc(S.cur.member.prenom || "l'adhérent")}</b>. Ce que tu écris ici est signé « Coach ».</span><button class="btn sm solid" data-a="exit-preview">Revenir en coach</button></div>` : "";
    if (S.tab === "accueil") return pre + accueil();
    if (S.tab === "nutrition") return pre + nutrition();
    if (S.tab === "corps") return pre + corps();
    if (S.tab === "seances") return _view() + `<section class="sec"><button class="btn sm ghost" data-a="tab" data-v="cycle" style="align-self:flex-start">Voir mon cycle ›</button></section>`;
  }
  return _view();
};
window.renderTabs = renderTabs = function(){
  if (S.mode !== "ready" || isCoachUI() || !S.cur.member) return _renderTabs();
  const t = $("tabs"), items = [["accueil", "Accueil", IC.home], ["seances", "Séances", IC.dumb], ["nutrition", "Nutrition", IC.fork], ["corps", "Corps", IC.body], ["reserver", "Planning", IC.cal]];
  const on = k => S.tab === k || (k === "accueil" && ["cycle", "offres"].includes(S.tab));
  t.hidden = false;
  t.innerHTML = `<div class="tabs-in">${items.map(([k, l, i]) => `<button class="tab ${on(k) ? "on" : ""}" data-a="tab" data-v="${k}">${i}${l}</button>`).join("")}</div>`;
};
window.fiche = fiche = function(){
  const out = _fiche(); if (!S.cur.member) return out;
  return out + ficheCorps();
};
/* pas de redessin d'une feuille pendant qu'on tape dedans (les mises à jour en direct arrivent n'importe quand) */
const enSaisie = sel => { const a = document.activeElement; return !!(a && a.closest && a.closest(sel) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)); };
window.render = render = function(f){ _render(f); if (!enSaisie("#px-sh")) renderSh(); if (!enSaisie("#px-wz")) renderWz(); autoIntro(); };
window.startData = startData = function(isCoach, cid){ _startData(isCoach, cid); if (!isCoach) { S.tab = "accueil"; render(true); } };
function autoIntro(){
  if (P.wz || P.introLater || S.owner || !S.cur.member) return;
  const m = S.cur.member; if (m.objectifsRequis === true && !objNote() && S.cur.notes !== undefined && autoIntro.ready) { ouvrirWz("objectifs"); renderWz(); }
}
/* on attend que les notes soient arrivées avant de proposer l'intro */
setTimeout(() => { autoIntro.ready = true; }, 2500);

document.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset?.pxw !== undefined && P.wz) { const st = wzSteps()[P.wz.i]; P.wz.d[t.dataset.pxw] = t.type === "number" ? num(t.value) : t.value;
    const b = document.querySelector(".px-wnext"); if (b && st) b.disabled = !wzValide(st, P.wz.d);
    if (t.type === "date") renderWz(); }
  if (t.dataset?.px !== undefined && P.sheet) { const k = t.dataset.px;
    if (P.sheet.type === "mesure") P.sheet.f[k] = t.value; else P.sheet[k] = t.value;
    if (k === "q") { const c = t.selectionStart; renderSh(); const n = document.querySelector(".px-search"); if (n) { n.focus(); try { n.setSelectionRange(c, c); } catch (x) {} } } }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.dataset?.pxFile && t.files?.[0]) { ajouterPhoto(t.files[0]); t.value = ""; }
  if (t.dataset?.pxw === "naissance" && P.wz) { P.wz.d.naissance = t.value; renderWz(); }
});

window.act = act = async function(a, ds){
  const v = ds.v;
  if (a === "tab") { P.muscle = null; if (ds.seg) P.seg = ds.seg; if (v === "nutrition" && !P.nutDay) P.nutDay = today(); }
  if (!a.startsWith("px-")) return _act(a, ds);
  const mid = memberId();
  switch (a) {
    case "px-seg": P.seg = v; P.muscle = null; return;
    case "px-vue": P.vue = P.vue === "face" ? "dos" : "face"; return;
    case "px-per": P.periode = v; return;
    case "px-muscle": P.muscle = v || null; if (v && !(P.vue === "face" ? FACE : DOS).includes(v)) P.vue = P.vue === "face" ? "dos" : "face"; return;
    case "px-nday": P.nutDay = v; return;
    case "px-nweek": P.nutDay = iso(addD(parseIso(P.nutDay || today()), Number(v))); return;
    case "px-add": P.sheet = {type: "add", r: v || (new Date().getHours() < 10 ? "matin" : new Date().getHours() < 15 ? "midi" : new Date().getHours() < 18 ? "collation" : "soir"), x: 1}; return;
    case "px-repas": P.sheet.r = v; return;
    case "px-qx": P.sheet.x = Number(v); return;
    case "px-close": P.sheet = null; return;
    case "px-ali": { const al = ALIMENTS[Number(v)], x = P.sheet.x || 1, day = P.nutDay || today(), j = jourDoc(day);
      const it = {id: rid(8), r: P.sheet.r, n: al[0] + (x !== 1 ? ` ×${fr(x, 1)}` : "") + ` (${al[1]})`, kcal: r0(al[2] * x), p: +(al[3] * x).toFixed(1), g: +(al[4] * x).toFixed(1), l: +(al[5] * x).toFixed(1)};
      if (await saveJour(day, {repas: [...(j?.repas || []), it]})) toast(`${al[0]} ajouté`); return; }
    case "px-manuel": { const s = P.sheet, day = P.nutDay || today(), j = jourDoc(day);
      if (!(num(s.kcal) > 0)) return toast("Indique au moins les calories.");
      const it = {id: rid(8), r: s.r, n: String(s.n || "Repas").trim().slice(0, 60), kcal: r0(num(s.kcal)), p: num(s.p), g: num(s.g), l: num(s.l)};
      if (await saveJour(day, {repas: [...(j?.repas || []), it]})) { P.sheet = null; toast("Ajouté"); } return; }
    case "px-del": { const day = P.nutDay || today(), j = jourDoc(day); await saveJour(day, {repas: (j?.repas || []).filter(x => x.id !== v)}); return; }
    case "px-eau": { const day = P.nutDay || today(), cur = jourDoc(day)?.eau || 0, n = Number(v); await saveJour(day, {eau: n === cur ? n - 1 : n}); return; }
    case "px-forme": P.sheet = {type: "forme", f: {...(jourDoc(today())?.forme || {})}}; return;
    case "px-fset": P.sheet.f[ds.k] = Number(v); return;
    case "px-fsave": { const f = P.sheet.f, sc = r0(["sommeil", "energie", "courbatures", "moral"].reduce((t, k) => t + (f[k] - 1) / 4, 0) / 4 * 100);
      if (await saveJour(today(), {forme: {sommeil: f.sommeil, energie: f.energie, courbatures: f.courbatures, moral: f.moral, score: sc, at: Date.now()}})) { P.sheet = null; toast("Forme notée 👍"); } return; }
    case "px-mesure": P.sheet = {type: "mesure", f: {date: today()}}; return;
    case "px-msave": { const f = P.sheet.f, zones = {}; for (const [k] of ZONES) { const x = num(f["z." + k]); if (x > 0) zones[k] = x; }
      const poids = num(f.poids); if (!poids && !Object.keys(zones).length) return toast("Remplis au moins ton poids ou une mesure.");
      const doc = {type: "mesure", auteur: "adherent", seance: null, at: Date.now(), date: f.date || today(), zones}; if (poids) doc.poids = poids;
      if (await run(S.db.doc(`members/${mid}/notes/m-${Date.now()}`).set(doc), "Relevé enregistré 📏")) P.sheet = null; return; }
    case "px-pdel": if (!confirm("Supprimer cette photo ?")) return; if (await run(S.db.doc(`members/${mid}/photos/${v}`).delete(), "Photo supprimée")) { P.photos = null; chargerPhotos(); } return;
    case "px-ask": P.sheet = {type: "ask", t: v || ""}; return;
    case "px-askchip": P.sheet.t = v; return;
    case "px-asksend": { const t = String(P.sheet.t || "").trim(); if (!t) return toast("Écris ton message.");
      if (await run(S.db.collection(`members/${mid}/notes`).add({seance: null, auteur: S.owner ? "coach" : "adherent", type: "question", texte: t.slice(0, 1500), at: Date.now(), suivante: false}), "Message envoyé à Nathanael 👍")) P.sheet = null; return; }
    /* intro pas à pas */
    case "px-wz": ouvrirWz(v); P.introLater = false; return;
    case "px-wclose": P.wz = null; P.introLater = true; return;
    case "px-wback": if (P.wz.i > 0) P.wz.i--; else { P.wz = null; P.introLater = true; } return;
    case "px-wnext": { const steps = wzSteps(), st = steps[P.wz.i];
      if (!wzValide(st, P.wz.d)) return;
      if (st.k === "fin" || st.k === "finNut") return wzFin();
      P.wz.i = Math.min(P.wz.i + 1, wzSteps().length - 1); return; }
    case "px-wpick": { const steps = wzSteps(), st = steps[P.wz.i]; P.wz.d[st.id] = v;
      if (st.k === "single" || st.k === "sexe") setTimeout(() => { if (P.wz && wzSteps()[P.wz.i] === st) { P.wz.i = Math.min(P.wz.i + 1, wzSteps().length - 1); renderWz(); } }, 260);
      return; }
    case "px-wtog": { const st = wzSteps()[P.wz.i], cur = [...(P.wz.d[st.id] || [])], i = cur.indexOf(v);
      if (i >= 0) cur.splice(i, 1); else { if (st.excl) { if (v === st.excl) cur.length = 0; else { const e = cur.indexOf(st.excl); if (e >= 0) cur.splice(e, 1); } } if (st.max && cur.length >= st.max) return toast(`${st.max} maximum`); cur.push(v); }
      P.wz.d[st.id] = cur; return; }
    case "px-wstep": { const st = wzSteps()[P.wz.i], cur = num(P.wz.d[st.id]) || st.def(P.wz.d); P.wz.d[st.id] = Math.max(st.min, Math.min(st.max, +(cur + Number(v) * st.pas).toFixed(1))); return; }
    case "px-wvise": P.wz.d.poidsVise = Math.max(30, Math.min(250, +(num(P.wz.d.poidsVise) + Number(v)).toFixed(1))); return;
    case "px-wnovise": P.wz.d.poidsVise = null; P.wz.i = Math.min(P.wz.i + 1, wzSteps().length - 1); return;
    /* coach */
    case "px-ncoach": { const k = "pxn.", g = f => S.drafts[k + f], m = S.cur.member, c = cibles(profil(), m) || {};
      const n = {kcal: num(g("kcal") ?? c.kcal), p: num(g("p") ?? c.p), g: num(g("g") ?? c.g), l: num(g("l") ?? c.l), mot: String(g("mot") ?? m.nutrition?.mot ?? "").trim().slice(0, 400)};
      if (!(n.kcal > 0)) return toast("Indique les calories.");
      if (await run(S.db.doc("members/" + S.fiche).update({nutrition: n}), "Cibles enregistrées")) clearDrafts(k); return; }
    case "px-nauto": if (await run(S.db.doc("members/" + S.fiche).update({nutrition: firebase.firestore.FieldValue.delete()}), "Retour au calcul auto")) clearDrafts("pxn."); return;
  }
};
})();
