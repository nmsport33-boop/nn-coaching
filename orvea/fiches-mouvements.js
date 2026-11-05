/* © 2026 Nathanael Neuville. Fiches détaillées des mouvements Animal Flow (05/11/2026).
   Affichées sous « Comment faire » dans la séance et dans la séance guidée, dès que le nom de l'exercice correspond.
   Chaque fiche : étapes, ce qu'on doit sentir, erreurs fréquentes, plus facile / plus dur, et ce que ça apporte. */
(function(){
  "use strict";
  const BASES = "Les 3 règles de l'Animal Flow : 1) mains bien à plat, doigts écartés, tu pousses le sol (épaules loin des oreilles) ; 2) tu bouges lentement et sans bruit, le contrôle avant la vitesse ; 3) tu respires en continu, tu souffles pendant l'effort.";
  const F = [
    {k: ["beast hold", "la bete", "beast"], t: "Beast hold (la bête)",
      pas: ["À quatre pattes : mains sous les épaules, genoux sous les hanches, orteils retournés.", "Pousse le sol avec les mains, serre légèrement le ventre comme pour te protéger d'un coup.", "Décolle les genoux de 2 à 3 cm, pas plus. Dos plat comme une table.", "Tiens en respirant calmement par le ventre."],
      sentir: "Le devant des épaules et le dentelé (sur les côtes, sous les bras), tout le ventre en gainage, les quadriceps qui tiennent la position.",
      erreurs: ["Genoux trop hauts, fesses en l'air : tu perds le gainage.", "Dos creusé ou rond.", "Épaules qui montent vers les oreilles.", "Bloquer la respiration."],
      facile: "Genoux décollés 5 sec, posés 5 sec, à répéter.", dur: "Lever une main ou un pied 2 sec sans que le bassin bouge.",
      pour: "C'est la base de tout le reste. Elle construit un ventre plat et dur et des épaules solides, sans charge."},
    {k: ["beast reach"], t: "Beast reach",
      pas: ["Mets-toi en bête (genoux à 2 cm du sol).", "Lève une main et va toucher l'épaule opposée, ou tends le bras devant toi.", "Repose-la sans bruit, puis change de main.", "Les hanches ne bougent pas : imagine un verre d'eau posé sur ton dos."],
      sentir: "L'épaule d'appui qui travaille fort, les obliques (côtés du ventre) qui empêchent le bassin de tourner.",
      erreurs: ["Le bassin qui bascule vers le côté de la main levée.", "Les genoux qui touchent le sol.", "Aller trop vite."],
      facile: "Pieds plus écartés, ou genoux posés.", dur: "Pieds serrés, ou 3 sec bras tendu devant.",
      pour: "Gainage anti-rotation : taille plus fine et dos protégé, très bon avant le judo ou les sports de contact."},
    {k: ["loaded beast"], t: "Loaded beast",
      pas: ["Pars de la bête.", "Recule les fesses vers les talons en gardant les genoux à 2 cm du sol.", "Le dos reste long, les bras tendus, les talons vont vers le sol.", "Reviens en poussant le sol avec les mains, épaules au-dessus des poignets."],
      sentir: "Un étirement des mollets et du dos, les quadriceps et les fessiers qui retiennent, les épaules qui poussent au retour.",
      erreurs: ["Dos qui s'arrondit en reculant.", "Poser les genoux.", "Revenir trop loin, épaules devant les mains."],
      facile: "Amplitude plus courte.", dur: "Tenir 3 sec en position chargée, ou enchaîner avec le wave unload.",
      pour: "La position de départ des transitions : elle chauffe les jambes, ouvre les chevilles et prépare les épaules."},
    {k: ["crab hold", "le crabe"], t: "Crab hold (le crabe)",
      pas: ["Assis, pieds à plat largeur de hanches, mains au sol derrière toi, doigts vers l'extérieur.", "Pousse le sol, épaules basses, poitrine ouverte.", "Décolle les fesses de 2 à 3 cm.", "Tiens en respirant, le regard devant."],
      sentir: "Le dos des épaules, le triceps, les ischios et les fessiers, et un étirement agréable du devant des épaules.",
      erreurs: ["Épaules qui remontent au niveau des oreilles.", "Poignets douloureux : tourne un peu plus les doigts vers l'extérieur.", "Fesses trop hautes."],
      facile: "Fesses posées, juste pousser le sol.", dur: "Lever un pied ou une main 2 sec.",
      pour: "Le contre-pied de la vie assise : ouvre la poitrine, redresse la posture, renforce le dos des épaules."},
    {k: ["crab reach"], t: "Crab reach",
      pas: ["Pars du crabe, fesses décollées.", "Pousse fort avec les pieds : les hanches montent très haut.", "En même temps, un bras passe au-dessus de la tête vers l'arrière, regard vers la main au sol.", "Redescends lentement dans le crabe, puis de l'autre côté."],
      sentir: "Les fessiers qui serrent en haut, un grand étirement de tout le devant du corps (hanche, ventre, poitrine, épaule).",
      erreurs: ["Pousser avec le bas du dos au lieu des fesses.", "Le bras qui tombe sans contrôle.", "Pied qui se décolle."],
      facile: "Hanches à mi-hauteur, bras devant.", dur: "Tenir 2 sec en haut, ou l'enchaîner avec un side kick through.",
      pour: "Sculpte les fessiers et ouvre la colonne : tu te sens grand et détendu après. Très proche de la mobilité capoeira (ponte)."},
    {k: ["side kick through"], t: "Side kick through",
      pas: ["Pars de la bête.", "Pivote sur les pieds et sur une main : la jambe du dessous passe sous ton corps et se tend sur le côté.", "La main libre se lève vers le haut ou recule, le talon de la jambe tendue frôle le sol.", "Reviens dans la bête sans bruit et change de côté."],
      sentir: "L'épaule d'appui, les obliques qui font tourner le buste, les hanches qui travaillent en rotation.",
      erreurs: ["Les fesses qui tombent au sol.", "Le pied qui tape le sol en revenant.", "Rentrer la tête dans les épaules."],
      facile: "Jambe à moitié tendue, rythme lent.", dur: "Kick plus haut et plus loin, ou enchaînement continu 30 sec.",
      pour: "Le mouvement roi de l'Animal Flow : gainage, épaules et souplesse des hanches. Il te rappellera la capoeira."},
    {k: ["underswitch"], t: "Underswitch",
      pas: ["Pars de la bête.", "Lève une main, passe la jambe opposée sous ton corps en pivotant sur l'autre pied.", "Tu te retrouves en crabe, face au plafond, fesses décollées.", "Reviens par le même chemin, puis de l'autre côté."],
      sentir: "Les épaules qui changent d'appui, la rotation du buste, les fessiers en arrivant en crabe.",
      erreurs: ["S'asseoir au lieu de rester en appui.", "Les mains trop proches du corps.", "Aller vite et perdre le contrôle."],
      facile: "Poser les fesses au sol en crabe.", dur: "Enchaîner gauche-droite sans pause, ou version sautée.",
      pour: "Coordination et agilité : tu passes du ventre au dos sans effort, comme une sortie de sol en judo."},
    {k: ["scorpion reach"], t: "Scorpion reach",
      pas: ["Pars de la bête.", "Pousse une jambe vers le plafond puis fais-la passer en diagonale par-dessus l'autre.", "La hanche s'ouvre, le regard suit le pied.", "Reviens lentement dans la bête et change de jambe."],
      sentir: "Le fessier de la jambe qui monte, le bas du dos qui s'étire en rotation, l'épaule opposée qui tient.",
      erreurs: ["Forcer dans le bas du dos.", "Plier les bras.", "Donner un coup de jambe au lieu de contrôler."],
      facile: "Petite amplitude, jambe pliée.", dur: "Tenir 2 sec en haut, puis le full scorpion.",
      pour: "Mobilité de la colonne et des hanches : soulage un dos raide et galbe les fessiers."},
    {k: ["traveling ape"], t: "Traveling ape",
      pas: ["Accroupi bas, talons au sol si possible, mains au sol sur le côté.", "Transfère ton poids sur les mains.", "Les pieds suivent sur le côté en petit saut ou en pas, les fesses restent basses.", "Repose-toi en accroupi et repars. Autant dans les deux sens."],
      sentir: "Les épaules et les bras qui portent le corps, les cuisses et les fessiers en position basse, les hanches qui s'ouvrent.",
      erreurs: ["Les fesses qui montent en l'air.", "Les mains trop près des pieds.", "Atterrir bruyamment."],
      facile: "Marcher avec les pieds au lieu de sauter.", dur: "Plus loin à chaque passage, ou forward et reverse ape.",
      pour: "Puissance des jambes et des épaules, cardio sans saut violent, ouverture des hanches."},
    {k: ["slow beast crawl", "beast crawl"], t: "Slow beast crawl",
      pas: ["En bête, genoux à 2 cm du sol.", "Avance main droite et pied gauche ensemble, d'un petit pas.", "Puis main gauche et pied droit.", "Dos immobile, genoux toujours au ras du sol. Fais l'aller en avant, le retour en arrière."],
      sentir: "Tout le ventre, les épaules, les quadriceps, et une vraie chaleur dans tout le corps.",
      erreurs: ["Les fesses qui montent.", "Le bassin qui se balance.", "Des pas trop grands."],
      facile: "Pas plus courts, pause en bête.", dur: "Plus lent, ou chaque pas tenu 2 sec.",
      pour: "Brûle-graisse doux et gainage complet : tout le corps travaille en même temps."},
    {k: ["crab walk"], t: "Crab walk",
      pas: ["En crabe, fesses décollées, hanches hautes.", "Avance main et pied opposés ensemble.", "Garde les épaules basses et la poitrine ouverte.", "Fais l'aller et le retour."],
      sentir: "Triceps, dos des épaules, fessiers et ischios.",
      erreurs: ["Les fesses qui traînent au sol.", "Les épaules qui remontent."],
      facile: "Distance plus courte.", dur: "Marche arrière plus longue, hanches à hauteur de table.",
      pour: "Bras et fessiers dessinés, posture plus droite."},
    {k: ["lateral ape"], t: "Lateral ape",
      pas: ["Accroupi profond, mains devant toi.", "Pose les mains sur le côté, un peu loin.", "Pousse avec les jambes et fais sauter les pieds à côté des mains, fesses basses.", "Atterris sans bruit en accroupi et repars."],
      sentir: "Les cuisses et fessiers qui poussent, les épaules qui réceptionnent, le cardio qui monte.",
      erreurs: ["Sauter en hauteur au lieu de sur le côté.", "Atterrir talons décollés, genoux rentrés."],
      facile: "Traveling ape en marchant.", dur: "Plus loin, plus rapide, toujours sans bruit.",
      pour: "Explosivité et cardio, très proche des déplacements de capoeira."},
    {k: ["forward ape", "reverse ape"], t: "Forward ape et reverse ape",
      pas: ["Accroupi, mains posées devant toi à une longueur de bras.", "Mets le poids sur les mains et fais sauter les pieds jusqu'aux mains.", "Replace les mains devant, recommence. Au retour, marche arrière : pieds vers l'arrière d'abord, puis les mains."],
      sentir: "Épaules, triceps, ventre, et les cuisses qui amortissent.",
      erreurs: ["Les bras pliés à la réception.", "Atterrir sur la pointe, genoux en dedans."],
      facile: "Pas au lieu de sauts.", dur: "Plus loin, ou enchaîné avec un front kick through.",
      pour: "Force des épaules et explosivité : la base pour les équilibres sur les mains."},
    {k: ["wave unload"], t: "Wave unload",
      pas: ["Pars de la loaded beast (fesses vers les talons).", "Fais glisser la poitrine vers l'avant, près du sol, comme une vague.", "Termine en appui, bras tendus, hanches basses, poitrine ouverte.", "Reviens en vague inverse jusqu'à la loaded beast."],
      sentir: "Pectoraux et épaules qui retiennent, tout le dos qui se déroule vertèbre par vertèbre, le ventre qui contrôle.",
      erreurs: ["Tomber vers le sol au lieu de glisser.", "Plier les coudes vers l'extérieur.", "Creuser fort le bas du dos."],
      facile: "Petite vague, sans descendre près du sol.", dur: "Plus lent (4 sec aller, 4 sec retour).",
      pour: "Souplesse de la colonne et force du haut du corps : galbe pectoraux et épaules, libère le dos."},
    {k: ["front kick through"], t: "Front kick through",
      pas: ["Pars de la bête.", "Lève une main, passe la jambe opposée en avant sous ton corps et tends-la devant toi.", "Le buste reste droit, la main levée vers le haut.", "Ramène la jambe sans bruit en bête et change de côté."],
      sentir: "L'épaule d'appui, les abdos du bas, les fléchisseurs de hanche, l'ischio qui s'étire.",
      erreurs: ["S'asseoir sur le pied d'appui.", "Jambe molle, pied qui tape le sol.", "Arrondir le dos."],
      facile: "Jambe pliée, amplitude courte.", dur: "Jambe tendue haute, ou enchaîné avec underswitch.",
      pour: "Abdos du bas et souplesse des ischios : pour sculpter le ventre et gagner en amplitude de jambes."},
    {k: ["full scorpion"], t: "Full scorpion",
      pas: ["Pars de la bête.", "Monte la jambe comme pour le scorpion reach, puis continue : le pied passe loin par-dessus et se pose de l'autre côté.", "La poitrine s'ouvre vers le côté, la main du même côté peut se lever.", "Reviens en contrôlant, la jambe repasse par le même chemin."],
      sentir: "Un grand étirement de la hanche et du devant de la cuisse, la rotation de la colonne, l'épaule d'appui très engagée.",
      erreurs: ["Se jeter sans contrôle.", "Forcer si tu sens une pince dans le bas du dos.", "Plier le bras d'appui."],
      facile: "Scorpion reach.", dur: "Pause 2 sec pied posé, ou enchaîné dans un flow.",
      pour: "Le mouvement des personnes souples : beaucoup de mobilité utile, et une belle sensation de liberté du corps."},
    {k: ["flow side kick through + crab reach", "flow side kick through"], t: "Flow side kick through + crab reach",
      pas: ["Bête : 2 respirations.", "Side kick through à droite, puis retour en bête.", "Underswitch vers le crabe, crab reach, puis retour en bête.", "Même chose à gauche. Enchaîne sans t'arrêter, en respirant à chaque transition."],
      sentir: "Tout le corps, le cardio qui monte doucement, la concentration.",
      erreurs: ["Courir après le chrono : mieux vaut 3 enchaînements propres que 6 bâclés.", "Bloquer la respiration."],
      facile: "Une pause en bête entre chaque mouvement.", dur: "Plus long (2 à 3 min), ou ajoute le full scorpion.",
      pour: "Le flow, c'est ce qui rend l'Animal Flow addictif : on sort de la séance plus souple, plus fort et plus léger."}
  ];
  const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)/g, " ").replace(/[^a-z0-9+]+/g, " ").trim();
  const IDX = F.flatMap(f => f.k.map(k => [norm(k), f])).sort((a, b) => b[0].length - a[0].length);
  function trouver(nom){
    const x = norm(nom); if (!x) return null;
    const e = IDX.find(([k]) => x === k || x.startsWith(k + " ") || x.includes(" " + k + " ") || x.endsWith(" " + k) || (k.length > 6 && x.includes(k)));
    return e ? e[1] : null;
  }
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"})[c]);
  /* fiche HTML (vide si l'exercice n'est pas un mouvement Animal Flow connu) */
  window.ficheMouvement = function(nom){
    const f = trouver(nom); if (!f) return "";
    return `<div class="fiche-mvt"><b>Fiche ${esc(f.t)}</b>
      <ol>${f.pas.map(p => `<li>${esc(p)}</li>`).join("")}</ol>
      <p><b>Ce que tu dois sentir :</b> ${esc(f.sentir)}</p>
      <p><b>Erreurs à éviter :</b></p><ul>${f.erreurs.map(p => `<li>${esc(p)}</li>`).join("")}</ul>
      <p><b>Plus facile :</b> ${esc(f.facile)}<br><b>Plus dur :</b> ${esc(f.dur)}</p>
      <p><b>Pour toi :</b> ${esc(f.pour)}</p>
      <p class="small muted">${esc(BASES)}</p></div>`;
  };
  window.ficheMouvementExiste = nom => !!trouver(nom);
})();
(function(){ try { const st = document.createElement("style");
  st.textContent = ".fiche-mvt{margin-top:8px;padding:10px 12px;border-left:3px solid var(--a1,#0ff);background:rgba(127,127,127,.08);border-radius:8px;font-size:14px;line-height:1.45}.fiche-mvt ol,.fiche-mvt ul{margin:6px 0 6px 18px;padding:0}.fiche-mvt p{margin:6px 0}";
  document.head.appendChild(st); } catch (e) {} })();
