"use client";

import React, { useEffect, useState, useRef } from "react";
import CongratulationsModal from "./CongratulationsModal";
import { logger } from "@/utils/logger";
import {
  checkUnitCongratulationsShown,
  markUnitCongratulationsShown,
} from "@/lib/congratulations";

const UnitProgressClient = ({ unitId, unitName, initialProgress = 0 }) => {
  const [progress, setProgress] = useState(initialProgress);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [congratulationsShown, setCongratulationsShown] = useState(false);
  const prevProgressRef = useRef(initialProgress);
  const isInitializedRef = useRef(false);
  const isCheckingRef = useRef(false);
  
  // Reset initialization flag when unitId changes
  useEffect(() => {
    isInitializedRef.current = false;
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
        logger.error("Error fetching progress from database:", error);
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
            
            // On first check (initialization), set prevProgress to current progress
            // This prevents showing modal when visiting a page where unit is already completed
            // IMPORTANT: Once shown, NEVER show again, even on page reload or revisit
            if (!isInitializedRef.current && !isCheckingRef.current) {
              isCheckingRef.current = true;
              checkUnitCongratulationsShown(unitId).then((hasShown) => {
                setCongratulationsShown(hasShown);
                prevProgressRef.current = dbProgress;
                isInitializedRef.current = true;
                // If already shown before, ensure modal is closed
                if (hasShown) {
                  setShowCongratulations(false);
                }
                isCheckingRef.current = false;
              });
              return dbProgress; // Don't show modal on initial load
            }
            
            // CRITICAL: Only check for modal if initialization is complete
            // This prevents race condition where modal shows before async check completes
            if (!isInitializedRef.current) {
              return dbProgress; // Don't check for modal until initialization is done
            }

            // Check if we've already shown congratulations for this completion
            const wasCompleted = prevProgressRef.current === 100;
            const isNowCompleted = dbProgress === 100;
            
            // Show congratulations only if:
            // 1. Progress just reached exactly 100% (wasn't 100% before)
            // 2. We haven't shown the modal for this completion yet
            // 3. Initialization is complete (prevents showing on page visit)
            if (isNowCompleted && !wasCompleted && !congratulationsShown && isInitializedRef.current) {
              setShowCongratulations(true);
              // Mark as shown in database
              markUnitCongratulationsShown(unitId).then((success) => {
                if (success) {
                  setCongratulationsShown(true);
                }
              });
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
            
            // On first check (initialization), set prevProgress to current progress
            // IMPORTANT: Once shown, NEVER show again, even on page reload or revisit
            if (!isInitializedRef.current && !isCheckingRef.current) {
              isCheckingRef.current = true;
              checkUnitCongratulationsShown(unitId).then((hasShown) => {
                setCongratulationsShown(hasShown);
                prevProgressRef.current = newProgress;
                isInitializedRef.current = true;
                // If already shown before, ensure modal is closed
                if (hasShown) {
                  setShowCongratulations(false);
                }
                isCheckingRef.current = false;
              });
              return newProgress; // Don't show modal on initial load
            }
            
            // CRITICAL: Only check for modal if initialization is complete
            if (!isInitializedRef.current) {
              return newProgress; // Don't check for modal until initialization is done
            }

            // Check if we've already shown congratulations for this completion
            const wasCompleted = prevProgressRef.current === 100;
            const isNowCompleted = newProgress === 100;
            
            // Show congratulations only if:
            // 1. Progress just reached exactly 100% (wasn't 100% before)
            // 2. We haven't shown the modal for this completion yet
            // 3. Initialization is complete (prevents showing on page visit)
            if (isNowCompleted && !wasCompleted && !congratulationsShown && isInitializedRef.current) {
              setShowCongratulations(true);
              // Mark as shown in database
              markUnitCongratulationsShown(unitId).then((success) => {
                if (success) {
                  setCongratulationsShown(true);
                }
              });
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
            
            // On first check (initialization), set prevProgress to current progress
            // IMPORTANT: Once shown, NEVER show again, even on page reload or revisit
            if (!isInitializedRef.current && !isCheckingRef.current) {
              isCheckingRef.current = true;
              checkUnitCongratulationsShown(unitId).then((hasShown) => {
                setCongratulationsShown(hasShown);
                prevProgressRef.current = avgProgress;
                isInitializedRef.current = true;
                // If already shown before, ensure modal is closed
                if (hasShown) {
                  setShowCongratulations(false);
                }
                isCheckingRef.current = false;
              });
              return avgProgress; // Don't show modal on initial load
            }
            
            // CRITICAL: Only check for modal if initialization is complete
            if (!isInitializedRef.current) {
              return avgProgress; // Don't check for modal until initialization is done
            }

            // Check if we've already shown congratulations for this completion
            const wasCompleted = prevProgressRef.current === 100;
            const isNowCompleted = avgProgress === 100;
            
            // Show congratulations only if:
            // 1. Progress just reached exactly 100% (wasn't 100% before)
            // 2. We haven't shown the modal for this completion yet
            // 3. Initialization is complete (prevents showing on page visit)
            if (isNowCompleted && !wasCompleted && !congratulationsShown && isInitializedRef.current) {
              setShowCongratulations(true);
              // Mark as shown in database
              markUnitCongratulationsShown(unitId).then((success) => {
                if (success) {
                  setCongratulationsShown(true);
                }
              });
            }
            prevProgressRef.current = avgProgress;
            return avgProgress;
          } else {
            setProgress(0);
            if (!isInitializedRef.current) {
              prevProgressRef.current = 0;
              isInitializedRef.current = true;
            }
            return 0;
          }
        } else {
          setProgress(0);
          if (!isInitializedRef.current) {
            prevProgressRef.current = 0;
            isInitializedRef.current = true;
          }
          return 0;
        }
      } catch (error) {
        logger.error("Error reading progress:", error);
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
        
        // CRITICAL: Only check for modal if initialization is complete
        if (!isInitializedRef.current) {
          prevProgressRef.current = newProgress;
          return; // Don't check for modal until initialization is done
        }
        
        // Check if we've already shown congratulations for this completion
        const wasCompleted = prevProgressRef.current === 100;
        const isNowCompleted = newProgress === 100;
        
        // Show congratulations only if:
        // 1. Progress just reached exactly 100% (wasn't 100% before)
        // 2. We haven't shown the modal for this completion yet
        // 3. Initialization is complete (prevents showing on page visit)
        if (isNowCompleted && !wasCompleted && !congratulationsShown && isInitializedRef.current) {
          setShowCongratulations(true);
          // Mark as shown in database
          markUnitCongratulationsShown(unitId).then((success) => {
            if (success) {
              setCongratulationsShown(true);
            }
          });
        }
        prevProgressRef.current = newProgress;
      } else {
        // Also recalculate if event doesn't have unitId (might be from chapters)
        await calculateProgress();
      }
    };

    // Listen for chapterProgressUpdate event
    const handleChapterProgressUpdate = async () => {
      const newProgress = await calculateProgress();
      if (newProgress !== null) {
        // CRITICAL: Only check for modal if initialization is complete
        if (!isInitializedRef.current) {
          prevProgressRef.current = newProgress;
          return; // Don't check for modal until initialization is done
        }

        // Check if we've already shown congratulations for this completion
        const wasCompleted = prevProgressRef.current === 100;
        const isNowCompleted = newProgress === 100;
        
        // Show congratulations only if:
        // 1. Progress just reached exactly 100% (wasn't 100% before)
        // 2. We haven't shown the modal for this completion yet
        // 3. Initialization is complete (prevents showing on page visit)
        if (isNowCompleted && !wasCompleted && !congratulationsShown && isInitializedRef.current) {
          setShowCongratulations(true);
          // Mark as shown in database
          markUnitCongratulationsShown(unitId).then((success) => {
            if (success) {
              setCongratulationsShown(true);
            }
          });
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
    // Reduced polling frequency to improve performance and reduce memory usage
    // Poll less frequently - only when authenticated and visible
    const pollInterval = authStatus ? 5000 : 3000; // Increased from 2s/1s to 5s/3s
    const interval = setInterval(calculateProgress, pollInterval);

    return () => {
      window.removeEventListener("progress-updated", handleProgressUpdate);
      window.removeEventListener("chapterProgressUpdate", handleChapterProgressUpdate);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [unitId, isAuthenticated, congratulationsShown]);

  return (
    <>
      <div className="w-full sm:w-auto text-left sm:text-right">
        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-1.5 font-medium">Unit Progress</p>
        <div className="flex items-center gap-2 sm:gap-2.5 flex-row sm:flex-row">
          <span className="font-semibold text-xs sm:text-sm text-gray-700 whitespace-nowrap min-w-[2.5rem] sm:min-w-[3rem]">{progress}%</span>
          <div className="flex-1 sm:flex-none w-full sm:w-24 md:w-28 h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
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
