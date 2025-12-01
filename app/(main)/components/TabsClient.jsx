"use client";

import React, { useState, lazy, Suspense } from "react";
import { ExamCardSkeleton } from "./SkeletonLoader";

// Lazy load tabs for code splitting - only load when needed
const OverviewTab = lazy(() => import("./OverviewTab"));
const DiscussionForumTab = lazy(() => import("./DiscussionForumTab"));
const PracticeTestTab = lazy(() => import("./PracticeTestTab"));
const PerformanceTab = lazy(() => import("./PerformanceTab"));

const TABS = ["Overview", "Discussion Forum", "Practice Test", "Performance"];

const TabsClient = ({
  activeTab: initialTab = TABS[0],
  content,
  details,
  examId,
  subjectId,
  unitId,
  chapterId,
  topicId,
  subTopicId,
  entityName,
  entityType,
  unitsCount,
  definitions = [],
  currentDefinitionId,
  examSlug,
  subjectSlug,
  unitSlug,
  chapterSlug,
  topicSlug,
  subTopicSlug,
  subtopics = [],
  chapters = [],
  topics = [],
  unitName,
  subjectsWithUnits = [],
  units = [],
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const renderTabContent = () => {
    const tabContent = (() => {
      switch (activeTab) {
        case "Overview":
          return (
            <OverviewTab
              content={content}
              entityType={entityType}
              entityName={entityName}
              unitName={unitName}
              unitsCount={unitsCount}
              definitions={definitions}
              subtopics={subtopics}
              chapters={chapters}
              topics={topics}
              units={units}
              subjectsWithUnits={subjectsWithUnits}
              examSlug={examSlug}
              subjectSlug={subjectSlug}
              unitSlug={unitSlug}
              chapterSlug={chapterSlug}
              topicSlug={topicSlug}
              subTopicSlug={subTopicSlug}
              activeTab={activeTab}
            />
          );

        case "Discussion Forum":
          return (
            <DiscussionForumTab entityType={entityType} entityName={entityName} />
          );

        case "Practice Test":
          return (
            <PracticeTestTab
              examId={examId}
              subjectId={subjectId}
              unitId={unitId}
              chapterId={chapterId}
              topicId={topicId}
              subTopicId={subTopicId}
            />
          );

        case "Performance":
          return (
            <PerformanceTab entityType={entityType} entityName={entityName} />
          );

        default:
          return null;
      }
    })();

    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-600 border-t-transparent mb-3"></div>
              <p className="text-xs text-gray-600">Loading...</p>
            </div>
          </div>
        }
      >
        {tabContent}
      </Suspense>
    );
  };

  return (
    <section className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      {/* Tab Navigation */}
      <nav className="flex  overflow-x-auto sm:overflow-visible border-b border-gray-200 bg-gray-50">
        <div className="flex  min-w-max sm:min-w-0 w-full justify-start sm:justify-around">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? "text-indigo-600 border-indigo-600 bg-white"
                    : "text-gray-500 hover:text-gray-700 border-transparent"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab Content */}
      <div className=" text-gray-700 text-sm sm:text-base">
        {renderTabContent()}
      </div>
    </section>
  );
};

export default TabsClient;
