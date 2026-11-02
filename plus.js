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
   Planche anatomique façon écorché, rendu néon : les muscles remplissent tout le corps, les tendons sont clairs,
   une texture de fibres et un éclairage en relief. Moitié gauche de l'écran dessinée, l'autre en miroir. viewBox 0 0 200 400. */
const BRAS = {
  avantbras: ["M44,149 C41,158 39,168 38.5,178 C38.5,186 39,193 40,200 L43,201 C43,190 44.5,176 47,164 C48,158 48,153 47,149 Z",
              "M48.5,150 C48,160 46.5,172 45,184 C44.5,191 44.5,197 45,201 L47.5,201 C49,190 52,176 55,162 C56,156 56.5,151 56,148 C53,148 50.5,149 48.5,150 Z"]};
const HALF = {
  face: {
    trapezes: ["M90,52 C89.5,58 87.5,63 84,66 C78,68 71,69 65,70 C73,71.5 83,72 92,71.5 C93,65 92,58 91,53 Z", "M91.5,49 C93.5,56 96,63 98.8,70 L96.3,71 C93.8,64 91.5,57 90.2,51 Z"],
    epaules: ["M64,70 C54,70 46,77 44.5,89 C43.5,98 44.5,107 48,114 C51,104 53,94 57,86 C59,79 61,74 64,70 Z",
              "M66.5,71 C73,72 78.5,74.5 80.5,78.5 C77,87 71,93 64.5,99 C60.5,103 56.5,108 53.5,113 L49,114 C51.5,104 53.5,94 57.5,86 C59.5,79 62.5,74 66.5,71 Z"],
    pecs: ["M99,75 C92,74.5 85.5,75 81.5,79 C79,82 77,85 75,88.5 C83,87.5 91,88.5 99,90.5 Z",
           "M99,92.5 C91,90.5 82.5,89.5 74,90.5 C71,93.5 68.5,96.5 66,99.5 C68,104 72,108 77,110.5 C84,113.5 92,113.5 99,111.5 Z"],
    biceps: ["M55,111 C50,118 47,127 46.5,136 C46.5,142 48.5,146 52,147 C56,145 59,138 60.5,128 C61.5,120 61,114 59,110 C57.5,109.5 56,110 55,111 Z",
             "M47.5,115 C45.5,123 44.5,132 44.5,140 C45,145 46.5,147 48.5,148 C47,142 46.8,136 46.8,130 C47.2,124 48.2,119 49.8,115 Z"],
    triceps: ["M61.5,112 C63,120 62.5,130 60,140 C59,143 58,145 56.5,147 C59.5,140 61.2,130 61.2,120 Z"],
    ...BRAS,
    dorsaux: ["M69.5,108.5 C70.5,120 72,133 74,146 C75.5,138 76,128 75.8,119 C74,114 72,110.5 69.5,108.5 Z"],
    obliques: ["M76,108 C79,108.5 82,109.6 83.5,111.4 C82.8,113.4 81,114.8 78.6,115 C77.2,114.4 76.3,113 75.9,111.4 Z",
               "M76.2,117 C79.3,117.4 82.4,118.5 84,120.3 C83.3,122.4 81.5,123.8 79,124 C77.5,123.4 76.6,122 76.2,120.4 Z",
               "M76.6,126 C79.6,126.4 82.6,127.5 84.2,129.3 C83.5,131.3 81.8,132.7 79.4,132.9 C78,132.4 77.1,131 76.7,129.4 Z",
               "M76.5,135.5 C75.5,146 76.3,157 78.3,166 C80,172.5 83,177 87,180 C86.4,165 86,150 86.3,136.5 C82.8,134.5 79.5,134.5 76.5,135.5 Z"],
    abdos: ["M98,112.5 C94.5,112 91,112.6 89,114.2 C88.2,117.8 88.4,121.8 89.6,125.2 C92.6,126 95.4,126.2 98,125.8 Z",
            "M98,127.8 C94.8,127.4 91.4,127.7 89,128.8 C88.1,132.4 88.2,136.6 89.2,140.2 C92.2,141.2 95.3,141.4 98,141 Z",
            "M98,142.9 C94.8,142.5 91.5,142.8 89.1,143.9 C88.3,147.6 88.4,151.8 89.4,155.4 C92.4,156.4 95.4,156.6 98,156.2 Z",
            "M98,158.2 C94.8,157.8 91.7,158.1 89.6,159.3 C89.3,167 92,176 98,184 Z"],
    quadriceps: ["M74,172 C71,180 69,188 68.5,198 C71,196 74,194 77,193 C77,186 76.5,179 74,172 Z",
                 "M71.8,200 C71,221 71.5,243 73.5,263 C75,273 77.5,280.5 80.8,284 C81.6,266 81.2,244 80.6,224 C80.1,212 78.8,203 77.2,196 C75.2,197 73.4,198.4 71.8,200 Z",
                 "M79.6,195 C83.6,207 87.3,224 88.6,244 C89.2,256 88,266 85.8,273 C83.4,266 82.4,254 82.2,240 C82,224 81.2,208 79.6,195 Z",
                 "M78.2,188 C80.2,187 82.2,188 83.2,190 C87.2,208 91.2,228 94.7,252 L92.6,254 C88.4,232 83.6,212 78.2,188 Z",
                 "M91.2,249 C95.7,257 97.2,267 95.2,277 C93.2,283 88.7,286 86.2,283 C88.7,273 90.2,261 91.2,249 Z"],
    adducteurs: ["M85.5,195 C91.5,199 96.8,205 99,213 C98.6,226 97.2,238 95,249 C91.2,231 88,213 83.8,197 Z"],
    mollets: ["M72.6,300 C70.1,312 70.1,326 72.1,340 C73.1,348 74.6,356 76.1,362 C75.1,346 74.6,330 74.6,314 C74.6,308 73.6,303 72.6,300 Z",
              "M76.2,298 C74.6,312 74.6,328 76.4,344 C77.4,352 79.2,360 81,366 L83.6,366 C83.2,348 83.2,326 83.6,306 C81.8,302 79.2,299 76.2,298 Z",
              "M86.6,298 C90.6,306 92.1,318 91.1,332 C90.6,342 89.1,350 87.1,356 C86.1,342 85.6,326 85.6,312 C85.6,306 86.1,301 86.6,298 Z"]},
  dos: {
    trapezes: ["M99,52 C95,58 88,64 66,70 C78,74 89,80 99,92 Z", "M99,94 C92,86 84,80 74.5,78 C79,90 88,104 99,124 Z"],
    epaules: ["M64,70 C54,70 46,77 44.5,89 C43.5,98 44.5,107 48,114 C52,104 58,94 68,86 C70,80 68,74 64,70 Z"],
    dorsaux: ["M70.5,87 C66.5,93 66.5,101 69.5,107.5 C77.5,106.5 85.5,103.5 91.5,100.5 C85.5,92.5 78.5,88.5 70.5,87 Z",
              "M69.5,110 C69.5,125 72.5,141 78.5,155 C83.5,163 89.5,168 95.5,170 L95.5,129 C87.5,121 78.5,114 69.5,110 Z"],
    triceps: ["M48.5,115 C45,123 44,133 44.5,141 C45.5,146 48.5,148 52,147 C52.5,136 52.5,124 51.5,115 Z",
              "M54,111 C56,122 56,134 54.5,147 C58.5,146 61,139 62,129 C62.5,120 60.5,113 55.5,110 Z"],
    ...BRAS,
    obliques: ["M76.5,152 C74.5,162 75,171 76.5,179 L89.5,181 C85.5,173 80.5,163 78.5,154 Z"],
    lombaires: ["M99,125 L97,127 L97,171 C95,176 93.6,181 93.6,186 L99,189 Z"],
    fessiers: ["M86,186.5 C79,186.5 73,190.5 70,198.5 C77,197.5 86,197.5 97,199.5 C96,193.5 92,188.5 86,186.5 Z",
               "M99,201 C88,199 77,200 70.5,206 C67.5,215 68.5,225 74,232 C81,238 91,238 99,235 Z"],
    adducteurs: ["M98.8,238 C98.8,246 98.4,254 97.6,260 C96.2,252 95.4,245 95.2,239 C96.6,238.8 97.8,238.5 98.8,238 Z"],
    ischios: ["M71.5,235 C70,251 71,267 74,281 C76,287 79,291 83,293 C83.5,275 84,255 84.5,239 C80,239 75.5,237 71.5,235 Z",
              "M86.5,239 C86.5,257 86.5,275 85.5,293 C90,293 93.5,288 95,281 C96.3,272 97,263 97.3,254 C96,248 95,243 94.5,239 C91.8,239.5 89,239.5 86.5,239 Z"],
    mollets: ["M74,297 C69.5,307 68.5,321 70.5,333 C72.5,341 76,345 80.5,343 C81.5,327 81.5,313 80.5,299 Z",
              "M83,299 C84,313 84,329 83,345 C88,347 92,342 93,333 C94,319 92.5,307 88.5,299 Z",
              "M70.5,336 C71.5,348 73.5,357 76,364 L87.5,364 C89,356 90.3,347 91.6,338 C88,346 76.5,348 70.5,336 Z"]}
};
/* silhouette complète (moitié) */
const SIL = "M91,47 C91,55 90,60 88,64 C82,67 72,68 63,70 C53,72 46,79 44,90 C42,101 43,112 44,122 C42,132 41,140 41,148 C39,160 37,172 37,184 C36,192 36,198 37,204 C35,210 34.5,217 36.5,221.5 C39.5,226.5 46,226 48.5,221 C50,216 49.5,209 47.5,203 C49.5,190 51.5,176 54.5,162 C56.5,154 58.5,148 58.5,142 C60.5,132 61.5,122 63.5,114 C65,110 67,108.5 69.5,108 C70.5,122 72.5,138 74.5,150 C75.5,158 76.5,166 75.5,172 C72,180 69,190 67.8,202 C66,220 66,242 69,262 C70.5,272 72,280 73,288 C70.5,298 69,312 69.5,327 C70.5,343 73,356 75,366 C73,374 70,382 70.5,388 C72.5,394 84,395.5 90,392.5 C91,385 90,376 88.5,368 C90.5,349 92.5,327 92.5,307 C92.5,299 93,293 94,287 C96,265 98,239 99.2,215 L100,209 L100,47 Z";
/* tendons et aponévroses (clairs), mains, pieds, tête */
const TEN = {
  face: "M87.5,111 L100,111 L100,194 C95,190 90,184 87,178 Z M87,178 C90,187 95,197 100,207 L100,193 C95,189 90,184 87,178 Z M66,70 C78,71 90,71.8 99,72 L99,74.6 C90,74.2 79,73.6 68,72.2 Z M44,145 C47,147.5 52,148.4 57,147 L56,151 C52,152 47,151.4 44,149 Z M38,199.5 L48,200.5 L47.6,205 L37.6,204 Z M37.6,204 C35,209 34.5,216 36.5,221 C39.5,226 45.5,226 48,221.5 C49.5,217 49,211 47.6,205 Z M67.8,201 C66.4,221 66.8,243 69.6,264 L72.4,264 C70.4,243 70.4,221 71.6,201 Z M77.6,284 C79.6,279.5 87.6,279.5 89.8,284 C91,290 89.4,296.5 84,298.6 C78.6,296.5 76.6,290 77.6,284 Z M83.8,304 L85.6,304 L85.6,363 L83.8,365 Z M75.6,364.5 L88.4,364.5 L88.6,370.5 L75.4,370.5 Z M75.4,370.5 C72.4,377 70.4,384 70.8,388.5 C72.8,394 84,395.4 89.8,392.4 C90.6,385 89.8,377.5 88.6,370.5 Z",
  dos: "M93.6,186 C95.4,180 96.8,174 97,171 L100,168 L100,195 Z M48,147 C51,149 55,149.4 58,147.4 L57,152.4 C54,153.4 50,153.2 48,151 Z M38,199.5 L48,200.5 L47.6,205 L37.6,204 Z M37.6,204 C35,209 34.5,216 36.5,221 C39.5,226 45.5,226 48,221.5 C49.5,217 49,211 47.6,205 Z M67.6,206 C66.4,226 66.8,248 69.8,270 L72.4,270 C70.2,248 70,226 70.6,206 Z M76,286 C80,290 88,291 94,288 L93.4,294 C88,297 80,296 75.6,292 Z M78.4,363.5 L86.8,363.5 L86,371 L79.2,371 Z M75.6,371 L88.4,371 L88.6,375 L75.4,375 Z M75.4,375 C72.4,380 70.6,385 70.8,388.5 C72.8,394 84,395.4 89.8,392.4 C90.6,386 89.8,380 88.6,375 Z"};
const TETE_D = "M100,6 C89,6 84.5,14 84.5,25 C84.5,35 87.5,43 93.5,47.5 L106.5,47.5 C112.5,43 115.5,35 115.5,25 C115.5,14 111,6 100,6 Z";
const VISAGE = `<path d="M91.5,25 C93.5,23.5 96,23.5 97.5,25 M102.5,25 C104,23.5 106.5,23.5 108.5,25 M97.5,33 C99,34 101,34 102.5,33 M95,39.5 C98,41 102,41 105,39.5 M88,30 C89,38 92,44 96,47 M112,30 C111,38 108,44 104,47"/>`;
const DECO = {
  face: `<path d="M100,72 L100,194"/><path d="M89,113 L98,113"/>`,
  dos: `<path d="M100,56 L100,192"/><path d="M93,198 C95,194 98,192 100,192"/>`};
const DEFS = `<defs><radialGradient id="pxsh" cx=".4" cy=".32" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".45" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
  <linearGradient id="pxsil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(var(--a1r))" stop-opacity=".14"/><stop offset=".6" stop-color="rgb(var(--a2r))" stop-opacity=".08"/><stop offset="1" stop-color="rgb(var(--a1r))" stop-opacity=".04"/></linearGradient>
  <radialGradient id="pxaura" cx=".5" cy=".42" r=".5"><stop offset="0" stop-color="rgb(var(--a1r))" stop-opacity=".22"/><stop offset="1" stop-color="rgb(var(--a1r))" stop-opacity="0"/></radialGradient>
  <filter id="pxfib" x="-15%" y="-5%" width="130%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9 .045" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.9 1.08" result="s"/><feComposite in="s" in2="SourceGraphic" operator="in" result="f"/>
    <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="f"/></feMerge></filter></defs>`;
/* points des articulations sensibles (vue de face : la gauche de la personne est à droite de l'écran) */
const JOINTS = {
  "Genou gauche": {face: [116, 289], dos: [84, 290]}, "Genou droit": {face: [84, 289], dos: [116, 290]},
  "Épaule gauche": {face: [148, 88], dos: [52, 88]}, "Épaule droite": {face: [52, 88], dos: [148, 88]},
  "Bas du dos": {dos: [100, 176]}, "Nuque / haut du dos": {dos: [100, 60], face: [100, 58]},
  "Hanche": {face: [130, 198], dos: [130, 198]}, "Cheville / pied": {face: [118, 367], dos: [118, 367]},
  "Poignet / coude": {face: [157, 172], dos: [43, 172]}};
const MIR = `transform="translate(200,0) scale(-1,1)"`;
function bodySVG(vue, fills, o = {}){
  const half = HALF[vue], tap = !!o.tap, mini = /mini/.test(o.cls || "");
  const part = (k, d, mir) => { const f = fills[k], sel = o.sel === k, m = mir ? MIR : "";
    return `<g class="px-m ${f ? "on" : ""} ${sel ? "sel" : ""}" style="${f ? `--f:${f}` : ""}" ${tap ? `data-a="px-muscle" data-v="${k}"` : ""}><path d="${d}" ${m}/><path class="px-sh" d="${d}" ${m}/></g>`; };
  const muscles = Object.entries(half).map(([k, ds]) => ds.map(d => part(k, d, false) + part(k, d, true)).join("")).join("");
  const joints = (o.joints || []).map(z => { const p = JOINTS[z]?.[vue]; return p ? `<circle class="px-j" cx="${p[0]}" cy="${p[1]}" r="9"/><circle class="px-jc" cx="${p[0]}" cy="${p[1]}" r="3.5"/>` : ""; }).join("");
  return `<svg class="px-body ${o.cls || ""}" viewBox="${o.vb || "0 0 200 400"}" role="img" aria-label="${o.label || "Corps, vue de " + (vue === "face" ? "face" : "dos")}">${DEFS}
    <ellipse class="px-aura" cx="100" cy="200" rx="95" ry="200" fill="url(#pxaura)"/>
    <g class="px-sil"><path d="${SIL}"/><path d="${SIL}" ${MIR}/><path d="${TETE_D}"/></g>
    <g class="px-ten"><path d="${TEN[vue]}"/><path d="${TEN[vue]}" ${MIR}/></g>
    <g class="px-mus" ${mini ? "" : `filter="url(#pxfib)"`}>${muscles}</g>
    <g class="px-deco">${DECO[vue]}</g>${o.extra || ""}${joints}</svg>`;
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
