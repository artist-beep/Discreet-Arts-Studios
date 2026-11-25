import { brandImages } from "./brands.mjs";
import { initialContent, withPortfolioDefaults } from "../src/content.js";
import {
  parseLead,
  uuidOk,
  Problem,
  requireThat,
} from "./validation.mjs";
import {
  digest,
  rateLimit,
  signStamp,
  suspected,
} from "./security.mjs";
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
const json = (body, status = 200, more = {}) =>
  Response.json(body, { status, headers: { ...headers, ...more } });
async function read(request, max) {
  requireThat(
    /^application\/json(?:;|$)/i.test(
      request.headers.get("Content-Type") || "",
    ),
    "Expected a JSON request.",
    415,
  );
  requireThat(
    Number(request.headers.get("Content-Length") || 0) <= max,
    "The request is too large.",
    413,
  );
  const reader = request.body?.getReader();
  requireThat(reader, "No form data received.");
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > max) {
      await reader.cancel();
      throw new Problem(413, "The request is too large.");
    }
    chunks.push(value);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    requireThat(
      body && typeof body === "object" && !Array.isArray(body),
      "Invalid data.",
    );
    return body;
  } catch {
    throw new Problem(400, "Invalid JSON data.");
  }
}
export async function currentContent(db) {
  const r = await db.first("SELECT body,revision FROM content WHERE id=1");
  return r
    ? {
        content: withPortfolioDefaults(JSON.parse(r.body)),
        revision: r.revision,
      }
    : { content: structuredClone(initialContent), revision: 0 };
}
export async function handle(request, { db, secret, clock = Date.now }) {
  const now = clock(),
    url = new URL(request.url),
    path = url.pathname,
    method = request.method;
  try {
    if (method === "POST") {
      requireThat(
        request.headers.get("Origin") === url.origin,
        "Please reopen the website and try again.",
        403,
      );
    }
    const ip = request.headers.get("CF-Connecting-IP") || "local",
      rate = (key, n, p) => rateLimit(db, digest(key + ":" + ip), now, n, p);
    if (path === "/api/brands" && method === "GET")
      return json(await brandImages());
    if (path === "/api/content" && method === "GET") {
      const { content } = await currentContent(db);
      const { films, studioImage, subtitle, ...publicContent } = content;
      return json(publicContent);
    }
    if (path === "/api/stamp" && method === "GET") {
      const form = url.searchParams.get("form");
      requireThat(!form || form === "project", "Unknown form.", 404);
      return json({ stamp: signStamp(secret, now) });
    }
    if (path === "/api/hearts" && method === "GET") {
      const rows = await db.all(
        "SELECT project,COUNT(*) AS count FROM hearts GROUP BY project",
      );
      const d = url.searchParams.get("device");
      const mine = uuidOk(d)
        ? await db.all("SELECT project FROM hearts WHERE device=?", digest(d))
        : [];
      return json({
        counts: Object.fromEntries(rows.map((r) => [r.project, r.count])),
        mine: mine.map((r) => r.project),
      });
    }
    if (path === "/api/hearts" && method === "POST") {
      const b = await read(request, 1024);
      requireThat(
        uuidOk(b.device) && typeof b.enabled === "boolean",
        "Invalid selection.",
      );
      const { content } = await currentContent(db);
      requireThat(
        content.projects.some((p) => p.id === b.project),
        "Unknown album.",
        404,
      );
      await rate("heart", 240, 60000);
      if (b.enabled)
        await db.run(
          "INSERT OR IGNORE INTO hearts(project,device) VALUES(?,?)",
          b.project,
          digest(b.device),
        );
      else
        await db.run(
          "DELETE FROM hearts WHERE project=? AND device=?",
          b.project,
          digest(b.device),
        );
      return json(
        await db.first(
          "SELECT COUNT(*) AS count FROM hearts WHERE project=?",
          b.project,
        ),
      );
    }
    if (path === "/api/leads" && method === "POST") {
      const b = await read(request, 32768),
        payload = parseLead(b),
        body = JSON.stringify(payload);
      requireThat(
        Buffer.byteLength(body) <= 32768,
        "The enquiry is too large.",
        413,
      );
      await rate("enquiry", 45, 60000);
      await db.run(
        "INSERT OR IGNORE INTO leads(submission_id,created_at,payload,suspected_spam) VALUES(?,?,?,?)",
        payload.submission_id,
        new Date(now).toISOString(),
        body,
        Number(suspected(secret, b.stamp, now)),
      );
      const saved = await db.first(
        "SELECT payload,suspected_spam FROM leads WHERE submission_id=?",
        payload.submission_id,
      );
      requireThat(
        saved?.payload === body,
        "This enquiry ID is already attached to a different request.",
        409,
      );
      return json(
        {
          submission_id: payload.submission_id,
          conversion_eligible: !saved.suspected_spam,
        },
        201,
      );
    }
    return json({ error: "Not found." }, 404);
  } catch (e) {
    return json(
      {
        error:
          e instanceof Problem
            ? e.message
            : "The website could not complete this request. Please try again.",
      },
      e instanceof Problem ? e.status : 500,
    );
  }
}
