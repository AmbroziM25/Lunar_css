"use client";

import { useEffect } from "react";
import { initTheme, initMoonPhase, initMoonbeam } from "lunara-css/theme";

/**
 * Wires up Lunara's optional JS helpers once for the whole site:
 * saved-theme restore, lunar-reactive glow (data-moon-phase), and
 * cursor-tracking .moonbeam glow.
 */
export default function LunaraInit() {
  useEffect(() => {
    initTheme();
    initMoonPhase();
    return initMoonbeam();
  }, []);
  return null;
}
