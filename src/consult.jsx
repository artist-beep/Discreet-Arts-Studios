import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Mail } from "lucide-react";
import { Dialog } from "./dialog.jsx";
import { scopes, bedrooms, cities, partnerFocus } from "./content.js";
import { api, attribution, portable, storage, trackLead } from "./client.js";

function Choice({ label, name, options, placeholder }) {
  return (
    <label>
      {label}
      <select name={name} required defaultValue="">
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </label>
  );
}
export function EnquiryForm({
  kind = "project",
  email,
  inline = false,
  onDone,
}) {
  const partner = kind === "partner",
    storageKey = "active-enquiry-" + kind + (inline ? "-contact" : "-modal");
  const container = useRef(null),
    stamp = useRef(""),
    id = useRef(null),
    last = useRef("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState(null);
  useEffect(() => {
    let active = true,
      requested = false;
    function loadStamp() {
      if (portable || requested) return;
      requested = true;
      api("stamp?form=" + kind)
        .then((r) => {
          if (active) stamp.current = r.stamp;
        })
        .catch(() => {});
    }
    let observer;
    if (
      inline &&
      typeof IntersectionObserver !== "undefined" &&
      container.current
    ) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadStamp();
          observer.disconnect();
        }
      });
      observer.observe(container.current);
    } else loadStamp();
    return () => {
      active = false;
      observer?.disconnect();
    };
  }, [kind, inline]);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    const f = Object.fromEntries(new FormData(e.currentTarget)),
      phone = f.phone.trim().replace(/[\s().-]/g, "");
    if (!f.name.trim() || (!f.email.trim() && !phone)) {
      setError("Add your name and either an email or WhatsApp number.");
      return;
    }
    if (phone && !/^\+[1-9]\d{6,14}$/.test(phone)) {
      setError(
        "Include the country code in your WhatsApp number, for example +91.",
      );
      return;
    }
    if (f.website) {
      setError("Unable to accept this enquiry.");
      return;
    }
    if (partner && f.portfolio_url) {
      try {
        const u = new URL(f.portfolio_url);
        if (u.protocol !== "https:" || u.username || u.password) throw Error();
      } catch {
        setError("Use a complete HTTPS link for your portfolio.");
        return;
      }
    }
    const subject = partner ? "Partnership enquiry" : "Interior design enquiry";
    if (portable) {
      const lines = [
        ["Name", f.name],
        ["Email", f.email],
        ["WhatsApp", f.phone],
        ["City", f.location],
        ["Studio / firm", f.organisation],
        ["Portfolio", f.portfolio_url],
        ["Work category", f.work_focus],
        ["Property", f.bhk],
        ["Scope", f.scope_of_work],
        ["Details", f.message],
      ]
        .filter(([, v]) => v)
        .map(([k, v]) => k + " — " + v);
      setResult({
        text: lines.join("\n"),
        mailto: email
          ? "mailto:" +
            email +
            "?subject=" +
            encodeURIComponent(subject) +
            "&body=" +
            encodeURIComponent(lines.join("\n"))
          : "",
      });
      return;
    }
    setBusy(true);
    try {
      const signature = JSON.stringify(f);
      if (!id.current)
        id.current =
          storage("sessionStorage", storageKey) || crypto.randomUUID();
      if (last.current && signature !== last.current)
        id.current = crypto.randomUUID();
      last.current = signature;
      storage("sessionStorage", storageKey, id.current);
      const reply = await api("leads", {
        ...f,
        ...attribution,
        enquiry_type: kind,
        stamp: stamp.current,
        submission_id: id.current,
      });
      if (reply.submission_id !== id.current)
        throw Error("The enquiry could not be confirmed. Please try again.");
      storage("sessionStorage", storageKey, null);
      setResult({ saved: true });
      if (!partner) trackLead(reply);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div ref={container} className="enquiry-body">
      {result ? (
        <div className="success" role="status">
          <Check />
          <h3>{result.saved ? "Details received." : "Your email is ready."}</h3>
          <p>
            {result.saved
              ? "Thank you. Your details have been saved for the studio team."
              : "Review the details below, then open your email app and press Send."}
          </p>
          {!result.saved && (
            <>
              <textarea
                aria-label="Your enquiry details"
                readOnly
                value={result.text}
              />
              {result.mailto && (
                <a className="solid" href={result.mailto}>
                  <Mail size={15} /> Open email app
                </a>
              )}
            </>
          )}
          <button
            className="text-link"
            onClick={() => {
              if (onDone) onDone();
              else {
                setResult(null);
                id.current = null;
                last.current = "";
              }
            }}
          >
            {onDone ? "Back to the studio" : "Start another enquiry"}
          </button>
        </div>
      ) : (
        <form className="studio-form" onSubmit={submit}>
          <label>
            Your name
            <input
              name="name"
              autoComplete="name"
              placeholder="Full name"
              maxLength={200}
              required
            />
          </label>
          <div className="form-pair">
            <label>
              Email
              <input
                name="email"
                autoComplete="email"
                type="email"
                placeholder="you@example.com"
                maxLength={254}
              />
            </label>
            <label>
              WhatsApp
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 …"
                maxLength={40}
              />
            </label>
          </div>
          <p className="hint">Please include at least one way to reach you.</p>
          <div className="form-pair">
            <Choice
              label={partner ? "City" : "Project city"}
              name="location"
              options={[...cities, "Other"]}
              placeholder="Select city"
            />
            {partner ? (
              <Choice
                label="Work category"
                name="work_focus"
                options={partnerFocus}
                placeholder="Select category"
              />
            ) : (
              <Choice
                label="Property size"
                name="bhk"
                options={bedrooms}
                placeholder="Select size"
              />
            )}
          </div>
          {partner ? (
            <>
              <label>
                Studio or firm
                <input
                  name="organisation"
                  autoComplete="organization"
                  required
                  maxLength={200}
                />
              </label>
              <label>
                Portfolio link (optional)
                <input
                  name="portfolio_url"
                  type="url"
                  placeholder="https://"
                  maxLength={2048}
                />
              </label>
            </>
          ) : (
            <Choice
              label="Scope of work"
              name="scope_of_work"
              options={scopes}
              placeholder="Select scope"
            />
          )}
          <label>
            {partner
              ? "About your work (optional)"
              : "Tell us about your project (optional)"}
            <textarea name="message" rows={2} maxLength={2000} />
          </label>
          <div className="trap" aria-hidden="true">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {portable && (
            <p className="hint">
              This preview prepares an email for you to send to the studio.
            </p>
          )}
          <button type="submit" className="solid" disabled={busy}>
            {busy
              ? "Saving…"
              : portable
                ? "Prepare enquiry email"
                : partner
                  ? "Send partner details"
                  : "Send project enquiry"}
            <ArrowUpRight size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
export function Consult({ onClose, email }) {
  return (
    <Dialog
      label="Book a free consultation"
      onClose={onClose}
      kind="consult-dialog"
    >
      <div className="kicker">
        <i />
        Studio enquiries
      </div>
      <h2>
        Tell us about
        <br />
        <em>your space.</em>
      </h2>
      <p className="intro">
        Share your brief with our Bangalore and Hyderabad team.
      </p>
      <EnquiryForm email={email} onDone={onClose} />
    </Dialog>
  );
}
