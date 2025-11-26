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
    // Method: Sum of all unit progress / Total possible progress (number of units × 100)
    // Example: 4 units, each at 90% = (90+90+90+90) / (4×100) = 360/400 = 90%
    const calculateProgress = () => {
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
          setProgress(subjectProgress);
        } else {
          setProgress(0);
        }
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

