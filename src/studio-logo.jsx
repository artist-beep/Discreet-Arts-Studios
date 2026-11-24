import React from "react";
import { brandLogo } from "./content.js";
import { asset } from "./client.js";

export function StudioLogo() {
  return (
    <span className="studio-logo">
      <img src={asset(brandLogo)} width="500" height="500" alt="Discrete Arts" />
    </span>
  );
}
