/* © 2026 Fitzora (Nathanael Neuville). Tous droits réservés.
   Analyse morphologique par photos (05/11/2026, méthode NN : Base coaching § 2.7). Chargé après orvea.js.
   - Carte « Analyse ta morphologie » dans l'onglet Séances (formules Training et Premium, 18 ans et plus).
   - 3 photos guidées à l'appareil photo : face relâché, face pecs serrés, dos double biceps → note {type:"morpho", imgs}.
     Le serveur (functions-orvea/morpho.js) répond dans notes/<id>-r {type:"morpho-r"} et efface les photos.
   - Pendant les séances (liste et séance guidée), chaque exercice concerné affiche « 🧬 Pour ta morpho : … ».
   - Le cycle suivant est écrit en tenant compte de l'analyse (functions-orvea/programme.js). */
(function(){
"use strict";
const NOMS = {pecs: "Pectoraux", dos: "Dos", epaules: "Épaules", biceps: "Biceps", triceps: "Triceps", quadriceps: "Quadriceps", ischios: "Ischios", mollets: "Mollets", fessiers: "Fessiers", abdos: "Abdos et taille"};
const EMO = {pecs: "🫁", dos: "🦅", epaules: "🎯", biceps: "💪", triceps: "💪", quadriceps: "🦵", ischios: "🦵", mollets: "🦶", fessiers: "🍑", abdos: "🧱"};
/* nom d'exercice → groupe (l'ordre compte : « leg curl » avant « curl », « face pull » avant « tirage ») */
const RE = [
  ["epaules", /élévation|elevation|militaire|landmine press|développé (vertical|épaules|arnold)|oiseau|face ?pull|arnold|overhead|deltoïde/i],
  ["ischios", /roumain|\brdl\b|soulevé de terre|leg curl|ischio|good ?morning|nordic/i],
  ["mollets", /mollet|calf/i],
  ["fessiers", /hip thrust|\bpont\b|fessier|abduction|glute|kickback (fess|jambe|poulie)|donkey|clamshell|monster walk|frog|curtsy/i],
  ["triceps", /triceps|barre au front|extension (nuque|au-dessus|poulie|bras|haltère)|kickback|pompes? (serrées|diamant)/i],
  ["biceps", /curl|biceps/i],
  ["pecs", /développé|pompe|écarté|ecarte|dips|pec|chest|bench|butterfly/i],
  ["dos", /rowing|tirage|traction|pull-?over|pull-?down|pull-?up|chin|dorsa|superman|tirage/i],
  ["quadriceps", /squat|fente|split|step-?up|presse|leg extension|chaise|sissy|lunge/i],
  ["abdos", /crunch|gainage|planche|dead ?bug|relevé de jambes|abdo|hollow|pallof|vacuum|bird ?dog/i]];
const groupeDe = n => (RE.find(([, re]) => re.test(n || "")) || [])[0] || null;

const M = {i: 0, imgs: [null, null, null], ok: false, open: false};
const ETAPES = [
  ["Face, relâché", "De face, bras le long du corps, debout naturellement.", "🧍"],
  ["Face, pecs serrés", "De face, bras un peu écartés devant toi, serre les pectoraux 3 secondes.", "🫸"],
  ["Dos, double biceps", "De dos, bras pliés à hauteur des épaules, serre le dos et les bras.", "🔙"]];

const notesM = () => (S.cur && S.cur.notes || []);
const derniere = () => notesM().filter(n => n.type === "morpho-r").sort((a, b) => (a.at || 0) - (b.at || 0)).pop() || null;
const analyse = () => { const r = derniere(); return r && r.utilisable && (r.groupes || []).length ? r : null; };
const enCours = () => { const d = notesM().filter(n => n.type === "morpho").sort((a, b) => (a.at || 0) - (b.at || 0)).pop();
  return d && !notesM().some(n => n.id === d.id + "-r") && Date.now() - (d.at || 0) < 4 * 60e3 ? d : null; };
function age(){ const p = notesM().find(n => n.id === "profil") || {}, o = notesM().filter(n => n.type === "objectifs").pop()?.reponses || {};
  if (p.naissance) { const b = new Date(p.naissance + "T12:00:00"); return (Date.now() - b) / (365.25 * 864e5); } return Number(o.age) || null; }
const mineur = () => { const a = age(); return a != null && a < 18; };

/* ---------- carte dans l'onglet Séances ---------- */
function carte(){
  if (!S.cur || !S.cur.member || mineur() || (typeof isCoachUI === "function" && isCoachUI())) return "";
  const ac = OV.acces(S.cur.member);
  if (!ac.entrainement) return `<section class="sec"><button class="card tap mo-card lock" data-a="tab" data-v="offres"><span class="px-emo">🧬</span><b>Analyse ta morphologie · Training et Premium</b><span class="small muted">3 photos, et chaque exercice s'adapte à tes proportions : angle, prise, amplitude.</span></button></section>`;
  if (enCours()) return `<section class="sec"><div class="card mo-card"><span class="ov-spin" aria-hidden="true"></span><b>On analyse ta morphologie…</b><span class="small muted">Compte 30 secondes à 1 minute. Tes photos sont effacées juste après.</span></div></section>`;
  const r = derniere(), a = analyse();
  if (a) return `<section class="sec"><div class="card mo-card"><div class="mo-h"><span class="px-emo">🧬</span><div><span class="eyebrow">Ta morphologie</span><b>Tes exercices sont adaptés à ta structure</b></div></div>
    <p class="small">${esc(a.resume)}</p>
    <details class="mo-det"><summary>Voir les conseils par muscle (${a.groupes.length})</summary>${a.groupes.map(x => `<div class="mo-g"><b>${EMO[x.g] || "•"} ${esc(NOMS[x.g] || x.g)}</b><span class="small muted">${esc(x.observe)}</span><span class="small">${esc(x.conseil)}</span></div>`).join("")}</details>
    <span class="small muted">Ces conseils s'affichent sous chaque exercice concerné, et ton prochain cycle en tient compte. Si un conseil ne colle pas à ce que tu ressens, fie-toi à ton ressenti.</span>
    <button class="btn sm ghost" data-a="mo-open" style="align-self:flex-start">Refaire l'analyse</button></div></section>`;
  const err = r && !r.utilisable ? `<span class="small mo-err">${esc(r.erreur || r.resume || "Analyse impossible avec ces photos.")}</span>` : "";
  return `<section class="sec"><button class="card tap mo-card" data-a="mo-open"><span class="px-emo">🧬</span><b>Analyse ta morphologie</b>
    <span class="small muted">La longueur de tes bras, la largeur de tes épaules, l'orientation de tes muscles changent l'angle idéal de chaque exercice. 3 photos, et on te dit comment pousser et tirer dans le bon axe.</span>${err}<span class="ov-go">${r ? "Reprendre les photos" : "Commencer"} ›</span></button></section>`;
}

/* ---------- prise des 3 photos ---------- */
function feuille(){
  let el = document.getElementById("mo-sh");
  if (!M.open) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement("div"); el.id = "mo-sh"; el.className = "px-sh"; document.body.appendChild(el); }
  const i = M.i, [t, aide, emo] = ETAPES[i], img = M.imgs[i], tout = M.imgs.every(Boolean);
  el.innerHTML = `<div class="px-sh-in mo-sh"><div class="px-sh-top"><b>Analyse morphologique · ${i + 1}/3</b><button class="px-x" data-a="mo-close">Fermer</button></div>
    <div class="mo-steps">${ETAPES.map((e, k) => `<button class="${k === i ? "on" : ""} ${M.imgs[k] ? "done" : ""}" data-a="mo-step" data-v="${k}">${M.imgs[k] ? "✓" : k + 1}</button>`).join("")}</div>
    ${i === 0 && !M.imgs.some(Boolean) ? `<div class="mo-guide"><b>Pour une bonne analyse</b><ul><li>Torse nu ou brassière, short : on doit voir la forme des muscles.</li><li>Mur uni, bonne lumière, téléphone posé à 2 à 3 m, à hauteur du nombril.</li><li>Corps entier dans la photo, de la tête aux genoux au moins.</li><li>Demande à quelqu'un de prendre la photo, ou utilise le retardateur.</li></ul></div>` : ""}
    <div class="mo-shot"><span class="mo-emo">${emo}</span><b>${esc(t)}</b><span class="small muted">${esc(aide)}</span>
      ${img ? `<img src="${img}" alt="Photo ${i + 1}">` : ""}
      <div class="px-pr-btns"><label class="btn ${img ? "ghost" : "solid"}">📸 ${img ? "Reprendre" : "Prendre la photo"}<input type="file" accept="image/*" capture="environment" data-mo-file="${i}" hidden></label>
        <label class="btn ghost">🖼️ Choisir dans mes photos<input type="file" accept="image/*" data-mo-file="${i}" hidden></label></div></div>
    ${tout ? `<label class="mo-ok"><input type="checkbox" data-mo-ok="1" ${M.ok ? "checked" : ""}> <span class="small">J'accepte que mes 3 photos soient analysées. Elles sont effacées juste après : seul le résultat reste dans mon espace.</span></label>
      <button class="btn solid" data-a="mo-send" ${M.ok ? "" : "disabled"}>Analyser ma morphologie</button>`
      : img ? `<button class="btn solid" data-a="mo-step" data-v="${M.imgs.findIndex(x => !x)}">Photo suivante ›</button>` : ""}
    <span class="small muted">Réservé aux 18 ans et plus. Aucun jugement sur ton physique : on regarde tes proportions pour régler tes exercices.</span></div>`;
}
async function compresser(file){
  const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = URL.createObjectURL(file); });
  const k = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  let q = .72, data = c.toDataURL("image/jpeg", q); while (data.length > 280000 && q > .3) { q -= .1; data = c.toDataURL("image/jpeg", q); }
  return data;
}
document.addEventListener("change", async e => {
  const t = e.target;
  if (t.dataset && t.dataset.moOk) { M.ok = t.checked; return feuille(); }
  if (!t.dataset || t.dataset.moFile === undefined || !t.files || !t.files[0]) return;
  const i = Number(t.dataset.moFile);
  try { M.imgs[i] = await compresser(t.files[0]); const n = M.imgs.findIndex(x => !x); if (n >= 0 && n !== i) M.i = n; }
  catch (err) { toast("Photo illisible : réessaie."); }
  t.value = ""; feuille();
});

/* ---------- conseils pendant les exercices ---------- */
function astuces(){
  const a = analyse(); if (!a) return;
  const par = Object.fromEntries(a.groupes.map(x => [x.g, x.conseil]));
  const tip = g => { const p = document.createElement("p"); p.className = "mo-tip"; p.textContent = "🧬 Pour ta morpho : " + par[g]; return p; };
  document.querySelectorAll(".ex:not([data-mo])").forEach(ex => {
    ex.dataset.mo = "1"; const g = groupeDe(ex.querySelector(".n")?.textContent); if (!g || !par[g]) return;
    let s = ex.nextElementSibling; while (s && !s.classList.contains("exbas") && !s.classList.contains("ex")) s = s.nextElementSibling;
    if (s && s.classList.contains("exbas")) s.prepend(tip(g));
  });
  document.querySelectorAll(".go-card:not([data-mo])").forEach(c => {
    c.dataset.mo = "1"; const h = c.querySelector("h3"), g = groupeDe(h && h.textContent); if (!g || !par[g]) return;
    const d = c.querySelector(".go-dose") || h; d.after(tip(g));
  });
}
let planifie = 0;
new MutationObserver(() => { if (planifie) return; planifie = requestAnimationFrame(() => { planifie = 0; try { astuces(); } catch (e) {} }); })
  .observe(document.body, {childList: true, subtree: true});

/* ---------- styles ---------- */
const st = document.createElement("style");
st.textContent = `.mo-card{gap:8px}.mo-card b{font-size:17px}.mo-h{display:flex;gap:10px;align-items:center}.mo-h>div{display:flex;flex-direction:column}
.mo-det summary{cursor:pointer;color:var(--a1l);font-weight:700;font-size:14px;margin:4px 0}
.mo-g{display:flex;flex-direction:column;gap:2px;padding:8px 0;border-top:1px solid rgba(var(--ov),.08)}
.mo-err{color:var(--warn)}.mo-tip{margin:6px 0 2px;padding:8px 10px;border-radius:12px;background:rgba(var(--a1r),.1);border:1px solid rgba(var(--a1r),.25);font-size:13.5px;line-height:1.35;text-align:left;width:100%}
.mo-steps{display:flex;gap:8px;justify-content:center}.mo-steps button{width:34px;height:34px;border-radius:50%;border:1px solid rgba(var(--ov),.2);background:transparent;color:var(--ink);font-weight:700}
.mo-steps button.on{border-color:var(--a1);box-shadow:0 0 0 2px rgba(var(--a1r),.35)}.mo-steps button.done{background:var(--a1);color:#fff;border-color:var(--a1)}
.mo-guide{background:rgba(var(--ov),.05);border-radius:16px;padding:10px 14px;font-size:14px}.mo-guide ul{margin:6px 0 0;padding-left:18px}
.mo-shot{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}.mo-emo{font-size:40px}
.mo-shot img{max-height:240px;max-width:100%;border-radius:14px;object-fit:contain}
.mo-ok{display:flex;gap:8px;align-items:flex-start}.mo-ok input{margin-top:3px}`;
document.head.appendChild(st);

/* ---------- branchements ---------- */
const _vue = OV.vueSeances;
OV.vueSeances = function(v){ return _vue(v) + carte(); };
const _render = render;
window.render = render = function(f){ _render(f); feuille(); };
const _act = act;
window.act = act = async function(a, ds){
  if (!a.startsWith("mo-")) return _act(a, ds);
  const v = ds.v;
  switch (a) {
    case "mo-open": Object.assign(M, {open: true, i: 0, imgs: [null, null, null], ok: false}); return;
    case "mo-close": M.open = false; return;
    case "mo-step": M.i = Math.max(0, Math.min(2, Number(v) || 0)); return;
    case "mo-send": { if (!M.imgs.every(Boolean) || !M.ok) return;
      const id = "mo-" + Date.now();
      if (await run(S.db.doc(`members/${memberId()}/notes/${id}`).set({type: "morpho", auteur: "adherent", seance: null, at: Date.now(), imgs: [...M.imgs]}), "Photos envoyées : l'analyse arrive (30 s à 1 min)")) {
        Object.assign(M, {open: false, imgs: [null, null, null], ok: false}); S.tab = "seances"; }
      return; }
  }
};
window.MO = {groupeDe, analyse};
})();
