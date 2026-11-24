import { bedrooms, scopes } from "../src/content.js";
export const emailOk = (value) =>
  typeof value === "string" &&
  value.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const phoneOk = (value) =>
  typeof value === "string" && /^\+[1-9]\d{6,14}$/.test(value);
export const uuidOk = (value) =>
  typeof value === "string" &&
  /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(
    value,
  );
export class Problem extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function requireThat(condition, message, status = 400) {
  if (!condition) throw new Problem(status, message);
}
export function field(value, max, label, required = false) {
  requireThat(
    typeof value === "string" &&
      value.length <= max &&
      (!required || value.trim().length),
    "Check " + label + ".",
  );
  return value.trim();
}
export function parseLead(body) {
  requireThat(body && typeof body === "object", "Check the enquiry.");
  requireThat(!body.website, "Unable to accept this enquiry.");
  requireThat(uuidOk(body.submission_id), "Refresh the form and try again.");
  const name = field(body.name, 200, "your name", true),
    email = field(body.email ?? "", 254, "your email"),
    rawPhone = field(body.phone ?? "", 40, "your WhatsApp number"),
    phone = rawPhone.replace(/[\s().-]/g, "");
  requireThat(
    email || phone,
    "Add your email or an international WhatsApp number.",
  );
  requireThat(!email || emailOk(email), "Enter a valid email address.");
  requireThat(
    !phone || phoneOk(phone),
    "Include the country code, for example +91.",
  );
  requireThat(bedrooms.includes(body.bhk), "Choose the property size.");
  requireThat(scopes.includes(body.scope_of_work), "Choose the scope of work.");
  const inputUrl = field(body.page_url ?? "", 2048, "the page URL");
  let page_url = "";
  if (inputUrl) {
    let url;
    try {
      url = new URL(inputUrl);
    } catch {}
    requireThat(
      url &&
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password,
      "Check the page URL.",
    );
    page_url = url.origin + url.pathname;
  }
  const utm = {};
  for (const k of ["source", "medium", "campaign", "term", "content"])
    if (body.utm?.[k]) utm[k] = field(body.utm[k], 200, "campaign " + k);
  return {
    submission_id: body.submission_id,
    name,
    email,
    phone,
    bhk: body.bhk,
    scope_of_work: body.scope_of_work,
    form_name: "Studio consultation",
    page_url,
    utm,
    version: 1,
  };
}
const safeMedia = (value) =>
  typeof value === "string" &&
  value.length <= 2048 &&
  (/^\/(media|stories)\/[a-z\d._-]+$/i.test(value) ||
    (/^https:\/\//i.test(value) &&
      (() => {
        try {
          const u = new URL(value);
          return !!u.hostname && !u.username && !u.password;
        } catch {
          return false;
        }
      })()));
export function validateContent(c, previous) {
  requireThat(c && typeof c === "object", "Invalid content.");
  const output = {};
  for (const [k, n] of Object.entries({
    headline: 110,
    subtitle: 240,
    city: 120,
    address: 400,
    email: 254,
    phone: 40,
    whatsapp: 40,
    pixel: 24,
  }))
    output[k] = field(c[k] ?? "", n, k, ["headline", "subtitle"].includes(k));
  requireThat(
    !output.email || emailOk(output.email),
    "Check the public email.",
  );
  for (const k of ["phone", "whatsapp"])
    requireThat(
      !output[k] || phoneOk(output[k]),
      "Use an international number for " + k + ".",
    );
  requireThat(
    !output.pixel || /^\d{5,24}$/.test(output.pixel),
    "Use a numeric Meta Pixel ID.",
  );
  function image(u) {
    requireThat(safeMedia(u), "Use a bundled image or an HTTPS media address.");
    return u;
  }
  function list(v, min, max) {
    requireThat(
      Array.isArray(v) && v.length >= min && v.length <= max,
      "Check media list length.",
    );
    return v;
  }
  function slug(v) {
    requireThat(
      typeof v === "string" &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) &&
        v.length <= 100,
      "Use a short unique project or film ID.",
    );
    return v;
  }
  output.hero = list(c.hero, 1, 12).map((s) => ({
    image: image(s.image),
    label: field(s.label, 100, "slide label", true),
  }));
  output.studioImage = image(c.studioImage);
  output.projects = list(c.projects, 1, 60).map((p) => ({
    id: slug(p.id),
    name: field(p.name, 100, "project name", true),
    type: field(p.type, 100, "project type", true),
    description: field(p.description, 800, "project description"),
    aspect: ["4/5", "5/4", "3/4", "4/3", "1/1"].includes(p.aspect)
      ? p.aspect
      : "4/5",
    images: list(p.images, 1, 30).map((i) => ({
      url: image(i.url),
      alt: field(i.alt, 240, "image description", true),
    })),
  }));
  output.films = list(c.films, 0, 20).map((f) => ({
    id: slug(f.id),
    title: field(f.title, 120, "film title", true),
    poster: image(f.poster),
    video: f.video ? image(f.video) : "",
    quote: field(f.quote ?? "", 400, "quote"),
    sample: f.sample === true,
  }));
  for (const a of [output.projects, output.films])
    requireThat(
      new Set(a.map((x) => x.id)).size === a.length,
      "Each album or film needs its own ID.",
    );
  return output;
}
