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
test("project enquiries remain available and archived partnership enquiries remain readable", async () => {
  const { db, t, req } = harness();
  try {
    const ticket = await issueTicket(db, email, "setup", t.now);
    await req("admin/activate", { token: ticket, password: pass });
    const session = (
      await req("admin/login", { email, password: pass })
    ).headers
      .get("Set-Cookie")
      .split(";")[0];
    assert.equal((await req("stamp?form=partner")).status, 404);
    const projectStamp = (await (await req("stamp?form=project")).json()).stamp;
    t.now += 2100;
    const partner = {
      submission_id: randomUUID(),
      enquiry_type: "partner",
      name: "Test Partner",
      email: "test@example.invalid",
      location: "Hyderabad",
      organisation: "QA partner office",
      work_focus: "Commercial",
      portfolio_url: "https://example.invalid/work",
      message: "QA portfolio submission",
    };
    assert.equal(
      (await req("leads", { ...partner, stamp: projectStamp })).status,
      400,
    );
    assert.equal(db.first("SELECT COUNT(*) AS n FROM leads").n, 0);
    const archive = { ...partner, form_name: "Partnership enquiry" };
    db.run(
      "INSERT INTO leads(submission_id,created_at,payload,suspected_spam) VALUES(?,?,?,0)",
      archive.submission_id,
      new Date(t.now).toISOString(),
      JSON.stringify(archive),
    );
    const project = {
      ...enquiry(projectStamp),
      location: "Bangalore",
      message: "QA project details",
    };
    const res = await req("leads", project);
    assert.equal((await res.json()).conversion_eligible, true);
    const rows = await (await req("admin/leads", undefined, session)).json();
    assert.equal(
      rows.find((r) => r.submission_id === partner.submission_id)
        .suspected_spam,
      false,
    );
    assert.equal(rows.filter((r) => r.suspected_spam).length, 0);
    assert.equal(
      rows.find((r) => r.submission_id === project.submission_id).location,
      "Bangalore",
    );
    const csv = await (await req("admin/export", undefined, session)).text();
    for (const field of [
      "QA partner office",
      "https://example.invalid/work",
      "Commercial",
      "QA project details",
      "Hyderabad",
      "Bangalore",
      "Partnership enquiry",
    ])
      assert.ok(csv.includes(field));
  } finally {
    db.close();
  }
});

test("work status controls gallery membership and older projects await assignment", async () => {
  const { db, t, req } = harness();
  try {
    const legacy = structuredClone(initialContent);
    delete legacy.projects[0].workStatus;
    legacy.films = [
      {
        id: "archived-portrait",
        title: "Archived portrait",
        poster: "/stories/portrait-one.webp",
        video: "",
        quote: "",
        sample: true,
      },
    ];
    legacy.studioImage = "/media/studio.webp";
    db.run(
      "INSERT INTO content(id,body,revision) VALUES(1,?,1)",
      JSON.stringify(legacy),
    );
    const ticket = await issueTicket(db, email, "setup", t.now);
    await req("admin/activate", { token: ticket, password: pass });
    const session = (
      await req("admin/login", { email, password: pass })
    ).headers
      .get("Set-Cookie")
      .split(";")[0];
    let { content, revision } = await (
      await req("admin/content", undefined, session)
    ).json();
    const project = content.projects[0];
    assert.equal(project.workStatus, "Unassigned");
    for (const status of ["Ongoing", "Completed"]) {
      project.workStatus = status;
      const r = await req("admin/content", { content, revision }, session);
      assert.equal(r.status, 200);
      revision = (await r.json()).revision;
      const pub = await (await req("content")).json();
      assert.deepEqual(
        pub.projects
          .filter((p) => p.id === project.id)
          .map((p) => p.workStatus),
        [status],
      );
      assert.equal(pub.films, undefined);
      assert.equal(pub.studioImage, undefined);
    }
    project.workStatus = "typo";
    assert.equal(
      (await req("admin/content", { content, revision }, session)).status,
      400,
    );
    const final = await (await req("admin/content", undefined, session)).json();
    assert.deepEqual(final.content.films, legacy.films);
  } finally {
    db.close();
  }
});
