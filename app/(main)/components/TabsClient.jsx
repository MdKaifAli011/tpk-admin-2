"use client";

import React, { useState } from "react";
import OverviewTab from "./OverviewTab";
import DiscussionForumTab from "./DiscussionForumTab";
import PracticeTestTab from "./PracticeTestTab";
import PerformanceTab from "./PerformanceTab";

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
