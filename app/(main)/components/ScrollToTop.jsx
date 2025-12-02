"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * ScrollToTop Component
 * Automatically scrolls to top of page when route changes
 * Handles both window scroll and main content area scroll
 */
const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Scroll window to top
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });

      // Also scroll main content area if it exists
      const mainElement = document.querySelector("main");
      if (mainElement) {
        mainElement.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant",
        });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;

