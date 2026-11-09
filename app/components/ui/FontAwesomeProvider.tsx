"use client";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

// Prevent Font Awesome from adding its CSS automatically since we're importing it above
config.autoAddCss = false;

export function FontAwesomeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}