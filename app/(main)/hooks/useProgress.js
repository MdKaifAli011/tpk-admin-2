"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for managing progress tracking
 * Handles localStorage persistence and progress calculations
 */
export const useProgress = (unitId, chapters = []) => {
  const storageKey = `unit-progress-${unitId}`;

  // Initialize state from localStorage
  const initializeProgress = () => {
    if (typeof window === "undefined") return {};
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
    
    // Initialize with default values
    const defaultProgress = {};
    chapters.forEach((chapter) => {
      defaultProgress[chapter._id] = {
        progress: 0,
        isCompleted: false,
      };
    });
    return defaultProgress;
  };

  const [chaptersProgress, setChaptersProgress] = useState(initializeProgress);
  const [unitProgress, setUnitProgress] = useState(0);

  // Calculate unit progress from chapters
  const calculateUnitProgress = useCallback((progressData) => {
    if (chapters.length === 0) return 0;
    
    const totalProgress = chapters.reduce((sum, chapter) => {
      const chapterData = progressData[chapter._id] || { progress: 0 };
      return sum + (chapterData.progress || 0);
    }, 0);
    
    return Math.round(totalProgress / chapters.length);
  }, [chapters]);

  // Update chapter progress
  const updateChapterProgress = useCallback((chapterId, progress, isCompleted = false) => {
    setChaptersProgress((prev) => {
      const updated = {
        ...prev,
        [chapterId]: {
          progress: Math.max(0, Math.min(100, progress)),
          isCompleted: isCompleted || progress === 100,
        },
      };
      
      // Save to localStorage with proper structure
      try {
        const dataToSave = { ...updated };
        // Also save unit progress for easy access
        const newUnitProgress = calculateUnitProgress(updated);
        dataToSave._unitProgress = newUnitProgress;
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        // Dispatch custom event for real-time updates (deferred to avoid render phase updates)
        if (typeof window !== "undefined") {
          // Use setTimeout to defer event dispatch until after render cycle
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('progress-updated', {
              detail: { unitId, unitProgress: newUnitProgress }
            }));
          }, 0);
        }
      } catch (error) {
        console.error("Error saving progress:", error);
      }
      
      // Calculate and update unit progress
      const newUnitProgress = calculateUnitProgress(updated);
      setUnitProgress(newUnitProgress);
      
      return updated;
    });
  }, [storageKey, calculateUnitProgress, unitId]);

  // Mark chapter as done
  const markAsDone = useCallback((chapterId) => {
    updateChapterProgress(chapterId, 100, true);
  }, [updateChapterProgress]);

  // Reset chapter progress
  const resetChapterProgress = useCallback((chapterId) => {
    updateChapterProgress(chapterId, 0, false);
  }, [updateChapterProgress]);

  // Get chapter progress
  const getChapterProgress = useCallback((chapterId) => {
    return chaptersProgress[chapterId] || { progress: 0, isCompleted: false };
  }, [chaptersProgress]);

  // Initialize unit progress on mount
  useEffect(() => {
    const initialProgress = calculateUnitProgress(chaptersProgress);
    setUnitProgress(initialProgress);
  }, []);

  // Recalculate unit progress when chapters change
  useEffect(() => {
    const newUnitProgress = calculateUnitProgress(chaptersProgress);
    setUnitProgress(newUnitProgress);
    // Note: Event dispatch is handled by updateChapterProgress to avoid render phase updates
  }, [chaptersProgress, calculateUnitProgress]);

  return {
    chaptersProgress,
    unitProgress,
    updateChapterProgress,
    markAsDone,
    resetChapterProgress,
    getChapterProgress,
  };
};

