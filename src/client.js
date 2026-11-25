export const portable = !!window.__STUDIO_PREVIEW__;
export const asset = (path) => window.__STUDIO_PREVIEW__?.[path] ?? path;
export function storage(area, key, value) {
  try {
    const s = window[area];
    if (value === undefined) return s.getItem("studio:" + key);
    if (value === null) s.removeItem("studio:" + key);
    else s.setItem("studio:" + key, value);
    return true;
  } catch {
    return null;
  }
}
export const getPrefs = (key, fallback) => {
  try {
    return JSON.parse(storage("localStorage", key)) ?? fallback;
  } catch {
    return fallback;
  }
};
export function setPrefs(key, value) {
  return storage("localStorage", key, JSON.stringify(value));
}
export const device = storage("localStorage", "device") || crypto.randomUUID();
storage("localStorage", "device", device);
export async function api(path, body, options = {}) {
  const response = await fetch("/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    ...options,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  if (!response.headers.get("Content-Type")?.includes("application/json"))
    throw Error("The studio service is unavailable. Please try again.");
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Please try again.");
  return data;
}
const url = new URL(location.href);
const source = {};
for (const k of ["source", "medium", "campaign", "term", "content"]) {
  const x = url.searchParams.get("utm_" + k);
  if (x) source[k] = x;
}
export const attribution = {
  utm: source,
  page_url: portable ? "" : url.origin + url.pathname,
};
export const launchHash = url.hash;
if (!portable && (url.search || url.hash))
  history.replaceState({}, "", url.pathname);
let pixel = "",
  loaded = false,
  active = false;
export const consent = () => storage("localStorage", "tracking") ?? "unset";
function cleanContext() {
  try {
    if (location.search || location.hash) return false;
    const ref = document.referrer ? new URL(document.referrer) : null;
    return !ref || (!ref.search && !ref.hash);
  } catch {
    return false;
  }
}
export function enablePixel(id) {
  if (
    portable ||
    !/^\d{5,24}$/.test(id) ||
    consent() !== "yes" ||
    !cleanContext()
  )
    return;
  if (loaded) return;
  const f = function () {
    if (f.callMethod) f.callMethod.apply(f, arguments);
    else f.queue.push(arguments);
  };
  f.push = f;
  f.loaded = true;
  f.version = "2.0";
  f.queue = [];
  window.fbq = f;
  window._fbq = f;
  pixel = id;
  loaded = true;
  active = true;
  f("consent", "grant");
  f("set", "autoConfig", false, id);
  f("init", id);
  f("trackSingle", id, "PageView");
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.referrerPolicy = "no-referrer";
  document.head.appendChild(script);
}
export function changeConsent(value, id) {
  storage("localStorage", "tracking", value);
  if (value === "yes") {
    enablePixel(id);
    return;
  }
  if (loaded) {
    active = false;
    window.fbq?.("consent", "revoke");
    location.reload();
  }
}
export function trackLead(reply) {
  if (
    !active ||
    !cleanContext() ||
    consent() !== "yes" ||
    reply?.conversion_eligible !== true ||
    !reply.submission_id
  )
    return;
  const key = "conversion:" + reply.submission_id;
  if (storage("localStorage", key)) return;
  if (!storage("localStorage", key, "1")) return;
  window.fbq(
    "trackSingle",
    pixel,
    "Lead",
    {},
    { eventID: reply.submission_id },
  );
}
