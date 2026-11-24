import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Facebook,
  Instagram,
  MapPin,
} from "lucide-react";
import { asset } from "./client.js";
import { sectors, cities, studioLocations } from "./content.js";
import { EnquiryForm } from "./consult.jsx";

function PartnerWorks({ partners, projects, open }) {
  const [partnerId, setPartnerId] = useState("");
  const [sector, setSector] = useState("");
  const [projectId, setProjectId] = useState("");
  const credited = projects.filter((p) => p.partnerIds.length > 0);
  const conceptPreview = credited.length === 0;
  const portfolio = conceptPreview
    ? projects.filter((p) => /\bconcept\b/i.test(p.type))
    : credited;
  const authorsWithWork = partners.filter((person) =>
    credited.some((project) => project.partnerIds.includes(person.id)),
  );
  const selectedPartner = authorsWithWork.find(
    (person) => person.id === partnerId,
  );
  const pool = selectedPartner
    ? portfolio.filter((p) => p.partnerIds.includes(selectedPartner.id))
    : portfolio;
  const activeSector =
    sector ||
    sectors.find((s) => pool.some((p) => p.sector === s)) ||
    sectors[0];
  const matches = pool.filter((p) => p.sector === activeSector);
  const featured = matches.find((p) => p.id === projectId) || matches[0];
  const authors =
    featured && partners.filter((p) => featured.partnerIds.includes(p.id));

  return (
    <section
      id="partner-works"
      className="partner-portfolio"
      aria-labelledby="partner-works-heading"
    >
      <header className="portfolio-heading">
        <h3 id="partner-works-heading">
          Partners’ <em>work</em>
        </h3>
        {conceptPreview && portfolio.length > 0 && (
          <p>Concept galleries · Individual project credits pending</p>
        )}
      </header>
      {!portfolio.length ? (
        <p>Partner projects will appear here as they are added.</p>
      ) : (
        <div className="portfolio-layout">
          <div className="portfolio-index">
            {!conceptPreview && (
              <label className="portfolio-filter">
                Partner
                <select
                  value={selectedPartner?.id || ""}
                  onChange={(e) => {
                    setPartnerId(e.target.value);
                    setSector("");
                    setProjectId("");
                  }}
                >
                  <option value="">All partners</option>
                  {authorsWithWork.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div
              role="group"
              aria-label="Partner work category"
              className="segmented"
            >
              {sectors.map((s) => (
                <button
                  type="button"
                  key={s}
                  aria-pressed={activeSector === s}
                  onClick={() => {
                    setSector(s);
                    setProjectId("");
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {matches.length > 0 ? (
              <ul
                className="portfolio-projects"
                aria-label={activeSector + " projects"}
              >
                {matches.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      aria-pressed={featured.id === p.id}
                      onClick={() => setProjectId(p.id)}
                    >
                      <span>{p.name}</span>
                      <small>{p.type}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="portfolio-empty">
                No {activeSector.toLowerCase()} projects are listed for this
                selection.
              </p>
            )}
          </div>
          {featured && (
            <button
              type="button"
              className="portfolio-feature"
              onClick={() => open(featured)}
              aria-label={"View gallery for " + featured.name}
            >
              <img
                loading="lazy"
                src={asset(featured.images[0].url)}
                alt={featured.images[0].alt}
              />
              <span className="portfolio-caption">
                {authors.length > 0 && (
                  <small>{authors.map((p) => p.name).join(" · ")}</small>
                )}
                <strong>{featured.name}</strong>
                <span>
                  View gallery <ArrowUpRight size={16} aria-hidden="true" />
                </span>
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function Partners({ content, open }) {
  const { founder, partners, projects } = content;
  return (
    <section
      id="partners"
      className="partners page-pad"
      aria-labelledby="people-heading"
    >
      <div className="section-top">
        <h2 id="people-heading">
          Founder <em>&amp; partners</em>
        </h2>
        <a className="text-link" href="#partner-works">
          View partners’ work <ArrowDown size={16} aria-hidden="true" />
        </a>
      </div>
      <div className="people-layout">
        <div className="people-image" aria-hidden="true">
          <img
            loading="lazy"
            src={asset("/media/kitchen-detail.webp")}
            alt=""
          />
        </div>
        <div className="people-list">
          <article className="person founder">
            <p className="person-role">Founder</p>
            <h3>{founder.name}</h3>
            <p className="person-bio">{founder.bio}</p>
          </article>
          {partners.map((person) => (
            <article key={person.id} className="person">
              <p className="person-role">{person.role || "Partner"}</p>
              <h3>{person.name}</h3>
              {person.bio && <p className="person-bio">{person.bio}</p>}
              {sectors.map((sector) => {
                const works = projects.filter(
                  (p) =>
                    p.sector === sector && p.partnerIds.includes(person.id),
                );
                return (
                  works.length > 0 && (
                    <div className="person-works" key={sector}>
                      <h4>{sector} work</h4>
                      <ul>
                        {works.map((p) => (
                          <li key={p.id}>
                            <button
                              className="text-link"
                              onClick={() => open(p)}
                            >
                              {p.name}{" "}
                              <ArrowUpRight size={15} aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                );
              })}
            </article>
          ))}
        </div>
      </div>
      <PartnerWorks partners={partners} projects={projects} open={open} />
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
export function ContactSection({ c }) {
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
        <h3>Tell us about your space.</h3>
        <EnquiryForm email={c.email} inline />
      </div>
    </section>
  );
}
