"use client";

import React, { useEffect, useState, useRef } from "react";
import CongratulationsModal from "./CongratulationsModal";

const SubjectProgressClient = ({ subjectId, subjectName, unitIds = [], initialProgress = 0 }) => {
  const [progress, setProgress] = useState(initialProgress);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const hasShownCongratulationsRef = useRef(false);
  const prevProgressRef = useRef(initialProgress);
  
  // Reset congratulations flag when subjectId changes
  useEffect(() => {
    hasShownCongratulationsRef.current = false;
    prevProgressRef.current = initialProgress;
  }, [subjectId, initialProgress]);

  useEffect(() => {
    if (unitIds.length === 0) {
      setProgress(0);
      return;
    }

    // Check if student is authenticated
    const checkAuth = () => {
      if (typeof window === "undefined") return false;
      return !!localStorage.getItem("student_token");
    };

    const authStatus = checkAuth();
    setIsAuthenticated(authStatus);

    // Fetch progress from database if authenticated
    const fetchProgressFromDB = async () => {
      if (!authStatus) return null;

      try {
        const token = localStorage.getItem("student_token");
        if (!token) return null;

        // Fetch progress for all units
        const unitProgressPromises = unitIds.map(async (unitId) => {
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
                return progressDoc.unitProgress || 0;
              }
            }
          } catch (error) {
            console.error(`Error fetching progress for unit ${unitId}:`, error);
          }
          return 0;
        });

        const unitProgresses = await Promise.all(unitProgressPromises);
        const totalProgress = unitProgresses.reduce((sum, p) => sum + p, 0);
        return Math.round(totalProgress / unitIds.length);
      } catch (error) {
        console.error("Error fetching progress from database:", error);
      }
      return null;
    };

    // Calculate subject progress from all units
    // Method: Sum of all unit progress / Total number of units
    // Example: 4 units with progress [80%, 60%, 0%, 0%] = (80+60+0+0) / 4 = 35%
    // IMPORTANT: Includes ALL units (even those with 0% progress) for accurate calculation
    const calculateProgress = async () => {
      try {
        // Try to fetch from database first if authenticated
        if (authStatus) {
          const dbProgress = await fetchProgressFromDB();
          if (dbProgress !== null) {
            setProgress(dbProgress);
            // Check if subject just reached 100%
            if (dbProgress === 100 && prevProgressRef.current < 100 && !hasShownCongratulationsRef.current) {
              setShowCongratulations(true);
              hasShownCongratulationsRef.current = true;
            }
            prevProgressRef.current = dbProgress;
            return;
          }
        }

        // Fallback to localStorage
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
        // Check if subject just reached 100% before updating state
        if (subjectProgress === 100 && prevProgressRef.current < 100 && !hasShownCongratulationsRef.current) {
          setShowCongratulations(true);
          hasShownCongratulationsRef.current = true;
        }
        setProgress(subjectProgress);
        prevProgressRef.current = subjectProgress;
      } catch (error) {
        console.error("Error calculating subject progress:", error);
        setProgress(0);
      }
    };

    // Check on mount
    calculateProgress();

    // Listen for storage events (from other tabs/windows)
    const handleStorageChange = async (e) => {
      if (e.key && e.key.startsWith('unit-progress-')) {
        await calculateProgress();
      }
    };

    // Listen for custom progress-updated event
    const handleProgressUpdate = async () => {
      await calculateProgress();
    };

    // Also listen for chapterProgressUpdate event
    const handleChapterProgressUpdate = async () => {
      await calculateProgress();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("progress-updated", handleProgressUpdate);
    window.addEventListener("chapterProgressUpdate", handleChapterProgressUpdate);

    // Poll for changes as backup (since storage event doesn't fire in same tab)
    // Poll more frequently if authenticated to get database updates
    const pollInterval = authStatus ? 2000 : 1000;
    const interval = setInterval(calculateProgress, pollInterval);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("progress-updated", handleProgressUpdate);
      window.removeEventListener("chapterProgressUpdate", handleChapterProgressUpdate);
      clearInterval(interval);
    };
  }, [subjectId, unitIds, isAuthenticated]);

  return (
    <>
      <div className="w-full md:w-auto text-left md:text-right">
        <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wide">
          Subject Progress
        </p>
        <div className="flex items-center gap-2.5 md:justify-end">
          <span className="font-semibold text-sm text-gray-700">{progress}%</span>
          <div className="w-full max-w-[140px] sm:max-w-[160px] h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progress >= 100
                  ? "bg-emerald-500"
                  : progress >= 50
                  ? "bg-emerald-400"
                  : "bg-emerald-300"
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Congratulations Modal for Subject Completion */}
      <CongratulationsModal
        isOpen={showCongratulations}
        onClose={() => setShowCongratulations(false)}
        subjectName={subjectName}
        type="subject"
      />
    </>
  );
};

export default SubjectProgressClient;
