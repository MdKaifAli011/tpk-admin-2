"use client";

import React from "react";
import { FaChevronDown } from "react-icons/fa";
import TextEllipsis from "./TextEllipsis";
import Collapsible from "./Collapsible";

/**
 * SidebarNavigationTree - Complete navigation tree component
 * Handles subjects, units, chapters, and topics hierarchy
 */
const SidebarNavigationTree = ({
  tree,
  navigateTo,
  openSubjectId,
  openUnitId,
  openChapterId,
  toggleSubject,
  toggleUnit,
  toggleChapter,
  subjectSlugFromPath,
  unitSlugFromPath,
  chapterSlugFromPath,
  topicSlugFromPath,
  activeItemRef,
}) => {
  return (
    <div className="space-y-0.5">
      {tree.map((subject) => {
        const isActiveSubject =
          subject.slug && subject.slug === subjectSlugFromPath;
        const isOpenSubject = openSubjectId === subject.id;

        return (
          <div
            key={subject.id}
            ref={isActiveSubject ? activeItemRef : null}
          >
            {/* Subject row */}
            <div
              className={`w-full flex items-center gap-1.5 px-2.5 py-2 rounded transition ${
                isActiveSubject
                  ? "bg-blue-500 text-white font-medium"
                  : isOpenSubject
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "hover:bg-gray-100 text-gray-800"
              }`}
            >
              <button
                onClick={() => navigateTo([subject.slug])}
                className="flex-1 min-w-0 text-left outline-none overflow-hidden cursor-pointer"
                style={{
                  fontWeight: isActiveSubject || isOpenSubject ? "600" : "500",
                }}
              >
                <TextEllipsis
                  maxW="max-w-full"
                  fontSize="text-base sm:text-[15px]"
                  className={
                    isActiveSubject ? "text-white" : "text-gray-800"
                  }
                >
                  {subject.name}
                </TextEllipsis>
              </button>
              {subject.units.length > 0 && (
                <button
                  className={`shrink-0 p-0.5 transition-all duration-200 cursor-pointer ${
                    isActiveSubject
                      ? "text-white/80 hover:text-white"
                      : isOpenSubject
                      ? "text-blue-600 hover:text-blue-700"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSubject(subject.id);
                  }}
                  aria-label={
                    isOpenSubject ? "Collapse subject" : "Expand subject"
                  }
                >
                  <FaChevronDown
                    className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-300 ease-in-out ${
                      isOpenSubject ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
              )}
            </div>

            <Collapsible isOpen={isOpenSubject}>
              <div
                id={`subject-${subject.id}`}
                className="pl-5 py-0.5 space-y-0.5"
              >
                {(subject.units || []).map((unit) => {
                  const isActiveUnit =
                    isActiveSubject && unit.slug === unitSlugFromPath;
                  const isOpenUnit = openUnitId === unit.id;

                  return (
                    <div
                      key={unit.id}
                      ref={isActiveUnit ? activeItemRef : null}
                    >
                      {/* Unit row */}
                      <div
                        className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded transition ${
                          isActiveUnit
                            ? "bg-[#E9F8F3] text-[rgb(20,164,49)] font-medium"
                            : isOpenUnit
                            ? "bg-[#F0FDF4] text-[rgb(20,164,49)] font-medium"
                            : "hover:bg-gray-100"
                        }`}
                        style={{
                          color: "rgb(20, 164, 49)",
                        }}
                      >
                        <button
                          onClick={() =>
                            navigateTo([subject.slug, unit.slug])
                          }
                          className="flex-1 min-w-0 text-left outline-none overflow-hidden cursor-pointer"
                          style={{
                            fontWeight: isActiveUnit || isOpenUnit ? "500" : "400",
                            color: "rgb(20, 164, 49)",
                          }}
                        >
                          <TextEllipsis
                            maxW="max-w-full"
                            fontSize="text-sm sm:text-[14px]"
                            style={{
                              color: "rgb(20, 164, 49)",
                            }}
                          >
                            {unit.name}
                          </TextEllipsis>
                        </button>
                        {unit.chapters.length > 0 && (
                          <button
                            className="shrink-0 p-0.5 transition-all duration-200 cursor-pointer"
                            style={{
                              color: "rgb(20, 164, 49)",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUnit(unit.id, subject.id);
                            }}
                            aria-label={isOpenUnit ? "Collapse unit" : "Expand unit"}
                          >
                            <FaChevronDown
                              className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-300 ease-in-out ${
                                isOpenUnit ? "rotate-180" : "rotate-0"
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      <Collapsible isOpen={isOpenUnit}>
                        <div
                          id={`unit-${unit.id}`}
                          className="pl-5 py-0.5 space-y-0.5"
                        >
                          {(unit.chapters || []).map((chapter) => {
                            const isActiveChapter =
                              isActiveUnit &&
                              chapter.slug === chapterSlugFromPath;
                            const isOpenChapter = openChapterId === chapter.id;

                            return (
                              <div
                                key={chapter.id}
                                ref={
                                  isActiveChapter ? activeItemRef : null
                                }
                              >
                                {/* Chapter row */}
                                <div
                                  className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded transition ${
                                    isActiveChapter
                                      ? "bg-[#E0E7FF] text-[rgb(22,82,198)] font-medium"
                                      : isOpenChapter
                                      ? "bg-[#EEF2FF] text-[rgb(22,82,198)] font-medium"
                                      : "hover:bg-gray-100"
                                  }`}
                                  style={{
                                    color: "rgb(22, 82, 198)",
                                  }}
                                >
                                  <button
                                    onClick={() =>
                                      navigateTo([
                                        subject.slug,
                                        unit.slug,
                                        chapter.slug,
                                      ])
                                    }
                                    className="flex-1 min-w-0 text-left outline-none overflow-hidden cursor-pointer"
                                    style={{
                                      fontWeight:
                                        isActiveChapter || isOpenChapter
                                          ? "500"
                                          : "400",
                                      color: "rgb(22, 82, 198)",
                                    }}
                                  >
                                    <TextEllipsis
                                      maxW="max-w-full"
                                      fontSize="text-xs sm:text-[13px]"
                                      style={{
                                        color: "rgb(22, 82, 198)",
                                      }}
                                    >
                                      {chapter.name}
                                    </TextEllipsis>
                                  </button>
                                  {chapter.topics.length > 0 && (
                                    <button
                                      className="shrink-0 p-0.5 transition-all duration-200 cursor-pointer"
                                      style={{
                                        color: "rgb(22, 82, 198)",
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleChapter(
                                          chapter.id,
                                          subject.id,
                                          unit.id
                                        );
                                      }}
                                      aria-label={
                                        isOpenChapter
                                          ? "Collapse chapter"
                                          : "Expand chapter"
                                      }
                                    >
                                      <FaChevronDown
                                        className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-300 ease-in-out ${
                                          isOpenChapter
                                            ? "rotate-180"
                                            : "rotate-0"
                                        }`}
                                      />
                                    </button>
                                  )}
                                </div>

                                <Collapsible isOpen={isOpenChapter}>
                                  <div
                                    id={`chapter-${chapter.id}`}
                                    className="pl-5 py-0.5 space-y-0.5"
                                  >
                                    {(chapter.topics || []).map((topic) => {
                                      const isTopicActive =
                                        isActiveChapter &&
                                        topic.slug === topicSlugFromPath;
                                      return (
                                        <div
                                          key={topic.id}
                                          ref={
                                            isTopicActive
                                              ? activeItemRef
                                              : null
                                          }
                                        >
                                          {/* Topic row */}
                                          <button
                                            onClick={() =>
                                              navigateTo([
                                                subject.slug,
                                                unit.slug,
                                                chapter.slug,
                                                topic.slug,
                                              ])
                                            }
                                            className={`w-full px-2.5 py-1.5 rounded transition text-left overflow-hidden cursor-pointer ${
                                              isTopicActive
                                                ? "bg-[#FCE7F3] text-[rgb(227,48,141)] font-medium"
                                                : "hover:bg-gray-100"
                                            }`}
                                            style={{
                                              color: "rgb(227, 48, 141)",
                                              fontWeight: isTopicActive ? "500" : "400",
                                            }}
                                          >
                                            <TextEllipsis
                                              maxW="max-w-full"
                                              fontSize="text-xs sm:text-[12px]"
                                              style={{
                                                color: "rgb(227, 48, 141)",
                                              }}
                                            >
                                              {topic.name}
                                            </TextEllipsis>
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </Collapsible>
                              </div>
                            );
                          })}
                        </div>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
};

export default SidebarNavigationTree;

