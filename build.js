/* Inlines assets/styles.css and assets/script.js back into a single dist/index.html,
   and copies the assets that cannot be inlined (the resume PDF, the link-preview
   image) alongside it, so dist/ works on its own.

   Needed only for hosts that block relative asset requests (e.g. publishing as a
   Claude Artifact). Plain static hosting - GitHub Pages, Netlify, Vercel - serves
   index.html and assets/ as-is and does not need this.

   Run:  node build.js                                                        */

const fs = require("fs");
const path = require("path");

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const css = read("assets/styles.css");
const js = read("assets/script.js");

const html = read("index.html")
  .replace(
    /<link rel="stylesheet" href="assets\/styles\.css">/,
    "<style>\n" + css + "</style>"
  )
  .replace(
    /<script src="assets\/script\.js" defer><\/script>/,
    "<script>\n" + js + "</script>"
  );

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist/index.html"), html);

/* styles.css and script.js are already inlined above, so they would just be
   dead weight in dist/. Everything else in assets/ is still fetched by URL
   and has to be there, or the resume link 404s. */
const inlined = new Set(["styles.css", "script.js"]);

fs.mkdirSync(path.join(root, "dist/assets"), { recursive: true });

const copied = fs
  .readdirSync(path.join(root, "assets"))
  .filter((name) => !inlined.has(name))
  .filter((name) => fs.statSync(path.join(root, "assets", name)).isFile());

for (const name of copied) {
  fs.copyFileSync(
    path.join(root, "assets", name),
    path.join(root, "dist/assets", name)
  );
}

/* Anything still asked for by a relative path has to exist in dist/ now */
const missing = [...html.matchAll(/(?:href|src)="(assets\/[^"]+)"/g)]
  .map((m) => m[1])
  .filter((rel) => !fs.existsSync(path.join(root, "dist", rel)));

console.log(
  `dist/index.html  ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB  ` +
    `(css ${(css.length / 1024).toFixed(1)} KB + js ${(js.length / 1024).toFixed(1)} KB inlined)`
);
console.log(`dist/assets/     ${copied.length} file(s): ${copied.join(", ")}`);

if (missing.length) {
  console.error(`\nMISSING from dist/: ${missing.join(", ")}`);
  process.exit(1);
}
