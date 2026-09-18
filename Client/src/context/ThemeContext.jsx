/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { nextQuickTheme, resolveInitialTheme } from "@/lib/theme";
import { browserStorage, readOptional, writeOptional } from '@/lib/preferences';

const ThemeContext = createContext(null);

const STORAGE_KEY = "arr-theme";

function resolveInitial() {
  if (typeof window === "undefined") return "dark";
  return resolveInitialTheme(
    readOptional(browserStorage(), STORAGE_KEY),
  );
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolveInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    writeOptional(browserStorage(), STORAGE_KEY, theme);
    const persist = () => writeOptional(browserStorage(), STORAGE_KEY, theme);
    window.addEventListener('privacy:changed', persist);
    return () => window.removeEventListener('privacy:changed', persist);
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((current) => nextQuickTheme(current)),
    []
  );

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, toggle]);
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
