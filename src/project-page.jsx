import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { asset } from "./client.js";
import { Dialog } from "./dialog.jsx";
import { ProjectLink } from "./project-link.jsx";
import { StudioLogo } from "./studio-logo.jsx";

function ProjectGallery({ project }) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const touch = useRef(null);
  const total = project.images.length;
  const active = index % total;
  const photo = project.images[active];
  const multiple = total > 1;

  function step(by) {
    setIndex((previous) => (previous + by + total) % total);
  }
  function keydown(event) {
    if (!multiple || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      step(event.key === "ArrowRight" ? 1 : -1);
    }
  }
  const swipe = {
    onTouchStart(event) {
      const point = event.touches[0];
      touch.current =
        event.touches.length === 1 ? [point.clientX, point.clientY] : null;
    },
    onTouchCancel() {
      touch.current = null;
    },
    onTouchEnd(event) {
      const start = touch.current;
      touch.current = null;
      if (!start || !multiple) return;
      const dx = event.changedTouches[0].clientX - start[0];
      const dy = event.changedTouches[0].clientY - start[1];
      if (Math.abs(dx) > 45 && Math.abs(dx) > 1.5 * Math.abs(dy))
        step(dx < 0 ? 1 : -1);
    },
  };
  function controls() {
    return (
      <div className="photo-pager" aria-label="Gallery controls">
        {multiple && (
          <button
            type="button"
            aria-label="Previous photograph"
            onClick={() => step(-1)}
          >
            <ChevronLeft />
          </button>
        )}
        <span className="photo-count" aria-live="polite" aria-atomic="true">
          {active + 1} / {total}
        </span>
        {multiple && (
          <button
            type="button"
            aria-label="Next photograph"
            onClick={() => step(1)}
          >
            <ChevronRight />
          </button>
        )}
      </div>
    );
  }
  return (
    <section
      className="project-gallery"
      aria-label="Project photographs"
      onKeyDown={keydown}
    >
      <figure>
        <div className="photo-stage" {...swipe}>
          <img
            key={photo.url + active}
            src={asset(photo.url)}
            alt={photo.alt}
          />
          <button
            className="expand-photo"
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Enlarge photograph"
          >
            <Maximize2 size={20} />
          </button>
        </div>
        <figcaption className="photo-bar">
          <span>{photo.alt}</span>
          {controls()}
        </figcaption>
      </figure>
      {multiple && (
        <div
          className="photo-thumbnails"
          role="group"
          aria-label="Choose a photograph"
        >
          {project.images.map((im, i) => (
            <button
              type="button"
              key={i}
              aria-label={"Show photograph " + (i + 1) + ", " + im.alt}
              aria-pressed={active === i}
              onClick={() => setIndex(i)}
            >
              <img loading="lazy" src={asset(im.url)} alt="" />
            </button>
          ))}
        </div>
      )}
      {expanded && (
        <Dialog
          label={project.name + " enlarged photograph"}
          onClose={() => setExpanded(false)}
          wide
          kind="photo-lightbox"
        >
          <figure {...swipe}>
            <img
              key={photo.url + active}
              src={asset(photo.url)}
              alt={photo.alt}
            />
            <figcaption className="photo-bar">
              <span>{photo.alt}</span>
              {controls()}
            </figcaption>
          </figure>
        </Dialog>
      )}
    </section>
  );
}

export function ProjectPage({
  project,
  partners,
  next,
  browse,
  open,
  consult,
  home,
}) {
  const title = useRef(null);
  const credits = partners.filter((person) =>
    project.partnerIds.includes(person.id),
  );
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    title.current?.focus({ preventScroll: true });
  }, [project.id]);
  return (
    <>
      <header className="project-mast page-pad">
        <button aria-label="Discrete Art Studio home" onClick={home}>
          <StudioLogo />
        </button>
        <button className="text-link" onClick={browse}>
          <ArrowLeft size={16} /> Back to projects
        </button>
      </header>
      <main className="project-page page-pad">
        <header className="project-intro">
          <div>
            <div className="kicker">
              <i />
              {project.sector}
              {project.workStatus !== "Unassigned" &&
                " · " + project.workStatus}
            </div>
            <h1 tabIndex={-1} ref={title}>
              {project.name}
            </h1>
          </div>
          <div className="project-brief">
            <p className="project-kind">{project.type}</p>
            <p>{project.description}</p>
            {credits.length > 0 && (
              <p className="project-credit">
                Project partners · {credits.map((p) => p.name).join(", ")}
              </p>
            )}
          </div>
        </header>
        <ProjectGallery project={project} />
        <button className="solid project-consult" onClick={consult}>
          Book consultation <ArrowUpRight size={16} />
        </button>
        {next && (
          <ProjectLink className="next-project" project={next} open={open}>
            <img src={asset(next.images[0].url)} alt="" loading="lazy" />
            <span>
              <small>Next project</small>
              <strong>{next.name}</strong>
            </span>
            <ArrowRight aria-hidden="true" />
          </ProjectLink>
        )}
      </main>
    </>
  );
}
