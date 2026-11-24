import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Download } from "lucide-react";
import { Dialog } from "./dialog.jsx";
import { scopes, bedrooms } from "./content.js";
import { api, attribution, portable, storage, trackLead } from "./client.js";
export function Consult({ onClose }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false);
  const stamp = useRef(""),
    id = useRef(
      storage("sessionStorage", "active-enquiry") || crypto.randomUUID(),
    ),
    snapshot = useRef("");
  useEffect(() => {
    let current = true;
    if (!portable)
      api("stamp")
        .then((r) => {
          if (current) stamp.current = r.stamp;
        })
        .catch(() => {});
    return () => {
      current = false;
    };
  }, []);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const cleanPhone = f.phone.trim().replace(/[\s().-]/g, "");
    if (!f.name.trim() || (!f.email.trim() && !cleanPhone)) {
      setError("Add your name and either an email or WhatsApp number.");
      return;
    }
    if (cleanPhone && !/^\+[1-9]\d{6,14}$/.test(cleanPhone)) {
      setError(
        "Include your country code in the WhatsApp number, for example +91.",
      );
      return;
    }
    if (portable) {
      const draft = [
        "Consultation enquiry",
        "Discrete Art Studio LLP",
        "",
        f.name,
        f.email,
        f.phone,
        f.bhk,
        f.scope_of_work,
      ].join("\n");
      const u = URL.createObjectURL(new Blob([draft], { type: "text/plain" })),
        a = document.createElement("a");
      a.href = u;
      a.download = "Studio_Consultation_Draft.txt";
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
      setSuccess(true);
      return;
    }
    setBusy(true);
    storage("sessionStorage", "active-enquiry", id.current);
    try {
      const key = JSON.stringify([
        f.name,
        f.email,
        f.phone,
        f.bhk,
        f.scope_of_work,
      ]);
      if (snapshot.current && snapshot.current !== key) {
        id.current = crypto.randomUUID();
        storage("sessionStorage", "active-enquiry", id.current);
      }
      snapshot.current = key;
      const result = await api("leads", {
        ...f,
        ...attribution,
        stamp: stamp.current,
        submission_id: id.current,
      });
      if (result.submission_id !== id.current)
        throw Error("The enquiry could not be confirmed. Please try again.");
      storage("sessionStorage", "active-enquiry", null);
      setSuccess(true);
      trackLead(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      label="Book a free consultation"
      onClose={onClose}
      kind="consult-dialog"
    >
      <div className="kicker">
        <i /> Studio enquiries
      </div>
      {success ? (
        <div className="success">
          <Check />
          <h2>{portable ? "Your draft is ready." : "Enquiry received."}</h2>
          <p>
            {portable
              ? "Your consultation details have been saved as a text file on your device."
              : "Thank you for sharing your brief with Discrete Art Studio LLP."}
          </p>
          <button onClick={onClose} className="solid">
            Back to the studio
          </button>
        </div>
      ) : (
        <>
          <h2>
            Tell us about
            <br />
            <em>your space.</em>
          </h2>
          <p className="intro">
            {portable
              ? "Explore the form and download a draft. Sending enquiries is available in the full website."
              : "Share a few details to book your free design consultation."}
          </p>
          <form onSubmit={submit} className="studio-form">
            <label>
              Your name
              <input
                autoComplete="name"
                name="name"
                placeholder="Full name"
                required
                maxLength={200}
              />
            </label>
            <div className="form-pair">
              <label>
                Email
                <input
                  autoComplete="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  maxLength={254}
                />
              </label>
              <label>
                WhatsApp
                <input
                  autoComplete="tel"
                  name="phone"
                  type="tel"
                  placeholder="+91 …"
                  maxLength={40}
                />
              </label>
            </div>
            <p className="hint">
              Please include at least one way to reach you.
            </p>
            <div className="form-pair">
              <label>
                Property size
                <select name="bhk" required defaultValue="">
                  <option value="" disabled>
                    Select size
                  </option>
                  {bedrooms.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Scope of work
                <select name="scope_of_work" required defaultValue="">
                  <option value="" disabled>
                    Select scope
                  </option>
                  {scopes.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
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
            <button type="submit" className="solid" disabled={busy}>
              {portable
                ? "Download enquiry draft"
                : busy
                  ? "Saving your enquiry…"
                  : "Send consultation enquiry"}
              {portable ? <Download size={16} /> : <ArrowUpRight size={16} />}
            </button>
          </form>
        </>
      )}
    </Dialog>
  );
}
