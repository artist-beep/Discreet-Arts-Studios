import React from "react";
import { renderToString } from "react-dom/server";
import { Website } from "./website.jsx";
export function previewHtml() {
  return renderToString(<Website />);
}
