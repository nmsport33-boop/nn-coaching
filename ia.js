/* © 2026 Nathanael Neuville, NN Coaching. Tous droits réservés.
   Assistant (02/11/2026) : une appli avec un coach derrière. L'assistant répond à l'adhérent à partir de son
   programme et de ses retours ; il ne change jamais rien lui-même : chaque changement part en proposition
   que Nathanael valide ou refuse dans la fiche. Chargé après plus.js.
   Données : notes/ia-<horodatage> {type:"ia", auteur, seance:null, q, at}  (écrite par l'adhérent, sans « texte » : pas de SMS)
             notes/<id>-r {type:"ia-r", auteur:"assistant", pour, r, prop:{quoi,titre,detail}|null, statut:"attente"|"validee"|"refusee", mot, alerte, pourCoach}
             (écrite par la fonction serveur, voir functions/ ; l'adhérent ne peut pas la modifier)
   Réglages du coach dans la fiche : members/<id>.iaConsignes (texte), members/<id>.iaOff (pause). */
(function(){
"use strict";
const IA = {open: false, t: "", busy: false};
const ATTENTE_MAX = 300 * 1000;   /* un plan de repas complet (menus, recettes, courses) peut prendre 1 à 3 minutes */
const STAT = {attente: ["⏳", "En attente de la décision de Nathanael"], validee: ["✓", "Validé par Nathanael"], refusee: ["↺", "Nathanael a décidé autrement"]};
const QUOI = {exercice: "Exercice", seance: "Séance", planning: "Planning", nutrition: "Nutrition", objectif: "Objectif", autre: "Autre"};
const memberUI = () => S.mode === "ready" && !isCoachUI() && !!S.cur.member;
const byAt = (a, b) => (a.at || 0) - (b.at || 0);
const questions = () => S.cur.notes.filter(n => n.type === "ia").sort(byAt);
const reponses = () => new Map(S.cur.notes.filter(n => n.type === "ia-r").map(n => [n.pour, n]));
const props = () => S.cur.notes.filter(n => n.type === "ia-r" && n.prop).sort(byAt);
const txt = s => esc(s).replace(/\n/g, "<br>");
const enSaisie = sel => { const a = document.activeElement; return !!(a && a.closest && a.closest(sel) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)); };

/* ================= barre d'accès (Accueil, Nutrition, Corps) ================= */
function bar(){
  const m = S.cur.member; if (!m || m.iaOff === true || (!window.NN_IA_ACTIF && !S.owner)) return `<button class="px-ask" data-a="px-ask"><span class="px-ask-av">NN</span><span>Une question ? Écris à Nathanael</span><span class="px-ask-go">›</span></button>`;
  const ps = props(), att = ps.filter(p => p.statut === "attente"), sem = Date.now() - 7 * 864e5;
  const dec = ps.filter(p => p.statut !== "attente" && (p.decideAt || 0) > sem).pop();
  return `<div class="ia-entry">
    ${att.length ? `<button class="ia-chip att" data-a="ia-open">⏳ ${att.length > 1 ? att.length + " propositions attendent" : "1 proposition attend"} la décision de Nathanael</button>` : ""}
    ${dec ? `<button class="ia-chip ${dec.statut}" data-a="ia-open">${STAT[dec.statut][0]} ${dec.statut === "validee" ? "Nathanael a validé" : "Nathanael a répondu"} : ${esc(dec.prop.titre)}</button>` : ""}
    <button class="px-ask ia-bar" data-a="ia-open"><span class="px-ask-av">NN</span><span class="ia-bar-t"><b>Ton assistant</b><small>Il t'aide au quotidien · Nathanael décide</small></span><span class="px-ask-go">›</span></button></div>`;
}
window.NN_IA = {bar};

/* ================= discussion ================= */
function decision(n){
  const s = STAT[n.statut] || STAT.attente;
  return `<div class="ia-prop ${n.statut || "attente"}"><span class="ia-prop-h">Proposition pour Nathanael · ${esc(QUOI[n.prop.quoi] || "Autre")}</span>
    <b>${esc(n.prop.titre)}</b>
    <span class="ia-stat">${s[0]} ${s[1]}</span>${n.mot ? `<span class="ia-mot">« ${txt(n.mot)} » <i>— Nathanael</i></span>` : ""}</div>`;
}
function bulles(){
  const qs = questions(), rs = reponses(), now = Date.now();
  if (!qs.length) return `<div class="ia-vide"><span class="small muted">Par exemple :</span><div class="px-chips">${["Comment bien faire mon premier exercice ?", "Aide-moi à caser mes séances cette semaine", "Une idée de repas riche en protéines", "Je n'ai pas le matériel pour un exercice"].map(x => `<button data-a="ia-chip" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>`;
  return qs.map(q => { const r = rs.get(q.id);
    const moi = `<div class="ia-b moi"><div>${txt(q.q)}</div><span>${esc(fmtWhen(q.at))}</span></div>`;
    if (!r) return moi + (now - q.at < ATTENTE_MAX ? `<div class="ia-b lui ia-dots"><i></i><i></i><i></i></div>${/plan/i.test(q.q) ? `<span class="small muted">Je prépare tes menus, tes recettes et ta liste de courses : ça prend 1 à 3 minutes. Tu peux fermer, le plan arrivera dans ton onglet Nutrition.</span>` : ""}`
      : `<div class="ia-b lui ia-soft"><div>Ton message est bien arrivé. Je n'ai pas encore pu répondre : Nathanael le voit aussi.</div></div>`);
    return moi + `<div class="ia-b lui"><span class="ia-who">Assistant</span><div>${txt(r.r)}</div>
      ${r.prop ? decision(r) : ""}${r.planRepas ? `<button class="ia-flag ia-plan" data-a="ia-plan">🍽️ Plan de repas enregistré dans ton onglet Nutrition ›</button>` : ""}${r.alerte && !r.limite ? `<span class="ia-flag">Nathanael est prévenu</span>` : ""}</div>`;
  }).join("");
}
function renderChat(){
  let el = $("ia-chat");
  if (!IA.open || !S.cur.member) { if (el) { el.remove(); document.body.classList.remove("ia-lock"); } return; }
  if (!el) {
    el = document.createElement("div"); el.id = "ia-chat"; document.body.appendChild(el); document.body.classList.add("ia-lock");
    el.innerHTML = `<div class="ia-in"><div class="ia-top"><span class="px-ask-av">NN</span><div class="ia-top-t"><b>Ton assistant</b><small>Supervisé par Nathanael, ton coach</small></div><button class="px-x" data-a="ia-close">Fermer</button></div>
      <div class="ia-list"><div class="ia-pacte"><b>Comment ça marche</b><span>Je connais ton programme et tes retours. Je t'explique tes exercices, je t'aide à t'organiser et je te donne des idées pour te faciliter la vie.</span>
        <span><b>Je ne change rien tout seul.</b> Si quelque chose doit bouger dans ton programme, je le propose à Nathanael : c'est lui qui décide, et tu vois sa réponse ici.</span></div><div class="ia-msgs"></div></div>
      <div class="ia-foot"><div class="ia-row"><textarea rows="1" maxlength="1000" data-ia="t" placeholder="Écris ta question…"></textarea><button class="ia-send" data-a="ia-send" aria-label="Envoyer">➤</button></div>
        <button class="btn link sm ia-direct" data-a="ia-direct">Écrire directement à Nathanael ›</button></div></div>`;
    el.querySelector("textarea").value = IA.t;
    setTimeout(() => descendre(true), 30);
  }
  const box = el.querySelector(".ia-msgs"), html = bulles();
  if (box.dataset.h !== html) { const bas = estEnBas(); box.innerHTML = html; box.dataset.h = html; if (bas) descendre(); }
  const b = el.querySelector(".ia-send"); if (b) b.disabled = IA.busy;
}
const liste = () => document.querySelector("#ia-chat .ia-list");
const estEnBas = () => { const l = liste(); return !l || l.scrollHeight - l.scrollTop - l.clientHeight < 80; };
const descendre = () => { const l = liste(); if (l) l.scrollTop = l.scrollHeight; };
/* les points « l'assistant réfléchit » laissent place au message d'attente au bout de 5 min */
setInterval(() => { if (IA.open) renderChat(); }, 15000);

async function envoyer(){
  const q = String(IA.t || "").trim(); if (!q || IA.busy) return;
  const mid = memberId(), id = `ia-${Date.now()}-${rid(4)}`;
  IA.busy = true; renderChat();
  try {
    await S.db.doc(`members/${mid}/notes/${id}`).set({type: "ia", auteur: S.owner ? "coach" : "adherent", seance: null, q: q.slice(0, 1000), at: Date.now()});
    IA.t = ""; const ta = document.querySelector("#ia-chat textarea"); if (ta) { ta.value = ""; ta.style.height = ""; }
  } catch (e) { toast("Message non envoyé. Vérifie ta connexion et réessaie."); }
  IA.busy = false; renderChat(); descendre();
}
document.addEventListener("input", e => {
  const t = e.target; if (t.dataset?.ia !== "t") return;
  IA.t = t.value; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 140) + "px";
});
document.addEventListener("keydown", e => {
  if (e.target.dataset?.ia === "t" && e.key === "Enter" && !e.shiftKey && !/iPhone|iPad|Android/.test(navigator.userAgent)) { e.preventDefault(); envoyer(); }
});

/* ================= coach : section « Assistant » de la fiche ================= */
function ficheIA(){
  const m = S.cur.member; if (!m) return "";
  const ps = props(), att = ps.filter(p => p.statut === "attente"), dec = ps.filter(p => p.statut !== "attente").slice(-4).reverse();
  const qs = new Map(questions().map(q => [q.id, q])), rs = reponses();
  const conv = questions().slice(-8).reverse();
  const k = "ia.";
  const carte = p => { const q = qs.get(p.pour);
    return `<div class="ia-cprop"><div class="row" style="justify-content:space-between"><span class="chip gold">${esc(QUOI[p.prop.quoi] || "Autre")}</span><span class="small muted">${esc(fmtWhen(p.at))}</span></div>
      <b>${esc(p.prop.titre)}</b><span class="small">${txt(p.prop.detail)}</span>
      ${q ? `<span class="small muted">Sa question : « ${esc(q.q)} »</span>` : ""}${p.pourCoach ? `<span class="small ia-pc">${txt(p.pourCoach)}</span>` : ""}
      <label class="f">Ton mot pour ${esc(m.prenom || "l'adhérent")} (facultatif)<textarea rows="2" data-d="${k}mot.${p.id}" placeholder="Ex. Oui, on remplace dès la prochaine séance">${esc(d(k + "mot." + p.id, ""))}</textarea></label>
      <div class="row"><button class="btn sm solid" data-a="ia-dec" data-v="${esc(p.id)}" data-s="validee">Valider</button><button class="btn sm ghost" data-a="ia-dec" data-v="${esc(p.id)}" data-s="refusee">Refuser</button></div></div>`; };
  return `<section class="sec" id="ia-fiche"><div class="sec-h"><h2>Assistant</h2>${m.iaOff ? `<span class="chip">en pause</span>` : ""}</div><div class="card">
    ${window.NN_IA_ACTIF ? "" : `<span class="chip">Pas encore activé : les adhérents ne le voient pas</span>`}<span class="small muted">L'assistant répond à ${esc(m.prenom || "l'adhérent")} à partir de son programme et de ses retours. Il ne change rien : ses propositions attendent ta décision ici, et tu es prévenu par SMS.</span>
    ${att.length ? `<span class="eyebrow">À décider (${att.length})</span>${att.map(carte).join("")}` : `<span class="small">Aucune proposition en attente.</span>`}
    ${dec.length ? `<span class="eyebrow">Tes dernières décisions</span>${dec.map(p => `<div class="small">${STAT[p.statut][0]} <b>${esc(p.prop.titre)}</b>${p.mot ? ` · « ${esc(p.mot)} »` : ""}</div>`).join("")}` : ""}
    <label class="f">Tes consignes pour l'assistant (il les suit avec ${esc(m.prenom || "l'adhérent")})<textarea rows="3" data-d="${k}cons" placeholder="Ex. Pas de saut à cause du genou gauche. Toujours rappeler l'échauffement des épaules.">${esc(d(k + "cons", m.iaConsignes || ""))}</textarea></label>
    <div class="row"><button class="btn sm solid" data-a="ia-cons">Enregistrer les consignes</button><button class="btn sm ghost" data-a="ia-pause">${m.iaOff ? "Réactiver l'assistant" : "Mettre l'assistant en pause"}</button></div>
    ${conv.length ? `<details><summary class="small"><b>Ses dernières discussions (${conv.length})</b></summary><div class="ia-conv">${conv.map(q => { const r = rs.get(q.id);
      return `<div><span class="small muted">${esc(fmtWhen(q.at))}</span><div class="small"><b>${esc(m.prenom || "Adhérent")} :</b> ${txt(q.q)}</div>
        <div class="small"><b>Assistant :</b> ${r ? txt(r.r) : "<i>pas encore de réponse</i>"}</div>${r?.pourCoach ? `<div class="small ia-pc">Pour toi : ${txt(r.pourCoach)}</div>` : ""}</div>`; }).join("")}</div></details>` : ""}
  </div></section>`;
}

/* ================= branchements ================= */
const _act = act, _render = render, _fiche = fiche;
window.fiche = fiche = function(){
  const out = _fiche(); if (!S.cur.member) return out;
  const n = props().filter(p => p.statut === "attente").length;
  const ban = n ? `<section class="sec"><button class="banner mag ia-ban" data-a="ia-goto"><span>🤖 L'assistant attend ta décision sur <b>${n} proposition${n > 1 ? "s" : ""}</b></span><span>Voir ›</span></button></section>` : "";
  const i = out.indexOf("</section>");
  return (i > 0 ? out.slice(0, i + 10) + ban + out.slice(i + 10) : ban + out) + ficheIA();
};
window.render = render = function(f){ _render(f); if (!enSaisie("#ia-chat .ia-foot")) renderChat(); else { const b = $("ia-chat"); if (b) { const box = b.querySelector(".ia-msgs"), h = bulles(); if (box && box.dataset.h !== h) { const bas = estEnBas(); box.innerHTML = h; box.dataset.h = h; if (bas) descendre(); } } } };
window.act = act = async function(a, ds){
  if (!a.startsWith("ia-")) { if (a === "tab" || a === "back") IA.open = false; return _act(a, ds); }
  const v = ds.v;
  switch (a) {
    case "ia-open": IA.open = true; renderChat(); return;
    case "ia-open-q": IA.open = true; renderChat(); return act("ia-chip", {v});
    case "ia-gen": IA.open = true; IA.t = "Génère mon plan nutritionnel selon mes goûts, mes cibles et mes jours de séance."; renderChat(); return envoyer();
    case "ia-plan": IA.open = false; renderChat(); return act("tab", {v: "nutrition"});
    case "ia-close": IA.open = false; renderChat(); return;
    case "ia-chip": { IA.t = v; const ta = document.querySelector("#ia-chat textarea"); if (ta) { ta.value = v; ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 140) + "px"; ta.focus(); } return; }
    case "ia-send": return envoyer();
    case "ia-direct": IA.open = false; renderChat(); return _act("px-ask", {});
    case "ia-goto": { const el = $("ia-fiche"); if (el) el.scrollIntoView({behavior: "smooth", block: "start"}); return; }
    case "ia-dec": { const mid = S.fiche, mot = String(S.drafts["ia.mot." + v] || "").trim().slice(0, 600);
      if (await run(S.db.doc(`members/${mid}/notes/${v}`).update({statut: ds.s, mot, decideAt: Date.now()}), ds.s === "validee" ? "Proposition validée 👍" : "Proposition refusée"))
        delete S.drafts["ia.mot." + v];
      return; }
    case "ia-cons": { const t = String(S.drafts["ia.cons"] ?? S.cur.member.iaConsignes ?? "").trim().slice(0, 1500);
      if (await run(S.db.doc("members/" + S.fiche).update({iaConsignes: t}), "Consignes enregistrées")) delete S.drafts["ia.cons"]; return; }
    case "ia-pause": { const off = !S.cur.member.iaOff;
      await run(S.db.doc("members/" + S.fiche).update({iaOff: off}), off ? "Assistant en pause pour cet adhérent" : "Assistant réactivé"); return; }
  }
};
})();
