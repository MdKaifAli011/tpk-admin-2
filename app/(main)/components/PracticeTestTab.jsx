"use client";

import React, { lazy, Suspense } from "react";

// Lazy load PracticeTestList to reduce initial bundle size
const PracticeTestList = lazy(() => import("./PracticeTestList"));

const PracticeTestTab = ({
  examId,
  subjectId,
  unitId,
  chapterId,
  topicId,
  subTopicId,
}) => {
  return (
    <div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-600 border-t-transparent mb-3"></div>
              <p className="text-xs text-gray-600">Loading practice tests...</p>
            </div>
          </div>
        }
      >
        <PracticeTestList
          examId={examId}
          subjectId={subjectId}
          unitId={unitId}
          chapterId={chapterId}
          topicId={topicId}
          subTopicId={subTopicId}
        />
      </Suspense>
    </div>
  );
};

export default PracticeTestTab;

