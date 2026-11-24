// Build-time rendering for the downloadable preview. No network service is started.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const map = {};
for (const dir of ["media", "brands", "stories"]) {
  const base = resolve("public", dir);
  let files = [];
  try {
    files = readdirSync(base);
  } catch {}
  for (const name of files) {
    const ext = name.split(".").pop();
    if (!["svg", "webp", "png", "jpg", "jpeg"].includes(ext)) continue;
    const mime = ext === "svg" ? "svg+xml" : ext === "jpg" ? "jpeg" : ext;
    map["/" + dir + "/" + name] =
      "data:image/" +
      mime +
      ";base64," +
      readFileSync(resolve(base, name)).toString("base64");
  }
}
globalThis.window = { __STUDIO_PREVIEW__: map };
globalThis.location = new URL("file:///studio-preview.html");
globalThis.matchMedia = () => ({ matches: false });
const { previewHtml } = await import("../.preview-work/preview-shell.js");
writeFileSync(".preview-work/fallback.html", previewHtml());
