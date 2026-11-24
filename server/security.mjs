import {
  randomBytes,
  createHash,
  createHmac,
  timingSafeEqual,
  pbkdf2,
} from "node:crypto";
import { promisify } from "node:util";
import { Problem, requireThat } from "./validation.mjs";
const derive = promisify(pbkdf2),
  FORM = "studio-consultation-v1";
export const token = () => randomBytes(32).toString("base64url");
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
const mac = (secret, data) =>
  createHmac("sha256", secret).update(data).digest("base64url");
export function signStamp(secret, now) {
  const message = [now, FORM, token()].join(".");
  return message + "." + mac(secret, message);
}
export function isSuspectedFormTiming(stampVerified, issuedAtMs, receivedAtMs) {
  const MIN_FORM_DISPLAY_MS = 2000;
  return (
    stampVerified !== true ||
    !Number.isSafeInteger(issuedAtMs) ||
    issuedAtMs < 0 ||
    !Number.isSafeInteger(receivedAtMs) ||
    receivedAtMs - issuedAtMs < MIN_FORM_DISPLAY_MS
  );
}
export function suspected(secret, stamp, now) {
  const [time, form, nonce, signature, ...extra] =
    typeof stamp === "string" && stamp.length <= 256 ? stamp.split(".") : [];
  const expected = mac(secret, [time, form, nonce].join("."));
  const verified =
    form === FORM &&
    /^\d{1,16}$/.test(time) &&
    /^[\w-]{43}$/.test(nonce) &&
    /^[\w-]{43}$/.test(signature) &&
    !extra.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  return isSuspectedFormTiming(verified, Number(time), now);
}
export async function hashPassword(password) {
  requireThat(
    typeof password === "string" &&
      password.length >= 15 &&
      password.length <= 128 &&
      new Set(password.toLowerCase()).size >= 6 &&
      !/(.)\1{5}|password|qwerty|12345678/i.test(password),
    "Choose a unique passphrase of 15–128 characters.",
  );
  const salt = randomBytes(16).toString("hex");
  return (
    salt +
    ":" +
    (await derive(password, salt, 600000, 32, "sha256")).toString("hex")
  );
}
export async function verifyPassword(password, stored) {
  if (typeof password !== "string" || password.length > 128 || !stored)
    return false;
  const [salt, hex] = stored.split(":");
  return timingSafeEqual(
    await derive(password, salt, 600000, 32, "sha256"),
    Buffer.from(hex, "hex"),
  );
}
export async function rateLimit(db, key, now, limit = 12, period = 600000) {
  const window = Math.floor(now / period);
  const hit = await db.first(
    "INSERT INTO attempts(key,window,hits) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN window=excluded.window THEN hits+1 ELSE 1 END,window=excluded.window RETURNING hits",
    key,
    window,
  );
  if (hit.hits > limit)
    throw new Problem(429, "Too many attempts. Please try again later.");
}
export const cookie = (value, life) =>
  "__Host-studio=" +
  value +
  "; Path=/; Max-Age=" +
  life +
  "; Secure; HttpOnly; SameSite=Strict";
export async function signedIn(db, request, now) {
  const value = request.headers
    .get("Cookie")
    ?.match(/(?:^|;\s*)__Host-studio=([\w-]{43})(?:;|$)/)?.[1];
  return (
    !!value &&
    !!(await db.first(
      "SELECT 1 FROM sessions JOIN owner ON owner.credential_version=sessions.version WHERE sessions.digest=? AND sessions.expires>?",
      digest(value),
      now,
    ))
  );
}
export async function issueTicket(db, email, kind, now) {
  const t = token(),
    expires = now + 30 * 60000;
  if (kind === "setup")
    await db.run(
      "INSERT INTO owner(id,email) VALUES(1,?) ON CONFLICT(id) DO NOTHING",
      email,
    );
  const r = await db.run(
    "UPDATE owner SET ticket_digest=?, ticket_type=?, ticket_expires=? WHERE id=1 AND email=? AND " +
      (kind === "setup"
        ? "password_hash IS NULL"
        : "password_hash IS NOT NULL"),
    digest(t),
    kind,
    expires,
    email,
  );
  requireThat(
    r.changes === 1,
    "The supplied owner identity or setup state does not match.",
  );
  return t;
}
export function ticketValid(row, t, now) {
  return (
    !!row &&
    typeof t === "string" &&
    /^[\w-]{43}$/.test(t) &&
    row.ticket_expires > now &&
    row.ticket_digest === digest(t) &&
    ((row.ticket_type === "setup" && !row.password_hash) ||
      (row.ticket_type === "recovery" && !!row.password_hash))
  );
}
