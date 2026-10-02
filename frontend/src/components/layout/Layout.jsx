import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

/**
 * Layout
 * Master enterprise application shell orchestrating the persistent navigation rail,
 * system telemetry header, and the scrollable content canvas.
 *
 * @param {React.ReactNode} children - Active module or page view component
 * @param {string} activeTab - Currently active module key ('matches' | 'profile')
 * @param {Function} setActiveTab - Handler to update active module
 * @param {string} [subTitle] - Optional contextual breadcrumb for deep detail views
 */
export const Layout = ({
  children,
  activeTab = "matches",
  setActiveTab,
  subTitle,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-zinc-300 font-sans antialiased overflow-hidden select-none">
      {/* ERP Sidebar Navigation Rail */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace Stage */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top ERP Command Bar */}
        <Header
          activeTab={activeTab}
          subTitle={subTitle}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* Scrollable Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#09090b] select-text">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;