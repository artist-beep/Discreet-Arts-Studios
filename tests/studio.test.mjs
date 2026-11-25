import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { openDatabase } from "../server/db.mjs";
import { handle } from "../server/api.mjs";
import { signStamp } from "../server/security.mjs";
import { initialContent } from "../src/content.js";
import { validateContent } from "../server/validation.mjs";

const base = "https://studio.test";

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

test("admin routes return 404 to ensure zero attack surface", async () => {
  const { db, req } = harness();
  const adminPaths = [
    "admin/state",
    "admin/ticket",
    "admin/activate",
    "admin/login",
    "admin/logout",
    "admin/password",
    "admin/leads",
    "admin/status",
    "admin/export",
    "admin/content",
  ];
  for (const p of adminPaths) {
    const resGet = await req(p);
    assert.equal(resGet.status, 404, `GET ${p} should return 404`);
    const resPost = await req(p, { test: 1 });
    assert.equal(resPost.status, 404, `POST ${p} should return 404`);
  }
  db.close();
});

test("hearts and gallery likes work idempotently per device", async () => {
  const { db, req } = harness();
  const project = "courtyard-house",
    device = randomUUID();
  for (const [enabled, n] of [
    [true, 1],
    [true, 1],
    [false, 0],
  ]) {
    const res = await req("hearts", { device, project, enabled });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).count, n);
  }
  db.close();
});

test("partner credits, project categories and locations survive CMS updates and older records", async () => {
  const { db, req } = harness();
  try {
    const legacy = structuredClone(initialContent);
    delete legacy.founder;
    legacy.partners = [];
    delete legacy.facebook;
    for (const p of legacy.projects) {
      delete p.partnerIds;
      delete p.sector;
    }
    db.run(
      "INSERT INTO content(id,body,revision) VALUES(1,?,3)",
      JSON.stringify(legacy),
    );
    const restored = await (await req("content")).json();
    assert.deepEqual(restored.partners, initialContent.partners);
    assert.deepEqual(restored.founder, initialContent.founder);
    assert.deepEqual(
      validateContent({ ...restored, partners: [] }).partners,
      [],
    );
    assert.throws(() =>
      validateContent({ ...restored, founder: { name: "", bio: "" } }),
    );

    assert.equal(
      restored.projects.find((p) => p.type === "Hospitality concept").sector,
      "Commercial",
    );
    const c = structuredClone(restored);
    c.partners = [
      {
        id: "test-practice",
        name: "QA practice",
        role: "Design partner",
        bio: "Temporary test fixture",
      },
    ];
    c.projects[0].partnerIds = ["test-practice"];
    c.hyderabadAddress = "Test address";
    assert.deepEqual(validateContent(c), c);
    assert.throws(() =>
      validateContent({ ...c, instagram: "https://unrelated.example/profile" }),
    );
    assert.throws(() => validateContent({ ...c, partners: [] }));
  } finally {
    db.close();
  }
});

test("project enquiries are safely stored for future grid and email delivery", async () => {
  const { db, t, req } = harness();
  try {
    const projectStamp = (await (await req("stamp?form=project")).json()).stamp;
    t.now += 2100;
    const project = {
      ...enquiry(projectStamp),
      location: "Bangalore",
      message: "QA project details for interior design",
    };
    const res = await req("leads", project);
    assert.equal(res.status, 201);
    assert.equal((await res.json()).conversion_eligible, true);

    const saved = db.first(
      "SELECT payload, suspected_spam, status FROM leads WHERE submission_id=?",
      project.submission_id,
    );
    assert.ok(saved);
    assert.equal(saved.suspected_spam, 0);
    assert.equal(saved.status, "New");
    const payload = JSON.parse(saved.payload);
    assert.equal(payload.location, "Bangalore");
    assert.equal(payload.message, "QA project details for interior design");
  } finally {
    db.close();
  }
});
