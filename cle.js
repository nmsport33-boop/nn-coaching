/* © 2026 Nathanael Neuville, NN Coaching. Tous droits réservés.
   « La clé » (05/11/2026, demande de Nathanael) : sur l'accueil de chaque adhérent, une phrase positive qui change
   chaque jour, et le rappel que sommeil et alimentation comptent autant que l'entraînement. Uniquement dans l'appli.
   En fin de séance, le message de bravo rappelle aussi de bien manger et bien dormir.
   Chargé en dernier (après plus.js, ia.js et orvea.js) : il enveloppe view() et finSeance() sans rien écrire. */
(function(){
"use strict";
const PHRASES = [
  "Chaque séance compte, même celle où tu n'avais pas envie.",
  "Tu n'as pas besoin d'être parfait·e, juste régulier·e.",
  "Le progrès, c'est un peu mieux qu'hier. Rien de plus.",
  "Ton corps entend tout ce que tu lui dis. Parle-lui bien.",
  "La motivation te fait commencer, l'habitude te fait continuer.",
  "Petit pas après petit pas, tu fais un grand chemin.",
  "Tu es plus fort·e que tu ne le penses.",
  "Aujourd'hui, fais-le pour la personne que tu seras dans trois mois.",
  "Une mauvaise séance vaut mieux que pas de séance.",
  "Ce que tu fais aujourd'hui, ton corps te le rendra demain.",
  "Sois fier·e de chaque effort, même le plus petit.",
  "La constance bat le talent quand le talent ne se lève pas.",
  "Respire, souris, et avance. Le reste suit.",
  "Ton seul adversaire, c'est toi d'hier.",
  "Le plus dur, c'est de commencer. Tu l'as déjà fait.",
  "Prends soin de toi : tu es ton meilleur investissement.",
  "Les résultats arrivent à ceux qui ne lâchent pas.",
  "Un jour à la fois, une séance à la fois.",
  "La bonne humeur, ça s'entraîne aussi.",
  "Tu ne te compares qu'à toi-même, et tu progresses.",
  "Chaque goutte de sueur te rapproche de ton objectif.",
  "Fais de ton mieux avec l'énergie du jour, c'est déjà gagné.",
  "Ton futur toi te dit merci.",
  "La discipline, c'est se souvenir de ce que tu veux vraiment.",
  "Bouger, c'est se faire du bien. Pas une punition, un cadeau.",
  "Avance à ton rythme, mais avance.",
  "Ce n'est pas une course, c'est un chemin. Et tu es dessus.",
  "Crois en toi autant que ton coach croit en toi.",
  "Un sourire avant la séance, et elle passe deux fois plus vite.",
  "Tu as déjà fait des choses plus difficiles que ça.",
  "La fatigue passe, la fierté reste.",
  "Rien ne change si rien ne change. Et toi, tu as commencé.",
  "Sois patient·e avec ton corps, il fait de son mieux pour toi.",
  "Le meilleur moment pour prendre soin de toi, c'est maintenant.",
  "Chaque répétition est un vote pour la personne que tu deviens.",
  "Positive, régulière, sans pression : c'est comme ça qu'on gagne."];
const CLES = [
  ["😴", "Le sommeil, c'est là que tes muscles se reconstruisent. Vise 7 à 9 heures."],
  ["🥗", "Ce que tu manges, c'est le carburant de tes séances. Des protéines et des légumes à chaque repas."],
  ["💧", "Bois de l'eau tout au long de la journée, surtout les jours de séance."],
  ["🌙", "Une bonne nuit vaut parfois plus qu'une séance de plus. Couche-toi à heure régulière."],
  ["🍳", "Après l'effort, un vrai repas : c'est lui qui transforme ta séance en progrès."],
  ["📵", "Les écrans éteints une demi-heure avant de dormir, et ton sommeil devient vraiment récupérateur."],
  ["🍽️", "Pas besoin d'un régime strict : des repas simples, réguliers, et assez de protéines."]];
/* même phrase toute la journée, différente d'un jour à l'autre et d'une personne à l'autre */
function graine(){
  const t = new Date(), j = Math.floor(new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime() / 864e5);
  const id = String((typeof memberId === "function" && memberId()) || S.uid || "");
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return j + (h % 97);
}
function carteCle(){
  const g = graine(), ph = PHRASES[g % PHRASES.length], [ico, cle] = CLES[g % CLES.length];
  return `<section class="sec"><div class="card cle-card">
    <span class="eyebrow">Ta phrase du jour</span><b class="cle-ph">« ${esc(ph)} »</b>
    <div class="cle-trio"><span>💪 Sport</span><i>+</i><span>😴 Sommeil</span><i>+</i><span>🥗 Alimentation</span></div>
    <span class="small">La clé du succès : l'un ne va pas sans l'autre. Si tu veux des résultats, prends soin des trois.</span>
    <span class="small muted">${ico} ${esc(cle)}</span></div></section>`;
}
const st = document.createElement("style");
st.textContent = `.cle-card{gap:8px;border:1px solid rgba(var(--ov,0,0,0),.08)}
.cle-ph{font-family:var(--display,inherit);font-size:19px;line-height:1.3}
.cle-trio{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-weight:700;font-size:13px}
.cle-trio span{padding:4px 10px;border-radius:999px;background:rgba(127,127,127,.14)}
.cle-trio i{font-style:normal;opacity:.5}`;
document.head.appendChild(st);

const _view = view;
window.view = view = function(){
  const out = _view();
  try {
    if (S.mode === "ready" && S.tab === "accueil" && S.cur?.member && !isCoachUI()) {
      const m = out.match(/<section class="sec px-hello">[\s\S]*?<\/section>/);
      if (m) return out.replace(m[0], m[0] + carteCle());
      return carteCle() + out;
    }
  } catch (e) {}
  return out;
};
if (typeof finSeance === "function") {
  window.finSeance = finSeance = function(){ sonBloc();
    celebre("Séance terminée !", "Énorme 👏 Maintenant, un bon repas et une bonne nuit : c'est là que tu progresses.", true); };
}
})();
