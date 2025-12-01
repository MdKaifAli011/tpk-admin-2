"use client";

import { useEffect } from "react";
import { logger } from "@/utils/logger";

/**
 * Client component to track student visits to chapters, topics, subtopics, and definitions
 * Automatically tracks visits when students view content pages
 */
const ProgressTracker = ({
  unitId,
  chapterId,
  itemType, // "chapter", "topic", "subtopic", or "definition"
  itemId,
}) => {
  useEffect(() => {
    // Only track if all required props are provided
    // For chapter visits, itemId is the chapterId itself
    if (!unitId || !chapterId || !itemType) {
      return;
    }
    
    // For chapter visits, itemId is optional (use chapterId)
    const finalItemId = itemId || chapterId;

    // Check if student is authenticated
    const token = localStorage.getItem("student_token");
    if (!token) {
      // Not authenticated, skip tracking
      return;
    }

    // Track visit
    const trackVisit = async () => {
      try {
        const response = await fetch("/api/student/progress/track-visit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            unitId,
            chapterId,
            itemType,
            itemId: finalItemId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Dispatch event to update progress UI
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("progress-updated", {
                  detail: {
                    unitId,
                    chapterId,
                    unitProgress: data.data?.unitProgress || 0,
                    chapterProgress: data.data?.chapterProgress || 0,
                  },
                })
              );
              window.dispatchEvent(new CustomEvent("chapterProgressUpdate"));
            }
          } else {
            // Log the error message from the API
            logger.warn("Failed to track visit:", data.message || "Unknown error");
          }
        } else {
          // Try to get error details from response
          let errorMessage = "Failed to track visit";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            errorMessage = `Failed to track visit: ${response.status} ${response.statusText}`;
          }
          logger.warn(errorMessage);
        }
      } catch (error) {
        logger.error("Error tracking visit:", error);
      }
    };

    // Debounce tracking to avoid multiple calls
    const timeoutId = setTimeout(trackVisit, 1000);

    return () => clearTimeout(timeoutId);
  }, [unitId, chapterId, itemType, itemId]);

  return null; // This component doesn't render anything
};

export default ProgressTracker;

