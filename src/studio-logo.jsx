import React from "react";
import { brandLogo } from "./content.js";
import { asset } from "./client.js";

export function StudioLogo({ whiteLettering = false }) {
  const src = asset(brandLogo);
  return (
    <span
      className={whiteLettering ? "studio-logo white-lettering" : "studio-logo"}
    >
      <img src={src} width="500" height="500" alt="Discrete Arts" />
      {whiteLettering && (
        <img
          src={src}
          width="500"
          height="500"
          className="logo-letters"
          alt=""
          aria-hidden="true"
        />
      )}
    </span>
  );
}
