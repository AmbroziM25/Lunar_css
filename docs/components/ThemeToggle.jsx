"use client";

import { useState } from "react";
import { toggleTheme } from "lunara-css/theme";

export default function ThemeToggle() {
  const [, rerender] = useState(0);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      aria-label="Toggle light/dark theme"
      onClick={() => {
        toggleTheme();
        rerender((n) => n + 1);
      }}
    >
      ☾ / ☀
    </button>
  );
}
