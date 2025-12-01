"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { FaCheck, FaEye } from "react-icons/fa";
import CongratulationsModal from "./CongratulationsModal";
import {
  checkChapterCongratulationsShown,
  markChapterCongratulationsShown,
} from "@/lib/congratulations";

const ChapterProgressItem = ({
  chapter,
  index,
  href,
  unitId,
  progress: initialProgress = 0,
  isCompleted: initialIsCompleted = false,
  onProgressChange,
  onMarkAsDone,
  onReset,
}) => {
  const [localProgress, setLocalProgress] = useState(initialProgress);
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [isDragging, setIsDragging] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [congratulationsShown, setCongratulationsShown] = useState(false);
  const prevProgressRef = useRef(initialProgress);
  const hasCheckedCompletionRef = useRef(false);
  const isCheckingRef = useRef(false);
  
  // Initialize: Check if already completed on mount (prevent showing on page load if already completed)
  useEffect(() => {
    if (!hasCheckedCompletionRef.current && !isCheckingRef.current && unitId) {
      isCheckingRef.current = true;
      checkChapterCongratulationsShown(chapter._id, unitId).then((hasShown) => {
        setCongratulationsShown(hasShown);
        // If already shown before OR if progress is already 100% on mount, set prevProgress to 100
        // This prevents showing modal when navigating back to a completed chapter
        // IMPORTANT: Once shown, NEVER show again, even on page reload or revisit
        if (hasShown || initialProgress === 100) {
          prevProgressRef.current = 100;
          // If already shown, ensure we don't show again
          if (hasShown) {
            setShowCongratulations(false);
          }
        } else {
          prevProgressRef.current = initialProgress;
        }
        hasCheckedCompletionRef.current = true;
        isCheckingRef.current = false;
      });
    }
  }, [chapter._id, unitId, initialProgress]);

  // Sync with prop changes (from database updates)
  useEffect(() => {
    if (!hasCheckedCompletionRef.current || !unitId) return;
    
    const prevProgress = prevProgressRef.current;
    setLocalProgress(initialProgress);
    setIsCompleted(initialIsCompleted);
    
    // Only show congratulations if:
    // 1. Progress is exactly 100%
    // 2. Previous progress was less than 100% (just completed)
    // 3. We haven't shown the modal for this completion yet
    if (initialProgress === 100 && prevProgress < 100 && !congratulationsShown) {
      setShowCongratulations(true);
      // Mark as shown in database
      markChapterCongratulationsShown(chapter._id, unitId).then((success) => {
        if (success) {
          setCongratulationsShown(true);
        }
      });
    }
    
    // Update previous progress reference
    prevProgressRef.current = initialProgress;
  }, [initialProgress, initialIsCompleted, chapter._id, unitId, congratulationsShown]);

  const weightage = chapter.weightage ?? "20%";
  const engagement = chapter.engagement ?? "2.2K";

  const colorVariants = {
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
    black: "bg-black",
    indigo: "bg-indigo-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
  };

  const getColor = () => {
    const colors = ["blue", "blue", "yellow", "green", "black"];
    return colorVariants[colors[index % colors.length]] || colorVariants.blue;
  };

  const indicatorColor = getColor();
  const progressPercent = Math.min(100, Math.max(0, localProgress));
  const progressLabel = Math.round(progressPercent);

  const handleSliderChange = useCallback((e) => {
    e.stopPropagation();
    const newProgress = parseInt(e.target.value);
    const prevProgress = localProgress;
    setLocalProgress(newProgress);
    setIsCompleted(newProgress === 100);
    
    // Show congratulations only if:
    // 1. Progress just reached exactly 100% (wasn't 100% before)
    // 2. We haven't shown the modal for this completion yet
    if (newProgress === 100 && prevProgress < 100 && !congratulationsShown && unitId) {
      setShowCongratulations(true);
      // Mark as shown in database
      markChapterCongratulationsShown(chapter._id, unitId).then((success) => {
        if (success) {
          setCongratulationsShown(true);
        }
      });
    }
    
    if (onProgressChange) {
      onProgressChange(chapter._id, newProgress, newProgress === 100);
    }
  }, [chapter._id, onProgressChange, localProgress, congratulationsShown, unitId]);

  const handleMarkAsDone = useCallback((e) => {
    e.stopPropagation();
    const checked = e.target.checked;
    
    if (checked) {
      // Mark as done
      const prevProgress = localProgress;
      setLocalProgress(100);
      setIsCompleted(true);
      
      // Show congratulations only if:
      // 1. Previous progress was less than 100% (just completed)
      // 2. We haven't shown the modal for this completion yet
      if (prevProgress < 100 && !congratulationsShown && unitId) {
        setShowCongratulations(true);
        // Mark as shown in database
        markChapterCongratulationsShown(chapter._id, unitId).then((success) => {
          if (success) {
            setCongratulationsShown(true);
          }
        });
      }
      prevProgressRef.current = 100;
      
      if (onMarkAsDone) {
        onMarkAsDone(chapter._id);
      }
    } else {
      // Reset if unchecked
      setLocalProgress(0);
      setIsCompleted(false);
      setCongratulationsShown(false);
      if (onReset) {
        onReset(chapter._id);
      }
    }
  }, [chapter._id, onMarkAsDone, onReset, localProgress, congratulationsShown, unitId]);

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback((e) => {
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const statusMarkup = (
    <label className="flex items-center cursor-pointer group">
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={handleMarkAsDone}
        className="sr-only"
        aria-label={isCompleted ? "Mark as incomplete" : "Mark as done"}
      />
      <div
        className={`relative inline-flex items-center justify-center w-6 h-6 rounded border-2 transition-all duration-200 ${
          isCompleted
            ? "bg-emerald-500 border-emerald-500 shadow-md"
            : "bg-white border-gray-300 group-hover:border-emerald-400"
        }`}
      >
        {isCompleted && (
          <FaCheck className="w-3.5 h-3.5 text-white" />
        )}
      </div>
    </label>
  );

  return (
    <div
      className={`block px-4 py-4 transition-colors hover:bg-gray-50 sm:px-6 ${
        isDragging ? "cursor-grabbing" : ""
      }`}
    >
      <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[minmax(0,1fr)_140px_180px] sm:items-center sm:gap-6">
        {/* Chapter Name Section */}
        <div className="flex items-start gap-3">
          <span
            className={`hidden sm:block w-1 self-stretch rounded-full ${indicatorColor}`}
            aria-hidden="true"
          />
          <span
            className={`block h-0.5 w-12 rounded-full ${indicatorColor} sm:hidden`}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            {href ? (
              <Link href={href} className="block">
                <p className="text-sm font-semibold text-gray-900 sm:text-base hover:text-indigo-600 transition-colors">
                  {chapter.name}
                </p>
              </Link>
            ) : (
              <p className="text-sm font-semibold text-gray-900 sm:text-base">
                {chapter.name}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 sm:text-sm">
              <span className="font-medium text-emerald-600">
                Weightage: {weightage}
              </span>
              <span className="inline-flex items-center gap-1">
                <FaEye className="text-gray-400" />
                {engagement}
              </span>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="flex items-center justify-start sm:justify-center" onClick={(e) => e.stopPropagation()}>
          <div onClick={(e) => e.stopPropagation()}>
            {statusMarkup}
          </div>
        </div>

        {/* Progress Section with Slider */}
        <div className="flex w-full items-center gap-3 sm:w-auto sm:justify-end">
          {/* Single Slider with Percentage Label */}
          <div className="flex-1 sm:w-48" onClick={(e) => e.stopPropagation()}>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={localProgress}
              onChange={handleSliderChange}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider pointer-events-auto"
              style={{
                background: `linear-gradient(to right, ${
                  progressPercent >= 100
                    ? "#10b981"
                    : progressPercent >= 50
                    ? "#34d399"
                    : "#6ee7b7"
                } 0%, ${
                  progressPercent >= 100
                    ? "#10b981"
                    : progressPercent >= 50
                    ? "#34d399"
                    : "#6ee7b7"
                } ${progressPercent}%, #e5e7eb ${progressPercent}%, #e5e7eb 100%)`,
              }}
              aria-label={`Progress for ${chapter.name}`}
            />
            <style jsx>{`
              .slider::-webkit-slider-thumb {
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: ${progressPercent >= 100
                  ? "#10b981"
                  : progressPercent >= 50
                  ? "#34d399"
                  : "#6ee7b7"};
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                transition: all 0.2s;
              }
              .slider::-webkit-slider-thumb:hover {
                transform: scale(1.1);
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
              }
              .slider::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: ${progressPercent >= 100
                  ? "#10b981"
                  : progressPercent >= 50
                  ? "#34d399"
                  : "#6ee7b7"};
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                transition: all 0.2s;
              }
              .slider::-moz-range-thumb:hover {
                transform: scale(1.1);
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
              }
            `}</style>
          </div>
          {/* Percentage Label */}
          <span className="min-w-[38px] text-right text-xs font-semibold text-gray-500">
            {progressLabel}%
          </span>
        </div>
      </div>

      {/* Congratulations Modal */}
      <CongratulationsModal
        isOpen={showCongratulations}
        onClose={() => setShowCongratulations(false)}
        chapterName={chapter.name}
      />
    </div>
  );
};

export default ChapterProgressItem;

