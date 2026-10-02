import React from "react";
import { UserButton, useUser } from "@clerk/clerk-react";

/**
 * Header
 * Top ERP command bar displaying workspace breadcrumbs, live microservice
 * telemetry status, and authenticated session controls.
 *
 * @param {string} [activeTab="matches"] - Currently selected view/module identifier
 * @param {string} [subTitle] - Optional contextual breadcrumb (e.g., active hackathon title)
 * @param {Function} [onToggleSidebar] - Optional handler for sidebar toggle on smaller viewports
 */
export const Header = ({ activeTab = "matches", subTitle, onToggleSidebar }) => {
  const { user } = useUser();

  const formatModuleName = (tab) => {
    switch (tab) {
      case "matches":
        return "MATCHMAKING MATRIX";
      case "profile":
        return "VECTOR & CANDIDATE REGISTRY";
      case "hackathons":
        return "HACKATHON DOSSIERS";
      default:
        return String(tab).toUpperCase();
    }
  };

  return (
    <header className="h-12 border-b border-zinc-800 bg-[#0c0c0e] px-5 flex items-center justify-between text-xs font-mono select-none flex-shrink-0 z-20">
      {/* Left: Navigation Breadcrumb & Node Info */}
      <div className="flex items-center gap-2.5 text-zinc-400 truncate">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-1 text-zinc-400 hover:text-zinc-200 focus:outline-none"
            aria-label="Toggle navigation"
          >
            ☰
          </button>
        )}

        <div className="flex items-center gap-1.5 text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="tracking-wider">SYS_ROOT</span>
        </div>

        <span className="text-zinc-700">/</span>

        <span className="text-zinc-200 font-medium tracking-tight">
          {formatModuleName(activeTab)}
        </span>

        {subTitle && (
          <>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400 truncate max-w-[200px] sm:max-w-xs">
              {subTitle}
            </span>
          </>
        )}
      </div>

      {/* Right: Engine Telemetry & Auth Controls */}
      <div className="flex items-center gap-4 text-[11px]">
        {/* Telemetry Indicator: AI Engine */}
        <div className="hidden sm:flex items-center gap-2 border border-zinc-800/80 rounded px-2.5 py-1 bg-zinc-950/60">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-400">FASTAPI:8000</span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-500">3072-VEC</span>
        </div>

        {/* User Profile Pill / Clerk Button */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800">
          <div className="hidden md:flex flex-col text-right leading-none">
            <span className="text-zinc-200 text-[11px] font-sans font-medium">
              {user?.fullName || user?.firstName || "Candidate"}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "AUTH_OK"}
            </span>
          </div>

          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-7 h-7 rounded border border-zinc-700/80",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;