import React, { useState } from "react";
import { ArrowUpRight, Facebook, Instagram, MapPin } from "lucide-react";
import { asset } from "./client.js";
import { sectors, cities, studioLocations } from "./content.js";
import { EnquiryForm } from "./consult.jsx";

export function Partners({ content, open, enquire }) {
  const [partnerId, setPartner] = useState(""),
    [scope, setScope] = useState("Residential"),
    [featuredId, setFeatured] = useState("");
  const credited = content.projects.filter((p) => p.partnerIds?.length);
  const preview = credited.length === 0 && content.partners.length === 0;
  const profiles = content.partners;
  const partner = profiles.find((p) => p.id === partnerId);
  const pool = (preview ? content.projects : credited).filter(
    (p) => !partner || p.partnerIds.includes(partner.id),
  );
  const matches = pool.filter((p) => p.sector === scope),
    selected = matches.find((p) => p.id === featuredId) || matches[0];
  return (
    <section id="partners" className="partners page-pad">
      <div className="section-top">
        <div>
          <div className="kicker">
            <i />
            Collaborations
          </div>
          <h2>
            Our <em>partners.</em>
          </h2>
        </div>
        <p>
          {preview
            ? "Explore residential and commercial concept galleries while partner credits are being confirmed."
            : "Meet the people behind our projects and explore the spaces they helped design."}
        </p>
      </div>
      {profiles.length > 0 && (
        <div className="partner-picker">
          <label>
            Choose a partner
            <select
              value={partner?.id || ""}
              onChange={(e) => {
                const id = e.target.value;
                setPartner(id);
                const first = credited.find(
                  (p) => !id || p.partnerIds.includes(id),
                );
                setScope(first?.sector || "Residential");
                setFeatured("");
              }}
            >
              <option value="">All partners</option>
              {profiles.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {partner && (
            <div>
              <h3>{partner.name}</h3>
              {partner.role && <p>{partner.role}</p>}
              {partner.bio && <p>{partner.bio}</p>}
            </div>
          )}
        </div>
      )}
      <div className="partner-layout">
        <div className="partner-index">
          <div
            role="group"
            aria-label="Partner work category"
            className="segmented"
          >
            {sectors.map((s) => (
              <button
                key={s}
                aria-pressed={scope === s}
                onClick={() => {
                  setScope(s);
                  setFeatured("");
                }}
              >
                {s}
              </button>
            ))}
          </div>
          {matches.length > 0 ? (
            <ul>
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setFeatured(p.id)}
                    aria-pressed={p.id === selected.id}
                  >
                    <span>{p.name}</span>
                    <small>{p.type}</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-portfolio">
              No {scope.toLowerCase()} projects are featured for this selection
              yet.
            </p>
          )}
          <button className="text-link" onClick={enquire}>
            Send your partner details <ArrowUpRight size={15} />
          </button>
        </div>
        {selected && (
          <button
            className="partner-feature"
            onClick={() => open(selected)}
            aria-label={"View featured project " + selected.name}
          >
            <img
              loading="lazy"
              src={asset(selected.images[0].url)}
              alt={selected.images[0].alt}
            />
            <span className="partner-caption">
              <small>
                {preview
                  ? "Concept portfolio preview"
                  : profiles
                      .filter((v) => selected.partnerIds.includes(v.id))
                      .map((v) => v.name)
                      .join(" · ")}
              </small>
              <strong>{selected.name}</strong>
              <span>
                View gallery <ArrowUpRight size={15} />
              </span>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
export function SocialLinks({ c }) {
  const links = [
    [Instagram, "Instagram", c.instagram],
    [Facebook, "Facebook", c.facebook],
  ].filter(([, , url]) => url);
  return links.length ? (
    <div className="social-links" aria-label="Studio social profiles">
      {links.map(([Icon, name, url]) => (
        <a href={url} target="_blank" rel="noopener noreferrer" key={name}>
          <Icon size={16} aria-hidden="true" />
          {name}
        </a>
      ))}
    </div>
  ) : null;
}
export function LocationList({ c }) {
  return (
    <div className="studio-locations">
      {cities.map((city) => {
        const address =
          city === "Bangalore" ? c.bangaloreAddress : c.hyderabadAddress;
        const url =
          "https://www.google.com/maps/search/?api=1&query=" +
          encodeURIComponent(
            address || city + ", " + studioLocations[city] + ", India",
          );
        return (
          <section className="city-location" key={city}>
            <MapPin size={17} />
            <div>
              <h3>{city}</h3>
              <p>{address || studioLocations[city]}</p>
              <a href={url} target="_blank" rel="noopener noreferrer">
                {address ? "View address on map" : "View city map"}{" "}
                <ArrowUpRight size={13} />
              </a>
            </div>
          </section>
        );
      })}
    </div>
  );
}
export function ContactSection({ c, kind, setKind }) {
  return (
    <section id="contact" className="contact-section page-pad">
      <div className="contact-intro">
        <div className="kicker">
          <i />
          Contact the studio
        </div>
        <h2>
          Bangalore &amp;
          <br />
          <em>Hyderabad.</em>
        </h2>
        <LocationList c={c} />
        {c.email && (
          <a href={"mailto:" + c.email} className="studio-email">
            {c.email}
          </a>
        )}
        <SocialLinks c={c} />
      </div>
      <div className="contact-form-card">
        <div className="segmented" role="group" aria-label="Enquiry type">
          {[
            ["project", "Project enquiry"],
            ["partner", "Partner enquiry"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={kind === id}
              onClick={() => setKind(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <h3>
          {kind === "partner"
            ? "Introduce your practice."
            : "Tell us about your space."}
        </h3>
        <EnquiryForm key={kind} kind={kind} email={c.email} inline />
      </div>
    </section>
  );
}
