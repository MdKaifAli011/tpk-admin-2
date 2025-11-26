"use client";

import React, { useState, lazy, Suspense } from "react";
import Link from "next/link";
import { FaBook, FaChartLine, FaTrophy } from "react-icons/fa";
import RichContent from "./RichContent";
import DownloadButton from "./DownloadButton";
import { createSlug } from "../lib/api";

// Lazy load PracticeTestList to reduce initial bundle size
const PracticeTestList = lazy(() => import("./PracticeTestList"));

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
          <div className="space-y-4">
            {/* Download Button - only for unit type */}
            {entityType === "unit" && unitName && (
              <div className="flex justify-end mb-4">
                <DownloadButton unitName={unitName} />
              </div>
            )}

            <div className="prose prose-sm sm:prose max-w-none">
              {content ? (
                <RichContent html={content} />
              ) : (
                <>
                  {entityType === "subject" ? (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Subject Overview
                      </h3>
                      <p className="text-gray-600">
                        Welcome to your {entityName} preparation. Here
                        you&apos;ll find comprehensive resources, study
                        materials, and track your progress across all categories
                        and topics.
                      </p>
                    </>
                  ) : (
                    <div className="text-gray-500 italic">
                      <p>No content available for this {entityType}.</p>
                      <p className="text-xs sm:text-sm mt-2">
                        Content can be added from the admin panel.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Subjects and Units Grid - only for exam type */}
            {entityType === "exam" &&
              subjectsWithUnits &&
              subjectsWithUnits.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">
                    Subjects & Units
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {subjectsWithUnits
                      .filter(
                        (subject) => subject.units && subject.units.length > 0
                      )
                      .map((subject, subjectIndex) => {
                        const subjectSlugValue =
                          subject.slug || createSlug(subject.name);
                        const subjectUrl = examSlug
                          ? `/${examSlug}/${subjectSlugValue}`
                          : null;

                        return (
                          <div
                            key={subject._id || subjectIndex}
                            className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 flex flex-col overflow-hidden"
                          >
                            {/* Subject Header */}
                            <div className="bg-linear-to-r from-indigo-600 to-purple-600 px-4 py-3.5">
                              {subjectUrl ? (
                                <Link href={subjectUrl}>
                                  <div className="flex items-center justify-between gap-3">
                                    <h4
                                      className="text-sm font-semibold text-white line-clamp-1 flex-1"
                                      title={subject.name}
                                    >
                                      {subject.name}
                                    </h4>
                                    <span className="bg-white/25 text-white text-xs font-medium px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                                      {subject.units.length}
                                    </span>
                                  </div>
                                </Link>
                              ) : (
                                <div className="flex items-center justify-between gap-3">
                                  <h4
                                    className="text-sm font-semibold text-white line-clamp-1 flex-1"
                                    title={subject.name}
                                  >
                                    {subject.name}
                                  </h4>
                                  <span className="bg-white/25 text-white text-xs font-medium px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                                    {subject.units.length}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Units List */}
                            <div className="flex-1 px-4 py-3 space-y-1">
                              {subject.units.map((unit, unitIndex) => {
                                const unitSlugValue =
                                  unit.slug || createSlug(unit.name);
                                const unitUrl =
                                  examSlug && subjectSlugValue
                                    ? `/${examSlug}/${subjectSlugValue}/${unitSlugValue}`
                                    : null;

                                return (
                                  <div key={unit._id || unitIndex}>
                                    {unitUrl ? (
                                      <Link href={unitUrl}>
                                        <div className="flex items-center gap-2.5 py-2 px-2 -mx-2 rounded-md hover:bg-gray-50 transition-colors group">
                                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                          <p
                                            className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors line-clamp-1 flex-1"
                                            title={unit.name}
                                          >
                                            {unit.name}
                                          </p>
                                        </div>
                                      </Link>
                                    ) : (
                                      <div className="flex items-center gap-2.5 py-2 px-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"></div>
                                        <p
                                          className="text-sm font-medium text-gray-500 line-clamp-1"
                                          title={unit.name}
                                        >
                                          {unit.name}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

            {/* Units Grid - only for subject type */}
            {entityType === "subject" && units && units.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">
                  Units
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {units.map((unit, unitIndex) => {
                    const unitSlugValue = unit.slug || createSlug(unit.name);
                    const unitUrl =
                      examSlug && subjectSlug
                        ? `/${examSlug}/${subjectSlug}/${unitSlugValue}`
                        : null;

                    const UnitCard = (
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 p-4">
                        <div className="flex items-center justify-between">
                          <h4
                            className="text-sm font-medium text-gray-900 line-clamp-1 flex-1"
                            title={unit.name}
                          >
                            {unit.name}
                          </h4>
                          {unitUrl && (
                            <div className="ml-3 shrink-0 text-indigo-600">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    );

                    return unitUrl ? (
                      <Link key={unit._id || unitIndex} href={unitUrl}>
                        {UnitCard}
                      </Link>
                    ) : (
                      <div key={unit._id || unitIndex}>{UnitCard}</div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subject Stats - only for subject type (fallback if no units) */}
            {entityType === "subject" &&
              unitsCount !== undefined &&
              (!units || units.length === 0) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                    <FaBook className="text-blue-600 text-2xl mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">Units</h4>
                    <p className="text-sm text-gray-600">{unitsCount} Units</p>
                  </div>
                  <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                    <FaChartLine className="text-purple-600 text-2xl mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Subject Overview
                    </h4>
                    <p className="text-sm text-gray-600">Explore all units</p>
                  </div>
                  <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                    <FaTrophy className="text-green-600 text-2xl mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Study Resources
                    </h4>
                    <p className="text-sm text-gray-600">
                      Access study materials
                    </p>
                  </div>
                </div>
              )}

            {/* SubTopics List - for topic type */}
            {entityType === "topic" && subtopics && subtopics.length > 0 && (
              <>
                <div className="mt-6">
                  <div className="space-y-6">
                    {subtopics.map((subTopic, index) => {
                      const subTopicSlugValue =
                        subTopic.slug || createSlug(subTopic.name);
                      const subTopicUrl =
                        examSlug &&
                        subjectSlug &&
                        unitSlug &&
                        chapterSlug &&
                        topicSlug
                          ? `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${subTopicSlugValue}`
                          : null;

                      return (
                        <div key={subTopic._id || index} className="space-y-3">
                          {subTopicUrl ? (
                            <Link href={subTopicUrl}>
                              <h3 className="text-xl sm:text-2xl font-bold text-indigo-700 hover:text-indigo-600 transition-colors cursor-pointer">
                                {subTopic.name}
                              </h3>
                            </Link>
                          ) : (
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                              {subTopic.name}
                            </h3>
                          )}
                          {subTopic.content && (
                            <div className="prose prose-sm sm:prose max-w-none">
                              <RichContent
                                key={`subtopic-list-${
                                  subTopic._id || index
                                }-${activeTab}`}
                                html={subTopic.content}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SubTopics Grid - for topic type */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Subtopics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subtopics.map((subTopic, index) => {
                      const subTopicSlugValue =
                        subTopic.slug || createSlug(subTopic.name);
                      const subTopicUrl =
                        examSlug &&
                        subjectSlug &&
                        unitSlug &&
                        chapterSlug &&
                        topicSlug
                          ? `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${subTopicSlugValue}`
                          : null;

                      const SubTopicCard = (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 p-4">
                          <div className="flex items-center justify-between">
                            <h4
                              className="text-sm font-medium text-gray-900 line-clamp-1 flex-1"
                              title={subTopic.name}
                            >
                              {subTopic.name}
                            </h4>
                            {subTopicUrl && (
                              <div className="ml-3 shrink-0 text-indigo-600">
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );

                      return subTopicUrl ? (
                        <Link key={subTopic._id || index} href={subTopicUrl}>
                          {SubTopicCard}
                        </Link>
                      ) : (
                        <div key={subTopic._id || index}>{SubTopicCard}</div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Chapters Grid - for unit type */}
            {entityType === "unit" && chapters && chapters.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Chapters
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chapters.map((chapter, index) => {
                    const chapterSlugValue =
                      chapter.slug || createSlug(chapter.name);
                    const chapterUrl =
                      examSlug && subjectSlug && unitSlug
                        ? `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlugValue}`
                        : null;

                    const ChapterCard = (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-medium text-gray-900 text-base ${
                                chapterUrl
                                  ? "hover:text-indigo-600 transition-colors cursor-pointer"
                                  : ""
                              }`}
                              title={chapter.name}
                            >
                              {chapter.name}
                            </h4>
                          </div>
                          {chapterUrl && (
                            <div className="ml-3 shrink-0 text-indigo-600">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    );

                    return chapterUrl ? (
                      <Link key={chapter._id || index} href={chapterUrl}>
                        {ChapterCard}
                      </Link>
                    ) : (
                      <div key={chapter._id || index}>{ChapterCard}</div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Topics Grid - for chapter type */}
            {entityType === "chapter" && topics && topics.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Topics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topics.map((topic, index) => {
                    const topicSlugValue = topic.slug || createSlug(topic.name);
                    const topicUrl =
                      examSlug && subjectSlug && unitSlug && chapterSlug
                        ? `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlugValue}`
                        : null;

                    const TopicCard = (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-medium text-gray-900 text-base ${
                                topicUrl
                                  ? "hover:text-indigo-600 transition-colors cursor-pointer"
                                  : ""
                              }`}
                              title={topic.name}
                            >
                              {topic.name}
                            </h4>
                          </div>
                          {topicUrl && (
                            <div className="ml-3 shrink-0 text-indigo-600">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    );

                    return topicUrl ? (
                      <Link key={topic._id || index} href={topicUrl}>
                        {TopicCard}
                      </Link>
                    ) : (
                      <div key={topic._id || index}>{TopicCard}</div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Definitions List - for subtopic type */}
            {entityType === "subtopic" &&
              definitions &&
              definitions.length > 0 && (
                <>
                  <div className="mt-6">
                    <div className="space-y-6">
                      {definitions.map((definition, index) => {
                        const definitionSlug =
                          definition.slug || createSlug(definition.name);
                        const definitionUrl =
                          examSlug &&
                          subjectSlug &&
                          unitSlug &&
                          chapterSlug &&
                          topicSlug &&
                          subTopicSlug
                            ? `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${subTopicSlug}/${definitionSlug}`
                            : null;

                        return (
                          <div
                            key={definition._id || index}
                            className="space-y-3"
                          >
                            {definitionUrl ? (
                              <Link href={definitionUrl}>
                                <h3 className="text-xl sm:text-2xl font-bold text-indigo-700 hover:text-indigo-600 transition-colors cursor-pointer">
                                  {definition.name}
                                </h3>
                              </Link>
                            ) : (
                              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                                {definition.name}
                              </h3>
                            )}
                            {definition.content && (
                              <div className="prose prose-sm sm:prose max-w-none">
                                <RichContent html={definition.content} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Definitions Grid - for subtopic type */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Definitions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {definitions.map((definition, index) => {
                        const definitionSlug =
                          definition.slug || createSlug(definition.name);
                        const definitionUrl =
                          examSlug &&
                          subjectSlug &&
                          unitSlug &&
                          chapterSlug &&
                          topicSlug &&
                          subTopicSlug
                            ? `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${subTopicSlug}/${definitionSlug}`
                            : null;

                        const DefinitionCard = (
                          <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 p-4">
                            <div className="flex items-center justify-between">
                              <h4
                                className="text-sm font-medium text-gray-900 line-clamp-1 flex-1"
                                title={definition.name}
                              >
                                {definition.name}
                              </h4>
                              {definitionUrl && (
                                <div className="ml-3 shrink-0 text-indigo-600">
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        );

                        return definitionUrl ? (
                          <Link
                            key={definition._id || index}
                            href={definitionUrl}
                          >
                            {DefinitionCard}
                          </Link>
                        ) : (
                          <div key={definition._id || index}>
                            {DefinitionCard}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
          </div>
        );

      case "Discussion Forum":
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Discussion Forum
            </h3>
            <p className="text-gray-600 mb-4">
              {entityType === "exam" &&
                `Connect with fellow students preparing for ${entityName}.`}
              {entityType === "subject" &&
                `Connect with fellow students studying ${entityName}.`}
              {entityType === "unit" &&
                `Connect with fellow students studying ${entityName}.`}
              {entityType === "chapter" &&
                `Connect with fellow students studying ${entityName}.`}
              {entityType === "topic" &&
                `Ask questions and discuss ${entityName} with fellow students.`}
              {entityType === "subtopic" &&
                `Ask questions and discuss ${entityName} with fellow students.`}
              {entityType === "definition" &&
                `Ask questions and discuss ${entityName} with fellow students.`}
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-500 italic">
                Discussion forum features will be available soon.
              </p>
            </div>
          </div>
        );

      case "Practice Test":
        return (
          <div>
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                    <p className="text-gray-600">Loading practice tests...</p>
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

      case "Performance":
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Performance Analytics
            </h3>
            <p className="text-gray-600 mb-4">
              {entityType === "exam" &&
                `Track your performance across all subjects in ${entityName}.`}
              {entityType === "subject" &&
                `Track your performance in ${entityName} across all categories and topics.`}
              {entityType === "unit" &&
                `Track your performance in ${entityName} across all chapters.`}
              {entityType === "chapter" &&
                `Track your performance in ${entityName}.`}
              {entityType === "topic" &&
                `Track your performance in ${entityName}.`}
              {entityType === "subtopic" &&
                `Track your performance in ${entityName}.`}
              {entityType === "definition" &&
                `Track your performance in ${entityName}.`}
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-500 italic">
                Performance analytics {entityType === "exam" ? "dashboard" : ""}{" "}
                will be available soon.
                {entityType !== "exam" &&
                  " Monitor your progress and improve your scores!"}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-md border border-gray-100">
      {/* Tab Navigation */}
      <nav className="flex overflow-x-auto sm:overflow-visible border-b border-gray-200 bg-gray-50">
        <div className="flex min-w-max sm:min-w-0 w-full justify-start sm:justify-around">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? "text-blue-600 border-blue-600 bg-white"
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
      <div className="p-4 sm:p-6 text-gray-600 text-sm sm:text-base">
        {renderTabContent()}
      </div>
    </section>
  );
};

export default TabsClient;
