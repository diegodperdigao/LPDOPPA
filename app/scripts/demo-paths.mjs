// Na demo o app roda numa subpasta: troca caminhos absolutos ("/mascote.webp") por relativos.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
const dir = "dist-demo/assets";
for (const f of readdirSync(dir).filter((f) => /\.(js|css)$/.test(f))) {
  const p = `${dir}/${f}`;
  const s = readFileSync(p, "utf8").replace(/(["'(`])\/(fonts\/|doppa-logo|mascote|doppa-eye)/g, "$1./$2");
  writeFileSync(p, s);
}
console.log("demo: caminhos relativos ok");
