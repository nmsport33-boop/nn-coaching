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
      titre = "Tabata"; info = `${w} s d'effort, ${r} s de repos, ${seq.length} intervalles`;
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

  /* --- voix (si dispo) --- */
  function parle(txt) { try { const v = window.speechSynthesis; if (!v || !txt) return; v.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = "fr-FR"; u.rate = 1.05; v.speak(u); } catch (e) {} }
  function annonce(p) { if (!p) return;
    if (p.ph === "pret") parle("Prépare-toi" + (p.e ? ". " + p.e.n : ""));
    else if (p.ph === "rest") parle(p.lbl === "Change de côté" ? "Change de côté" : "Repos" + (p.e ? ". Ensuite, " + p.e.n : ""));
    else parle(p.liste ? "C'est parti, un max de tours" : "Go" + (p.e ? ", " + p.e.n : "")); }

  /* --- moteur --- */
  function finGo(sid, bi) { const s = S.cur.seances[sid], p = s && planFin(s, Number(bi)); if (!p) return;
    try { if (S.repos) stopRepos(); } catch (e) {} try { if (S.chrono) stopChrono(); } catch (e) {} audioOn();
    S.fin = {sid, bi: Number(bi), mode: p.mode, titre: p.titre, P: p.P, pi: 0, fin: Date.now() + p.P[0].sec * 1000, bip: 99, pause: null};
    annonce(p.P[0]); tick(); }
  function stop() { S.fin = null; clearInterval(S.finH); S.finH = null; try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {} }
  function tick() { const f = S.fin; if (!f) { clearInterval(S.finH); S.finH = null; return; }
    if (!S.finH) S.finH = setInterval(tick, 200);
    if (f.pause != null) return;
    const left = Math.ceil((f.fin - Date.now()) / 1000);
    if (left > 0) { if (left <= 3 && left < f.bip) { f.bip = left; bip(false); }
      /* EMOM et AMRAP : petit rappel à mi-parcours des longues phases */
      return maj(); }
    suivant(); }
  function marque(p) { if (!p || p.ph !== "go") return; const ks = p.ks || (p.k ? [p.k] : []); if (!ks.length) return;
    const f = S.fin, s = S.cur.seances[f.sid]; if (!s) return; s.coches = Object.assign({}, s.coches);
    const args = []; ks.forEach(k => { s.coches[k] = true; args.push(new firebase.firestore.FieldPath("coches", k), true); });
    const b = s.blocs[f.bi]; if (nbTours(b.tours) >= 2) { const tf = toursComplets(s, f.bi, b); s.toursFaits = Object.assign({}, s.toursFaits, {[f.bi]: tf}); args.push(new firebase.firestore.FieldPath("toursFaits", String(f.bi)), tf); }
    try { S.db.doc(`members/${memberId()}/seances/${f.sid}`).update(...args).catch(() => {}); } catch (e) {} }
  function suivant() { const f = S.fin; if (!f) return; marque(f.P[f.pi]); f.pi++; f.bip = 99;
    if (f.pi >= f.P.length) return fini();
    const p = f.P[f.pi]; f.fin = Date.now() + p.sec * 1000; bip(true); annonce(p);
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
  const txt = l => l >= 60 ? mmss(l) : String(l);
  function maj() { const f = S.fin, p = f.P[f.pi], ms = f.pause != null ? f.pause : f.fin - Date.now(), l = Math.max(0, Math.ceil(ms / 1000));
    majRing("fin", ms / (p.sec * 1000), txt(l)); document.querySelectorAll(".fin-tot").forEach(b => b.textContent = mmss(Math.ceil(reste(f)))); }

  function vue() { const f = S.fin, el = $("go"), p = f.P[f.pi], s = S.cur.seances[f.sid], b = s.blocs[f.bi];
    const ms = f.pause != null ? f.pause : f.fin - Date.now(), l = Math.max(0, Math.ceil(ms / 1000));
    const nGo = f.P.filter(q => q.ph === "go").length, iGo = f.P.slice(0, f.pi + 1).filter(q => q.ph === "go").length, pct = Math.round(iGo / nGo * 100);
    const nx = f.P.slice(f.pi + 1).find(q => q.ph === "go");
    const lbl = p.ph === "pret" ? "Prépare-toi" : p.ph === "rest" ? p.lbl : f.mode === "emom" ? "Go · ta récup après" : f.mode === "amrap" ? "AMRAP" : "Effort";
    const corps = p.liste ? `<div class="fin-liste">${p.liste.map(e => `<div><b>${esc(e.n)}</b>${e.d ? ` <i>${esc(e.d)}</i>` : ""}</div>`).join("")}</div>`
      : p.e ? `<h3>${esc(p.e.n)}</h3>${p.e.d && (f.mode === "emom" || f.mode === "tabata") ? `<div class="go-dose">${esc(p.e.d)}</div>` : ""}` : "";
    el.innerHTML = `<div class="in"><div class="go-top"><button class="go-x" data-a="go-close" aria-label="Quitter">✕</button><div class="go-prog"><i style="width:${pct}%"></i></div><span class="go-cnt">${iGo} / ${nGo}</span></div>
      <div class="go-bloc"><span class="code">${esc(f.titre)}${b.nom && low(b.nom) !== low(f.titre) ? " · " + esc(b.nom) : ""}</span></div>
      <div class="go-rest fin ${p.ph}"><span class="go-lbl">${esc(lbl)}</span>${p.ph === "rest" && p.e ? `<div class="go-suiv"><span>À suivre</span><b>${esc(p.e.n)}</b></div>` : corps}
        <div class="go-ring">${ring("fin", ms / (p.sec * 1000))}<b class="fin-t">${txt(l)}</b></div>
        <div class="fin-info">${p.ph === "go" && p.lbl ? `<span>${esc(p.lbl)}</span>` : ""}<span>Reste <b class="fin-tot">${mmss(Math.ceil(reste(f)))}</b></span></div>
        ${p.ph === "go" && nx && nx.e && (!p.e || nx.e !== p.e) ? `<div class="go-next">Ensuite : <b>${esc(nx.e.n)}</b></div>` : ""}
        <div class="go-rbtn"><button data-a="fin-pause">${f.pause != null ? "▶ Reprendre" : "❚❚ Pause"}</button><button class="pass" data-a="fin-skip">Passer ›</button></div>
        <button class="btn link" data-a="fin-stop" style="color:var(--muted)">Arrêter le minuteur</button></div></div>`;
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
.go-rest.fin.go .go-lbl{color:#3ddc84}.go-rest.fin.go .ring .fg{stroke:#3ddc84}
.go-rest.fin.rest .go-lbl{color:#ff5c7a}.go-rest.fin.rest .ring .fg{stroke:#ff5c7a}
.go-rest.fin.pret .go-lbl{color:#ffd166}.go-rest.fin.pret .ring .fg{stroke:#ffd166}
.fin-info{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;font-size:14px;color:var(--muted);font-weight:700}.fin-info b{color:var(--ink);font-variant-numeric:tabular-nums}
.fin-liste{display:flex;flex-direction:column;gap:6px;font-size:16px}.fin-liste b{text-transform:uppercase;letter-spacing:.03em}.fin-liste i{font-style:normal;color:var(--a1l);font-weight:700}`;
  document.head.appendChild(css);
})();
