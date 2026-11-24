import { brandImages } from "./brands.mjs";
import { initialContent } from "../src/content.js";
import {
  parseLead,
  uuidOk,
  validateContent,
  Problem,
  requireThat,
} from "./validation.mjs";
import {
  cookie,
  digest,
  token,
  hashPassword,
  verifyPassword,
  rateLimit,
  signedIn,
  signStamp,
  suspected,
  ticketValid,
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
    ? { content: JSON.parse(r.body), revision: r.revision }
    : { content: structuredClone(initialContent), revision: 0 };
}
function csvValue(value) {
  const t = String(value ?? "");
  return (
    '"' + (/^[\s]*[=+@-]/.test(t) ? "'" : "") + t.replaceAll('"', '""') + '"'
  );
}
function leadView(row) {
  const p = JSON.parse(row.payload);
  return {
    ...p,
    created_at: row.created_at,
    status: row.status,
    suspected_spam: !!row.suspected_spam,
    delivery: row.suspected_spam ? "Suspected spam" : "Stored on site",
  };
}
const leadQuery = "SELECT * FROM leads ORDER BY created_at DESC, submission_id";
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
      return json(content);
    }
    if (path === "/api/stamp" && method === "GET")
      return json({ stamp: signStamp(secret, now) });
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
    if (!path.startsWith("/api/admin/"))
      return json({ error: "Not found." }, 404);
    const owner = await db.first("SELECT * FROM owner WHERE id=1");
    if (path === "/api/admin/state" && method === "GET")
      return json({
        setup: !owner?.password_hash,
        authenticated: await signedIn(db, request, now),
      });
    if (
      (path === "/api/admin/ticket" || path === "/api/admin/activate") &&
      method === "POST"
    ) {
      await rate("ticket", 16, 600000);
      const b = await read(request, 2048);
      requireThat(
        ticketValid(owner, b.token, now),
        "The private link is invalid, expired or already used.",
        403,
      );
      if (path.endsWith("/ticket"))
        return json({ valid: true, kind: owner.ticket_type });
      const hash = await hashPassword(b.password);
      const r = await db.run(
        "UPDATE owner SET password_hash=?,credential_version=credential_version+1,ticket_digest=NULL,ticket_type=NULL,ticket_expires=NULL WHERE id=1 AND ticket_digest=? AND ticket_expires>? AND credential_version=?",
        hash,
        digest(b.token),
        clock(),
        owner.credential_version,
      );
      requireThat(
        r.changes === 1,
        "This link has expired or has already been used.",
        403,
      );
      return json({ ok: true });
    }
    if (path === "/api/admin/login" && method === "POST") {
      await rate("login", 10, 600000);
      const b = await read(request, 2048);
      requireThat(
        owner?.password_hash &&
          owner.email === String(b.email).toLowerCase().trim() &&
          (await verifyPassword(b.password, owner.password_hash)),
        "Check your sign-in details.",
        401,
      );
      const session = token();
      await db.run(
        "INSERT INTO sessions(digest,version,expires) VALUES(?,?,?)",
        digest(session),
        owner.credential_version,
        now + 8 * 3600000,
      );
      await db.run("DELETE FROM sessions WHERE expires<=?", now);
      return json({ ok: true }, 200, { "Set-Cookie": cookie(session, 28800) });
    }
    requireThat(
      await signedIn(db, request, now),
      "Sign in to the studio dashboard.",
      401,
    );
    if (path === "/api/admin/logout" && method === "POST") {
      const s = request.headers
        .get("Cookie")
        ?.match(/__Host-studio=([\w-]{43})/)?.[1];
      if (s) await db.run("DELETE FROM sessions WHERE digest=?", digest(s));
      return json({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });
    }
    if (path === "/api/admin/password" && method === "POST") {
      await rate("change", 10, 600000);
      const b = await read(request, 2048);
      requireThat(
        await verifyPassword(b.current, owner.password_hash),
        "Check the current password.",
        403,
      );
      const hash = await hashPassword(b.password);
      const r = await db.run(
        "UPDATE owner SET password_hash=?,credential_version=credential_version+1,ticket_digest=NULL,ticket_type=NULL,ticket_expires=NULL WHERE id=1 AND credential_version=?",
        hash,
        owner.credential_version,
      );
      requireThat(r.changes === 1, "Please sign in again.", 409);
      return json({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });
    }
    if (path === "/api/admin/leads" && method === "GET")
      return json((await db.all(leadQuery)).map(leadView));
    if (path === "/api/admin/status" && method === "POST") {
      const b = await read(request, 1024);
      requireThat(
        ["New", "Contacted", "Closed", "Test"].includes(b.status) &&
          uuidOk(b.id),
        "Invalid lead update.",
      );
      const r = await db.run(
        "UPDATE leads SET status=? WHERE submission_id=?",
        b.status,
        b.id,
      );
      requireThat(r.changes === 1, "Enquiry not found.", 404);
      return json({ ok: true });
    }
    if (path === "/api/admin/export" && method === "GET") {
      const cols = [
        "created_at",
        "submission_id",
        "name",
        "email",
        "phone",
        "bhk",
        "scope_of_work",
        "status",
        "delivery",
      ];
      const rows = (await db.all(leadQuery)).map(leadView);
      return new Response(
        "\uFEFF" +
          [
            cols.join(","),
            ...rows.map((r) => cols.map((k) => csvValue(r[k])).join(",")),
          ].join("\r\n"),
        {
          headers: {
            ...headers,
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition":
              'attachment; filename="studio-enquiries.csv"',
          },
        },
      );
    }
    if (path === "/api/admin/content" && method === "GET")
      return json(await currentContent(db));
    if (path === "/api/admin/content" && method === "POST") {
      const b = await read(request, 400000),
        c = validateContent(b.content);
      requireThat(
        Number.isSafeInteger(b.revision) && b.revision >= 0,
        "Reload before saving.",
      );
      const r =
        b.revision === 0
          ? await db.run(
              "INSERT OR IGNORE INTO content(id,body,revision) VALUES(1,?,1)",
              JSON.stringify(c),
            )
          : await db.run(
              "UPDATE content SET body=?,revision=revision+1 WHERE id=1 AND revision=?",
              JSON.stringify(c),
              b.revision,
            );
      requireThat(
        r.changes === 1,
        "Content changed in another session. Reload before saving.",
        409,
      );
      return json({ revision: b.revision + 1 });
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
