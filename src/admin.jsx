import React, { useEffect, useRef, useState } from "react";
import { Sun, Moon, LogOut, Download, Plus, Trash2 } from "lucide-react";
import { api, getPrefs, setPrefs } from "./client.js";
function Field({ label, value, change, area = false, ...props }) {
  return (
    <label>
      {label}
      {area ? (
        <textarea
          value={value}
          onChange={(e) => change(e.target.value)}
          {...props}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => change(e.target.value)}
          {...props}
        />
      )}
    </label>
  );
}
function Editor({ onNotice }) {
  const [data, setData] = useState(null),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api("admin/content")
      .then((r) => {
        setData(r.content);
        setRevision(r.revision);
      })
      .catch((e) => onNotice(e.message));
  }, []);
  function set(path, value) {
    setData((previous) => {
      const next = structuredClone(previous);
      let obj = next;
      for (const k of path.slice(0, -1)) obj = obj[k];
      obj[path.at(-1)] = value;
      return next;
    });
  }
  const input = (label, path, value, area = false) => (
    <Field
      key={path.join(".")}
      label={label}
      value={value}
      area={area}
      change={(v) => set(path, v)}
    />
  );
  const remove = (path, list, index) =>
    set(
      path,
      list.filter((_, i) => i !== index),
    );
  const add = (path, list, value) => set(path, [...list, value]);
  const minus = (action, label) => (
    <button type="button" className="text-link del" onClick={action}>
      <Trash2 size={14} />
      {label}
    </button>
  );
  const more = (action, label) => (
    <button type="button" className="outline" onClick={action}>
      <Plus size={15} />
      {label}
    </button>
  );
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api("admin/content", { revision, content: data });
      setRevision(r.revision);
      onNotice("Website content saved.");
    } catch (e) {
      onNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!data) return <p>Loading website content…</p>;
  return (
    <form className="studio-form editor" onSubmit={save}>
      <h2>Website content</h2>
      <details open>
        <summary>Hero and studio</summary>
        {input(
          "Hero headline · line break for italic text",
          ["headline"],
          data.headline,
          true,
        )}
        {input("Studio introduction", ["subtitle"], data.subtitle, true)}
        {input("Studio image URL", ["studioImage"], data.studioImage)}
        {data.hero.map((h, i) => (
          <fieldset key={i}>
            <legend>Hero slide {i + 1}</legend>
            {input("Image URL", ["hero", i, "image"], h.image)}
            {input("Caption", ["hero", i, "label"], h.label)}
            {data.hero.length > 1 &&
              minus(() => remove(["hero"], data.hero, i), "Remove slide")}
          </fieldset>
        ))}
        {more(
          () => add(["hero"], data.hero, { image: "", label: "" }),
          "Add hero slide",
        )}
      </details>
      <details>
        <summary>Project galleries</summary>
        {data.projects.map((p, i) => (
          <details key={i}>
            <summary>{p.name || "New project"}</summary>
            {input("Gallery ID", ["projects", i, "id"], p.id)}
            {input("Project name", ["projects", i, "name"], p.name)}
            {input("Project type", ["projects", i, "type"], p.type)}
            {input(
              "Description",
              ["projects", i, "description"],
              p.description,
              true,
            )}
            {p.images.map((im, j) => (
              <fieldset key={j}>
                <legend>Image {j + 1}</legend>
                {input(
                  "Image URL",
                  ["projects", i, "images", j, "url"],
                  im.url,
                )}
                {input(
                  "Image description",
                  ["projects", i, "images", j, "alt"],
                  im.alt,
                )}
                {p.images.length > 1 &&
                  minus(
                    () => remove(["projects", i, "images"], p.images, j),
                    "Remove image",
                  )}
              </fieldset>
            ))}
            {more(
              () =>
                add(["projects", i, "images"], p.images, { url: "", alt: "" }),
              "Add image",
            )}
            {data.projects.length > 1 &&
              minus(
                () => remove(["projects"], data.projects, i),
                "Remove gallery",
              )}
          </details>
        ))}
        {more(
          () =>
            add(["projects"], data.projects, {
              id: "gallery-" + crypto.randomUUID().slice(0, 8),
              name: "New gallery",
              type: "Residential",
              aspect: "4/5",
              description: "",
              images: [{ url: "", alt: "" }],
            }),
          "Add gallery",
        )}
      </details>
      <details>
        <summary>Client films</summary>
        {data.films.map((f, i) => (
          <fieldset key={i}>
            <legend>{f.title || "New film"}</legend>
            {[
              ["Title", "title"],
              ["Poster URL", "poster"],
              ["Video URL (optional)", "video"],
              ["Approved client quote", "quote"],
            ].map(([l, k]) => input(l, ["films", i, k], f[k]))}
            <label className="inline-check">
              <input
                type="checkbox"
                checked={f.sample}
                onChange={(e) => set(["films", i, "sample"], e.target.checked)}
              />
              Label as an illustrative preview
            </label>
            {minus(() => remove(["films"], data.films, i), "Remove film")}
          </fieldset>
        ))}
        {more(
          () =>
            add(["films"], data.films, {
              id: "film-" + crypto.randomUUID().slice(0, 8),
              title: "",
              poster: "",
              video: "",
              quote: "",
              sample: true,
            }),
          "Add film",
        )}
      </details>
      <details>
        <summary>Business details and tracking</summary>
        {[
          ["Headquarters city", "city"],
          ["Registered address", "address"],
          ["Public email", "email"],
          ["Call number, including country code", "phone"],
          ["WhatsApp number, including country code", "whatsapp"],
          ["Meta Pixel ID (optional)", "pixel"],
        ].map(([l, k]) => input(l, [k], data[k]))}
      </details>
      <button className="solid" disabled={busy}>
        {busy ? "Saving…" : "Save website content"}
      </button>
    </form>
  );
}
function Leads({ onNotice }) {
  const [rows, setRows] = useState(null),
    [filter, setFilter] = useState("All"),
    [q, setQ] = useState("");
  const load = () =>
    api("admin/leads")
      .then(setRows)
      .catch((e) => onNotice(e.message));
  useEffect(() => {
    load();
  }, []);
  const shown = (rows || []).filter(
    (r) =>
      (filter === "All" ||
        (filter === "Suspected spam" ? r.suspected_spam : !r.suspected_spam)) &&
      [r.name, r.email, r.phone]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  async function update(id, status) {
    try {
      await api("admin/status", { id, status });
      await load();
      onNotice("Lead updated.");
    } catch (e) {
      onNotice(e.message);
    }
  }
  return (
    <section>
      <div className="admin-title">
        <h2>Studio enquiries</h2>
        <a className="outline" href="/api/admin/export" download>
          <Download size={16} /> Download CSV
        </a>
      </div>
      <div className="form-pair">
        <label>
          Search enquiries
          <input
            placeholder="Name, email or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label>
          Show
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["All", "Normal enquiries", "Suspected spam"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      {!rows ? (
        <p>Loading enquiries…</p>
      ) : !shown.length ? (
        <p className="empty">
          {rows.length
            ? "No matches."
            : "Your saved consultation enquiries will appear here."}
        </p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Received",
                  "Contact",
                  "Property",
                  "Scope",
                  "Classification",
                  "Status",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.submission_id}>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    <strong>{r.name}</strong>
                    <br />
                    {r.email}
                    <br />
                    {r.phone}
                  </td>
                  <td>{r.bhk}</td>
                  <td>{r.scope_of_work}</td>
                  <td>{r.delivery}</td>
                  <td>
                    <select
                      aria-label={"Status for " + r.name}
                      value={r.status}
                      onChange={(e) => update(r.submission_id, e.target.value)}
                    >
                      {["New", "Contacted", "Closed", "Test"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
export function Admin({ ticket }) {
  const [auth, setAuth] = useState(null),
    [valid, setValid] = useState(""),
    [tab, setTab] = useState("Enquiries"),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [dark, setDark] = useState(getPrefs("admin-dark", false));
  const ticketRef = useRef(ticket);
  function state() {
    return api("admin/state")
      .then(setAuth)
      .catch((e) => setNotice(e.message));
  }
  useEffect(() => {
    state();
    if (ticketRef.current)
      api("admin/ticket", { token: ticketRef.current })
        .then((r) => setValid(r.kind))
        .catch((e) => setNotice(e.message));
  }, []);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    const b = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (valid) {
        await api("admin/activate", {
          password: b.password,
          token: ticketRef.current,
        });
        ticketRef.current = "";
        setValid("");
        setNotice("Password saved. Sign in to the dashboard.");
      } else if (auth?.authenticated) {
        await api("admin/password", b);
        setNotice("Password updated. Please sign in again.");
      } else await api("admin/login", b);
      await state();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  function passwordForm(type) {
    return (
      <form className="studio-form" onSubmit={submit}>
        {type === "login" && (
          <label>
            Owner email
            <input name="email" type="email" autoComplete="username" required />
          </label>
        )}
        {type === "change" && (
          <label>
            Current password
            <input
              name="current"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
        )}
        <label>
          {type === "login" ? "Password" : "New passphrase"}
          <input
            name="password"
            type="password"
            autoComplete={
              type === "login" ? "current-password" : "new-password"
            }
            minLength={type === "login" ? 1 : 15}
            maxLength={128}
            required
          />
        </label>
        {type !== "login" && (
          <p>Use a unique passphrase of at least 15 characters.</p>
        )}
        <button className="solid" disabled={busy}>
          {busy
            ? "Please wait…"
            : type === "login"
              ? "Sign in"
              : "Save password"}
        </button>
      </form>
    );
  }
  return (
    <main className={"admin " + (dark ? "dark" : "")}>
      <header>
        <a href="/">Discrete Art Studio LLP</a>
        <div>
          <button
            aria-label="Toggle dashboard theme"
            onClick={() => {
              setPrefs("admin-dark", !dark);
              setDark(!dark);
            }}
          >
            {dark ? <Sun /> : <Moon />}
          </button>
          {auth?.authenticated && (
            <button
              onClick={async () => {
                try {
                  await api("admin/logout", {});
                  setTab("Enquiries");
                  await state();
                } catch (e) {
                  setNotice(e.message);
                }
              }}
            >
              <LogOut size={18} />
              Sign out
            </button>
          )}
        </div>
      </header>
      <div className="admin-main">
        {notice && (
          <p className="status-msg" role="status">
            {notice}
          </p>
        )}
        {!auth ? (
          <p>Loading studio dashboard…</p>
        ) : !auth.authenticated ? (
          <section className="owner-login">
            <div className="kicker">
              <i /> Private studio access
            </div>
            <h1>
              {valid === "recovery"
                ? "Reset your password."
                : valid || auth.setup
                  ? "Set your admin password."
                  : "Studio sign-in."}
            </h1>
            {valid ? (
              passwordForm("setup")
            ) : auth.setup ? (
              <p>
                Use the private, one-time link issued to the studio owner to set
                your password.
              </p>
            ) : (
              passwordForm("login")
            )}
          </section>
        ) : (
          <>
            <div className="admin-tabs">
              {["Enquiries", "Website content", "Account"].map((s) => (
                <button
                  aria-pressed={tab === s}
                  onClick={() => {
                    setNotice("");
                    setTab(s);
                  }}
                  key={s}
                >
                  {s}
                </button>
              ))}
            </div>
            {tab === "Enquiries" ? (
              <Leads onNotice={setNotice} />
            ) : tab === "Website content" ? (
              <Editor onNotice={setNotice} />
            ) : (
              <section className="owner-login">
                <h2>Change password</h2>
                {passwordForm("change")}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
