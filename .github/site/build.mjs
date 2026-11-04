// Construit le site publié (dossier _site) : seulement les fichiers web, compactés.
// Le code source complet reste dans le dépôt privé ; le serveur (functions*) n'est jamais publié.
import {readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync} from "node:fs";
import {dirname, join, extname} from "node:path";
import {minify as minHtml} from "html-minifier-terser";
import {minify as minJs} from "terser";
import CleanCSS from "clean-css";

const OUT = "_site";
// Compactage désactivé (03/11) : le site compacté restait bloqué sur « Chargement… » sur iPhone. On publie les fichiers web tels quels, sans le code serveur.
const COMPACTER = process.env.COMPACTER === "1";
const EXCLU = [/^\./, /^_site/, /^node_modules/, /^functions/, /^agenda\//, /firestore\.rules$/, /^regles\.txt$/, /^firebase\.json$/, /^README\.md$/, /^LICENSE$/, /\/node_modules\//];
const entete = f => `/*! © 2026 ${f.startsWith("orvea/") ? "Fitzora" : "NN Coaching"}. Tous droits réservés. Reproduction interdite. */`;
const opts = f => ({compress: {passes: 2}, mangle: true, toplevel: false, format: {comments: /^!/, preamble: entete(f)}});

const tous = (d = ".") => readdirSync(d).flatMap(n => { const p = d === "." ? n : `${d}/${n}`; return statSync(p).isDirectory() ? tous(p) : [p]; });
let n = 0, avant = 0, apres = 0;
for (const f of tous()) {
  if (EXCLU.some(r => r.test(f))) continue;
  const dest = join(OUT, f); mkdirSync(dirname(dest), {recursive: true});
  const ext = extname(f), src = readFileSync(f);
  let out = null;
  if (!COMPACTER) { copyFileSync(f, dest); continue; }
  if (ext === ".js" && !f.endsWith(".min.js")) out = (await minJs(src.toString(), opts(f))).code;
  else if (ext === ".css") out = entete(f) + new CleanCSS({level: 1}).minify(src.toString()).styles;
  else if (ext === ".html") out = await minHtml(src.toString(), {collapseWhitespace: true, conservativeCollapse: true, removeComments: true,
      minifyCSS: true, minifyJS: {...opts(f), format: {comments: false}}, keepClosingSlash: true});
  if (out === null) { copyFileSync(f, dest); continue; }
  writeFileSync(dest, out); n++; avant += src.length; apres += Buffer.byteLength(out);
}
writeFileSync(join(OUT, ".nojekyll"), "");
console.log(`${n} fichiers compactés : ${Math.round(avant / 1024)} Ko → ${Math.round(apres / 1024)} Ko`);
