import {
  Partners,
  LocationList,
  SocialLinks,
  ContactSection,
} from "./partners.jsx";
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Layers,
  MessageCircle,
  Phone,
  Menu,
  X,
  MessageSquareText,
} from "lucide-react";
import { initialContent, company } from "./content.js";
import {
  api,
  asset,
  portable,
  device,
  getPrefs,
  setPrefs,
  enablePixel,
  consent,
  changeConsent,
  launchHash,
} from "./client.js";
import { Dialog } from "./dialog.jsx";
import { Consult } from "./consult.jsx";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
let motionModule;
function animateIn(el) {
  if (!el || reduced()) return;
  const frames = {
    opacity: [0.3, 1],
    transform: ["translateY(10px)", "translateY(0px)"],
  };
  if (motionModule?.animate) {
    motionModule.animate(el, frames, { duration: 0.45, ease: "easeOut" });
    return;
  }
  el.animate?.(frames, { duration: 420, easing: "ease-out" });
}
if (!portable && !location.pathname.startsWith("/admin")) {
  const source =
    "https://cdn.jsdelivr.net/npm/framer-motion@12.23.24/dom/mini/+esm";
  import(/* @vite-ignore */ source)
    .then((m) => {
      motionModule = m;
    })
    .catch(() => {});
}
function Wordmark() {
  return (
    <span className="wordmark">
      <svg
        viewBox="0 0 42 42"
        width="39"
        height="39"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 35V7h9.5C21 7 27 12.7 27 21s-6 14-14.5 14H3Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="m15 35 12-28 12 28M20.1 23h13.7"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
      <span>
        DISCRETE<small>ART STUDIO LLP</small>
      </span>
    </span>
  );
}
function route() {
  if (portable)
    return location.hash.startsWith("#view=")
      ? decodeURIComponent(location.hash.slice(6))
      : "/";
  return location.pathname.replace(/\/$/, "") || "/";
}
function go(path) {
  if (portable)
    history.pushState(
      {},
      "",
      path === "/"
        ? location.href.split("#")[0]
        : "#view=" + encodeURIComponent(path),
    );
  else history.pushState({}, "", path);
  dispatchEvent(new Event("popstate"));
}
const navigation = [
  ["partners", "Partners"],
  ["ongoing-works", "Ongoing Works"],
  ["completed-works", "Completed Works"],
  ["contact", "Contact"],
];

function Hero({ c, consult, section }) {
  const [slide, setSlide] = useState(0),
    [menu, setMenu] = useState(false);
  const n = c.hero.length,
    idx = slide % n,
    s = c.hero[idx],
    heading = useRef(null);
  useEffect(() => {
    animateIn(heading.current);
  }, []);
  function jump(key) {
    setMenu(false);
    section(key);
  }
  const parts = c.headline.split("\n");
  return (
    <section className="hero" id="home" aria-label="Studio introduction">
      {c.hero.map((im, i) => (
        <img
          className={"hero-image " + (i === idx ? "shown" : "")}
          key={im.image + i}
          src={asset(im.image)}
          alt=""
          fetchPriority={i === 0 ? "high" : "low"}
          aria-hidden="true"
        />
      ))}
      <div className="hero-shade" />
      <header className="mast">
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            jump("home");
          }}
          aria-label="Discrete Art Studio home"
        >
          <Wordmark />
        </a>
        <nav aria-label="Main navigation">
          {navigation.map(([id, label]) => (
            <a
              key={id}
              href={"#" + id}
              onClick={(e) => {
                e.preventDefault();
                jump(id);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <button className="outline-light enquire" onClick={consult}>
          Book consultation
        </button>
        <button
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          className="mobile-menu"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
        {menu && (
          <div className="mobile-nav">
            {navigation.map(([k, v]) => (
              <button key={k} onClick={() => jump(k)}>
                {v}
              </button>
            ))}
            <button
              onClick={() => {
                setMenu(false);
                consult();
              }}
            >
              Book consultation
            </button>
          </div>
        )}
      </header>
      <div className="hero-body" ref={heading}>
        <div className="kicker">
          <i /> Residential &amp; commercial interiors
        </div>
        <h1>
          {parts.length > 1 ? (
            <>
              {parts.slice(0, -1).join(" ")}
              <br />
              <em>{parts.at(-1)}</em>
            </>
          ) : (
            c.headline
          )}
        </h1>
        <button className="hero-cta" onClick={consult}>
          Book consultation
          <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="hero-baseline">
        <button className="scroll-cue" onClick={() => jump("ongoing-works")}>
          <ArrowDown size={16} /> Explore the work
        </button>
        <div className="slide-control" aria-label="Featured images">
          <span className="slide-label" aria-live="polite">
            {s.label}
          </span>
          <span className="slide-index">
            {String(idx + 1).padStart(2, "0")} <b>/</b>{" "}
            {String(n).padStart(2, "0")}
          </span>
          <button
            aria-label="Previous featured image"
            onClick={() => setSlide((idx + n - 1) % n)}
          >
            <ChevronLeft />
          </button>
          <button
            aria-label="Next featured image"
            onClick={() => setSlide((idx + 1) % n)}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
function ProjectCard({ p, count, liked, onLike, share, open }) {
  return (
    <article className="project">
      <button
        className="project-photo"
        aria-label={"Open " + p.name + " gallery"}
        style={{ aspectRatio: p.aspect }}
        onClick={open}
      >
        <img
          loading="lazy"
          src={asset(p.images[0].url)}
          alt={p.images[0].alt}
        />
      </button>
      <div className="project-info">
        <button className="project-title" onClick={open}>
          <span>{p.name}</span>
          <small>{p.type}</small>
        </button>
        <div className="project-actions">
          <button
            aria-label={(liked ? "Unlike " : "Like ") + p.name}
            aria-pressed={liked}
            onClick={onLike}
          >
            <Heart fill={liked ? "currentColor" : "none"} />
            <span>{count || 0}</span>
          </button>
          <button aria-label={"Share " + p.name} onClick={share}>
            <Share2 />
          </button>
          <button
            aria-label={"View " + p.images.length + " images of " + p.name}
            onClick={open}
          >
            <Layers />
            <span>{p.images.length}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
function Invitation({ consult }) {
  return (
    <aside className="invitation">
      <h3>A space of your own.</h3>
      <button onClick={consult}>
        Book consultation <ArrowUpRight size={16} />
      </button>
    </aside>
  );
}
function Masonry({ items, card }) {
  const [small, setSmall] = useState(matchMedia("(max-width: 640px)").matches);
  useEffect(() => {
    const m = matchMedia("(max-width: 640px)"),
      f = () => setSmall(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return (
    <div className="masonry">
      {small ? (
        <div>{items.map(card)}</div>
      ) : (
        [0, 1].map((i) => (
          <div key={i} className="masonry-col">
            {items.filter((_, j) => j % 2 === i).map(card)}
          </div>
        ))
      )}
    </div>
  );
}
function WorkSection({ status, projects, card }) {
  const gallery = projects.filter((p) => p.workStatus === status);
  const examples =
    gallery.length > 0 && gallery.every((p) => /\bconcept\b/i.test(p.type));
  const id = status.toLowerCase() + "-works";
  return (
    <section
      id={id}
      aria-labelledby={id + "-heading"}
      className="work page-pad"
    >
      <div className="section-top">
        <h2 id={id + "-heading"}>
          {status} <em>Works</em>
        </h2>
        {examples && <p>Concept galleries illustrating this section.</p>}
      </div>
      {gallery.length ? (
        <Masonry items={gallery} card={card} />
      ) : (
        <p className="work-empty">
          No {status.toLowerCase()} projects are featured yet.
        </p>
      )}
    </section>
  );
}

function Brands() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (portable) return;
    let current = true;
    api("brands")
      .then(async (candidates) => {
        const loaded = await Promise.all(
          candidates.map(async (item) => {
            const img = new Image();
            img.referrerPolicy = "no-referrer";
            img.src = item.url;
            try {
              await img.decode();
              return item;
            } catch {
              return null;
            }
          }),
        );
        if (current) setItems(loaded.filter(Boolean));
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, []);
  if (!items.length) return null;
  return (
    <section className="brands" aria-label="Materials and finishes">
      <span className="kicker">Material library</span>
      <div className="brand-rail">
        <div className="brand-track">
          {[...items, ...items, ...items, ...items].map(({ name, url }, i) => (
            <span key={i} aria-hidden={i >= items.length ? "true" : undefined}>
              <img src={url} referrerPolicy="no-referrer" alt={name} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
function Legal({ page, c, consult, preferences }) {
  if (page === "Contact")
    return (
      <>
        <h2>
          Contact <em>us.</em>
        </h2>
        <h3>{company}</h3>
        <LocationList c={c} />
        <SocialLinks c={c} />
        {c.address ? (
          <p>
            {c.address}
            {c.city ? " · " + c.city : ""}
          </p>
        ) : null}
        {c.email && (
          <p>
            <a href={"mailto:" + c.email}>{c.email}</a>
          </p>
        )}
        {c.phone && (
          <p>
            <a href={"tel:" + c.phone}>{c.phone}</a>
          </p>
        )}
        <button className="solid" onClick={consult}>
          Book consultation
        </button>
      </>
    );
  if (page === "Privacy")
    return (
      <>
        <h2>
          Privacy <em>policy.</em>
        </h2>
        <h3>Your enquiry</h3>
        <p>
          Discrete Art Studio LLP uses the contact details, city, project or
          partnership information, property size and scope you provide to
          respond to your enquiry and discuss your project. The website stores
          these details in the studio’s private enquiry dashboard.
        </p>
        <h3>Grid CRM</h3>
        <p>
          The Grid connection is deferred in this build. When enabled, eligible
          enquiries will also be sent to the studio’s Grid sales list for
          follow-up. Suspected spam is retained in the website dashboard for
          review.
        </p>
        <h3>Tracking choices</h3>
        <p>
          If the studio enables Meta Pixel and you accept tracking, the site can
          report a page view and an eligible, saved enquiry to Meta. Contact
          details and the text of your enquiry are excluded. Declining tracking
          or using an ad blocker can leave your enquiry unmeasured. You can
          still send the form.
        </p>
        <button className="text-link" onClick={preferences}>
          Change tracking choice
        </button>
        <h3>Access and requests</h3>
        <p>
          Use the contact page to ask about access, correction or deletion of
          information you have submitted. The site stores your tracking choice,
          display preferences and a random identifier for gallery likes on your
          device.
        </p>
      </>
    );
  return (
    <>
      <h2>
        Terms of <em>service.</em>
      </h2>
      <h3>Consultations and estimates</h3>
      <p>
        A website enquiry starts a design conversation. The project scope,
        deliverables, fees, payment schedule and timelines are agreed in a
        separate written proposal before work begins.
      </p>
      <h3>Design references</h3>
      <p>
        Concept images illustrate possible design directions. Material
        availability, site measurements, lighting and screen settings may affect
        the final appearance. Project drawings, specifications and finish
        samples are reviewed with the client.
      </p>
      <h3>Use of this site</h3>
      <p>
        Please provide accurate contact information and share only content you
        have permission to use. Images, logos and design materials belong to
        their respective owners. Contact the studio for permission before
        reproducing them.
      </p>
      <h3>Project agreements</h3>
      <p>
        Your signed project agreement sets the terms for changes, cancellations,
        purchasing and installation.
      </p>
    </>
  );
}
export function Website() {
  const [c, setC] = useState(initialContent),
    [path, setPath] = useState(route),
    [overlay, setOverlay] = useState(""),
    [enquiryKind, setEnquiryKind] = useState("project"),
    [notice, setNotice] = useState(""),
    [shareInfo, setShareInfo] = useState(null),
    [tracking, setTracking] = useState(consent),
    [counts, setCounts] = useState({}),
    [mine, setMine] = useState(portable ? getPrefs("offline-hearts", []) : []);
  const pending = useRef(new Set()),
    timer = useRef(null),
    albumRef = useRef(null);
  const selected = path.startsWith("/project/")
    ? c.projects.find((p) => p.id === path.slice(9))
    : null;
  const legal = {
    "/privacy": "Privacy",
    "/terms": "Terms",
    "/contact": "Contact",
  }[path];
  useEffect(() => {
    const r = () => setPath(route());
    window.addEventListener("popstate", r);
    if (!portable) {
      api("content")
        .then((data) => {
          setC(data);
          enablePixel(data.pixel);
        })
        .catch(() => {});
      api("hearts?device=" + device)
        .then((d) => {
          setCounts(d.counts);
          setMine(d.mine);
        })
        .catch(() => {});
    }
    return () => {
      window.removeEventListener("popstate", r);
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (selected) animateIn(albumRef.current);
    document.title =
      (selected?.name || legal || "Interior design") +
      " — Discrete Art Studio LLP";
  }, [selected, legal]);
  function toast(t) {
    setNotice(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(""), 2500);
  }
  const consult = () => {
    if (path !== "/") go("/");
    setOverlay("consult");
  };
  function section(id) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduced() ? "instant" : "smooth" });
  }
  async function like(id) {
    if (pending.current.has(id)) return;
    pending.current.add(id);
    const next = !mine.includes(id);
    try {
      const value = portable
        ? next
          ? 1
          : 0
        : (await api("hearts", { device, project: id, enabled: next })).count;
      setCounts((v) => ({ ...v, [id]: value }));
      setMine((v) => {
        const a = next ? [...new Set([...v, id])] : v.filter((x) => x !== id);
        if (portable) setPrefs("offline-hearts", a);
        return a;
      });
    } catch {
      toast("Could not update this like. Please try again.");
    } finally {
      pending.current.delete(id);
    }
  }
  async function share(p) {
    if (portable) {
      setShareInfo({ text: p.name + " — " + company, portable: true });
      return;
    }
    const url = location.origin + "/project/" + p.id;
    try {
      if (navigator.share) {
        await navigator.share({ title: p.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Gallery link copied.");
    } catch (e) {
      if (e.name !== "AbortError") setShareInfo({ text: url });
    }
  }
  function card(p) {
    return (
      <ProjectCard
        key={p.id}
        p={p}
        count={portable ? (mine.includes(p.id) ? 1 : 0) : counts[p.id]}
        liked={mine.includes(p.id)}
        onLike={() => like(p.id)}
        share={() => share(p)}
        open={() => go("/project/" + p.id)}
      />
    );
  }
  function contact(kind) {
    if (kind === "Book consultation") return consult();
    const number = kind === "Call" ? c.phone : c.whatsapp || c.phone;
    if (number) {
      if (kind === "Call") location.href = "tel:" + number;
      else
        window.open(
          "https://wa.me/" + number.replace(/\D/g, ""),
          "_blank",
          "noopener,noreferrer",
        );
    } else setOverlay(kind);
  }
  const prefs = () => {
    if (legal) go("/");
    setOverlay("tracking");
  };
  const closePage = () => go("/");
  return (
    <>
      <a className="skip" href="#ongoing-works">
        Skip to ongoing works
      </a>
      <Hero c={c} consult={consult} section={section} />
      <main>
        <Partners
          content={c}
          open={(p) => go("/project/" + p.id)}
          enquire={() => {
            setEnquiryKind("partner");
            section("contact");
          }}
        />
        <WorkSection status="Ongoing" projects={c.projects} card={card} />
        <Invitation consult={consult} />
        <WorkSection status="Completed" projects={c.projects} card={card} />
        <Brands />
        <ContactSection c={c} kind={enquiryKind} setKind={setEnquiryKind} />
      </main>
      <footer>
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            section("home");
          }}
        >
          <Wordmark />
        </a>
        <div>
          <button onClick={() => go("/contact")}>Contact us</button>
          <button onClick={() => go("/privacy")}>Privacy policy</button>
          <button onClick={() => go("/terms")}>Terms of service</button>
          <button onClick={prefs}>Tracking choices</button>
        </div>
        <SocialLinks c={c} />
        <small>
          © {new Date().getFullYear()} {company}
        </small>
      </footer>
      <nav className="dock" aria-label="Contact the studio">
        {[
          [MessageSquareText, "Book consultation"],
          [MessageCircle, "WhatsApp"],
          [Phone, "Call"],
        ].map(([Icon, s]) => (
          <button key={s} onClick={() => contact(s)}>
            <Icon size={16} />
            <span>{s}</span>
          </button>
        ))}
      </nav>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      {selected && (
        <Dialog wide kind="album" label={selected.name} onClose={closePage}>
          <div ref={albumRef}>
            <div className="album-top">
              <div className="kicker">
                <i />
                {selected.type}
              </div>
              <h2>{selected.name}</h2>
              <p>{selected.description}</p>
              {selected.partnerIds?.length > 0 && (
                <p className="project-credit">
                  Project partners ·{" "}
                  {c.partners
                    .filter((p) => selected.partnerIds.includes(p.id))
                    .map((p) => p.name)
                    .join(", ")}
                </p>
              )}
              <small>{selected.images.length} images</small>
            </div>
            {selected.images.map((im, i) => (
              <figure key={i}>
                <img
                  src={asset(im.url)}
                  alt={im.alt}
                  loading={i ? "lazy" : "eager"}
                />
                <figcaption>{im.alt}</figcaption>
              </figure>
            ))}
            <button className="solid" onClick={consult}>
              Book consultation <ArrowUpRight size={15} />
            </button>
          </div>
        </Dialog>
      )}
      {legal && (
        <Dialog label={legal} kind="legal" onClose={closePage}>
          <Legal page={legal} c={c} consult={consult} preferences={prefs} />
        </Dialog>
      )}
      {path !== "/" && !legal && !selected && (
        <Dialog label="Page unavailable" onClose={closePage}>
          <h2>Page unavailable.</h2>
          <p>This page could not be found.</p>
          <button className="solid" onClick={closePage}>
            Back to the studio
          </button>
        </Dialog>
      )}
      {overlay === "consult" && (
        <Consult email={c.email} onClose={() => setOverlay("")} />
      )}
      {["WhatsApp", "Call"].includes(overlay) && (
        <Dialog label={overlay} onClose={() => setOverlay("")}>
          <div className="kicker">
            <i /> Contact the studio
          </div>
          <h2>{overlay === "Call" ? "Call the studio." : "On WhatsApp."}</h2>
          <p>
            The studio’s {overlay === "Call" ? "phone" : "WhatsApp"} number is
            awaiting confirmation. You can use the consultation form to share
            your project details.
          </p>
          <button className="solid" onClick={consult}>
            Book consultation
          </button>
        </Dialog>
      )}
      {overlay === "tracking" && (
        <Dialog label="Tracking choices" onClose={() => setOverlay("")}>
          <h2>
            Tracking <em>choices.</em>
          </h2>
          <p>
            Optional Meta tracking helps the studio measure page views and saved
            enquiries. You can contact the studio with either choice.
          </p>
          <p>
            Current choice:{" "}
            <strong>
              {tracking === "yes"
                ? "Accepted"
                : tracking === "no"
                  ? "Declined"
                  : "No choice yet"}
            </strong>
          </p>
          <div className="choice-row">
            {[
              ["yes", "Accept tracking"],
              ["no", "Decline tracking"],
            ].map(([k, v]) => (
              <button
                key={k}
                className="outline"
                onClick={() => {
                  changeConsent(k, c.pixel);
                  setTracking(k);
                  setOverlay("");
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </Dialog>
      )}
      {c.pixel && tracking === "unset" && !overlay && !portable && (
        <div
          className="consent-bar"
          role="region"
          aria-label="Optional tracking"
        >
          <p>Allow optional Meta tracking for page views and enquiries?</p>
          {[
            ["yes", "Accept"],
            ["no", "Decline"],
          ].map(([k, v]) => (
            <button
              className="outline"
              key={k}
              onClick={() => {
                changeConsent(k, c.pixel);
                setTracking(k);
              }}
            >
              {v}
            </button>
          ))}
        </div>
      )}
      {shareInfo && (
        <Dialog label="Share gallery" onClose={() => setShareInfo(null)}>
          <h2>
            Share <em>gallery.</em>
          </h2>
          <p>
            {shareInfo.portable
              ? "Gallery links become available when the website has a web address. You can copy the project name below."
              : "Copy this direct link to the gallery."}
          </p>
          <input
            aria-label="Gallery to share"
            readOnly
            value={shareInfo.text}
            onFocus={(e) => e.target.select()}
          />
        </Dialog>
      )}
    </>
  );
}
