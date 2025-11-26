"use client";

import React, { useEffect, useState } from "react";

const UnitProgressClient = ({ unitId, initialProgress = 0 }) => {
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    const storageKey = `unit-progress-${unitId}`;

    // Calculate unit progress from chapters in localStorage
    const calculateProgress = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          
          // Check if unit progress is already calculated
          if (data._unitProgress !== undefined) {
            setProgress(data._unitProgress);
            return;
          }
          
          // Calculate from chapters (fallback)
          const chapterKeys = Object.keys(data).filter(key => !key.startsWith('_'));
          if (chapterKeys.length > 0) {
            const totalProgress = chapterKeys.reduce((sum, key) => {
              return sum + (data[key]?.progress || 0);
            }, 0);
            const avgProgress = Math.round(totalProgress / chapterKeys.length);
            setProgress(avgProgress);
          } else {
            setProgress(0);
          }
        } else {
          setProgress(0);
        }
      } catch (error) {
        console.error("Error reading progress:", error);
        setProgress(0);
      }
    };

    // Check on mount
    calculateProgress();

    // Listen for custom progress-updated event
    const handleProgressUpdate = (event) => {
      if (event.detail.unitId === unitId) {
        setProgress(event.detail.unitProgress);
      }
    };

    // Listen for storage events (from other tabs/windows)
    const handleStorageChange = (e) => {
      if (e.key === storageKey) {
        calculateProgress();
      }
    };

    window.addEventListener("progress-updated", handleProgressUpdate);
    window.addEventListener("storage", handleStorageChange);

    // Poll for changes as backup (since storage event doesn't fire in same tab)
    const interval = setInterval(calculateProgress, 1000);

    return () => {
      window.removeEventListener("progress-updated", handleProgressUpdate);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [unitId]);

  return (
    <div className="text-right">
      <p className="text-xs text-gray-500 mb-1.5">Unit Progress</p>
      <div className="flex items-center gap-2.5">
        <span className="font-semibold text-sm text-gray-700">{progress}%</span>
        <div className="w-24 sm:w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
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

export default UnitProgressClient;

