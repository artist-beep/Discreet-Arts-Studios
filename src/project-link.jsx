import React from "react";
import { portable } from "./client.js";

export function ProjectLink({ project, open, children, ...props }) {
  const path = "/project/" + project.id;
  return (
    <a
      {...props}
      href={portable ? "#view=" + encodeURIComponent(path) : path}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        open(project);
      }}
    >
      {children}
    </a>
  );
}
