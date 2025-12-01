"use client";

import React, { useEffect, useState, useRef } from "react";
import CongratulationsModal from "./CongratulationsModal";
import {
  checkSubjectCongratulationsShown,
  markSubjectCongratulationsShown,
} from "@/lib/congratulations";

const SubjectCompletionTracker = ({ subjectId, subjectName, unitIds = [] }) => {
  const [showModal, setShowModal] = useState(false);
  const [previousProgress, setPreviousProgress] = useState(null);
  const [congratulationsShown, setCongratulationsShown] = useState(false);
  const isInitializedRef = useRef(false);
  const isCheckingRef = useRef(false);

  // Reset initialization flag when subjectId or unitIds change
  useEffect(() => {
    isInitializedRef.current = false;
    setPreviousProgress(null);
    setCongratulationsShown(false);
  }, [subjectId, unitIds.length]);

  useEffect(() => {
    if (!subjectId || unitIds.length === 0) return;

    const checkProgress = async () => {
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

        // On first check (initialization), set previousProgress to current progress
        // This prevents showing modal when visiting a page where subject is already completed
        // IMPORTANT: Once shown, NEVER show again, even on page reload or revisit
        if (!isInitializedRef.current && !isCheckingRef.current) {
          isCheckingRef.current = true;
          checkSubjectCongratulationsShown(subjectId).then((hasShown) => {
            setCongratulationsShown(hasShown);
            setPreviousProgress(subjectProgress);
            isInitializedRef.current = true;
            // If already shown before, ensure modal is closed
            if (hasShown) {
              setShowModal(false);
            }
            isCheckingRef.current = false;
          });
          return; // Don't show modal on initial load
        }

        // Check if we've already shown the modal for this completion
        const wasCompleted = previousProgress === 100;
        const isNowCompleted = subjectProgress === 100;

        // Show modal only if:
        // 1. Progress just reached exactly 100% (wasn't 100% before)
        // 2. We haven't shown the modal for this completion yet
        if (isNowCompleted && !wasCompleted && !congratulationsShown) {
          setShowModal(true);
          // Mark as shown in database
          markSubjectCongratulationsShown(subjectId).then((success) => {
            if (success) {
              setCongratulationsShown(true);
            }
          });
        }

        setPreviousProgress(subjectProgress);
      } catch (error) {
        console.error("Error checking subject progress:", error);
        setPreviousProgress(0);
      }
    };

    // Initial check (will set previousProgress but not show modal)
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
  }, [subjectId, subjectName, unitIds, previousProgress, congratulationsShown]);

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

