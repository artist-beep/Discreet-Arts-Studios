import test from "node:test";
import assert from "node:assert/strict";
function memory() {
  const values = new Map();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, String(v)),
    removeItem: (k) => values.delete(k),
  };
}
async function visitor({
  referrer = "",
  decision = null,
  query = "?utm_source=print&contact=private#secret",
  prior,
} = {}) {
  const local = prior || memory(),
    scripts = [];
  let reloads = 0;
  globalThis.window = { localStorage: local, sessionStorage: memory() };
  if (decision) local.setItem("studio:tracking", decision);
  globalThis.location = new URL("https://studio.test/" + query);
  globalThis.location.reload = () => {
    reloads++;
  };
  globalThis.document = {
    referrer,
    createElement: () => ({}),
    head: { appendChild: (s) => scripts.push(s) },
  };
  globalThis.history = {
    replaceState(_, __, path) {
      globalThis.location = new URL(path, location);
      globalThis.location.reload = () => {
        reloads++;
      };
    },
  };
  const lib = await import("../src/client.js?visit=" + crypto.randomUUID());
  return {
    lib,
    scripts,
    local,
    events: () => Array.from(window.fbq?.queue || [], (x) => Array.from(x)),
    reloads: () => reloads,
  };
}
test("optional measurement with no consent, bad ID or unclean referrer stays off", async () => {
  for (const [decision, id, ref] of [
    [null, "123456789", ""],
    ["no", "123456789", ""],
    ["yes", "", ""],
    ["yes", "abc", ""],
    ["yes", "123456789", "https://from.test/previous?email=private"],
    ["yes", "123456789", "https://from.test/#name"],
  ]) {
    const v = await visitor({ decision, referrer: ref });
    v.lib.enablePixel(id);
    assert.deepEqual(v.scripts, []);
    assert.equal(location.search, "");
    assert.equal(location.hash, "");
    assert.deepEqual(v.lib.attribution, {
      utm: { source: "print" },
      page_url: "https://studio.test/",
    });
  }
});
test("only explicit eligible confirmations count once, including after reload", async () => {
  const id = "123456789",
    key = crypto.randomUUID(),
    v = await visitor();
  v.lib.changeConsent("yes", id);
  assert.equal(v.scripts.length, 1);
  assert.equal(v.events().filter((e) => e[2] === "PageView").length, 1);
  for (const flag of [false, undefined])
    v.lib.trackLead({ submission_id: key, conversion_eligible: flag });
  assert.equal(v.events().filter((e) => e[2] === "Lead").length, 0);
  for (let i = 0; i < 2; i++)
    v.lib.trackLead({ submission_id: key, conversion_eligible: true });
  assert.equal(v.events().filter((e) => e[2] === "Lead").length, 1);
  assert.deepEqual(v.events().at(-1), [
    "trackSingle",
    id,
    "Lead",
    {},
    { eventID: key },
  ]);
  const again = await visitor({ prior: v.local });
  again.lib.enablePixel(id);
  again.lib.trackLead({ submission_id: key, conversion_eligible: true });
  assert.equal(again.events().filter((e) => e[2] === "Lead").length, 0);
  again.lib.changeConsent("no", id);
  again.lib.trackLead({
    submission_id: crypto.randomUUID(),
    conversion_eligible: true,
  });
  assert.equal(again.reloads(), 1);
  assert.equal(again.events().filter((e) => e[2] === "Lead").length, 0);
});
