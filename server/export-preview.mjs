// Run after Vite's browser and SSR builds. Emit a self-contained file with no network dependency.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { resolve, extname, dirname } from "node:path";
import "./preview-shell.mjs";
import { initialContent, brandLogo } from "../src/content.js";
const previewImages = new Set([
  brandLogo,
  "/media/kitchen-detail.webp",
  ...initialContent.hero.map((slide) => slide.image),
  ...initialContent.projects.flatMap((project) =>
    project.images.map((image) => image.url),
  ),
]);
const root = resolve("dist"),
  assets = {};
const mime = {
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
};
for (const dir of ["identity", "media", "stories", "brands", "fonts"]) {
  let files;
  try {
    files = readdirSync(resolve(root, dir));
  } catch {
    continue;
  }
  for (const name of files) {
    const type = mime[extname(name)];
    if (type && (dir === "fonts" || previewImages.has("/" + dir + "/" + name)))
      assets["/" + dir + "/" + name] =
        "data:" +
        type +
        ";base64," +
        readFileSync(resolve(root, dir, name)).toString("base64");
  }
}
let html = readFileSync(resolve(root, "index.html"), "utf8");
const scripts = /<script type="module"[^>]* src="([^"]+)"[^>]*><\/script>/;
const styles = /<link rel="stylesheet"[^>]* href="([^"]+)"[^>]*>/;
const js = readFileSync(
  resolve(root, html.match(scripts)[1].replace(/^\//, "")),
  "utf8",
).replace(/<\/script/gi, "<\\/script");
let css = readFileSync(
  resolve(root, html.match(styles)[1].replace(/^\//, "")),
  "utf8",
);
for (const [key, value] of Object.entries(assets))
  if (key.startsWith("/fonts/")) css = css.replaceAll(key, value);
const markup = readFileSync(".preview-work/fallback.html", "utf8");
html = html
  .replace('href="' + brandLogo + '"', () => 'href="' + assets[brandLogo] + '"')
  .replace(scripts, "")
  .replace(styles, () => "<style>" + css + "</style>")
  .replace('<div id="root"></div>', () => '<div id="root">' + markup + "</div>")
  .replace(
    "</body>",
    () =>
      "<script>window.__STUDIO_PREVIEW__=" +
      JSON.stringify(assets) +
      '</script><script type="module">' +
      js +
      "</script></body>",
  );
const output = resolve(process.argv[2] || "Discrete_Art_Studio_Preview.html");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, html);
console.log(output);
