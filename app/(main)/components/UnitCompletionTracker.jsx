"use client";

import React, { useEffect, useState } from "react";
import CongratulationsModal from "./CongratulationsModal";

const UnitCompletionTracker = ({ unitId, unitName }) => {
  const [showModal, setShowModal] = useState(false);
  const [previousProgress, setPreviousProgress] = useState(null);

  useEffect(() => {
    if (!unitId) return;

    const storageKey = `unit-progress-${unitId}`;
    const completionKey = `unit-completion-shown-${unitId}`;

    const checkProgress = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          
          // Check if unit progress is already calculated
          let unitProgress = 0;
          if (data._unitProgress !== undefined) {
            unitProgress = data._unitProgress;
          } else {
            // Calculate from chapters (fallback)
            const chapterKeys = Object.keys(data).filter(key => !key.startsWith('_'));
            if (chapterKeys.length > 0) {
              const totalProgress = chapterKeys.reduce((sum, key) => {
                return sum + (data[key]?.progress || 0);
              }, 0);
              unitProgress = Math.round(totalProgress / chapterKeys.length);
            }
          }

          // Check if we've already shown the modal for this completion
          const hasShownCompletion = localStorage.getItem(completionKey) === "true";
          const wasCompleted = previousProgress === 100;
          const isNowCompleted = unitProgress === 100;

          // Show modal only if:
          // 1. Progress just reached exactly 100% (wasn't 100% before)
          // 2. We haven't shown the modal for this completion yet
          if (isNowCompleted && !wasCompleted && !hasShownCompletion) {
            setShowModal(true);
            localStorage.setItem(completionKey, "true");
          } else if (unitProgress < 100) {
            // Reset completion flag if progress drops below 100%
            localStorage.removeItem(completionKey);
          }

          setPreviousProgress(unitProgress);
        } else {
          setPreviousProgress(0);
        }
      } catch (error) {
        console.error("Error checking unit progress:", error);
      }
    };

    // Initial check
    checkProgress();

    // Listen for storage events
    const handleStorageChange = (e) => {
      if (e.key === storageKey) {
        checkProgress();
      }
    };

    // Listen for custom progress-updated event
    const handleProgressUpdate = (event) => {
      // Check progress on any unit progress update (could be from chapters)
      checkProgress();
    };

    // Also listen for chapterProgressUpdate event
    const handleChapterProgressUpdate = () => {
      checkProgress();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("progress-updated", handleProgressUpdate);
    window.addEventListener("chapterProgressUpdate", handleChapterProgressUpdate);

    // Poll for changes as backup - reduced frequency to improve performance
    const interval = setInterval(checkProgress, 3000); // Increased from 1s to 3s

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("progress-updated", handleProgressUpdate);
      window.removeEventListener("chapterProgressUpdate", handleChapterProgressUpdate);
      clearInterval(interval);
    };
  }, [unitId, previousProgress]);

  return (
    <CongratulationsModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      unitName={unitName}
      type="unit"
    />
  );
};

export default UnitCompletionTracker;

