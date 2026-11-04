/* Mode « grand affichage » pour ceux qui voient mal : tout l'écran est agrandi (textes, boutons, séance guidée,
   chronos, repos) et les textes gris passent plus foncés / plus clairs pour un meilleur contraste.
   Le choix est gardé sur l'appareil (localStorage). Clé : data-k du script (nn-zoom ou orvea-zoom).
   Le tableau projeté et l'écran télé ne sont pas agrandis : ils sont déjà en très grand. */
(function () {
  var h = document.documentElement, me = document.currentScript, K = (me && me.dataset.k) || "nn-zoom";
  var NIV = [
    {f: 1, n: "Normal", d: "Taille d'origine"},
    {f: 1.15, n: "Grand", d: "Un peu plus gros"},
    {f: 1.3, n: "Très grand", d: "Nettement plus gros"},
    {f: 1.45, n: "Maxi", d: "Le plus gros possible"}
  ];
  function lire() { try { return JSON.parse(localStorage.getItem(K) || "{}") || {}; } catch (e) { return {}; } }
  function ecrire(c) { try { localStorage.setItem(K, JSON.stringify(c)); } catch (e) {} }
  function appliquer(c) {
    var z = Math.max(0, Math.min(3, c.z | 0));
    for (var i = 1; i < 4; i++) h.classList.toggle("zm" + i, z === i);
    h.classList.toggle("zm-ct", !!c.ct);
  }
  appliquer(lire());

  var css = "";
  for (var i = 1; i < 4; i++) {
    var f = NIV[i].f, inv = (1 / f).toFixed(4);
    css += "html.zm" + i + "{zoom:" + f + "}" +
      /* le tableau projeté et l'écran télé gardent leur taille (déjà prévus pour être vus de loin) */
      "html.zm" + i + " #proj,html.zm" + i + " #ecran{zoom:" + inv + "}" +
      /* bandeau du haut et barre d'onglets : agrandis un peu moins, pour que tout tienne sur la largeur du téléphone */
      "html.zm" + i + " header.top{zoom:" + (Math.min(f, 1.15) / f).toFixed(4) + "}" +
      "html.zm" + i + " .tabs{zoom:" + (Math.min(f, 1.3) / f).toFixed(4) + "}";
  }
  css +=
    /* contraste renforcé : les textes secondaires se rapprochent de la couleur du texte principal */
    "html.zm-ct,html.zm-ct[data-skin],html.zm-ct[data-theme]{" +
      "--muted:color-mix(in srgb,var(--ink) 84%,var(--b0,var(--bg))) !important;" +
      "--muted2:color-mix(in srgb,var(--ink) 66%,var(--b0,var(--bg))) !important;" +
      "--ink2:var(--ink) !important;" +
      "--line:color-mix(in srgb,var(--ink) 34%,var(--b0,var(--bg))) !important}" +
    "html.zm1 .go-fait,html.zm2 .go-fait,html.zm3 .go-fait{flex:none}html.zm3 .go-fait{width:118px;height:118px}" +
    "html.zm2 .go-ring{width:min(60vw,300px)}html.zm3 .go-ring{width:min(54vw,300px)}" +
    "html.zm-ct body{font-weight:500}" +
    "html.zm-ct .muted,html.zm-ct .small,html.zm-ct small{opacity:1 !important}" +
    "html.zm-ct :focus-visible{outline:3px solid var(--a1,#2ec4b6);outline-offset:2px}" +
    /* bouton Aa du bandeau et de la séance guidée */
    ".zm-btn{font-family:Georgia,'Times New Roman',serif;font-weight:700;letter-spacing:-.02em}" +
    ".skinbtn.zm-btn{font-size:15px}" +
    ".go-x.zm-btn{font-size:19px}" +
    /* fenêtre de choix */
    ".zmpick{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.6);display:grid;place-items:end center;padding:16px}" +
    ".zmpick .in{width:100%;max-width:520px;max-height:calc(100% - 8px);overflow-y:auto;background:var(--b0,var(--bg,#111));color:var(--ink,#fff);border:1px solid var(--line,#333);border-radius:24px;padding:18px;display:flex;flex-direction:column;gap:12px;margin-bottom:env(safe-area-inset-bottom,0px)}" +
    ".zmpick h3{margin:0;font-family:var(--display,inherit);letter-spacing:.06em;text-transform:uppercase;font-size:17px}" +
    ".zmpick p{margin:0;font-size:14px;line-height:1.4;color:var(--ink,#fff);opacity:.85}" +
    ".zmpick .lv{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
    ".zmpick button.n{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;border-radius:16px;padding:12px;border:2px solid var(--line,#333);background:rgba(128,128,128,.08);color:inherit;font:inherit;font-weight:700;min-height:84px;cursor:pointer}" +
    ".zmpick button.n.on{border-color:var(--a1,#2ec4b6);background:rgba(var(--a1r,46,196,182),.14)}" +
    ".zmpick button.n b{font-family:Georgia,'Times New Roman',serif;line-height:1}" +
    ".zmpick button.n small{font-weight:500;font-size:12px;opacity:.8}" +
    ".zmpick label.ct{display:flex;align-items:center;gap:12px;border:2px solid var(--line,#333);border-radius:16px;padding:12px;font-weight:700;font-size:15px;cursor:pointer}" +
    ".zmpick label.ct input{width:24px;height:24px;accent-color:var(--a1,#2ec4b6);flex:none}" +
    ".zmpick label.ct small{display:block;font-weight:500;font-size:12px;opacity:.8}" +
    ".zmpick .ok{border:0;border-radius:999px;min-height:52px;font:inherit;font-weight:800;font-size:16px;background:var(--a1,#2ec4b6);color:var(--b0,#000);cursor:pointer}";
  var st = document.createElement("style"); st.id = "zm-style"; st.textContent = css;
  (document.head || h).appendChild(st);

  function ouvrir() {
    if (document.querySelector(".zmpick")) return;
    var c = lire(), w = document.createElement("div");
    w.className = "zmpick"; w.setAttribute("role", "dialog"); w.setAttribute("aria-label", "Taille d'affichage");
    function dessiner() {
      var z = c.z | 0;
      w.innerHTML = '<div class="in"><h3>🔍 Taille d\'affichage</h3>' +
        '<p>Agrandit les textes et les boutons partout, y compris pendant la séance guidée et les chronos. Le réglage reste sur ce téléphone.</p>' +
        '<div class="lv">' + NIV.map(function (x, i) {
          return '<button class="n' + (i === z ? " on" : "") + '" data-z="' + i + '" aria-pressed="' + (i === z) + '"><b style="font-size:' + Math.round(18 * x.f) + 'px">Aa</b>' + x.n + '<small>' + x.d + '</small></button>';
        }).join("") + '</div>' +
        '<label class="ct"><input type="checkbox" data-ct' + (c.ct ? " checked" : "") + '><span>Contraste renforcé<small>Textes gris plus lisibles, contours plus nets</small></span></label>' +
        '<button class="ok" data-ok>C\'est bon</button></div>';
    }
    dessiner();
    w.addEventListener("click", function (ev) {
      if (ev.target === w || ev.target.closest("[data-ok]")) { w.remove(); return; }
      var b = ev.target.closest("[data-z]");
      if (b) {
        var avant = c.z | 0; c.z = +b.dataset.z;
        if (!avant && c.z && c.ctAuto !== false) c.ct = true;   /* on active le contraste avec le zoom, sauf si la personne l'a enlevé */
        ecrire(c); appliquer(c); dessiner();
      }
    });
    w.addEventListener("change", function (ev) {
      if (ev.target.matches("[data-ct]")) { c.ct = ev.target.checked; c.ctAuto = c.ct; ecrire(c); appliquer(c); }
    });
    document.body.appendChild(w);
  }
  window.ZOOM_OUVRIR = ouvrir;

  function bouton(cls) {
    var b = document.createElement("button");
    b.type = "button"; b.className = cls + " zm-btn"; b.textContent = "Aa";
    b.setAttribute("aria-label", "Agrandir l'affichage"); b.title = "Taille d'affichage";
    b.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); ouvrir(); });
    return b;
  }
  function brancher() {
    /* bandeau du haut : juste avant le bouton 🎨 */
    var top = document.querySelector("header.top .top-in");
    if (top && !top.querySelector(".zm-btn")) {
      var sk = top.querySelector(".skinbtn");
      if (sk) top.insertBefore(bouton("skinbtn"), sk); else top.appendChild(bouton("skinbtn"));
    }
    /* séance guidée : à côté du bouton « projeter » (l'écran est redessiné souvent, on remet le bouton à chaque fois) */
    var go = document.getElementById("go");
    if (go) {
      var poser = function () {
        var t = go.querySelector(".go-top");
        if (t && !t.querySelector(".zm-btn")) {
          var e = t.querySelector(".ecr"); t.insertBefore(bouton("go-x"), e || null);
        }
      };
      poser(); new MutationObserver(poser).observe(go, {childList: true, subtree: true});
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", brancher); else brancher();
})();
