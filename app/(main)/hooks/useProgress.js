"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for managing progress tracking
 * Handles database persistence and local storage caching
 */
export const useProgress = (unitId, chapters = []) => {
  const storageKey = `unit-progress-${unitId}`;
  const [chaptersProgress, setChaptersProgress] = useState({});
  const [unitProgress, setUnitProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const saveTimeoutRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // Check if student is authenticated
  const checkAuth = useCallback(() => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("student_token");
    return !!token;
  }, []);

  // Get student token for API requests
  const getAuthToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("student_token");
  }, []);

  // Load progress from database
  const loadProgressFromDB = useCallback(async () => {
    if (!isAuthenticated) {
      // If not authenticated, load from localStorage only
      return loadProgressFromLocalStorage();
    }

    try {
      const token = getAuthToken();
      if (!token) {
        return loadProgressFromLocalStorage();
      }

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
          // Convert Map to object (progress is already converted to object by API)
          const progressObj = {};
          if (progressDoc.progress && typeof progressDoc.progress === "object") {
            Object.keys(progressDoc.progress).forEach((key) => {
              const value = progressDoc.progress[key];
              progressObj[key] = {
                progress: value.progress || 0,
                isCompleted: value.isCompleted || false,
                isManualOverride: value.isManualOverride || false,
                manualProgress: value.manualProgress || null,
                autoCalculatedProgress: value.autoCalculatedProgress || 0,
                visitedItems: value.visitedItems || {
                  chapter: false,
                  topics: [],
                  subtopics: [],
                  definitions: [],
                },
              };
            });
          }

          // Also update localStorage as cache
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(storageKey, JSON.stringify(progressObj));
            } catch (error) {
              console.error("Error caching progress to localStorage:", error);
            }
          }

          return {
            progress: progressObj,
            unitProgress: progressDoc.unitProgress || 0,
          };
        }
      }
    } catch (error) {
      console.error("Error loading progress from database:", error);
    }

    // Fallback to localStorage
    return loadProgressFromLocalStorage();
  }, [unitId, isAuthenticated, getAuthToken, storageKey]);

  // Load progress from localStorage
  const loadProgressFromLocalStorage = useCallback(() => {
    if (typeof window === "undefined") {
      return { progress: {}, unitProgress: 0 };
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Remove _unitProgress if it exists (old format)
        const { _unitProgress, ...progress } = parsed;
        return {
          progress,
          unitProgress: _unitProgress || 0,
        };
      }
    } catch (error) {
      console.error("Error loading progress from localStorage:", error);
    }

    // Initialize with default values
    const defaultProgress = {};
    chapters.forEach((chapter) => {
      defaultProgress[chapter._id] = {
        progress: 0,
        isCompleted: false,
      };
    });
    return { progress: defaultProgress, unitProgress: 0 };
  }, [storageKey, chapters]);

  // Save progress to database
  const saveProgressToDB = useCallback(
    async (progressData, calculatedUnitProgress) => {
      if (!isAuthenticated) {
        // If not authenticated, only save to localStorage
        return;
      }

      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce saves to avoid too many API calls
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const token = getAuthToken();
          if (!token) return;

          // Convert progress object to Map format for API
          const progressMap = {};
          Object.keys(progressData).forEach((chapterId) => {
            progressMap[chapterId] = progressData[chapterId];
          });

          const response = await fetch("/api/student/progress", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              unitId,
              progress: progressMap,
              unitProgress: calculatedUnitProgress,
            }),
          });

          if (!response.ok) {
            console.error("Failed to save progress to database");
          }
        } catch (error) {
          console.error("Error saving progress to database:", error);
        }
      }, 500); // 500ms debounce
    },
    [unitId, isAuthenticated, getAuthToken]
  );

  // Calculate unit progress from chapters
  const calculateUnitProgress = useCallback((progressData) => {
    if (chapters.length === 0) return 0;

    const totalProgress = chapters.reduce((sum, chapter) => {
      const chapterData = progressData[chapter._id] || { progress: 0 };
      return sum + (chapterData.progress || 0);
    }, 0);

    return Math.round(totalProgress / chapters.length);
  }, [chapters]);

  // Initialize progress on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const authStatus = checkAuth();
      setIsAuthenticated(authStatus);

      const loaded = await loadProgressFromDB();
      setChaptersProgress(loaded.progress);
      setUnitProgress(loaded.unitProgress);
      setIsLoading(false);
      isInitialLoadRef.current = false;
    };

    init();
  }, [unitId, checkAuth, loadProgressFromDB]);

  // Listen for progress updates from visit tracking
  useEffect(() => {
    const handleProgressUpdate = async (event) => {
      if (event.detail?.unitId === unitId && isAuthenticated) {
        // Reload progress from database to get latest updates
        const loaded = await loadProgressFromDB();
        setChaptersProgress(loaded.progress);
        setUnitProgress(loaded.unitProgress);
      }
    };

    const handleChapterProgressUpdate = async () => {
      if (isAuthenticated) {
        // Reload progress from database
        const loaded = await loadProgressFromDB();
        setChaptersProgress(loaded.progress);
        setUnitProgress(loaded.unitProgress);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("progress-updated", handleProgressUpdate);
      window.addEventListener("chapterProgressUpdate", handleChapterProgressUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("progress-updated", handleProgressUpdate);
        window.removeEventListener("chapterProgressUpdate", handleChapterProgressUpdate);
      }
    };
  }, [unitId, isAuthenticated, loadProgressFromDB]);

  // Update chapter progress
  const updateChapterProgress = useCallback(
    (chapterId, progress, isCompleted = false) => {
      setChaptersProgress((prev) => {
        const prevChapter = prev[chapterId] || {};
        const autoProgress = prevChapter.autoCalculatedProgress || 0;
        // If progress differs from auto-calculated, it's a manual override
        const isManual = progress !== autoProgress;
        
        const updated = {
          ...prev,
          [chapterId]: {
            progress: Math.max(0, Math.min(100, progress)),
            isCompleted: isCompleted || progress === 100,
            isManualOverride: isManual || prevChapter.isManualOverride || false,
            manualProgress: isManual ? progress : (prevChapter.manualProgress || null),
            autoCalculatedProgress: prevChapter.autoCalculatedProgress || 0,
            visitedItems: prevChapter.visitedItems || {
              chapter: false,
              topics: [],
              subtopics: [],
              definitions: [],
            },
          },
        };

        // Save to localStorage immediately for fast UI updates
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          }
        } catch (error) {
          console.error("Error saving progress to localStorage:", error);
        }

        // Calculate and update unit progress
        const newUnitProgress = calculateUnitProgress(updated);
        setUnitProgress(newUnitProgress);

        // Save to database (debounced)
        if (!isInitialLoadRef.current) {
          saveProgressToDB(updated, newUnitProgress);
        }

        // Dispatch custom event for real-time updates
        if (typeof window !== "undefined") {
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("progress-updated", {
                detail: { unitId, unitProgress: newUnitProgress },
              })
            );
          }, 0);
        }

        return updated;
      });
    },
    [storageKey, calculateUnitProgress, unitId, saveProgressToDB]
  );

  // Mark chapter as done
  const markAsDone = useCallback(
    (chapterId) => {
      updateChapterProgress(chapterId, 100, true);
    },
    [updateChapterProgress]
  );

  // Reset chapter progress
  const resetChapterProgress = useCallback(
    (chapterId) => {
      updateChapterProgress(chapterId, 0, false);
    },
    [updateChapterProgress]
  );

  // Get chapter progress
  const getChapterProgress = useCallback(
    (chapterId) => {
      return chaptersProgress[chapterId] || { progress: 0, isCompleted: false };
    },
    [chaptersProgress]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    chaptersProgress,
    unitProgress,
    updateChapterProgress,
    markAsDone,
    resetChapterProgress,
    getChapterProgress,
    isLoading,
    isAuthenticated,
  };
};
