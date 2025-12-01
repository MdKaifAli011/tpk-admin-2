"use client";

import React, { useEffect, useState } from "react";

const SubjectProgressClient = ({ subjectId, unitIds = [], initialProgress = 0 }) => {
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    if (unitIds.length === 0) {
      setProgress(0);
      return;
    }

    // Calculate subject progress from all units
    // Method: Sum of all unit progress / Total number of units
    // Example: 4 units with progress [80%, 60%, 0%, 0%] = (80+60+0+0) / 4 = 35%
    // IMPORTANT: Includes ALL units (even those with 0% progress) for accurate calculation
    const calculateProgress = () => {
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
        setProgress(subjectProgress);
      } catch (error) {
        console.error("Error calculating subject progress:", error);
        setProgress(0);
      }
    };

    // Check on mount
    calculateProgress();

    // Listen for storage events (from other tabs/windows)
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('unit-progress-')) {
        calculateProgress();
      }
    };

    // Listen for custom progress-updated event
    const handleProgressUpdate = () => {
      calculateProgress();
    };

    // Also listen for chapterProgressUpdate event
    const handleChapterProgressUpdate = () => {
      calculateProgress();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("progress-updated", handleProgressUpdate);
    window.addEventListener("chapterProgressUpdate", handleChapterProgressUpdate);

    // Poll for changes as backup (since storage event doesn't fire in same tab)
    const interval = setInterval(calculateProgress, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("progress-updated", handleProgressUpdate);
      window.removeEventListener("chapterProgressUpdate", handleChapterProgressUpdate);
      clearInterval(interval);
    };
  }, [subjectId, unitIds]);

  return (
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
  );
};

export default SubjectProgressClient;

