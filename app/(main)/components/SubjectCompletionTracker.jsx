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
        let sumOfUnitProgress = 0;
        let validUnits = 0;

        unitIds.forEach((unitId) => {
          const storageKey = `unit-progress-${unitId}`;
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            try {
              const data = JSON.parse(stored);
              // Check if unit progress is already calculated
              if (data._unitProgress !== undefined) {
                sumOfUnitProgress += data._unitProgress;
                validUnits++;
              } else {
                // Calculate from chapters (fallback)
                const chapterKeys = Object.keys(data).filter(key => !key.startsWith('_'));
                if (chapterKeys.length > 0) {
                  const unitProgress = chapterKeys.reduce((sum, key) => {
                    return sum + (data[key]?.progress || 0);
                  }, 0);
                  const avgProgress = Math.round(unitProgress / chapterKeys.length);
                  sumOfUnitProgress += avgProgress;
                  validUnits++;
                }
              }
            } catch (error) {
              console.error(`Error parsing progress for unit ${unitId}:`, error);
            }
          }
        });

        if (validUnits > 0) {
          // Calculate: Sum of all unit progress / Total possible progress
          // Total possible = number of units × 100 (since each unit max is 100%)
          const totalPossibleProgress = validUnits * 100;
          const subjectProgress = Math.round((sumOfUnitProgress / totalPossibleProgress) * 100);

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
        } else {
          setPreviousProgress(0);
        }
      } catch (error) {
        console.error("Error checking subject progress:", error);
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

    // Poll for changes as backup
    const interval = setInterval(checkProgress, 1000);

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
      chapterName={subjectName ? `Subject: ${subjectName}` : "this subject"}
    />
  );
};

export default SubjectCompletionTracker;

