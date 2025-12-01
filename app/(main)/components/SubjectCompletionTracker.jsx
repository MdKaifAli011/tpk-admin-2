"use client";

import React, { useEffect, useState } from "react";
import CongratulationsModal from "./CongratulationsModal";

const SubjectCompletionTracker = ({ subjectId, subjectName, unitIds = [] }) => {
  const [showModal, setShowModal] = useState(false);
  const [previousProgress, setPreviousProgress] = useState(null);

  useEffect(() => {
    if (!subjectId || unitIds.length === 0) return;

    const completionKey = `subject-completion-shown-${subjectId}`;

    const checkProgress = () => {
      try {
        // Loop through ALL units and get their progress (0 if not found)
        const totalUnitProgress = unitIds.reduce((sum, unitId) => {
          const storageKey = `unit-progress-${unitId}`;
          const stored = localStorage.getItem(storageKey);
          
          if (stored) {
            try {
              const data = JSON.parse(stored);
              // Check if unit progress is already calculated
              if (data._unitProgress !== undefined) {
                return sum + data._unitProgress;
              } else {
                // Calculate from chapters (fallback)
                const chapterKeys = Object.keys(data).filter(key => !key.startsWith('_'));
                if (chapterKeys.length > 0) {
                  const unitProgress = chapterKeys.reduce((sum, key) => {
                    return sum + (data[key]?.progress || 0);
                  }, 0);
                  const avgProgress = Math.round(unitProgress / chapterKeys.length);
                  return sum + avgProgress;
                }
              }
            } catch (error) {
              console.error(`Error parsing progress for unit ${unitId}:`, error);
            }
          }
          // Return 0 for units without progress data
          return sum;
        }, 0);

        // Calculate: Sum of all unit progress / Total number of units
        // This ensures ALL units are included in the calculation (even with 0% progress)
        const subjectProgress = Math.round(totalUnitProgress / unitIds.length);

        // Check if we've already shown the modal for this completion
        const hasShownCompletion = localStorage.getItem(completionKey) === "true";
        const wasCompleted = previousProgress === 100;
        const isNowCompleted = subjectProgress === 100;

        // Show modal only if:
        // 1. Progress just reached exactly 100% (wasn't 100% before)
        // 2. We haven't shown the modal for this completion yet
        if (isNowCompleted && !wasCompleted && !hasShownCompletion) {
          setShowModal(true);
          localStorage.setItem(completionKey, "true");
        } else if (subjectProgress < 100) {
          // Reset completion flag if progress drops below 100%
          localStorage.removeItem(completionKey);
        }

        setPreviousProgress(subjectProgress);
      } catch (error) {
        console.error("Error checking subject progress:", error);
        setPreviousProgress(0);
      }
    };

    // Initial check
    checkProgress();

    // Listen for storage events
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('unit-progress-')) {
        checkProgress();
      }
    };

    // Listen for custom progress-updated event
    const handleProgressUpdate = () => {
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
  }, [subjectId, subjectName, unitIds, previousProgress]);

  return (
    <CongratulationsModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      subjectName={subjectName}
      type="subject"
    />
  );
};

export default SubjectCompletionTracker;

