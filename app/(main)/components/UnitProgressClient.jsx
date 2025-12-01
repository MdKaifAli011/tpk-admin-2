"use client";

import React, { useEffect, useState, useRef } from "react";
import CongratulationsModal from "./CongratulationsModal";

const UnitProgressClient = ({ unitId, unitName, initialProgress = 0 }) => {
  const [progress, setProgress] = useState(initialProgress);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const hasShownCongratulationsRef = useRef(false);
  const prevProgressRef = useRef(initialProgress);
  
  // Reset congratulations flag when unitId changes
  useEffect(() => {
    hasShownCongratulationsRef.current = false;
    prevProgressRef.current = initialProgress;
  }, [unitId, initialProgress]);

  useEffect(() => {
    // Check if student is authenticated
    const checkAuth = () => {
      if (typeof window === "undefined") return false;
      return !!localStorage.getItem("student_token");
    };

    const authStatus = checkAuth();
    setIsAuthenticated(authStatus);

    const storageKey = `unit-progress-${unitId}`;

    // Fetch progress from database if authenticated
    const fetchProgressFromDB = async () => {
      if (!authStatus) return null;

      try {
        const token = localStorage.getItem("student_token");
        if (!token) return null;

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
        console.error("Error fetching progress from database:", error);
      }
      return null;
    };

    // Calculate unit progress from chapters in localStorage (fallback)
    const calculateProgress = async () => {
      try {
        // Try to fetch from database first if authenticated
        if (authStatus) {
          const dbProgress = await fetchProgressFromDB();
          if (dbProgress !== null) {
            setProgress(dbProgress);
            // Check if unit just reached 100%
            if (dbProgress === 100 && prevProgressRef.current < 100 && !hasShownCongratulationsRef.current) {
              setShowCongratulations(true);
              hasShownCongratulationsRef.current = true;
            }
            prevProgressRef.current = dbProgress;
            return dbProgress;
          }
        }

        // Fallback to localStorage
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          
          // Check if unit progress is already calculated
          if (data._unitProgress !== undefined) {
            const newProgress = data._unitProgress;
            setProgress(newProgress);
            // Check if unit just reached 100%
            if (newProgress === 100 && prevProgressRef.current < 100 && !hasShownCongratulationsRef.current) {
              setShowCongratulations(true);
              hasShownCongratulationsRef.current = true;
            }
            prevProgressRef.current = newProgress;
            return newProgress;
          }
          
          // Calculate from chapters (fallback)
          const chapterKeys = Object.keys(data).filter(key => !key.startsWith('_'));
          if (chapterKeys.length > 0) {
            const totalProgress = chapterKeys.reduce((sum, key) => {
              return sum + (data[key]?.progress || 0);
            }, 0);
            const avgProgress = Math.round(totalProgress / chapterKeys.length);
            setProgress(avgProgress);
            // Check if unit just reached 100%
            if (avgProgress === 100 && prevProgressRef.current < 100 && !hasShownCongratulationsRef.current) {
              setShowCongratulations(true);
              hasShownCongratulationsRef.current = true;
            }
            prevProgressRef.current = avgProgress;
            return avgProgress;
          } else {
            setProgress(0);
            prevProgressRef.current = 0;
            return 0;
          }
        } else {
          setProgress(0);
          prevProgressRef.current = 0;
          return 0;
        }
      } catch (error) {
        console.error("Error reading progress:", error);
        setProgress(0);
        prevProgressRef.current = 0;
        return 0;
      }
    };

    // Check on mount
    calculateProgress();

    // Listen for custom progress-updated event
    const handleProgressUpdate = async (event) => {
      if (event.detail?.unitId === unitId) {
        const newProgress = event.detail.unitProgress;
        setProgress(newProgress);
        
        // Check if unit just reached 100%
        if (newProgress === 100 && prevProgressRef.current < 100 && !hasShownCongratulationsRef.current) {
          setShowCongratulations(true);
          hasShownCongratulationsRef.current = true;
        }
        prevProgressRef.current = newProgress;
      } else {
        // Also recalculate if event doesn't have unitId (might be from chapters)
        const newProgress = await calculateProgress();
        if (newProgress !== null) {
          // Check if unit just reached 100%
          if (newProgress === 100 && prevProgressRef.current < 100 && !hasShownCongratulationsRef.current) {
            setShowCongratulations(true);
            hasShownCongratulationsRef.current = true;
          }
          prevProgressRef.current = newProgress;
        }
      }
    };

    // Listen for chapterProgressUpdate event
    const handleChapterProgressUpdate = async () => {
      const newProgress = await calculateProgress();
      if (newProgress !== null) {
        // Check if unit just reached 100%
        if (newProgress === 100 && prevProgressRef.current < 100 && !hasShownCongratulationsRef.current) {
          setShowCongratulations(true);
          hasShownCongratulationsRef.current = true;
        }
        prevProgressRef.current = newProgress;
      }
    };

    // Listen for storage events (from other tabs/windows)
    const handleStorageChange = async (e) => {
      if (e.key === storageKey) {
        await calculateProgress();
      }
    };

    window.addEventListener("progress-updated", handleProgressUpdate);
    window.addEventListener("chapterProgressUpdate", handleChapterProgressUpdate);
    window.addEventListener("storage", handleStorageChange);

    // Poll for changes as backup (since storage event doesn't fire in same tab)
    // Poll more frequently if authenticated to get database updates
    const pollInterval = authStatus ? 2000 : 1000;
    const interval = setInterval(calculateProgress, pollInterval);

    return () => {
      window.removeEventListener("progress-updated", handleProgressUpdate);
      window.removeEventListener("chapterProgressUpdate", handleChapterProgressUpdate);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [unitId, isAuthenticated]);

  return (
    <>
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

      {/* Congratulations Modal for Unit Completion */}
      <CongratulationsModal
        isOpen={showCongratulations}
        onClose={() => setShowCongratulations(false)}
        unitName={unitName}
        type="unit"
      />
    </>
  );
};

export default UnitProgressClient;
