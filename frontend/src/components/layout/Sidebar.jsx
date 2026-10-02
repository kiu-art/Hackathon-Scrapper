import React from "react";
import { SignOutButton, useUser } from "@clerk/clerk-react";

/**
 * Sidebar
 * Persistent ERP navigation rail containing module routing,
 * microservice environment indicators, and session termination controls.
 *
 * @param {string} activeTab - Identifier of the active view ('matches' | 'profile')
 * @param {Function} setActiveTab - Navigation switch callback
 * @param {boolean} [isOpen=true] - Mobile overlay visibility state
 * @param {Function} [onClose] - Callback to dismiss sidebar on mobile
 */
export const Sidebar = ({
  activeTab = "matches",
  setActiveTab,
  isOpen = true,
  onClose,
}) => {
  const { user } = useUser();

  const navigationModules = [
    {
      id: "matches",
      label: "MATCHMAKING",
      code: "MOD-01",
      description: "Ranked hackathons & gap analysis",
    },
    {
      id: "profile",
      label: "CANDIDATE & VECTOR",
      code: "MOD-02",
      description: "Profile metadata & resume sync",
    },
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-60 flex-shrink-0 bg-[#0c0c0e] border-r border-zinc-800 flex flex-col justify-between select-none transition-transform duration-200 ease-in-out font-mono ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Branding & Module Directory */}
        <div className="flex flex-col">
          {/* Workspace Title Bar */}
          <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950/70">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-zinc-100 tracking-wider">
                HACK.MATCH // ERP
              </span>
            </div>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="md:hidden text-zinc-500 hover:text-zinc-200 text-xs px-1"
                aria-label="Close navigation"
              >
                ✕
              </button>
            )}
          </div>

          {/* Module Section Label */}
          <div className="px-4 pt-4 pb-2">
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold block">
              Core Modules
            </span>
          </div>

          {/* Module Links */}
          <nav className="px-2 space-y-1">
            {navigationModules.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full text-left p-2.5 rounded transition-colors group relative border ${
                    isActive
                      ? "bg-zinc-900/90 border-zinc-700/80 text-zinc-100"
                      : "border-transparent text-zinc-400 hover:bg-zinc-950 hover:text-zinc-200 hover:border-zinc-800/60"
                  }`}
                >
                  {/* Left Active Accent Indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-blue-500 rounded-r" />
                  )}

                  <div className="flex items-center justify-between pl-1">
                    <span className="text-xs font-semibold tracking-wide">
                      {item.label}
                    </span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                        isActive
                          ? "bg-blue-950 text-blue-400 border border-blue-900/40"
                          : "text-zinc-600 group-hover:text-zinc-500"
                      }`}
                    >
                      {item.code}
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-500 font-sans mt-0.5 pl-1 truncate">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Diagnostic Cluster & Session Termination */}
        <div className="border-t border-zinc-800 bg-zinc-950/60 flex flex-col">
          {/* Microservice Diagnostics Readout */}
          <div className="p-3 border-b border-zinc-800/80 space-y-1.5 text-[10px] text-zinc-500">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 uppercase">CLUSTER:</span>
              <span className="text-zinc-400 font-medium">AP-SOUTH-1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 uppercase">VECTOR ENGINE:</span>
              <span className="text-emerald-400 font-medium">GEMINI-3072</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 uppercase">SYNC CRON:</span>
              <span className="text-zinc-400 font-medium">00:00 DAILY</span>
            </div>
          </div>

          {/* User Session Strip */}
          <div className="p-3 flex items-center justify-between gap-2">
            <div className="flex flex-col truncate min-w-0 font-sans">
              <span className="text-[11px] text-zinc-200 font-medium truncate">
                {user?.fullName || user?.firstName || "Candidate"}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 truncate">
                {user?.primaryEmailAddress?.emailAddress || "SESSION_ACTIVE"}
              </span>
            </div>

            <SignOutButton>
              <button
                type="button"
                className="text-[10px] font-mono px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-900/50 rounded transition-colors"
                title="Terminate Session"
              >
                EXIT
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;