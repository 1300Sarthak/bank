"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">V</div>
        <div className="logo-text">Vertex</div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Overview</div>
        <Link
          href="/dashboard"
          className={`sidebar-item ${isActive("/dashboard") && !pathname.startsWith("/dashboard/") ? "active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Portfolio
        </Link>
        <Link
          href="/dashboard/allocation"
          className={`sidebar-item ${isActive("/dashboard/allocation") ? "active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 10 10h-10z" />
          </svg>
          Allocation
        </Link>
        <Link
          href="/dashboard/watchlist"
          className={`sidebar-item ${isActive("/dashboard/watchlist") ? "active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5l1.5 3.1 3.4.5-2.5 2.4.6 3.4L12 13l-3 1.4.6-3.4L7.1 8.6l3.4-.5z" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          Watchlist
        </Link>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Spending</div>
        <Link
          href="/dashboard/spending"
          className={`sidebar-item ${isActive("/dashboard/spending") ? "active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          Spending
          <span
            style={{
              marginLeft: "auto",
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--accent)",
              background: "var(--accent-muted)",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            Soon
          </span>
        </Link>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Tools</div>
        <Link
          href="/dashboard/ai"
          className={`sidebar-item ${isActive("/dashboard/ai") ? "active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          AI Assistant
        </Link>
      </div>

      <div className="sidebar-spacer" />
      <div className="sidebar-bottom">
        <ThemeToggle />
      </div>
    </nav>
  );
}
