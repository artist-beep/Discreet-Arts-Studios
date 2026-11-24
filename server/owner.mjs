import { spawn } from "node:child_process";
import { localState } from "./local-state.mjs";
import { issueTicket } from "./security.mjs";
import { emailOk } from "./validation.mjs";
const email = process.env.STUDIO_OWNER_EMAIL?.trim().toLowerCase(),
  kind = process.argv[2];
if (!emailOk(email) || !["setup", "recovery"].includes(kind))
  throw new Error("Set STUDIO_OWNER_EMAIL to the confirmed owner email first.");
const { db } = localState();
const t = await issueTicket(db, email, kind, Date.now());
db.close();
// Local machine access authorises local preview recovery only. Never logs a link or password.
const url =
  "http://localhost:" + Number(process.env.PORT || 4817) + "/admin#ticket=" + t;
const launcher =
  process.platform === "darwin"
    ? "open"
    : process.platform === "win32"
      ? "rundll32.exe"
      : "xdg-open";
const args =
  process.platform === "win32" ? ["url.dll,FileProtocolHandler", url] : [url];
spawn(launcher, args, { stdio: "ignore", shell: false }).on("error", () =>
  console.error("The private owner page could not be opened."),
);
