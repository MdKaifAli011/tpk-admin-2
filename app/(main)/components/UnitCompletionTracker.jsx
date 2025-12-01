"use client";

import React, { useEffect, useState, useRef } from "react";
import CongratulationsModal from "./CongratulationsModal";
import {
  checkUnitCongratulationsShown,
  markUnitCongratulationsShown,
} from "@/lib/congratulations";

const UnitCompletionTracker = ({ unitId, unitName }) => {
  const [showModal, setShowModal] = useState(false);
  const [previousProgress, setPreviousProgress] = useState(null);
  const [congratulationsShown, setCongratulationsShown] = useState(false);
  const isInitializedRef = useRef(false);
  const isCheckingRef = useRef(false);

  // Reset initialization flag when unitId changes
  useEffect(() => {
    isInitializedRef.current = false;
    setPreviousProgress(null);
    setCongratulationsShown(false);
  }, [unitId]);

  useEffect(() => {
    if (!unitId) return;

    const storageKey = `unit-progress-${unitId}`;

    const checkProgress = async () => {
      try {
        // Check if student is authenticated
        const token = typeof window !== "undefined" ? localStorage.getItem("student_token") : null;
        let unitProgress = 0;

        if (token) {
          // Fetch from database
          try {
            const response = await fetch(`/api/student/progress?unitId=${unitId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data && data.data.length > 0) {
                const progressDoc = data.data[0];
                unitProgress = progressDoc.unitProgress || 0;
              }
            }
          } catch (error) {
            console.error("Error fetching progress from database:", error);
          }
        }

        // Fallback to localStorage if not authenticated
        if (unitProgress === 0 && typeof window !== "undefined") {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const data = JSON.parse(stored);
            
            // Check if unit progress is already calculated
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
          }
        }

        // On first check (initialization), set previousProgress to current progress
        // This prevents showing modal when visiting a page where unit is already completed
        // IMPORTANT: Once shown, NEVER show again, even on page reload or revisit
        if (!isInitializedRef.current && !isCheckingRef.current) {
          isCheckingRef.current = true;
          checkUnitCongratulationsShown(unitId).then((hasShown) => {
            setCongratulationsShown(hasShown);
            setPreviousProgress(unitProgress);
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
        const isNowCompleted = unitProgress === 100;

        // Show modal only if:
        // 1. Progress just reached exactly 100% (wasn't 100% before)
        // 2. We haven't shown the modal for this completion yet
        if (isNowCompleted && !wasCompleted && !congratulationsShown) {
          setShowModal(true);
          // Mark as shown in database
          markUnitCongratulationsShown(unitId).then((success) => {
            if (success) {
              setCongratulationsShown(true);
            }
          });
        }

        setPreviousProgress(unitProgress);
      } catch (error) {
        console.error("Error checking unit progress:", error);
      }
    };

    // Initial check (will set previousProgress but not show modal)
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
  }, [unitId, previousProgress, congratulationsShown]);

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

