"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui";

const STORAGE_KEY = "theme";

/**
 * Light/dark toggle for the design system's .dark token block. Dependency
 * free: persists to localStorage, falls back to the OS preference (the
 * flash-prevention script in the root layout applies the initial theme
 * before first paint).
 */
export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {/* Both icons render; CSS picks one — no hydration mismatch. */}
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
      {mounted ? null : null}
    </Button>
  );
}
