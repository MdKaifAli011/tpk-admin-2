"use client";

import React, { useEffect } from "react";
import ChapterProgressItem from "./ChapterProgressItem";
import { useProgress } from "../hooks/useProgress";
import { createSlug as createSlugUtil } from "@/utils/slug";

const ChaptersListClient = ({
  chapters,
  unitId,
  examSlug,
  subjectSlug,
  unitSlug,
  onUnitProgressChange,
}) => {
  const {
    chaptersProgress,
    unitProgress,
    updateChapterProgress,
    markAsDone,
    resetChapterProgress,
    getChapterProgress,
  } = useProgress(unitId, chapters);

  // Notify parent component when unit progress changes
  useEffect(() => {
    if (onUnitProgressChange) {
      onUnitProgressChange(unitProgress);
    }
  }, [unitProgress, onUnitProgressChange]);

  if (chapters.length === 0) {
    return (
      <div className="px-4 sm:px-6 py-10 text-center text-gray-500">
        No chapters available for this unit.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {chapters.map((chapter, index) => {
        const chapterSlug = chapter.slug || createSlugUtil(chapter.name);
        const chapterProgressData = getChapterProgress(chapter._id);
        const chapterUrl = `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}`;

        return (
          <ChapterProgressItem
            key={chapter._id}
            chapter={chapter}
            index={index}
            href={chapterUrl}
            progress={chapterProgressData.progress}
            isCompleted={chapterProgressData.isCompleted}
            onProgressChange={updateChapterProgress}
            onMarkAsDone={markAsDone}
            onReset={resetChapterProgress}
          />
        );
      })}
    </div>
  );
};

export default ChaptersListClient;
