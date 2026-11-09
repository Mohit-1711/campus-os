import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ResourcesProvider } from "../../context/ResourcesContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";

/** The logged-in shell: sidebar + topbar around whichever page is active. */
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // The assistant fills the whole area (it scrolls internally); other pages scroll normally.
  const isFlush = pathname.startsWith("/assistant");

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <ResourcesProvider>
      <div className="app-shell">
        <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />

        {menuOpen && <div className="app-shell__scrim" onClick={() => setMenuOpen(false)} />}

        <div className="app-shell__main">
          <Topbar onMenuClick={() => setMenuOpen(true)} />
          <main className={`content ${isFlush ? "content--flush" : ""}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </ResourcesProvider>
  );
}
