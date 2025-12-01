"use client";

import React, { Suspense, useState, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";

const MainLayout = ({ children, showSidebar = true }) => {
  // Initialize sidebar as open on desktop, closed on mobile (only if showSidebar is true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (!showSidebar) return false;
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024; // lg breakpoint
    }
    return true; // Default to open for SSR
  });

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  /* -------------------------------------------------------
     Mobile Scroll Lock — Simplified + Reliable
     -------------------------------------------------------- */
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;

    if (isSidebarOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  // Keep sidebar open on desktop when window is resized (only if showSidebar is true)
  useEffect(() => {
    if (!showSidebar) return;

    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen, showSidebar]);

  return (
    <ErrorBoundary>
      <ServiceWorkerRegistration />
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* NAVBAR */}
        <Navbar onMenuToggle={toggleSidebar} isMenuOpen={isSidebarOpen} />

        <div className="flex flex-1 relative">
          {/* SIDEBAR (Premium 300px Glass UI) - Only show if showSidebar is true */}
          {showSidebar && (
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
          )}

          {/* OVERLAY (Mobile only) - Removed duplicate, handled in Sidebar */}

          {/* MAIN CONTENT */}
          <main
            className={`
              flex-1
              pt-[110px] md:pt-[120px]
              ${showSidebar ? "lg:ml-[300px]" : ""}
              bg-white
              overflow-y-auto
              min-h-0
              px-4 md:px-6 pb-6
              transition-all
              [&::-webkit-scrollbar]:hidden
              [-ms-overflow-style:none]
              [scrollbar-width:none]
            `}
          >
            <div className="w-full max-w-7xl mx-auto">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
                      <p className="text-gray-600 text-sm">Loading...</p>
                    </div>
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </main>
        </div>

        {/* FOOTER */}
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default MainLayout;
