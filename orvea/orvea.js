/* © 2026 Orvéa (Nathanael Neuville). Tous droits réservés.
   Couche « commerciale » de l'appli Orvéa, chargée en dernier (après index.html, plus.js et ia.js) :
   accueil de bienvenue, essai gratuit, formules et tarifs, droits par formule, carte « ton programme »,
   magasins proches par géolocalisation (OpenStreetMap), promos de la semaine par enseigne, compte (Google, thème, suppression).
   Données : members/{uid}.essaiFin (serveur), members/{uid}.abo {formule, fin} (serveur, après paiement), members/{uid}.programmeEtat (serveur),
             promos/{enseigne} (serveur), enseignes/{enseigne} {nom, at} (écrit ici quand l'utilisateur choisit ses magasins). */
(function(){
"use strict";
const fr = (n, d = 0) => Number(n || 0).toLocaleString("fr-FR", {maximumFractionDigits: d, minimumFractionDigits: d});
const eur = n => Number(n).toLocaleString("fr-FR", {minimumFractionDigits: 2, maximumFractionDigits: 2}) + " €";
const cleEnseigne = e => String(e || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "autre";
const LS = {get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }};
const O = {geo: null, promos: {}, promoSubs: {}, choix: null, cycleAnnuel: true};

/* ================= formules et droits (même règle que functions-orvea/assistant.js : acces()) ================= */
const FORMULES = [
  {id: "decouverte", nom: "Découverte", mois: 0, an: 0, droits: {entrainement: false, nutrition: false, ia: false},
    pitch: "Pour essayer, sans carte bancaire.", feat: ["2 séances guidées écrites pour toi", "Journal des repas et calcul de tes calories", "Suivi du corps : poids, mensurations, photos", "Écran projeté sur la télé"]},
  {id: "entrainement", nom: "Training", mois: 14.99, an: 99.99, droits: {entrainement: true, nutrition: false, ia: true},
    pitch: "Ton programme sur mesure, qui s'adapte à toi.", feat: ["Programme illimité, cycle après cycle", "Séance guidée : chrono, repos, vidéos", "Questionnaire santé et séances adaptées", "Coach IA 24 h/24 pour l'entraînement", "Corps : muscles travaillés, forme du jour"]},
  {id: "nutrition", nom: "Nutrition", mois: 14.99, an: 99.99, droits: {entrainement: false, nutrition: true, ia: true},
    pitch: "Bien manger sans se prendre la tête.", feat: ["Calories et macros calculées pour toi", "Plan de repas, recettes et liste de courses", "Magasins près de chez toi et promos de la semaine", "Photo d'assiette : calories en 10 secondes", "Coach IA pour la nutrition"]},
  {id: "complet", nom: "Premium", mois: 24.99, an: 179.99, top: true, droits: {entrainement: true, nutrition: true, ia: true},
    pitch: "Entraînement + nutrition + coach IA. Le plus choisi.", feat: ["Tout Training et tout Nutrition", "Le coach IA relie tes séances et tes repas", "Carte « Ta transformation »", "Liste de courses en PDF à partager"]},
  {id: "famille", nom: "Premium Famille", mois: 39.99, an: 299.99, droits: {entrainement: true, nutrition: true, ia: true},
    pitch: "Premium pour 4 personnes, une seule liste de courses.", feat: ["4 comptes Premium", "Une liste de courses commune, par magasin", "Chacun son programme et ses cibles"]}];
const OPTIONS = [
  ["Programme spécial", "24,99 € une fois", "Un cycle de 8 semaines pour un objectif précis : genou, épaules, dos, reprise après une pause, préparation d'une course."],
  ["Coach IA illimité", "+ 4,99 €/mois", "Pour les gros utilisateurs : plus de 25 messages par jour et plus de 15 photos d'assiette par jour."]];
const ESSAI_JOURS = 21;
function acces(m){
  if (m && Number(m.essaiFin) > Date.now()) return {entrainement: true, nutrition: true, ia: true, essai: true, formule: "complet"};
  const f = m && m.abo && Number(m.abo.fin) > Date.now() ? m.abo.formule : "decouverte";
  return {...(FORMULES.find(x => x.id === f) || FORMULES[0]).droits, formule: f};
}
const joursEssai = m => m && m.essaiFin ? Math.max(0, Math.ceil((m.essaiFin - Date.now()) / 864e5)) : null;
const prixMin = feat => { const l = FORMULES.filter(f => f.mois && f.droits[feat]).sort((a, b) => a.mois - b.mois)[0]; return l ? eur(l.mois) + "/mois" : ""; };

const icoIA = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>`;

/* ================= bienvenue (avant toute création de compte) ================= */
const bienvenueVue = () => LS.get("orvea-start") === "1";
function bienvenue(){
  return `<section class="sec ov-hero">
    <div class="ov-mark"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="16" cy="16" r="3.2" fill="currentColor"/></svg></div>
    <h2 class="ov-titre">Ton coach sportif et nutrition, dans ta poche.</h2>
    <p class="ov-sous">Un programme écrit pour toi, des séances guidées pas à pas, et des repas calés sur les magasins près de chez toi. Un coach IA l'adapte avec toi, chaque semaine.</p>
    <div class="ov-points">
      <div><b>Séances guidées</b><span>Chrono, repos et vidéos : tu n'as qu'à suivre.</span></div>
      <div><b>Nutrition locale</b><span>Plan de repas, courses et promos de tes magasins.</span></div>
      <div><b>Photo d'assiette</b><span>Les calories de ton repas en 10 secondes.</span></div>
      <div><b>Coach IA</b><span>Il connaît ton programme et l'ajuste avec toi.</span></div></div>
    <button class="btn solid ov-cta" data-a="ov-start">Commencer · ${ESSAI_JOURS} jours offerts</button>
    <button class="btn link" data-a="ov-google">J'ai déjà un compte (Google)</button>
    <span class="small muted ov-mention">Sans carte bancaire. Tes données restent privées et tu peux tout supprimer à tout moment.</span></section>`;
}

/* ================= bandeau d'essai / de formule ================= */
function bandeau(){
  const m = S.cur.member, a = acces(m), j = joursEssai(m);
  if (a.essai) return `<section class="sec"><button class="ov-band" data-a="tab" data-v="offres"><span><b>${m && m.offert ? "Accès offert" : "Essai gratuit"} · ${j} jour${j > 1 ? "s" : ""}</b> · tout est débloqué</span><span>Voir les formules ›</span></button></section>`;
  if (a.formule === "decouverte" && m && m.essaiFin) return `<section class="sec"><button class="ov-band off" data-a="tab" data-v="offres"><span><b>Formule Découverte</b> · ton essai est terminé</span><span>Tout débloquer ›</span></button></section>`;
  return "";
}
const essaiChip = m => { const a = acces(m); return a.essai ? `<span class="off-alt px-noff">✦ Inclus dans ton essai gratuit (${joursEssai(m)} j)</span>` : ""; };

/* ================= paywall ================= */
const PW = {
  nutrition: ["🥗", "La nutrition, calée sur ta vie", "Calories, plan de repas, recettes, liste de courses dans les magasins près de chez toi, promos de la semaine et photo d'assiette."],
  entrainement: ["🏋️", "Ton programme complet", "Ton cycle entier, puis le suivant, écrit à partir de tes retours après chaque séance."],
  ia: ["✨", "Ton coach IA", "Pose tes questions, adapte une séance, change un repas : 24 h/24."]};
function paywall(feat){
  const [emo, t, s] = PW[feat] || PW.entrainement, fs = FORMULES.filter(f => f.mois && f.droits[feat]);
  return `<div class="card ov-pay"><span class="px-emo">${emo}</span><b>${esc(t)}</b><span class="small muted">${esc(s)}</span>
    <div class="ov-pay-l">${fs.map(f => `<button class="ov-pay-f ${f.top ? "top" : ""}" data-a="ov-choisir" data-v="${f.id}"><b>${esc(f.nom)}</b><span>${eur(f.mois)}/mois</span><small>ou ${eur(f.an)}/an</small></button>`).join("")}</div>
    <button class="btn link sm" data-a="tab" data-v="offres">Comparer les formules ›</button></div>`;
}

/* ================= carte « ton programme » (séances pas encore là, ou cycle fini) ================= */
function carteProgramme(){
  const m = S.cur.member || {}, e = m.programmeEtat || {}, obj = S.cur.notes.some(n => n.type === "objectifs");
  if (!obj) return `<button class="card tap ov-prog" data-a="px-wz" data-v="objectifs"><span class="px-emo">📝</span><b>Crée ton programme</b><span class="small muted">3 minutes de questions, une par écran : objectifs, niveau, matériel, santé. Ton programme s'écrit tout de suite après.</span><span class="ov-go">Commencer ›</span></button>`;
  if (e.statut === "en-cours" || (!e.statut && Date.now() - (S.cur.notes.filter(n => n.type === "objectifs").pop()?.at || 0) < 5 * 60e3))
    return `<div class="card ov-prog"><span class="ov-spin" aria-hidden="true"></span><b>Ton programme s'écrit…</b><span class="small muted">On assemble tes séances à partir de tes réponses : compte 1 à 2 minutes. Tu peux fermer l'appli, il t'attendra ici.</span></div>`;
  if (e.statut === "medecin") return `<div class="card ov-prog warn"><span class="px-emo">🩺</span><b>Avant de commencer : l'avis de ton médecin</b>
    <span class="small muted">Tu as signalé un point de santé qui demande son accord (cœur, tension, malaise à l'effort, ou réserves de sa part). Montre-lui tes réponses. Quand il est d'accord, ton programme s'écrit en douceur.</span>
    <button class="btn solid" data-a="ov-relance" data-v="medecin">Mon médecin est d'accord</button></div>`;
  if (e.statut === "erreur") return `<div class="card ov-prog warn"><b>Ton programme n'a pas pu s'écrire</b><span class="small muted">Un souci de notre côté. Relance : ça reprend là où on en était.</span><button class="btn solid" data-a="ov-relance">Relancer</button></div>`;
  if (e.statut === "verrou") return paywall("entrainement");
  return "";
}
function carteSuite(){
  const m = S.cur.member || {}, all = allSeances(); if (!all.length) return "";
  const reste = all.filter(s => s.statut !== "faite" && !seanceEntamee(s)).length, e = m.programmeEtat || {};
  if (e.statut === "en-cours") return `<div class="card ov-prog"><span class="ov-spin" aria-hidden="true"></span><b>Ton cycle suivant s'écrit…</b><span class="small muted">À partir de tes retours. Compte 1 à 2 minutes.</span></div>`;
  if (reste > 1) return "";
  if (!acces(m).entrainement) return `<div class="card ov-prog"><b>${reste ? "Plus qu'une séance" : "Bravo, séances terminées 🎉"}</b><span class="small muted">La suite de ton programme, écrite à partir de tes retours, fait partie des formules Training et Premium.</span>${paywall("entrainement")}</div>`;
  return `<button class="card tap ov-prog" data-a="ov-suite"><span class="px-emo">🚀</span><b>${reste ? "Plus qu'une séance dans ce cycle" : "Cycle terminé, bravo 🎉"}</b><span class="small muted">Crée le cycle suivant : il tient compte de tes charges, de ton ressenti et de tes questionnaires.</span><span class="ov-go">Créer mon cycle suivant ›</span></button>`;
}
function vueSeances(_view){
  return rappelBilan() + heroAdh() + seancesView() + `<section class="sec">${carteSuite()}<button class="btn sm ghost" data-a="tab" data-v="cycle" style="align-self:flex-start">Voir mon cycle ›</button></section>`;
}

/* ================= coaching privé (lien vers l'appli NN Coaching) ================= */
const COACH_PRIVE = "nmsport33@gmail.com";
function carteCoachPrive(court){
  const m = S.cur.member || {}, sujet = "Bilan complet - coaching privé",
    corps = `Bonjour,\n\nJ'utilise Orvéa et j'aimerais aller plus loin avec un coaching privé.\nJe souhaite prendre rendez-vous pour un bilan complet d'une heure (coach sportif et coach en nutrition).\n\nPrénom : ${m.prenom || ""}\nMon objectif : \nMes disponibilités : \n\nMerci !`,
    href = `mailto:${COACH_PRIVE}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
  return `<div class="card ov-prive"><div class="ov-prive-h"><span class="ov-prive-e">🤝</span><div><span class="eyebrow">Envie d'aller plus loin ?</span><b>Bilan complet avec notre équipe</b></div></div>
    ${court ? `<span class="small muted">Coach sportif diplômé et coach en nutrition, sur rendez-vous.</span>` : `<span class="small">Un <b>coach sportif diplômé</b> et un <b>coach en nutrition</b> te reçoivent pour un <b>bilan complet et personnalisé d'une heure</b>, sur rendez-vous :</span>
    <ul class="off-feat"><li>Tes objectifs, ton rythme de vie, tes contraintes</li><li>Ta posture, ta mobilité, tes douleurs</li><li>Ton alimentation et tes habitudes</li><li>Un plan sur mesure, puis un suivi en coaching privé dans l'appli NN Coaching</li></ul>`}
    <a class="btn solid" href="${href}">✉️ Demander mon bilan complet</a></div>`;
}

/* ================= offres ================= */
function offres(){
  const m = S.cur.member, a = acces(m), an = O.cycleAnnuel, j = joursEssai(m);
  const carte = f => { const prix = !f.mois ? "0 €" : an ? eur(f.an / 12) : eur(f.mois), cur = !a.essai && a.formule === f.id;
    return `<div class="ov-off ${f.top ? "top" : ""} ${cur ? "cur" : ""}">${f.top ? `<span class="ov-badge">Le plus choisi</span>` : ""}
      <div class="ov-off-h"><b>${esc(f.nom)}</b><span class="ov-prix">${prix}<small>${f.mois ? "/mois" : ""}</small></span></div>
      <span class="small muted">${f.mois ? (an ? `${eur(f.an)} par an, soit ${fr(100 - f.an / (f.mois * 12) * 100)} % d'économie` : `ou ${eur(f.an)} par an`) : esc(f.pitch)}</span>
      ${f.mois ? `<span class="small">${esc(f.pitch)}</span>` : ""}
      <ul class="off-feat">${f.feat.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      ${cur ? `<span class="chip ok">Ta formule</span>` : f.mois ? `<button class="btn ${f.top ? "solid" : "ghost"}" data-a="ov-choisir" data-v="${f.id}">Choisir ${esc(f.nom)}</button>` : ""}</div>`; };
  return `<section class="sec"><h2>Formules</h2>
    ${a.essai ? `<div class="ov-band"><span><b>${m && m.offert ? "Accès offert" : "Essai gratuit en cours"} · ${j} jour${j > 1 ? "s" : ""}</b> · tu as tout Premium</span></div>` : ""}
    <div class="px-seg ov-per"><button class="${an ? "" : "on"}" data-a="ov-per" data-v="mois">Au mois</button><button class="${an ? "on" : ""}" data-a="ov-per" data-v="an">À l'année · jusqu'à −${Math.max(...FORMULES.filter(f => f.mois).map(f => Math.round(100 - f.an / (f.mois * 12) * 100)))} %</button></div>
    ${FORMULES.map(carte).join("")}
    <h2 style="margin-top:8px">Options</h2>
    ${OPTIONS.map(([t, p, d]) => `<div class="card ov-opt"><div class="ov-off-h"><b>${esc(t)}</b><span class="small" style="font-weight:700">${esc(p)}</span></div><span class="small muted">${esc(d)}</span></div>`).join("")}
    <h2 style="margin-top:8px">Coaching privé</h2>
    ${carteCoachPrive()}
    <details class="card ov-faq"><summary>Questions fréquentes</summary>
      <p><b>L'essai est vraiment gratuit ?</b> Oui : ${ESSAI_JOURS} jours de Premium, sans carte bancaire. Ensuite tu passes en Découverte si tu ne choisis rien.</p>
      <p><b>Je peux arrêter quand je veux ?</b> Oui, sans engagement au mois. À l'année, tu gardes l'accès jusqu'à la fin de la période payée.</p>
      <p><b>Il y a un vrai coach ?</b> Ton programme suit une méthode écrite par un coach diplômé, et un coach IA l'adapte avec toi chaque jour. Il ne remplace pas un médecin.</p>
      <p><b>Mes données ?</b> Elles servent seulement à ton programme. Tu peux tout supprimer dans « Mon compte ».</p></details>
    <p class="off-foot">Prix TTC. Paiement sécurisé par carte, Apple Pay ou Google Pay.</p></section>`;
}

/* ================= compte ================= */
const THEMES = [
  {k: "auto", n: "Auto", d: "Suit ton téléphone", c: ["linear-gradient(135deg,#4a5060,#0b0d12)", "#f6f7f9", "#ff5a36", "#0b0d12"]},
  {k: "light", n: "Orvéa clair", d: "Blanc et corail", c: ["#f6f7f9", "#ff5a36", "#6c5ce7", "#12a150"], clair: true},
  {k: "dark", n: "Orvéa nuit", d: "Nuit et corail", c: ["#0b0d12", "#ff6b47", "#8b7cf6", "#34d399"]},
  {k: "neon", n: "Néon futuriste", d: "Nuit, cyan et violet", c: ["#05060d", "#22e3ff", "#7b5cff", "#ff2bd6"]},
  {k: "classique", n: "Classique", d: "Blanc cassé et or", c: ["#f2f2f0", "#16161d", "#a8811a", "#c2185b"], clair: true},
  {k: "graphite", n: "Graphite", d: "Noir et or", c: ["#0e0e12", "#d6b04c", "#ef5f97", "#62c497"]},
  {k: "ocean", n: "Océan", d: "Bleu nuit et turquoise", c: ["#061626", "#2ec4b6", "#3a86ff", "#ff7a59"]},
  {k: "energie", n: "Énergie", d: "Noir, orange et jaune", c: ["#0a0a0a", "#ff6b1a", "#ffb703", "#b8f135"]},
  {k: "rose", n: "Rose poudré", d: "Clair, rose et prune", c: ["#fbf1f4", "#c2185b", "#8e3a9e", "#e05780"], clair: true},
  {k: "sable", n: "Sable", d: "Clair et zen, sauge", c: ["#f5f0e6", "#4f7d5c", "#b08950", "#c26a4a"], clair: true}];
function compte(){
  const m = S.cur.member || {}, u = firebase.auth().currentUser, a = acces(m), f = FORMULES.find(x => x.id === a.formule) || FORMULES[0], th = LS.get("orvea-theme") || "neon";
  const google = u && !u.isAnonymous ? (u.email || "Compte Google") : "";
  return `<section class="sec"><h2>Mon compte</h2>
    <div class="card"><label class="f">Prénom<input type="text" maxlength="40" data-d="ov.prenom" value="${esc(d("ov.prenom", m.prenom || ""))}"></label><button class="btn sm solid" data-a="ov-prenom" style="align-self:flex-start">Enregistrer</button></div>
    <div class="card"><span class="eyebrow">Formule</span><b>${a.essai ? `${m.offert ? "Accès Premium offert" : "Essai gratuit Premium"} · encore ${joursEssai(m)} j` : esc(f.nom)}</b><button class="btn sm ghost" data-a="tab" data-v="offres" style="align-self:flex-start">Changer de formule ›</button></div>
    <div class="card"><span class="eyebrow">Sauvegarde</span>${google ? `<b>✓ Relié à ${esc(google)}</b><span class="small muted">Tu retrouves tout sur un autre téléphone en te connectant avec ce compte.</span>`
      : `<b>Sécurise ton compte</b><span class="small muted">Relie-le à Google pour ne rien perdre si tu changes de téléphone.</span><button class="btn sm solid" data-a="ov-lier" style="align-self:flex-start">Relier à Google</button>`}</div>
    <div class="card" id="ov-themes"><span class="eyebrow">🎨 Thème de l'appli</span><span class="small muted">Touche un thème : l'appli change de couleurs tout de suite.</span>
      <div class="ov-themes">${THEMES.map(t => `<button class="ov-th ${th === t.k ? "on" : ""}" data-a="ov-theme" data-v="${t.k}" style="background:${t.c[0]};color:${t.clair ? "#16161d" : "#f2f2f2"}"><span class="sw">${t.c.slice(1).map(c => `<i style="background:${c}"></i>`).join("")}</span>${esc(t.n)}<small>${esc(t.d)}</small></button>`).join("")}</div></div>
    ${carteCoachPrive()}
    <div class="card"><span class="eyebrow">Mes données</span><span class="small muted">Seul·e toi y as accès. Les photos d'assiette sont effacées juste après l'analyse. Pour trouver tes magasins, ta position est envoyée une fois à OpenStreetMap, sans ton nom.</span>
      <button class="btn sm ghost" data-a="ov-suppr" style="align-self:flex-start;color:var(--warn)">Supprimer mon compte et mes données</button></div>
    <p class="off-foot">Orvéa · © 2026 · Ne remplace pas un avis médical.</p></section>`;
}

/* ================= magasins proches (géolocalisation + OpenStreetMap) ================= */
const ENSEIGNES = [["Intermarché", /intermarch/i], ["E.Leclerc", /leclerc/i], ["Carrefour", /carrefour/i], ["Auchan", /auchan/i], ["Lidl", /lidl/i], ["Aldi", /aldi/i],
  ["Super U", /(super|hyper|march[eé])\s*u\b|^u express|système u|systeme u/i], ["Casino", /casino/i], ["Monoprix", /monoprix/i], ["Franprix", /franprix/i], ["Netto", /netto/i],
  ["Grand Frais", /grand frais/i], ["Biocoop", /biocoop/i], ["Picard", /picard/i], ["Cora", /\bcora\b/i], ["Match", /\bmatch\b/i], ["Spar", /\bspar\b/i], ["Colruyt", /colruyt/i]];
const enseigneDe = (nom, brand) => { const t = (brand || "") + " " + (nom || ""); const e = ENSEIGNES.find(([, re]) => re.test(t)); return e ? e[0] : (brand || nom || "Magasin"); };
const km = (a, b, c, d) => { const R = 6371, r = x => x * Math.PI / 180, x = r(c - a), y = r(d - b), h = Math.sin(x / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
async function chercherMagasins(lat, lon){
  const q = `[out:json][timeout:20];(node["shop"~"supermarket|convenience|frozen_food"](around:6000,${lat},${lon});way["shop"~"supermarket|frozen_food"](around:6000,${lat},${lon}););out center 80;`;
  const r = await fetch("https://overpass-api.de/api/interpreter", {method: "POST", body: "data=" + encodeURIComponent(q)});
  if (!r.ok) throw new Error("overpass " + r.status);
  const j = await r.json(), vus = new Set();
  return (j.elements || []).map(e => { const t = e.tags || {}, la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
    return {nom: String(t.name || t.brand || "").slice(0, 60), enseigne: enseigneDe(t.name, t.brand), km: Math.round(km(lat, lon, la, lo) * 10) / 10,
      adresse: [t["addr:housenumber"], t["addr:street"], t["addr:city"]].filter(Boolean).join(" ").slice(0, 90), ville: t["addr:city"] || "", sup: t.shop === "supermarket"}; })
    .filter(x => x.nom && (x.sup || ENSEIGNES.some(([n]) => n === x.enseigne)))
    .sort((a, b) => a.km - b.km).filter(x => { const k = x.nom + x.adresse; if (vus.has(k)) return false; vus.add(k); return true; }).slice(0, 12);
}
async function geocoder(ville){
  const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=" + encodeURIComponent(ville));
  const j = await r.json(); if (!j[0]) throw new Error("ville introuvable");
  return {lat: Number(j[0].lat), lon: Number(j[0].lon), nom: String(j[0].display_name || ville).split(",")[0]};
}
async function localiser(ville){
  O.geo = {etat: "cherche"}; render();
  try {
    let pos;
    if (ville) pos = await geocoder(ville);
    else pos = await new Promise((ok, ko) => navigator.geolocation.getCurrentPosition(p => ok({lat: p.coords.latitude, lon: p.coords.longitude}), ko, {enableHighAccuracy: false, timeout: 15000, maximumAge: 600000}));
    const l = await chercherMagasins(pos.lat, pos.lon);
    const f = P_g(); if (f) { f.proches = l; f.ville = pos.nom || (l.find(x => x.ville) || {}).ville || "";
      if (!f.magasins.length) f.magasins = [...new Set(l.slice(0, 4).map(x => x.enseigne))].slice(0, 3); }
    O.geo = {etat: l.length ? "ok" : "vide"};
  } catch (e) { O.geo = {etat: "erreur", msg: e && e.code === 1 ? "Localisation refusée. Tape ta ville à la place." : "Recherche impossible pour l'instant. Tape ta ville ou réessaie."}; }
  render();
}
/* brouillon du questionnaire de goûts (P.g dans plus.js) : on le retrouve via le dernier bloc rendu */
let gRef = null; const P_g = () => gRef;
function magasinsBloc(f){
  gRef = f; f.proches = f.proches || []; f.magasins = f.magasins || [];
  const ens = [...new Set([...f.proches.map(x => x.enseigne), ...f.magasins])];
  const g = O.geo || {};
  return `<div class="ov-mag"><span class="small muted">Tes magasins : on cherche ceux autour de toi, puis tu choisis tes enseignes. Le plan et la liste de courses en tiennent compte, avec les promos de la semaine.</span>
    <div class="row"><button class="btn sm solid" data-a="ov-geo">📍 ${f.proches.length ? "Relocaliser" : "Trouver les magasins près de moi"}</button></div>
    <div class="ov-ville"><input type="text" data-d="ov.ville" placeholder="ou tape ta ville / code postal" value="${esc(d("ov.ville", ""))}"><button class="btn sm ghost" data-a="ov-ville">Chercher</button></div>
    ${g.etat === "cherche" ? `<span class="small"><span class="ov-spin sm"></span> Recherche des magasins…</span>` : g.etat === "erreur" ? `<span class="small" style="color:var(--warn)">${esc(g.msg)}</span>` : g.etat === "vide" ? `<span class="small muted">Aucun supermarché trouvé à moins de 6 km.</span>` : ""}
    ${f.proches.length ? `<div class="ov-proches">${f.proches.slice(0, 6).map(x => `<div><b>${esc(x.nom)}</b><span class="small muted">${fr(x.km, 1)} km${x.adresse ? " · " + esc(x.adresse) : ""}</span></div>`).join("")}</div>` : ""}
    ${ens.length ? `<span class="small muted">Tes enseignes (une ou plusieurs, on prend le meilleur de chacune)</span><div class="px-chips">${ens.map(e => `<button class="${f.magasins.includes(e) ? "on" : ""}" data-a="px-gmag" data-v="${esc(e)}">${esc(e)}</button>`).join("")}</div>` : ""}</div>`;
}

/* ================= promos de la semaine (promos/{enseigne}, écrites par le serveur) ================= */
function suivrePromos(){
  const g = S.cur.notes.find(n => n.id === "gouts"); if (!g || !S.db) return;
  for (const e of (g.magasins || [])) { const k = cleEnseigne(e); if (O.promoSubs[k]) continue;
    O.promoSubs[k] = S.db.doc("promos/" + k).onSnapshot(s => { O.promos[e] = s.exists ? s.data() : null; render(); }, () => {}); }
}
const promosItems = mags => (mags || []).flatMap(mg => ((O.promos[mg] && O.promos[mg].items) || []).map(x => ({...x, magasin: mg})));

/* ================= Accueil ultra simple : UNE action à faire maintenant, puis 4 grosses tuiles ================= */
const isoJ = () => iso(new Date());
function prochaineAction(){
  const m = S.cur.member || {}, notes = S.cur.notes, all = allSeances(), e = m.programmeEtat || {};
  if (!notes.some(n => n.type === "objectifs")) return {emo: "📝", t: "Crée ton programme", s: "3 minutes de questions. Ensuite on s'occupe de tout.", a: "px-wz", v: "objectifs", b: "C'est parti"};
  if (e.statut === "en-cours" || (!all.length && !["medecin", "erreur", "verrou"].includes(e.statut))) return {emo: "⏳", t: "Ton programme arrive", s: "1 à 2 minutes. Tu peux fermer l'appli.", attente: true};
  if (e.statut === "medecin" || e.statut === "erreur") return {emo: e.statut === "medecin" ? "🩺" : "↻", t: e.statut === "medecin" ? "L'accord de ton médecin" : "On relance ton programme", s: e.statut === "medecin" ? "Une étape de sécurité avant de commencer." : "Un souci de notre côté.", a: "tab", v: "seances", b: "Voir"};
  const lim = iso(new Date(Date.now() - 7 * 864e5)), p = all.filter(x => seanceEntamee(x)).pop();
  if (p && !bilanFait(p) && (!p.date || p.date >= lim)) return {emo: "💬", t: "Comment s'est passée ta séance ?", s: "30 secondes. Ça débloque la suivante.", a: "open-bilan", v: p.id, b: "Répondre"};
  const nx = nextSeance(seancesSorted());
  if (nx) { const st = etapes(nx), f = st.filter(x => x.ok).length;
    if (!(jourDoc_(isoJ())?.forme) && !f) return {emo: "🌤️", t: "Comment tu te sens ?", s: "15 secondes, puis ta séance.", a: "px-forme", b: "Je réponds"};
    return {emo: "🏋️", t: nx.titre || "Ta séance", s: `${st.length} étapes · tout est guidé, suis l'écran.`, a: "go", v: nx.id, b: f ? "▶ Reprendre ma séance" : "▶ Faire ma séance", big: true}; }
  if (all.length) return {emo: "🚀", t: "Cycle terminé, bravo !", s: "On prépare la suite avec tes retours.", a: "tab", v: "seances", b: "Voir la suite"};
  return null;
}
const jourDoc_ = date => S.cur.notes.find(n => n.id === "j-" + date) || null;
function maintenant(){
  const x = prochaineAction(); if (!x) return "";
  return `<section class="sec"><div class="ov-now ${x.big ? "big" : ""}"><span class="ov-now-l">À faire maintenant</span>
    <div class="ov-now-h"><span class="ov-now-e">${x.emo}</span><div><b>${esc(x.t)}</b><span>${esc(x.s)}</span></div></div>
    ${x.attente ? `<div class="ov-bar"><i></i></div>` : `<button class="ov-now-b" data-a="${x.a}" ${x.v ? `data-v="${esc(x.v)}"` : ""}>${esc(x.b)}</button>`}</div></section>`;
}
function tuiles(){
  const a = acces(S.cur.member);
  const T = [["seances", "🏋️", "Mes séances", "tab"], ["photo", "📸", "Photo de mon assiette", "px-pr"], ["nutrition", "🥗", "Mes repas", "tab"], ["coach", "✨", "Parler au coach", "tab"]];
  return `<section class="sec"><div class="ov-tiles">${T.map(([v, e, l, act]) => { const lock = (v === "photo" || v === "nutrition") && !a.nutrition || v === "coach" && !a.ia;
    return `<button class="ov-tile" data-a="${lock ? "tab" : act}" data-v="${lock ? "offres" : v === "photo" ? "" : v}"><span>${e}</span><b>${esc(l)}</b>${lock ? `<i>🔒</i>` : ""}</button>`; }).join("")}</div></section>`;
}
function accueilSimple(orig){
  const m = S.cur.member || {}, h = new Date().getHours(), salut = h < 12 ? "Bonjour" : h < 18 ? "Salut" : "Bonsoir";
  /* l'accueil d'origine sans son titre ni ses cartes déjà résumées plus haut */
  const reste = orig.replace(/^\s*<section class="sec px-hello">[\s\S]*?<\/section>/, "");
  return `<section class="sec px-hello"><h2 class="px-h1">${salut}${m.prenom ? " " + esc(m.prenom) : ""} 👋</h2></section>${bandeau()}${maintenant()}${tuiles()}<div class="ov-plus">${reste}</div><section class="sec">${carteCoachPrive(true)}</section>`;
}

/* ================= branchements ================= */
window.OV = {accueilSimple, acces, paywall, prixMin, bandeau, essaiChip, carteProgramme, vueSeances, offres, compte, magasinsBloc, promosItems, bienvenue, bienvenueVue, icoIA, FORMULES};
const _act = act, _render = render, _view = view;
window.view = view = function(){ const out = _view(); return S.mode === "ready" && S.tab === "accueil" && S.cur.member && !isCoachUI() ? accueilSimple(out) : out; };
window.render = render = function(f){ _render(f); suivrePromos(); document.documentElement.dataset.ov = "1"; const r = document.getElementById("role"); if (r) r.textContent = ""; };
/* séances verrouillées en formule Découverte au-delà des 2 séances d'essai : rien à faire ici, le serveur n'en écrit que 2 */
window.act = act = async function(a, ds){
  const v = ds.v, mid = () => memberId();
  if (a === "tab" && v === "coach") { if (!acces(S.cur.member).ia) { S.tab = "offres"; window.scrollTo(0, 0); return render(); } return act("ia-open", {}); }
  if (a === "px-ask") return act("ia-open-q", {v: v || ""});
  if (a === "ia-open" && S.cur.member && !acces(S.cur.member).ia) { S.tab = "offres"; window.scrollTo(0, 0); toast("Le coach IA fait partie des formules payantes."); return render(); }
  if (a === "px-gsave") { await _act(a, ds); const g = S.cur.notes.find(n => n.id === "gouts"); const ens = (gRef && gRef.magasins) || (g && g.magasins) || [];
    for (const e of ens) S.db.doc("enseignes/" + cleEnseigne(e)).set({nom: e, at: Date.now()}).catch(() => {}); return; }
  if (!a.startsWith("ov-")) return _act(a, ds);
  switch (a) {
    case "ov-start": LS.set("orvea-start", "1"); S.mode = "loading"; render(true); try { await firebase.auth().signInAnonymously(); } catch (e) { S.mode = "offline"; S.err = e.code; render(true); } return;
    case "ov-google": LS.set("orvea-start", "1"); { const p = new firebase.auth.GoogleAuthProvider(); try { await firebase.auth().signInWithPopup(p); } catch (e) { if (/popup/.test(e.code || "")) return firebase.auth().signInWithRedirect(p); toast("Connexion impossible."); } } return;
    case "ov-lier": { const u = firebase.auth().currentUser, p = new firebase.auth.GoogleAuthProvider(); if (!u) return;
      try { await u.linkWithPopup(p); toast("Compte relié à Google ✓"); render(); }
      catch (e) { if (/popup/.test(e.code || "")) return u.linkWithRedirect(p); toast(e.code === "auth/credential-already-in-use" ? "Ce compte Google a déjà un espace Orvéa : déconnecte-toi puis connecte-toi avec Google." : "Liaison impossible pour l'instant."); } return; }
    case "ov-prenom": { const p = String(S.drafts["ov.prenom"] ?? "").trim().slice(0, 40); if (!p) return toast("Écris ton prénom.");
      if (await run(S.db.doc("members/" + mid()).update({prenom: p}), "Prénom enregistré")) delete S.drafts["ov.prenom"]; return; }
    case "ov-themes": S.tab = "compte"; render(); setTimeout(() => { const e = document.getElementById("ov-themes"); if (e) e.scrollIntoView({behavior: "smooth", block: "center"}); }, 60); return;
    case "ov-theme": LS.set("orvea-theme", v); window.OV_THEME(); return render();
    case "ov-per": O.cycleAnnuel = v === "an"; return render();
    case "ov-choisir": { const f = FORMULES.find(x => x.id === v); if (!f) return;
      /* le paiement (Stripe sur le web, achats intégrés sur les stores) se branche ici au lancement */
      toast(`${f.nom} : le paiement en ligne s'ouvre au lancement. Pendant l'essai, tu as déjà tout.`); return; }
    case "ov-relance": await run(S.db.collection(`members/${mid()}/notes`).add({type: "relance", auteur: "adherent", seance: null, at: Date.now(), medecinOk: v === "medecin"}), "C'est parti, ton programme s'écrit"); return;
    case "ov-suite": if (!confirm("Créer ton cycle suivant à partir de tes retours ?")) return;
      await run(S.db.collection(`members/${mid()}/notes`).add({type: "suite", auteur: "adherent", seance: null, at: Date.now()}), "Ton cycle suivant s'écrit (1 à 2 minutes)"); return;
    case "ov-debloque": await run(S.db.doc(`members/${mid()}/seances/${v}`).update({debloque: Date.now()}), "Séance suivante débloquée. Vas-y doucement 💪"); return;
    case "ov-geo": if (!navigator.geolocation) return toast("Localisation indisponible : tape ta ville."); return localiser();
    case "ov-ville": { const t = String(S.drafts["ov.ville"] || "").trim(); if (!t) return toast("Tape ta ville ou ton code postal."); return localiser(t); }
    case "ov-suppr": { if (!confirm("Supprimer ton compte et toutes tes données ? C'est définitif.")) return;
      try { const base = "members/" + mid();
        for (const c of ["seances", "notes", "photos"]) { const q = await S.db.collection(base + "/" + c).get(); for (const x of q.docs) await x.ref.delete(); }
        await S.db.doc(base).delete(); try { await firebase.auth().currentUser.delete(); } catch (e) { await firebase.auth().signOut(); }
        try { localStorage.clear(); } catch (e) {} location.reload();
      } catch (e) { toast("Suppression impossible pour l'instant. Réessaie."); } return; }
  }
};
})();
