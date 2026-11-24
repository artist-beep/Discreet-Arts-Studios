import React from "react";
import { ArrowUpRight, Facebook, Instagram, MapPin } from "lucide-react";
import { asset } from "./client.js";
import { sectors, cities, studioLocations } from "./content.js";
import { EnquiryForm } from "./consult.jsx";

export function Partners({ content, open }) {
  const { founder, partners, projects } = content;
  return (
    <section
      id="partners"
      className="partners page-pad"
      aria-labelledby="people-heading"
    >
      <h2 id="people-heading">
        Founder <em>&amp; partners</em>
      </h2>
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
