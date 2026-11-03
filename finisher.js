/* © Nathanael Neuville. Minuteur automatique des finishers (Tabata, EMOM, AMRAP, circuits en temps).
   Un seul GO : préparation 10 s, effort / repos / tours enchaînés tout seuls, bips 3-2-1, voix, coches automatiques.
   Se branche sur la séance guidée sans la modifier (renderGo et act sont enveloppés). */
(function () {
  if (typeof renderGo !== "function" || typeof act !== "function" || typeof S === "undefined") return;

  const low = t => String(t || "").toLowerCase();
  const num = (t, re, def) => { const m = t.match(re); return m ? Number(m[1]) : def; };
  /* « 30 sec d'effort », « 40" on », « 45 s de travail » */
  const effortSec = t => num(t, /(\d+)\s*(?:s|sec|secondes?|")\s*(?:d'effort|d’effort|de travail|on\b|effort)/, 0);
  /* récup entre les exos : « 15 s de récup entre les exos », « repos 20 sec entre chaque exo » */
  const entreSec = t => num(t, /(\d+)\s*(?:s|sec|")\s*(?:de\s+)?(?:repos|récup)\s+entre/, 0) || num(t, /(?:repos|récup)\s*(\d+)\s*(?:s|sec|")?\s+entre/, 0);

  /* répète les exos sur N intervalles ; la coche d'un exo part à son dernier passage */
  function cycle(items, N) { const out = []; for (let i = 0; i < N; i++) out.push({e: items[i % items.length].e, k: null, y: items[i % items.length]});
    items.forEach(y => { for (let i = out.length - 1; i >= 0; i--) if (out[i].y === y) { out[i].k = y.k; break; } }); return out; }

  /* plan d'un bloc : null si ce n'est pas un finisher à minuter */
  function planFin(s, bi) {
    const b = s && s.blocs && s.blocs[bi]; if (!b || !(b.exos || []).length) return null;
    const st = etapes(s).filter(y => y.bi === bi), todo = st.filter(y => !y.ok); if (!todo.length) return null;
    const tx = low(`${b.tours || ""} ${b.nom || ""}`), all = low(tx + " " + b.exos.map(e => `${e.n || ""} ${e.d || ""}`).join(" "));
    const fin = /^fin/i.test(b.code || ""), n = nbTours(b.tours), P = [];
    const go = (sec, y, lbl, extra) => P.push(Object.assign({ph: "go", sec, k: y && y.k, e: y && y.e, lbl}, extra || {}));
    const rest = (sec, lbl, y) => { if (sec > 0) P.push({ph: "rest", sec, lbl, e: y && y.e}); };
    let mode, titre, info;
    if (/tabata/.test(all)) {
      mode = "tabata"; const m = all.match(/(\d+)\s*(?:s|sec|")?\s*(?:on|effort|travail)?\s*\/\s*(\d+)\s*(?:s|sec|")?\s*(?:off|repos|récup)?/);
      const w = m && +m[1] >= 5 ? +m[1] : 20, r = m && +m[2] >= 0 ? +m[2] : 10;
      const seq = n >= 2 ? todo : cycle(todo, num(all, /(\d+)\s*(?:intervalles?|rounds?)/, 8));
      seq.forEach((y, i) => { go(w, y, `Intervalle ${i + 1} / ${seq.length}`); if (i < seq.length - 1) rest(r, "Repos", seq[i + 1]); });
      titre = `HIIT ${w}/${r}`; info = `${w} s d'effort, ${r} s de repos, ${seq.length} intervalles`;
    } else if (/\bemom\b|e\d\s*mom|toutes les\s*\d*\s*min/.test(all)) {
      mode = "emom"; const every = num(all, /e(\d)\s*mom/, 0) || num(all, /toutes les\s*(\d+)\s*min/, 1);
      const mins = num(all, /emom\s*(?:de\s*|sur\s*)?(\d+)/, 0) || num(all, /(\d+)\s*(?:min|')\s*(?:en\s*)?emom/, 0);
      const seq = n >= 2 ? todo : cycle(todo, Math.max(1, Math.round((mins || todo.length * 3) / every)));
      seq.forEach((y, i) => go(60 * every, y, `Minute ${i * every + 1} / ${seq.length * every}`, {emom: true}));
      titre = "EMOM"; info = `un exo au début de chaque ${every > 1 ? every + " minutes" : "minute"}, le reste de la minute c'est ta récup`;
    } else if (/amrap/.test(all)) {
      mode = "amrap"; const mins = num(all, /amrap\s*(?:de\s*)?(\d+)/, 0) || num(all, /(\d+)\s*(?:min|')\s*(?:en\s*)?amrap/, 0) || num(tx, /(\d+)\s*(?:min|')/, 10);
      P.push({ph: "go", sec: mins * 60, ks: todo.map(y => y.k), liste: todo.filter((y, i, a) => a.findIndex(z => z.e === y.e) === i).map(y => y.e), lbl: "Un max de tours"});
      titre = "AMRAP"; info = `${mins} min : enchaîne les exos en boucle, un max de tours`;
    } else {
      const eff = effortSec(all); if (!fin) return null;
      const dur = y => dureeExo(y.e.d, y.e.n) || (eff ? {sec: eff, sides: 1} : null);
      if (!todo.every(dur)) return null;
      const entre = entreSec(all), recup = reposSec(b.tours) || 60;
      todo.forEach((y, i) => { const t = dur(y), nx = todo[i + 1], tour = n >= 2 ? `Tour ${y.t} / ${n}` : "";
        if (t.sides > 1) { go(t.sec, null, [tour, "côté 1"].filter(Boolean).join(" · "), {e: y.e}); rest(5, "Change de côté", y); go(t.sec, y, [tour, "côté 2"].filter(Boolean).join(" · ")); }
        else go(t.sec, y, tour);
        if (nx) { if (nx.t !== y.t) rest(recup, "Récup", nx); else rest(entre || 5, entre ? "Récup" : "Exo suivant", nx); } });
      mode = "circuit"; titre = "Finisher"; info = `${n >= 2 ? n + " tours, " : ""}effort et récup enchaînés tout seuls`;
    }
    if (!P.length) return null;
    P.unshift({ph: "pret", sec: 10, lbl: "Prépare-toi", e: P[0].e, liste: P[0].liste});
    return {mode, titre, info, P, bi, total: P.reduce((a, p) => a + p.sec, 0)};
  }
  window.planFin = planFin;

  /* --- son : sur iPhone, jouer même en mode silencieux (Safari 17+) --- */
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
  const T = (f, t0, d, v, type, f2) => { try { ton(f, t0, d, v, type, f2); } catch (e) {} };
  const SON = {
    tic: () => { T(1046, 0, .12, .5, "square"); try { navigator.vibrate && navigator.vibrate(60); } catch (e) {} },
    go: () => { T(784, 0, .12, .5, "square"); T(1046, .12, .12, .5, "square"); T(1568, .24, .55, .55, "square"); try { navigator.vibrate && navigator.vibrate([250, 80, 250]); } catch (e) {} },
    repos: () => { T(988, 0, .2, .45, "triangle"); T(659, .2, .45, .45, "triangle"); try { navigator.vibrate && navigator.vibrate(300); } catch (e) {} },
    cote: () => { T(880, 0, .15, .45, "triangle"); T(880, .22, .15, .45, "triangle"); },
    alerte: () => { T(1318, 0, .08, .35, "square"); T(1318, .14, .08, .35, "square"); }
  };
  /* --- voix (si dispo) --- */
  let voix = null;
  const choisir = () => { try { const vs = speechSynthesis.getVoices(); voix = vs.find(v => /^fr(-|_)FR/i.test(v.lang) && /google|thomas|amélie|audrey|marie/i.test(v.name)) || vs.find(v => /^fr/i.test(v.lang)) || null; } catch (e) {} };
  try { choisir(); speechSynthesis.addEventListener && speechSynthesis.addEventListener("voiceschanged", choisir); } catch (e) {}
  function parle(txt, vite) { try { const v = window.speechSynthesis; if (!v || !txt) return; v.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = "fr-FR"; if (voix) u.voice = voix; u.rate = vite ? 1.25 : 1.08; u.pitch = 1.05; u.volume = 1; v.speak(u); } catch (e) {} }
  const ENC = ["Allez, on lâche rien !", "Tiens bon !", "Plus que dix secondes !", "Encore un peu !"];
  function annonce(p) { if (!p) return;
    if (p.ph === "pret") parle("Prépare-toi" + (p.e ? ". " + p.e.n : ""));
    else if (p.ph === "rest") parle(p.lbl === "Change de côté" ? "Change de côté" : p.lbl === "Exo suivant" ? "Exo suivant" + (p.e ? ", " + p.e.n : "") : "Repos" + (p.e ? ". Ensuite, " + p.e.n : ""));
    else parle(p.liste ? "Top départ ! Un max de tours" : "Top départ !" + (p.e ? " " + p.e.n : "")); }
  /* chaque seconde : 3-2-1 parlé + bip, rappels pendant l'effort */
  function seconde(f, p, left) {
    if (left <= 3) { SON.tic(); parle(["", "Un", "Deux", "Trois"][left], true); pulse(); return; }
    if (p.ph !== "go") return;
    if (left === 10 && p.sec >= 25) { SON.alerte(); parle("Plus que dix secondes !"); }
    else if (p.sec >= 40 && left === Math.round(p.sec / 2)) parle(f.mode === "amrap" ? "Moitié du temps, continue !" : "Moitié, on lâche rien !");
    else if (f.mode === "amrap" && left % 60 === 0 && left > 10) parle(`Plus que ${left / 60} minute${left > 60 ? "s" : ""}`); }
  function pulse() { document.querySelectorAll(".fx-t").forEach(el => { el.classList.remove("tic"); void el.offsetWidth; el.classList.add("tic"); }); }

  /* --- moteur --- */
  function finGo(sid, bi) { const s = S.cur.seances[sid], p = s && planFin(s, Number(bi)); if (!p) return;
    try { if (S.repos) stopRepos(); } catch (e) {} try { if (S.chrono) stopChrono(); } catch (e) {} audioOn();
    S.fin = {sid, bi: Number(bi), mode: p.mode, titre: p.titre, P: p.P, pi: 0, fin: Date.now() + p.P[0].sec * 1000, bip: 99, pause: null};
    SON.go(); annonce(p.P[0]); tick(); }
  function stop() { S.fin = null; clearInterval(S.finH); S.finH = null; try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {} }
  function tick() { const f = S.fin; if (!f) { clearInterval(S.finH); S.finH = null; return; }
    if (!S.finH) S.finH = setInterval(tick, 200);
    if (f.pause != null) return;
    const left = Math.ceil((f.fin - Date.now()) / 1000);
    if (left > 0) { if (left < f.bip) { const p = f.P[f.pi]; if (f.bip !== 99 || left <= 3) seconde(f, p, left); f.bip = left; }
      return maj(); }
    suivant(); }
  function marque(p) { if (!p || p.ph !== "go") return; const ks = p.ks || (p.k ? [p.k] : []); if (!ks.length) return;
    const f = S.fin, s = S.cur.seances[f.sid]; if (!s) return; s.coches = Object.assign({}, s.coches);
    const args = []; ks.forEach(k => { s.coches[k] = true; args.push(new firebase.firestore.FieldPath("coches", k), true); });
    const b = s.blocs[f.bi]; if (nbTours(b.tours) >= 2) { const tf = toursComplets(s, f.bi, b); s.toursFaits = Object.assign({}, s.toursFaits, {[f.bi]: tf}); args.push(new firebase.firestore.FieldPath("toursFaits", String(f.bi)), tf); }
    try { S.db.doc(`members/${memberId()}/seances/${f.sid}`).update(...args).catch(() => {}); } catch (e) {} }
  function suivant() { const f = S.fin; if (!f) return; marque(f.P[f.pi]); f.pi++; f.bip = 99;
    if (f.pi >= f.P.length) return fini();
    const p = f.P[f.pi]; f.fin = Date.now() + p.sec * 1000; (p.ph === "go" ? SON.go : p.lbl === "Change de côté" ? SON.cote : SON.repos)(); annonce(p);
    if (p.k || (p.ph === "rest" && p.e)) { const st = etapes(S.cur.seances[f.sid]), y = st.find(z => z.k === p.k) || st.find(z => !z.ok && z.bi === f.bi); if (y) try { focusSur(f.sid, y.k); } catch (e) {} }
    render(); }
  function fini() { const f = S.fin, s = S.cur.seances[f.sid], b = s && s.blocs[f.bi]; stop();
    if (s) { const st = etapes(s), first = st.findIndex(y => !y.ok);
      if (S.go && S.go.sid === f.sid) { S.go.i = first < 0 ? st.length - 1 : first; if (first < 0) S.go.fin = true; }
      try { if (seanceFinie(s)) finSeance(); else if (b) bravoBloc(b); } catch (e) {}
      parle(first < 0 ? "Séance terminée, bravo" : "Finisher terminé, bravo");
      if (first >= 0) try { focusSur(f.sid, st[first].k); } catch (e) {} }
    render(); }
  const reste = f => Math.max(0, (f.pause != null ? f.pause : f.fin - Date.now())) / 1000 + f.P.slice(f.pi + 1).reduce((a, p) => a + p.sec, 0);
  const txt = l => mmss(l);
  function maj() { const f = S.fin, p = f.P[f.pi], ms = f.pause != null ? f.pause : f.fin - Date.now(), l = Math.max(0, Math.ceil(ms / 1000));
    majRing("fin", ms / (p.sec * 1000), txt(l)); document.querySelectorAll(".fin-tot").forEach(b => b.textContent = mmss(Math.ceil(reste(f)))); }

  function vue() { const f = S.fin, el = $("go"), p = f.P[f.pi], s = S.cur.seances[f.sid], b = s.blocs[f.bi];
    const ms = f.pause != null ? f.pause : f.fin - Date.now(), l = Math.max(0, Math.ceil(ms / 1000));
    const gos = f.P.filter(q => q.ph === "go"), iGo = f.P.slice(0, f.pi + 1).filter(q => q.ph === "go").length, pct = Math.round((f.pi + 1) / f.P.length * 100);
    const resteGo = gos.length - iGo + (p.ph === "go" ? 1 : 0), nx = f.P.slice(f.pi + 1).find(q => q.ph === "go");
    const tours = (() => { const ts = gos.map(q => (String(q.lbl).match(/Tour (\d+) \/ (\d+)/) || [])).filter(m => m[1]); if (!ts.length) return null;
      const cur = (String((p.ph === "go" ? p : nx || p).lbl).match(/Tour (\d+) \/ (\d+)/) || [])[1]; return cur ? {cur: +cur, n: +ts[0][2]} : null; })();
    const mot = p.ph === "pret" ? "En place" : p.ph === "rest" ? (p.lbl === "Change de côté" ? "Change de côté" : p.lbl === "Exo suivant" ? "Exo suivant" : "Récup") : f.mode === "amrap" ? "Max de tours" : f.mode === "emom" ? "Go" : "Effort";
    const quoi = p.ph === "rest" ? nx : p;
    const corps = p.liste ? `<div class="fx-liste">${p.liste.map(e => `<div><b>${esc(e.n)}</b>${e.d ? ` <i>${esc(e.d)}</i>` : ""}</div>`).join("")}</div>`
      : quoi && quoi.e ? `<div class="fx-exo">${p.ph === "rest" ? "<small>Ensuite</small>" : ""}<b>${esc(quoi.e.n)}</b>${quoi.e.d && /emom|tabata/.test(f.mode) ? `<i>${esc(quoi.e.d)}</i>` : ""}</div>` : "";
    const gauche = tours ? `<div class="fx-cpt"><b>${tours.n - tours.cur + 1}</b><span>${tours.n - tours.cur + 1 > 1 ? "tours restants" : "dernier tour"}</span></div>`
      : `<div class="fx-cpt"><b>${resteGo}</b><span>${f.mode === "emom" ? "minutes restantes" : f.mode === "amrap" ? "bloc" : "efforts restants"}</span></div>`;
    el.innerHTML = `<div class="finx ${p.ph}${f.pause != null ? " pause" : ""}"><div class="fx-top"><button class="fx-x" data-a="go-close" aria-label="Quitter">✕</button>
        <div class="fx-titre">${esc(f.titre)}${b.nom && low(b.nom) !== low(f.titre) ? " · " + esc(b.nom) : ""}<span>Reste <b class="fin-tot">${mmss(Math.ceil(reste(f)))}</b></span></div><button class="fx-x" data-a="fin-skip" aria-label="Passer">⏭</button></div>
      <div class="fx-bar"><i style="width:${pct}%"></i></div>
      <div class="fx-main"><div class="fx-mot">${esc(mot)}</div><div class="fx-t fin-t">${mmss(l)}</div>${corps}${p.ph === "go" && p.lbl && !tours ? `<div class="fx-sous">${esc(p.lbl)}</div>` : ""}</div>
      <div class="fx-bas">${gauche}<button class="fx-play" data-a="fin-pause" aria-label="${f.pause != null ? "Reprendre" : "Pause"}">${f.pause != null ? "▶" : "❚❚"}</button>
        <div class="fx-cpt"><b class="fx-nx">${nx && nx.e && p.ph === "go" ? esc(nx.e.n) : "—"}</b><span>à suivre</span></div></div>
      <button class="fx-stop" data-a="fin-stop">Arrêter le minuteur</button></div>`;
    el.hidden = false; document.body.classList.add("going"); }

  /* --- branchement sur la séance guidée --- */
  const renderGo0 = renderGo;
  renderGo = function () {
    const g = S.go, s = g && S.cur && S.cur.seances && S.cur.seances[g.sid];
    if (S.fin && (!g || !s || g.sid !== S.fin.sid)) stop();
    if (S.fin) return vue();
    renderGo0.apply(this, arguments);
    try {
      if (!g || !s || g.stop || g.check || g.fin) return;
      const st = etapes(s), x = st[g.i]; if (!x || x.ok) return;
      const btn = $("go").querySelector(".go-bas .go-fait"); if (!btn || btn.classList.contains("deja")) return;
      const p = planFin(s, x.bi); if (!p) return;
      btn.outerHTML = `<button class="go-fait gofin" data-a="fin-go" data-v="${esc(g.sid)}" data-k="${x.bi}"><b>▶</b>GO ${esc(p.titre)}<small>${mmss(p.total)}</small></button>`;
      const card = $("go").querySelector(".go-card"); if (card) card.insertAdjacentHTML("beforeend", `<div class="fin-auto">⏱ Minuteur automatique : ${esc(p.info)}. Un seul GO, tout s'enchaîne avec des bips.</div>`);
      const sans = $("go").querySelector(".go-sans"); if (!sans) $("go").querySelector(".go-bas")?.insertAdjacentHTML("afterend", `<button class="btn link go-sans" data-a="go-fait" data-v="${esc(g.sid)}" data-k="${x.k}">Cocher sans le minuteur</button>`);
    } catch (e) {}
  };
  const act0 = act;
  act = async function (a, ds) {
    if (a === "fin-go") return finGo(ds.v, ds.k);
    if (a === "fin-stop") { stop(); return; }
    if (a === "fin-skip") { if (S.fin) { if (S.fin.pause != null) S.fin.pause = null; suivant(); } return; }
    if (a === "fin-pause") { const f = S.fin; if (!f) return; if (f.pause != null) { f.fin = Date.now() + f.pause; f.pause = null; } else { f.pause = Math.max(0, f.fin - Date.now()); try { speechSynthesis.cancel(); } catch (e) {} } return; }
    if (a === "go-close" && S.fin) stop();
    return act0.apply(this, arguments);
  };

  const css = document.createElement("style");
  css.textContent = `.go-fait.gofin{background:radial-gradient(circle at 35% 30%,#ffb3c7,#ff4d7a 45%,#c2185b);color:#fff;box-shadow:0 0 0 6px rgba(255,77,122,.14),0 0 40px rgba(255,77,122,.5)}
.go-fait.gofin small{font-size:13px;opacity:.85;font-weight:700}
.fin-auto{margin-top:12px;font-size:13px;line-height:1.4;color:var(--muted);border-top:1px solid rgba(var(--ov),.08);padding-top:10px}
.finx{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;color:#0b0f14;transition:background .3s;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
.finx.pret{background:#ffc94a}.finx.go{background:#2fd47e}.finx.rest{background:#ff6b6b}.finx.pause{filter:saturate(.35) brightness(.9)}
.fx-top{display:flex;align-items:center;gap:10px;padding:12px 14px 6px}
.fx-x{width:44px;height:44px;border-radius:50%;border:0;background:rgba(0,0,0,.14);color:inherit;font-size:20px;font-weight:800;flex:none}
.fx-titre{flex:1;text-align:center;font-family:var(--display);font-weight:800;text-transform:uppercase;letter-spacing:.06em;font-size:15px;display:flex;flex-direction:column;gap:2px}
.fx-titre span{font-family:inherit;font-size:13px;letter-spacing:.04em;opacity:.75}.fx-titre b{font-variant-numeric:tabular-nums}
.fx-bar{height:6px;margin:4px 14px 0;border-radius:6px;background:rgba(0,0,0,.14);overflow:hidden}.fx-bar i{display:block;height:100%;background:#0b0f14;transition:width .3s}
.fx-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 16px;gap:6px;min-height:0}
.fx-mot{font-family:var(--display);font-weight:900;text-transform:uppercase;letter-spacing:.04em;font-size:clamp(34px,12vw,64px);line-height:1}
.fx-t{font-family:var(--display);font-weight:900;font-variant-numeric:tabular-nums;font-size:clamp(96px,34vw,220px);line-height:.95;letter-spacing:-.02em}
.fx-exo{display:flex;flex-direction:column;gap:2px;margin-top:6px}.fx-exo small{font-size:13px;letter-spacing:.2em;text-transform:uppercase;font-weight:800;opacity:.7}
.fx-exo b{font-family:var(--display);font-size:clamp(22px,7vw,34px);text-transform:uppercase;letter-spacing:.03em}.fx-exo i{font-style:normal;font-weight:800;opacity:.8}
.fx-sous{font-weight:800;opacity:.75}
.fx-liste{display:flex;flex-direction:column;gap:6px;font-size:18px}.fx-liste b{text-transform:uppercase;letter-spacing:.03em}.fx-liste i{font-style:normal;font-weight:800;opacity:.75}
.fx-bas{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;padding:14px 16px 6px;background:rgba(0,0,0,.1)}
.fx-cpt{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;min-width:0}.fx-cpt b{font-family:var(--display);font-size:clamp(30px,10vw,48px);line-height:1;font-weight:900}
.fx-cpt b.fx-nx{font-size:15px;line-height:1.2;text-transform:uppercase;overflow-wrap:anywhere}.fx-cpt span{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;opacity:.7}
.fx-play{width:88px;height:88px;border-radius:50%;border:0;background:#0b0f14;color:#fff;font-size:30px;font-weight:900;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.fx-t.tic{animation:fxtic .5s ease-out}@keyframes fxtic{0%{transform:scale(1.18)}100%{transform:scale(1)}}
.finx{animation:fxflash .45s ease-out}@keyframes fxflash{0%{filter:brightness(1.6)}100%{filter:none}}
.finx.go .fx-mot{animation:fxmot .6s ease-out}@keyframes fxmot{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1)}}
@media (prefers-reduced-motion: reduce){.fx-t.tic,.finx,.finx.go .fx-mot{animation:none}}
.fx-stop{border:0;background:none;color:inherit;opacity:.7;font-weight:700;padding:12px;font-size:14px}`;
  document.head.appendChild(css);
})();
