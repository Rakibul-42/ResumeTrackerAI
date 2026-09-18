import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar, MobileNavigation } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "./CommandPalette";

export function AppShell() {
  const location = useLocation();
  const [paletteLocation, setPaletteLocation] = useState(null);
  const paletteOpen = paletteLocation === location.key;

  const openPalette = useCallback(
    () => setPaletteLocation(location.key),
    [location.key]
  );
  const closePalette = useCallback(() => setPaletteLocation(null), []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.key]);

  useEffect(() => {
    function onKey(e) {
      const isK = e.key === "k" || e.key === "K";
      if (isK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteLocation((current) =>
          current === location.key ? null : location.key
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [location.key]);

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Sidebar />
      <div className="min-w-0 flex-1 px-4 sm:px-6 md:px-8 py-6 max-w-[1600px] mx-auto w-full">
        <Topbar onOpenPalette={openPalette} />
        <MobileNavigation />
        <main id="main-content" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </div>
  );
}
