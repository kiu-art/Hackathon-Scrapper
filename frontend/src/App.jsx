import React, { useState, useEffect } from "react";
import { SignedIn, SignedOut, SignIn, useUser } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";

import { useAuthToken } from "./hooks/useAuthToken";
import { useUserStore } from "./store/useUserStore";
import { useHackathonStore } from "./store/useHackathonStore";

import { Layout } from "./components/layout/Layout";
import { MatchesPage } from "./pages/MatchesPage";
import { HackathonDetailPage } from "./pages/HackathonDetailPage";
import { ProfilePage } from "./pages/ProfilePage";

/**
 * MainAuthenticatedApp
 * Orchestrates navigation routing, token synchronization, and views
 * for authenticated candidates within the master ERP Layout.
 */
const MainAuthenticatedApp = () => {
  // Sync Clerk JWT session token with centralized Axios instance
  useAuthToken();

  const { isLoaded: isUserLoaded } = useUser();
  const { fetchProfile } = useUserStore();
  const {
    selectedHackathon,
    setSelectedHackathon,
    resetSelection,
  } = useHackathonStore();

  // Navigation states: 'matches' | 'profile'
  const [activeTab, setActiveTab] = useState("matches");
  // Sub-view mode for hackathons: 'list' | 'detail'
  const [hackathonViewMode, setHackathonViewMode] = useState("list");

  // Fetch candidate profile & vector telemetry upon authentication load
  useEffect(() => {
    if (isUserLoaded) {
      fetchProfile();
    }
  }, [isUserLoaded, fetchProfile]);

  // Tab switcher handler
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId !== "matches") {
      setHackathonViewMode("list");
    }
  };

  // Navigate to Hackathon Dossier & Pitch workstation
  const handleSelectHackathon = (hackathon) => {
    setSelectedHackathon(hackathon);
    setHackathonViewMode("detail");
  };

  // Return to Matchmaking Matrix list
  const handleBackToList = () => {
    resetSelection();
    setHackathonViewMode("list");
  };

  // Determine contextual breadcrumb title
  const contextualSubtitle =
    activeTab === "matches" && hackathonViewMode === "detail" && selectedHackathon
      ? selectedHackathon.title
      : null;

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      subTitle={contextualSubtitle}
    >
      {activeTab === "matches" && (
        <>
          {hackathonViewMode === "detail" && selectedHackathon ? (
            <HackathonDetailPage onBack={handleBackToList} />
          ) : (
            <MatchesPage
              onSelectHackathon={handleSelectHackathon}
              onNavigateToProfile={() => handleTabChange("profile")}
            />
          )}
        </>
      )}

      {activeTab === "profile" && <ProfilePage />}
    </Layout>
  );
};

/**
 * App Root Component
 * Handles Clerk authentication gating, dark-mode ERP toasts, and session state.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans antialiased selection:bg-zinc-800 selection:text-zinc-100">
      {/* Toast Notification Configuration */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "border border-zinc-800 bg-[#0c0c0e] text-zinc-200 font-mono text-xs rounded shadow-2xl",
          style: {
            background: "#0c0c0e",
            color: "#e4e4e7",
            borderColor: "#27272a",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#0c0c0e",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#0c0c0e",
            },
          },
        }}
      />

      {/* Authenticated Application */}
      <SignedIn>
        <MainAuthenticatedApp />
      </SignedIn>

      {/* Unauthenticated ERP Access Gate */}
      <SignedOut>
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#09090b]">
          <div className="w-full max-w-sm space-y-6 text-center">
            {/* System Identifier */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 border border-zinc-800 rounded px-3 py-1 bg-zinc-950 font-mono text-[11px] text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>SYS_PORTAL // 3072-VEC MATCHMAKING</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">
                Hackathon ERP Gateway
              </h1>
              <p className="text-xs text-zinc-500 font-mono">
                Resume Ingestion • Algorithmic Alignment • MVP Pitch Generation
              </p>
            </div>

            {/* Clerk Sign-In Form Container */}
            <div className="border border-zinc-800 rounded bg-[#0c0c0e] p-6 shadow-2xl flex justify-center">
              <SignIn
                routing="hash"
                appearance={{
                  elements: {
                    card: "bg-transparent shadow-none p-0 w-full",
                    headerTitle: "text-zinc-100 font-sans text-sm font-semibold",
                    headerSubtitle: "text-zinc-500 text-xs font-mono",
                    socialButtonsBlockButton:
                      "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white font-mono text-xs",
                    formButtonPrimary:
                      "bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold py-2",
                    formFieldInput:
                      "bg-zinc-950 border-zinc-800 text-zinc-200 placeholder-zinc-700 font-mono text-xs focus:border-zinc-600",
                    footerActionLink: "text-blue-400 hover:text-blue-300 text-xs font-mono",
                    identityPreviewText: "text-zinc-300 font-mono text-xs",
                    formFieldLabel: "text-zinc-400 font-mono text-[11px]",
                  },
                }}
              />
            </div>

            {/* Telemetry Footer */}
            <div className="font-mono text-[10px] text-zinc-600 flex justify-between px-2">
              <span>ENDPOINT: FASTAPI:8000</span>
              <span>INDEX: GEMINI-001</span>
            </div>
          </div>
        </div>
      </SignedOut>
    </div>
  );
}