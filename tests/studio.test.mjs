import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "../server/db.mjs";
import { handle } from "../server/api.mjs";
import { issueTicket, signStamp } from "../server/security.mjs";
import { initialContent } from "../src/content.js";
import { validateContent } from "../server/validation.mjs";
const base = "https://studio.test",
  email = "owner@example.invalid",
  pass = "Linen windows fold in summer light";
function harness(path = ":memory:") {
  const db = openDatabase(path),
    t = { now: 120000000 };
  function req(path, body, cookie, origin = base) {
    const headers = { Origin: origin };
    if (cookie) headers.Cookie = cookie;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const r = new Request(base + "/api/" + path, {
      method: body === undefined ? "GET" : "POST",
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return handle(r, {
      db,
      secret: "fixture-signing-secret",
      clock: () => t.now,
    });
  }
  return { db, t, req };
}
function enquiry(stamp) {
  return {
    submission_id: randomUUID(),
    name: "QA Test",
    email: "test@example.invalid",
    phone: "+919000000000",
    bhk: "2 BHK",
    scope_of_work: "Woodwork",
    website: "",
    stamp,
    utm: { source: "test" },
    page_url: "https://studio.test/?q=private#fragment",
  };
}
test("signed display timing, inclusive boundary, long-open forms and immutable retry classification", async () => {
  const { db, t, req } = harness();
  const issued = t.now,
    stamp = (await (await req("stamp")).json()).stamp;
  const bad = [
    ["missing", "", 4500],
    ["bad signature", stamp + "x", 4500],
    ["modified time", "1" + stamp, 6000],
    [
      "wrong binding",
      stamp.replace("studio-consultation-v1", "other-form"),
      6000,
    ],
    ["future", signStamp("fixture-signing-secret", issued + 6000), 5000],
  ];
  for (const [_, s, elapsed] of bad) {
    t.now = issued + elapsed;
    const b = enquiry(s);
    const r = await req("leads", b);
    assert.equal(r.status, 201);
    assert.equal((await r.json()).conversion_eligible, false);
  }
  for (const [elapsed, eligible] of [
    [1999, false],
    [2000, true],
    [2001, true],
    [86400000, true],
  ]) {
    t.now = issued + elapsed;
    const b = enquiry(stamp),
      r = await req("leads", b);
    assert.equal(r.status, 201);
    assert.equal((await r.json()).conversion_eligible, eligible);
    const fresh = signStamp("fixture-signing-secret", t.now);
    t.now += 5000;
    const duplicate = await req("leads", { ...b, stamp: fresh });
    assert.equal((await duplicate.json()).conversion_eligible, eligible);
    const saved = db.first(
      "SELECT payload FROM leads WHERE submission_id=?",
      b.submission_id,
    );
    assert.equal(JSON.parse(saved.payload).page_url, base + "/");
    assert.equal(JSON.parse(saved.payload).stamp, undefined);
    assert.equal(
      (await req("leads", { ...b, name: "Different name" })).status,
      409,
    );
  }
  db.close();
});
test("validation, database save failures and cross-origin checks", async () => {
  const { db, req } = harness();
  const b = enquiry("");
  for (const changes of [
    { website: "bot" },
    { phone: "99999999" },
    { email: "broken" },
    { phone: "", email: "" },
    { name: "x".repeat(201) },
    { utm: { source: "x".repeat(201) } },
    { bhk: "invalid" },
  ])
    assert.equal((await req("leads", { ...b, ...changes })).status, 400);
  assert.equal(
    (await req("leads", b, undefined, "https://elsewhere.test")).status,
    403,
  );
  assert.equal(db.first("SELECT COUNT(*) AS n FROM leads").n, 0);
  db.close();
  assert.equal((await req("leads", b)).status, 500);
});
test("private setup, concurrent consumption, password changes, recovery and session revocation", async () => {
  const { db, t, req } = harness();
  assert.deepEqual(await (await req("admin/state")).json(), {
    setup: true,
    authenticated: false,
  });
  for (const p of ["admin/leads", "admin/content", "admin/export"])
    assert.equal((await req(p)).status, 401);
  assert.equal(
    (await req("admin/activate", { token: "invalid", password: pass })).status,
    403,
  );
  const one = await issueTicket(db, email, "setup", t.now);
  t.now += 1800001;
  assert.equal((await req("admin/ticket", { token: one })).status, 403);
  const two = await issueTicket(db, email, "setup", t.now);
  assert.equal((await req("admin/ticket", { token: two })).status, 200);
  assert.equal(
    (await req("admin/activate", { token: two, password: "tiny" })).status,
    400,
  );
  const answers = await Promise.all([
    req("admin/activate", { token: two, password: pass }),
    req("admin/activate", { token: two, password: pass }),
  ]);
  assert.deepEqual(answers.map((r) => r.status).sort(), [200, 403]);
  assert.equal((await req("admin/ticket", { token: two })).status, 403);
  assert.equal(
    (await req("admin/login", { email, password: "wrong" })).status,
    401,
  );
  const login = await req("admin/login", { email, password: pass });
  assert.equal(login.status, 200);
  const raw = login.headers.get("Set-Cookie");
  for (const k of ["Secure", "HttpOnly", "SameSite=Strict"])
    assert.ok(raw.includes(k));
  const session = raw.split(";")[0];
  assert.equal((await req("admin/leads", undefined, session)).status, 200);
  const next = "Brass lamps beside the walnut table";
  assert.equal(
    (await req("admin/password", { current: pass, password: next }, session))
      .status,
    200,
  );
  assert.equal((await req("admin/leads", undefined, session)).status, 401);
  const again = await req("admin/login", { email, password: next });
  const current = again.headers.get("Set-Cookie").split(";")[0];
  const recovery = await issueTicket(db, email, "recovery", t.now);
  assert.equal(
    (await req("admin/activate", { token: recovery, password: pass })).status,
    200,
  );
  assert.equal(
    (await req("admin/activate", { token: recovery, password: next })).status,
    403,
  );
  assert.equal((await req("admin/leads", undefined, current)).status, 401);
  assert.equal(
    (await req("admin/login", { email, password: pass })).status,
    200,
  );
  await assert.rejects(issueTicket(db, email, "setup", t.now));
  db.close();
});
test("CMS edit and restoration, persistence after reopening, CRM updates, safe CSV and idempotent likes", async () => {
  const dir = mkdtempSync(join(tmpdir(), "das-qa-")),
    path = join(dir, "qa.sqlite");
  const { db, t, req } = harness(path);
  try {
    const tok = await issueTicket(db, email, "setup", t.now);
    await req("admin/activate", { token: tok, password: pass });
    const session = (
      await req("admin/login", { email, password: pass })
    ).headers
      .get("Set-Cookie")
      .split(";")[0];
    const { content, revision } = await (
      await req("admin/content", undefined, session)
    ).json();
    assert.equal(
      (
        await req(
          "admin/content",
          { content: { ...content, headline: "Temporary local QA" }, revision },
          session,
        )
      ).status,
      200,
    );
    assert.equal(
      (await req("admin/content", { content, revision }, session)).status,
      409,
    );
    const second = harness(path);
    assert.equal(
      (await (await second.req("content")).json()).headline,
      "Temporary local QA",
    );
    second.db.close();
    await req("admin/content", { content, revision: 1 }, session);
    assert.deepEqual(await (await req("content")).json(), initialContent);
    const b = enquiry("");
    b.name = "=QA formula";
    await req("leads", b);
    assert.equal(
      (
        await req(
          "admin/status",
          { id: b.submission_id, status: "Test" },
          session,
        )
      ).status,
      200,
    );
    const csv = await (await req("admin/export", undefined, session)).text();
    assert.ok(csv.includes("'=QA formula"));
    assert.ok(csv.includes("Suspected spam"));
    assert.ok(csv.includes("Test"));
    const project = content.projects[0].id,
      device = randomUUID();
    for (const [enabled, n] of [
      [true, 1],
      [true, 1],
      [false, 0],
    ])
      assert.equal(
        (await (await req("hearts", { device, project, enabled })).json())
          .count,
        n,
      );
    assert.throws(() => validateContent({ ...content, pixel: "invalid" }));
    assert.throws(() =>
      validateContent({ ...content, studioImage: "javascript:example" }),
    );
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("sign-in rate limit", async () => {
  const { db, req } = harness();
  for (let i = 0; i < 10; i++)
    assert.equal((await req("admin/login", {})).status, 401);
  assert.equal((await req("admin/login", {})).status, 429);
  db.close();
});
