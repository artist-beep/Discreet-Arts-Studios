import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { token } from "./security.mjs";
import { openDatabase } from "./db.mjs";
export const root = fileURLToPath(new URL("../", import.meta.url));
export function localState() {
  const dir = join(root, ".local");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const filename = join(dir, "timing.key");
  try {
    writeFileSync(filename, token(), { mode: 0o600, flag: "wx" });
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }
  return {
    db: openDatabase(join(dir, "studio.sqlite")),
    secret: readFileSync(filename, "utf8"),
  };
}
