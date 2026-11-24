import React from "react";
import { createRoot } from "react-dom/client";
import { Website } from "./website.jsx";
import { Admin } from "./admin.jsx";
import { launchHash, portable } from "./client.js";
import "./style.css";
createRoot(document.getElementById("root")).render(
  !portable && location.pathname.startsWith("/admin") ? (
    <Admin
      ticket={launchHash.startsWith("#ticket=") ? launchHash.slice(8) : ""}
    />
  ) : (
    <Website />
  ),
);
