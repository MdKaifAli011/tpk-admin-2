/**
 * Complete Hierarchical Navigation System
 * Handles Next/Previous navigation across all 7 levels:
 * Exam → Subject → Unit → Chapter → Topic → Subtopic → Definition
 *
 * This utility provides functions to calculate the next/previous item
 * in the hierarchy, automatically traversing up levels when needed.
 */

import {
  fetchExams,
  fetchSubjectsByExam,
  fetchUnitsBySubject,
  fetchChaptersByUnit,
  fetchTopicsByChapter,
  fetchSubTopicsByTopic,
  fetchDefinitionsBySubTopic,
  createSlug,
} from "./api";
import { logger } from "@/utils/logger";

/**
 * Get next navigation for Subtopic level
 */
export async function getNextSubtopic({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  topicId,
  topicSlug,
  subTopicId,
  subTopicSlug,
  currentIndex,
  allItems,
}) {
  // 1. Check if current subtopic has definitions - if yes, go to first definition
  if (subTopicId) {
    try {
      const definitions = await fetchDefinitionsBySubTopic(subTopicId);
      if (definitions.length > 0) {
        const firstDefinition = definitions[0];
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${subTopicSlug}/${createSlug(
            firstDefinition.name
          )}`,
          label: `${allItems[currentIndex]?.name || "SubTopic"} > ${
            firstDefinition.name
          }`,
          type: "definition",
        };
      }
    } catch (error) {
      logger.error("Error fetching definitions for subtopic:", {
        error: error.message,
        context: { subTopicId },
      });
    }
  }

  // 2. Try next subtopic in same topic
  if (currentIndex !== undefined && currentIndex < allItems.length - 1) {
    const next = allItems[currentIndex + 1];
    const nextSlug = createSlug(next.name);
    try {
      const definitions = await fetchDefinitionsBySubTopic(next._id);
      if (definitions.length > 0) {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${nextSlug}/${createSlug(
            definitions[0].name
          )}`,
          label: `${next.name} > ${definitions[0].name}`,
          type: "definition",
        };
      }
    } catch (error) {
      // Continue without definitions
    }
    return {
      url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${nextSlug}`,
      label: next.name,
      type: "subtopic",
    };
  }

  // 2b. Try next subtopic in same topic (fallback via API)
  try {
    const subtopics = await fetchSubTopicsByTopic(topicId);
    const subtopicIndex = subtopics.findIndex((st) => st._id === subTopicId);
    if (subtopicIndex < subtopics.length - 1) {
      const nextSubTopic = subtopics[subtopicIndex + 1];
      const nextSubTopicSlug = createSlug(nextSubTopic.name);
      const definitions = await fetchDefinitionsBySubTopic(nextSubTopic._id);
      if (definitions.length > 0) {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${nextSubTopicSlug}/${createSlug(
            definitions[0].name
          )}`,
          label: `${nextSubTopic.name} > ${definitions[0].name}`,
          type: "definition",
        };
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${nextSubTopicSlug}`,
          label: nextSubTopic.name,
          type: "subtopic",
        };
      }
    }
  } catch (error) {
    logger.error("Error fetching next subtopic:", {
      error: error.message,
      context: { subTopicId, topicId },
    });
  }

  // 3. Try next topic in same chapter
  try {
    const topics = await fetchTopicsByChapter(chapterId);
    const topicIndex = topics.findIndex((t) => t._id === topicId);
    if (topicIndex < topics.length - 1) {
      const nextTopic = topics[topicIndex + 1];
      const nextTopicSlug = createSlug(nextTopic.name);
      // Check if next topic has subtopics
      try {
        const nextTopicSubtopics = await fetchSubTopicsByTopic(nextTopic._id);
        if (nextTopicSubtopics.length > 0) {
          const firstSubTopic = nextTopicSubtopics[0];
          const firstSubTopicSlug = createSlug(firstSubTopic.name);
          // Check if first subtopic has definitions
          try {
            const definitions = await fetchDefinitionsBySubTopic(
              firstSubTopic._id
            );
            if (definitions.length > 0) {
              return {
                url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${nextTopicSlug}/${firstSubTopicSlug}/${createSlug(
                  definitions[0].name
                )}`,
                label: `${nextTopic.name} > ${firstSubTopic.name} > ${definitions[0].name}`,
                type: "definition",
              };
            }
          } catch (error) {}
          // Next topic has subtopics but no definitions, go to first subtopic
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${nextTopicSlug}/${firstSubTopicSlug}`,
            label: `${nextTopic.name} > ${firstSubTopic.name}`,
            type: "subtopic",
          };
        }
      } catch (error) {}
      // Next topic has no subtopics, go to topic page
      return {
        url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${nextTopicSlug}`,
        label: nextTopic.name,
        type: "topic",
      };
    }
  } catch (error) {
    logger.error("Error fetching next topic:", {
      error: error.message,
      context: { topicId, chapterId },
    });
  }

  // 5. Try next chapter in same unit
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    const chapterIndex = chapters.findIndex((c) => c._id === chapterId);
    if (chapterIndex < chapters.length - 1) {
      const nextChapter = chapters[chapterIndex + 1];
      const nextChapterSlug = createSlug(nextChapter.name);
      // Check if next chapter has topics
      try {
        const nextChapterTopics = await fetchTopicsByChapter(nextChapter._id);
        if (nextChapterTopics.length > 0) {
          const firstTopic = nextChapterTopics[0];
          const firstTopicSlug = createSlug(firstTopic.name);
          // Check if first topic has subtopics
          try {
            const firstTopicSubtopics = await fetchSubTopicsByTopic(
              firstTopic._id
            );
            if (firstTopicSubtopics.length > 0) {
              const firstSubTopic = firstTopicSubtopics[0];
              const firstSubTopicSlug = createSlug(firstSubTopic.name);
              // Check if first subtopic has definitions
              try {
                const definitions = await fetchDefinitionsBySubTopic(
                  firstSubTopic._id
                );
                if (definitions.length > 0) {
                  return {
                    url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextChapterSlug}/${firstTopicSlug}/${firstSubTopicSlug}/${createSlug(
                      definitions[0].name
                    )}`,
                    label: `${nextChapter.name} > ${firstTopic.name} > ${firstSubTopic.name} > ${definitions[0].name}`,
                    type: "definition",
                  };
                }
              } catch (error) {
                // Continue without definitions
              }
              return {
                url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextChapterSlug}/${firstTopicSlug}/${firstSubTopicSlug}`,
                label: `${nextChapter.name} > ${firstTopic.name} > ${firstSubTopic.name}`,
                type: "subtopic",
              };
            }
          } catch (error) {}
          // First topic has no subtopics, go to topic page
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextChapterSlug}/${firstTopicSlug}`,
            label: `${nextChapter.name} > ${firstTopic.name}`,
            type: "topic",
          };
        }
      } catch (error) {}
      // No topics in next chapter, go to chapter page
      return {
        url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextChapterSlug}`,
        label: nextChapter.name,
        type: "chapter",
      };
    }
  } catch (error) {
    logger.error("Error fetching next chapter:", {
      error: error.message,
      context: { chapterId, unitId },
    });
  }

  // 6. Try next unit in same subject
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    const unitIndex = units.findIndex((u) => u._id === unitId);
    if (unitIndex < units.length - 1) {
      const nextUnit = units[unitIndex + 1];
      const nextUnitSlug = createSlug(nextUnit.name);
      // Check if next unit has chapters
      try {
        const nextUnitChapters = await fetchChaptersByUnit(nextUnit._id);
        if (nextUnitChapters.length > 0) {
          const firstChapter = nextUnitChapters[0];
          const firstChapterSlug = createSlug(firstChapter.name);
          // Check if first chapter has topics
          try {
            const firstChapterTopics = await fetchTopicsByChapter(
              firstChapter._id
            );
            if (firstChapterTopics.length > 0) {
              const firstTopic = firstChapterTopics[0];
              const firstTopicSlug = createSlug(firstTopic.name);
              // Check if first topic has subtopics
              try {
                const firstTopicSubtopics = await fetchSubTopicsByTopic(
                  firstTopic._id
                );
                if (firstTopicSubtopics.length > 0) {
                  const firstSubTopic = firstTopicSubtopics[0];
                  const firstSubTopicSlug = createSlug(firstSubTopic.name);
                  // Check if first subtopic has definitions
                  try {
                    const definitions = await fetchDefinitionsBySubTopic(
                      firstSubTopic._id
                    );
                    if (definitions.length > 0) {
                      return {
                        url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}/${firstChapterSlug}/${firstTopicSlug}/${firstSubTopicSlug}/${createSlug(
                          definitions[0].name
                        )}`,
                        label: `${nextUnit.name} > ${firstChapter.name} > ${firstTopic.name} > ${firstSubTopic.name} > ${definitions[0].name}`,
                        type: "definition",
                      };
                    }
                  } catch (error) {
                    // Continue without definitions
                  }
                  return {
                    url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}/${firstChapterSlug}/${firstTopicSlug}/${firstSubTopicSlug}`,
                    label: `${nextUnit.name} > ${firstChapter.name} > ${firstTopic.name} > ${firstSubTopic.name}`,
                    type: "subtopic",
                  };
                }
              } catch (error) {}
              // First topic has no subtopics, go to topic page
              return {
                url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}/${firstChapterSlug}/${firstTopicSlug}`,
                label: `${nextUnit.name} > ${firstChapter.name} > ${firstTopic.name}`,
                type: "topic",
              };
            }
          } catch (error) {
            // Continue without topics
          }
          // No topics in first chapter, go to chapter page
          return {
            url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}/${firstChapterSlug}`,
            label: `${nextUnit.name} > ${firstChapter.name}`,
            type: "chapter",
          };
        }
      } catch (error) {}
      // No chapters in next unit, go to unit page
      return {
        url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}`,
        label: nextUnit.name,
        type: "unit",
      };
    }
  } catch (error) {
    logger.error("Error fetching next unit:", {
      error: error.message,
      context: { unitId, subjectId },
    });
  }

  // 6. Try next subject in same exam
  try {
    const subjects = await fetchSubjectsByExam(examId);
    const subjectIndex = subjects.findIndex((s) => s._id === subjectId);
    if (subjectIndex < subjects.length - 1) {
      const nextSubject = subjects[subjectIndex + 1];
      const nextSubjectSlug = createSlug(nextSubject.name);
      // Check if next subject has units
      try {
        const nextSubjectUnits = await fetchUnitsBySubject(
          nextSubject._id,
          examId
        );
        if (nextSubjectUnits.length > 0) {
          const firstUnit = nextSubjectUnits[0];
          const firstUnitSlug = createSlug(firstUnit.name);
          // Check if first unit has chapters
          try {
            const firstUnitChapters = await fetchChaptersByUnit(firstUnit._id);
            if (firstUnitChapters.length > 0) {
              const firstChapter = firstUnitChapters[0];
              const firstChapterSlug = createSlug(firstChapter.name);
              // Check if first chapter has topics
              try {
                const firstChapterTopics = await fetchTopicsByChapter(
                  firstChapter._id
                );
                if (firstChapterTopics.length > 0) {
                  const firstTopic = firstChapterTopics[0];
                  const firstTopicSlug = createSlug(firstTopic.name);
                  // Check if first topic has subtopics
                  try {
                    const firstTopicSubtopics = await fetchSubTopicsByTopic(
                      firstTopic._id
                    );
                    if (firstTopicSubtopics.length > 0) {
                      const firstSubTopic = firstTopicSubtopics[0];
                      const firstSubTopicSlug = createSlug(firstSubTopic.name);
                      // Check if first subtopic has definitions
                      try {
                        const definitions = await fetchDefinitionsBySubTopic(
                          firstSubTopic._id
                        );
                        if (definitions.length > 0) {
                          return {
                            url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}/${firstTopicSlug}/${firstSubTopicSlug}/${createSlug(
                              definitions[0].name
                            )}`,
                            label: `${nextSubject.name} > ${firstUnit.name} > ${firstChapter.name} > ${firstTopic.name} > ${firstSubTopic.name} > ${definitions[0].name}`,
                            type: "definition",
                          };
                        }
                      } catch (error) {
                        // Continue without definitions
                      }
                      return {
                        url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}/${firstTopicSlug}/${firstSubTopicSlug}`,
                        label: `${nextSubject.name} > ${firstUnit.name} > ${firstChapter.name} > ${firstTopic.name} > ${firstSubTopic.name}`,
                        type: "subtopic",
                      };
                    }
                  } catch (error) {}
                  // First topic has no subtopics, go to topic page
                  return {
                    url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}/${firstTopicSlug}`,
                    label: `${nextSubject.name} > ${firstUnit.name} > ${firstChapter.name} > ${firstTopic.name}`,
                    type: "topic",
                  };
                }
              } catch (error) {
                // Continue without topics
              }
              // No topics in first chapter, go to chapter page
              return {
                url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}`,
                label: `${nextSubject.name} > ${firstUnit.name} > ${firstChapter.name}`,
                type: "chapter",
              };
            }
          } catch (error) {
            // Continue without chapters
          }
          // No chapters in first unit, go to unit page
          return {
            url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}`,
            label: `${nextSubject.name} > ${firstUnit.name}`,
            type: "unit",
          };
        }
      } catch (error) {}
      // No units in next subject, go to subject page
      return {
        url: `/${examSlug}/${nextSubjectSlug}`,
        label: nextSubject.name,
        type: "subject",
      };
    }
  } catch (error) {
    logger.error("Error fetching next subject:", {
      error: error.message,
      context: { subjectId, examId },
    });
  }

  // 7. Try next exam
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex < exams.length - 1) {
      const nextExam = exams[examIndex + 1];
      const nextExamSlug = createSlug(nextExam.name);
      // Check if next exam has subjects
      try {
        const nextExamSubjects = await fetchSubjectsByExam(nextExam._id);
        if (nextExamSubjects.length > 0) {
          const firstSubject = nextExamSubjects[0];
          const firstSubjectSlug = createSlug(firstSubject.name);
          // Check if first subject has units
          try {
            const firstSubjectUnits = await fetchUnitsBySubject(
              firstSubject._id,
              nextExam._id
            );
            if (firstSubjectUnits.length > 0) {
              const firstUnit = firstSubjectUnits[0];
              const firstUnitSlug = createSlug(firstUnit.name);
              // Check if first unit has chapters
              try {
                const firstUnitChapters = await fetchChaptersByUnit(
                  firstUnit._id
                );
                if (firstUnitChapters.length > 0) {
                  const firstChapter = firstUnitChapters[0];
                  const firstChapterSlug = createSlug(firstChapter.name);
                  // Check if first chapter has topics
                  try {
                    const firstChapterTopics = await fetchTopicsByChapter(
                      firstChapter._id
                    );
                    if (firstChapterTopics.length > 0) {
                      const firstTopic = firstChapterTopics[0];
                      const firstTopicSlug = createSlug(firstTopic.name);
                      // Check if first topic has subtopics
                      try {
                        const firstTopicSubtopics = await fetchSubTopicsByTopic(
                          firstTopic._id
                        );
                        if (firstTopicSubtopics.length > 0) {
                          const firstSubTopic = firstTopicSubtopics[0];
                          const firstSubTopicSlug = createSlug(
                            firstSubTopic.name
                          );
                          // Go to first subtopic page, not definition
                          return {
                            url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}/${firstTopicSlug}/${firstSubTopicSlug}`,
                            label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name} > ${firstChapter.name} > ${firstTopic.name} > ${firstSubTopic.name}`,
                            type: "subtopic",
                          };
                        }
                      } catch (error) {}
                      // First topic has no subtopics, go to topic page
                      return {
                        url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}/${firstTopicSlug}`,
                        label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name} > ${firstChapter.name} > ${firstTopic.name}`,
                        type: "topic",
                      };
                    }
                  } catch (error) {
                    // Continue without topics
                  }
                  // No topics in first chapter, go to chapter page
                  return {
                    url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}`,
                    label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name} > ${firstChapter.name}`,
                    type: "chapter",
                  };
                }
              } catch (error) {
                // Continue without chapters
              }
              // No chapters in first unit, go to unit page
              return {
                url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}`,
                label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name}`,
                type: "unit",
              };
            }
          } catch (error) {
            // Continue without units
          }
          // No units in first subject, go to subject page
          return {
            url: `/${nextExamSlug}/${firstSubjectSlug}`,
            label: `${nextExam.name} > ${firstSubject.name}`,
            type: "subject",
          };
        }
      } catch (error) {}
      // No subjects in next exam, go to exam page
      return {
        url: `/${nextExamSlug}`,
        label: nextExam.name,
        type: "exam",
      };
    }
  } catch (error) {
    logger.error("Error fetching next exam:", {
      error: error.message,
      context: { examId },
    });
  }

  return null;
}

/**
 * Get previous navigation for Subtopic level
 */
export async function getPreviousSubtopic({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  topicId,
  topicSlug,
  subTopicId,
  subTopicSlug,
  currentIndex,
  allItems,
}) {
  // 1. Check if current subtopic has definitions - if yes, go to last definition
  if (subTopicId) {
    try {
      const definitions = await fetchDefinitionsBySubTopic(subTopicId);
      if (definitions.length > 0) {
        const lastDefinition = definitions[definitions.length - 1];
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${subTopicSlug}/${createSlug(
            lastDefinition.name
          )}`,
          label: `${allItems[currentIndex]?.name || "SubTopic"} > ${
            lastDefinition.name
          }`,
          type: "definition",
        };
      }
    } catch (error) {
      logger.error("Error fetching definitions for subtopic:", {
        error: error.message,
        context: { subTopicId },
      });
    }
  }

  // 2. Try previous subtopic in same topic
  if (currentIndex !== undefined && currentIndex > 0) {
    const prev = allItems[currentIndex - 1];
    const prevSlug = createSlug(prev.name);
    try {
      // Check if previous subtopic has definitions
      const definitions = await fetchDefinitionsBySubTopic(prev._id);
      if (definitions.length > 0) {
        const lastDefinition = definitions[definitions.length - 1];
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${prevSlug}/${createSlug(
            lastDefinition.name
          )}`,
          label: `${prev.name} > ${lastDefinition.name}`,
          type: "definition",
        };
      }
    } catch (error) {
      // Continue without definitions
    }
    return {
      url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${prevSlug}`,
      label: prev.name,
      type: "subtopic",
    };
  }

  // 3. Try previous topic in same chapter
  try {
    const topics = await fetchTopicsByChapter(chapterId);
    const topicIndex = topics.findIndex((t) => t._id === topicId);
    if (topicIndex > 0) {
      const prevTopic = topics[topicIndex - 1];
      const prevTopicSlug = createSlug(prevTopic.name);
      const subtopics = await fetchSubTopicsByTopic(prevTopic._id);
      if (subtopics.length > 0) {
        const lastSubtopic = subtopics[subtopics.length - 1];
        const lastSubtopicSlug = createSlug(lastSubtopic.name);
        // Check if last subtopic has definitions
        try {
          const definitions = await fetchDefinitionsBySubTopic(
            lastSubtopic._id
          );
          if (definitions.length > 0) {
            const lastDefinition = definitions[definitions.length - 1];
            return {
              url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${prevTopicSlug}/${lastSubtopicSlug}/${createSlug(
                lastDefinition.name
              )}`,
              label: `${prevTopic.name} > ${lastSubtopic.name} > ${lastDefinition.name}`,
              type: "definition",
            };
          }
        } catch (error) {
          // Continue without definitions
        }
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${prevTopicSlug}/${lastSubtopicSlug}`,
          label: `${prevTopic.name} > ${lastSubtopic.name}`,
          type: "subtopic",
        };
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${prevTopicSlug}`,
          label: prevTopic.name,
          type: "topic",
        };
      }
    }
  } catch (error) {
    logger.error("Error fetching previous topic:", {
      error: error.message,
      context: { topicId, chapterId },
    });
  }

  // 3. Try previous chapter in same unit
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    const chapterIndex = chapters.findIndex((c) => c._id === chapterId);
    if (chapterIndex > 0) {
      const prevChapter = chapters[chapterIndex - 1];
      const prevChapterSlug = createSlug(prevChapter.name);
      const topics = await fetchTopicsByChapter(prevChapter._id);
      if (topics.length > 0) {
        const lastTopic = topics[topics.length - 1];
        const lastTopicSlug = createSlug(lastTopic.name);
        const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
        if (subtopics.length > 0) {
          const lastSubtopic = subtopics[subtopics.length - 1];
          const lastSubtopicSlug = createSlug(lastSubtopic.name);
          // Check if last subtopic has definitions
          try {
            const definitions = await fetchDefinitionsBySubTopic(
              lastSubtopic._id
            );
            if (definitions.length > 0) {
              const lastDefinition = definitions[definitions.length - 1];
              return {
                url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}/${createSlug(
                  lastDefinition.name
                )}`,
                label: `${prevChapter.name} > ${lastTopic.name} > ${lastSubtopic.name} > ${lastDefinition.name}`,
                type: "definition",
              };
            }
          } catch (error) {}
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}`,
            label: `${prevChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
            type: "subtopic",
          };
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}/${lastTopicSlug}`,
            label: `${prevChapter.name} > ${lastTopic.name}`,
            type: "topic",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}`,
          label: prevChapter.name,
          type: "chapter",
        };
      }
    }
  } catch (error) {
    logger.error("Error fetching previous chapter:", {
      error: error.message,
      context: { chapterId, unitId },
    });
  }

  // 4. Try previous unit
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    const unitIndex = units.findIndex((u) => u._id === unitId);
    if (unitIndex > 0) {
      const prevUnit = units[unitIndex - 1];
      const prevUnitSlug = createSlug(prevUnit.name);
      const chapters = await fetchChaptersByUnit(prevUnit._id);
      if (chapters.length > 0) {
        const lastChapter = chapters[chapters.length - 1];
        const lastChapterSlug = createSlug(lastChapter.name);
        const topics = await fetchTopicsByChapter(lastChapter._id);
        if (topics.length > 0) {
          const lastTopic = topics[topics.length - 1];
          const lastTopicSlug = createSlug(lastTopic.name);
          const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
          if (subtopics.length > 0) {
            const lastSubtopic = subtopics[subtopics.length - 1];
            const lastSubtopicSlug = createSlug(lastSubtopic.name);
            // Check if last subtopic has definitions
            try {
              const definitions = await fetchDefinitionsBySubTopic(
                lastSubtopic._id
              );
              if (definitions.length > 0) {
                const lastDefinition = definitions[definitions.length - 1];
                return {
                  url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}/${createSlug(
                    lastDefinition.name
                  )}`,
                  label: `${prevUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name} > ${lastDefinition.name}`,
                  type: "definition",
                };
              }
            } catch (error) {
              // Continue without definitions
            }
            return {
              url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}`,
              label: `${prevUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
              type: "subtopic",
            };
          } else {
            return {
              url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}/${lastTopicSlug}`,
              label: `${prevUnit.name} > ${lastChapter.name} > ${lastTopic.name}`,
              type: "topic",
            };
          }
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}`,
            label: `${prevUnit.name} > ${lastChapter.name}`,
            type: "chapter",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}`,
          label: prevUnit.name,
          type: "unit",
        };
      }
    }
  } catch (error) {
    logger.error("Error fetching previous unit:", {
      error: error.message,
      context: { unitId, subjectId },
    });
  }

  // 5. Try previous subject
  try {
    const subjects = await fetchSubjectsByExam(examId);
    const subjectIndex = subjects.findIndex((s) => s._id === subjectId);
    if (subjectIndex > 0) {
      const prevSubject = subjects[subjectIndex - 1];
      const prevSubjectSlug = createSlug(prevSubject.name);
      const units = await fetchUnitsBySubject(prevSubject._id, examId);
      if (units.length > 0) {
        const lastUnit = units[units.length - 1];
        const lastUnitSlug = createSlug(lastUnit.name);
        const chapters = await fetchChaptersByUnit(lastUnit._id);
        if (chapters.length > 0) {
          const lastChapter = chapters[chapters.length - 1];
          const lastChapterSlug = createSlug(lastChapter.name);
          const topics = await fetchTopicsByChapter(lastChapter._id);
          if (topics.length > 0) {
            const lastTopic = topics[topics.length - 1];
            const lastTopicSlug = createSlug(lastTopic.name);
            const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
            if (subtopics.length > 0) {
              const lastSubtopic = subtopics[subtopics.length - 1];
              const lastSubtopicSlug = createSlug(lastSubtopic.name);
              // Check if last subtopic has definitions
              try {
                const definitions = await fetchDefinitionsBySubTopic(
                  lastSubtopic._id
                );
                if (definitions.length > 0) {
                  const lastDefinition = definitions[definitions.length - 1];
                  return {
                    url: `/${examSlug}/${prevSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}/${createSlug(
                      lastDefinition.name
                    )}`,
                    label: `${prevSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name} > ${lastDefinition.name}`,
                    type: "definition",
                  };
                }
              } catch (error) {
                // Continue without definitions
              }
              return {
                url: `/${examSlug}/${prevSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}`,
                label: `${prevSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
                type: "subtopic",
              };
            } else {
              return {
                url: `/${examSlug}/${prevSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}`,
                label: `${prevSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name}`,
                type: "topic",
              };
            }
          } else {
            return {
              url: `/${examSlug}/${prevSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}`,
              label: `${prevSubject.name} > ${lastUnit.name} > ${lastChapter.name}`,
              type: "chapter",
            };
          }
        } else {
          return {
            url: `/${examSlug}/${prevSubjectSlug}/${lastUnitSlug}`,
            label: `${prevSubject.name} > ${lastUnit.name}`,
            type: "unit",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${prevSubjectSlug}`,
          label: prevSubject.name,
          type: "subject",
        };
      }
    }
  } catch (error) {
    logger.error("Error fetching previous subject:", {
      error: error.message,
      context: { subjectId, examId },
    });
  }

  // 6. Try previous exam
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex > 0) {
      const prevExam = exams[examIndex - 1];
      const prevExamSlug = createSlug(prevExam.name);
      const subjects = await fetchSubjectsByExam(prevExam._id);
      if (subjects.length > 0) {
        const lastSubject = subjects[subjects.length - 1];
        const lastSubjectSlug = createSlug(lastSubject.name);
        const units = await fetchUnitsBySubject(lastSubject._id, prevExam._id);
        if (units.length > 0) {
          const lastUnit = units[units.length - 1];
          const lastUnitSlug = createSlug(lastUnit.name);
          const chapters = await fetchChaptersByUnit(lastUnit._id);
          if (chapters.length > 0) {
            const lastChapter = chapters[chapters.length - 1];
            const lastChapterSlug = createSlug(lastChapter.name);
            const topics = await fetchTopicsByChapter(lastChapter._id);
            if (topics.length > 0) {
              const lastTopic = topics[topics.length - 1];
              const lastTopicSlug = createSlug(lastTopic.name);
              const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
              if (subtopics.length > 0) {
                const lastSubtopic = subtopics[subtopics.length - 1];
                const lastSubtopicSlug = createSlug(lastSubtopic.name);
                // Check if last subtopic has definitions
                try {
                  const definitions = await fetchDefinitionsBySubTopic(
                    lastSubtopic._id
                  );
                  if (definitions.length > 0) {
                    const lastDefinition = definitions[definitions.length - 1];
                    return {
                      url: `/${prevExamSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}/${createSlug(
                        lastDefinition.name
                      )}`,
                      label: `${prevExam.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name} > ${lastDefinition.name}`,
                      type: "definition",
                    };
                  }
                } catch (error) {
                  // Continue without definitions
                }
                return {
                  url: `/${prevExamSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}`,
                  label: `${prevExam.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
                  type: "subtopic",
                };
              } else {
                return {
                  url: `/${prevExamSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}`,
                  label: `${prevExam.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name}`,
                  type: "topic",
                };
              }
            } else {
              return {
                url: `/${prevExamSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}`,
                label: `${prevExam.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name}`,
                type: "chapter",
              };
            }
          } else {
            return {
              url: `/${prevExamSlug}/${lastSubjectSlug}/${lastUnitSlug}`,
              label: `${prevExam.name} > ${lastSubject.name} > ${lastUnit.name}`,
              type: "unit",
            };
          }
        } else {
          return {
            url: `/${prevExamSlug}/${lastSubjectSlug}`,
            label: `${prevExam.name} > ${lastSubject.name}`,
            type: "subject",
          };
        }
      } else {
        return {
          url: `/${prevExamSlug}`,
          label: prevExam.name,
          type: "exam",
        };
      }
    }
  } catch (error) {
    logger.error("Error fetching previous exam:", {
      error: error.message,
      context: { examId },
    });
  }

  return null;
}

/**
 * Get next navigation for Topic level
 */
export async function getNextTopic({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  topicId,
  topicSlug,
  currentIndex,
  allItems,
}) {
  // 1. First check if current topic has subtopics - if yes, go to first subtopic page
  try {
    const currentTopicSubtopics = await fetchSubTopicsByTopic(topicId);
    if (currentTopicSubtopics.length > 0) {
      const firstSubTopic = currentTopicSubtopics[0];
      const firstSubTopicSlug = createSlug(firstSubTopic.name);
      return {
        url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${firstSubTopicSlug}`,
        label: firstSubTopic.name,
        type: "subtopic",
      };
    }
  } catch (error) {}

  // 2. If no subtopics in current topic, go to next topic in same chapter
  if (currentIndex !== undefined && currentIndex < allItems.length - 1) {
    const next = allItems[currentIndex + 1];
    const nextSlug = createSlug(next.name);
    // Check if next topic has subtopics
    try {
      const subtopics = await fetchSubTopicsByTopic(next._id);
      if (subtopics.length > 0) {
        const firstSubTopic = subtopics[0];
        const firstSubTopicSlug = createSlug(firstSubTopic.name);
        // Go to first subtopic page, not definition
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${nextSlug}/${firstSubTopicSlug}`,
          label: `${next.name} > ${firstSubTopic.name}`,
          type: "subtopic",
        };
      }
    } catch (error) {}
    // Next topic has no subtopics, go to topic page
    return {
      url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${nextSlug}`,
      label: next.name,
      type: "topic",
    };
  }

  // 3. Try next chapter in same unit
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    const chapterIndex = chapters.findIndex((c) => c._id === chapterId);
    if (chapterIndex < chapters.length - 1) {
      const nextChapter = chapters[chapterIndex + 1];
      const nextChapterSlug = createSlug(nextChapter.name);
      // Check if next chapter has topics
      try {
        const nextChapterTopics = await fetchTopicsByChapter(nextChapter._id);
        if (nextChapterTopics.length > 0) {
          const firstTopic = nextChapterTopics[0];
          const firstTopicSlug = createSlug(firstTopic.name);
          // Check if first topic has subtopics
          try {
            const firstTopicSubtopics = await fetchSubTopicsByTopic(
              firstTopic._id
            );
            if (firstTopicSubtopics.length > 0) {
              const firstSubTopic = firstTopicSubtopics[0];
              const firstSubTopicSlug = createSlug(firstSubTopic.name);
              // Go to first subtopic page, not definition
              return {
                url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextChapterSlug}/${firstTopicSlug}/${firstSubTopicSlug}`,
                label: `${nextChapter.name} > ${firstTopic.name} > ${firstSubTopic.name}`,
                type: "subtopic",
              };
            }
          } catch (error) {}
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextChapterSlug}/${firstTopicSlug}`,
            label: `${nextChapter.name} > ${firstTopic.name}`,
            type: "topic",
          };
        }
      } catch (error) {}
      return {
        url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextChapterSlug}`,
        label: nextChapter.name,
        type: "chapter",
      };
    }
  } catch (error) {
    logger.error("Error fetching next chapter:", {
      error: error.message,
      context: { chapterId, unitId },
    });
  }

  // 4. Try next unit in same subject
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    const unitIndex = units.findIndex((u) => u._id === unitId);
    if (unitIndex < units.length - 1) {
      const nextUnit = units[unitIndex + 1];
      const nextUnitSlug = createSlug(nextUnit.name);
      // Check if next unit has chapters
      try {
        const nextUnitChapters = await fetchChaptersByUnit(nextUnit._id);
        if (nextUnitChapters.length > 0) {
          const firstChapter = nextUnitChapters[0];
          const firstChapterSlug = createSlug(firstChapter.name);
          // Check if first chapter has topics
          try {
            const firstChapterTopics = await fetchTopicsByChapter(
              firstChapter._id
            );
            if (firstChapterTopics.length > 0) {
              const firstTopic = firstChapterTopics[0];
              const firstTopicSlug = createSlug(firstTopic.name);
              // Check if first topic has subtopics
              try {
                const firstTopicSubtopics = await fetchSubTopicsByTopic(
                  firstTopic._id
                );
                if (firstTopicSubtopics.length > 0) {
                  const firstSubTopic = firstTopicSubtopics[0];
                  const firstSubTopicSlug = createSlug(firstSubTopic.name);
                  // Go to first subtopic page, not definition
                  return {
                    url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}/${firstChapterSlug}/${firstTopicSlug}/${firstSubTopicSlug}`,
                    label: `${nextUnit.name} > ${firstChapter.name} > ${firstTopic.name} > ${firstSubTopic.name}`,
                    type: "subtopic",
                  };
                }
              } catch (error) {}
              return {
                url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}/${firstChapterSlug}/${firstTopicSlug}`,
                label: `${nextUnit.name} > ${firstChapter.name} > ${firstTopic.name}`,
                type: "topic",
              };
            }
          } catch (error) {}
          return {
            url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}/${firstChapterSlug}`,
            label: `${nextUnit.name} > ${firstChapter.name}`,
            type: "chapter",
          };
        }
      } catch (error) {}
      return {
        url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}`,
        label: nextUnit.name,
        type: "unit",
      };
    }
  } catch (error) {
    logger.error("Error fetching next unit:", {
      error: error.message,
      context: { unitId, subjectId },
    });
  }

  // 5. Try next subject in same exam
  try {
    const subjects = await fetchSubjectsByExam(examId);
    const subjectIndex = subjects.findIndex((s) => s._id === subjectId);
    if (subjectIndex < subjects.length - 1) {
      const nextSubject = subjects[subjectIndex + 1];
      const nextSubjectSlug = createSlug(nextSubject.name);
      // Check if next subject has units
      try {
        const nextSubjectUnits = await fetchUnitsBySubject(
          nextSubject._id,
          examId
        );
        if (nextSubjectUnits.length > 0) {
          const firstUnit = nextSubjectUnits[0];
          const firstUnitSlug = createSlug(firstUnit.name);
          // Check if first unit has chapters
          try {
            const firstUnitChapters = await fetchChaptersByUnit(firstUnit._id);
            if (firstUnitChapters.length > 0) {
              const firstChapter = firstUnitChapters[0];
              const firstChapterSlug = createSlug(firstChapter.name);
              // Check if first chapter has topics
              try {
                const firstChapterTopics = await fetchTopicsByChapter(
                  firstChapter._id
                );
                if (firstChapterTopics.length > 0) {
                  const firstTopic = firstChapterTopics[0];
                  const firstTopicSlug = createSlug(firstTopic.name);
                  // Check if first topic has subtopics
                  try {
                    const firstTopicSubtopics = await fetchSubTopicsByTopic(
                      firstTopic._id
                    );
                    if (firstTopicSubtopics.length > 0) {
                      const firstSubTopic = firstTopicSubtopics[0];
                      const firstSubTopicSlug = createSlug(firstSubTopic.name);
                      // Go to first subtopic page, not definition
                      return {
                        url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}/${firstTopicSlug}/${firstSubTopicSlug}`,
                        label: `${nextSubject.name} > ${firstUnit.name} > ${firstChapter.name} > ${firstTopic.name} > ${firstSubTopic.name}`,
                        type: "subtopic",
                      };
                    }
                  } catch (error) {}
                  return {
                    url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}/${firstTopicSlug}`,
                    label: `${nextSubject.name} > ${firstUnit.name} > ${firstChapter.name} > ${firstTopic.name}`,
                    type: "topic",
                  };
                }
              } catch (error) {}
              return {
                url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}`,
                label: `${nextSubject.name} > ${firstUnit.name} > ${firstChapter.name}`,
                type: "chapter",
              };
            }
          } catch (error) {}
          return {
            url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}`,
            label: `${nextSubject.name} > ${firstUnit.name}`,
            type: "unit",
          };
        }
      } catch (error) {}
      return {
        url: `/${examSlug}/${nextSubjectSlug}`,
        label: nextSubject.name,
        type: "subject",
      };
    }
  } catch (error) {
    logger.error("Error fetching next subject:", {
      error: error.message,
      context: { subjectId, examId },
    });
  }

  // 6. Try next exam
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex < exams.length - 1) {
      const nextExam = exams[examIndex + 1];
      const nextExamSlug = createSlug(nextExam.name);
      // Check if next exam has subjects
      try {
        const nextExamSubjects = await fetchSubjectsByExam(nextExam._id);
        if (nextExamSubjects.length > 0) {
          const firstSubject = nextExamSubjects[0];
          const firstSubjectSlug = createSlug(firstSubject.name);
          // Check if first subject has units
          try {
            const firstSubjectUnits = await fetchUnitsBySubject(
              firstSubject._id,
              nextExam._id
            );
            if (firstSubjectUnits.length > 0) {
              const firstUnit = firstSubjectUnits[0];
              const firstUnitSlug = createSlug(firstUnit.name);
              // Check if first unit has chapters
              try {
                const firstUnitChapters = await fetchChaptersByUnit(
                  firstUnit._id
                );
                if (firstUnitChapters.length > 0) {
                  const firstChapter = firstUnitChapters[0];
                  const firstChapterSlug = createSlug(firstChapter.name);
                  // Check if first chapter has topics
                  try {
                    const firstChapterTopics = await fetchTopicsByChapter(
                      firstChapter._id
                    );
                    if (firstChapterTopics.length > 0) {
                      const firstTopic = firstChapterTopics[0];
                      const firstTopicSlug = createSlug(firstTopic.name);
                      // Check if first topic has subtopics
                      try {
                        const firstTopicSubtopics = await fetchSubTopicsByTopic(
                          firstTopic._id
                        );
                        if (firstTopicSubtopics.length > 0) {
                          const firstSubTopic = firstTopicSubtopics[0];
                          const firstSubTopicSlug = createSlug(
                            firstSubTopic.name
                          );
                          // Go to first subtopic page, not definition
                          return {
                            url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}/${firstTopicSlug}/${firstSubTopicSlug}`,
                            label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name} > ${firstChapter.name} > ${firstTopic.name} > ${firstSubTopic.name}`,
                            type: "subtopic",
                          };
                        }
                      } catch (error) {}
                      return {
                        url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}/${firstTopicSlug}`,
                        label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name} > ${firstChapter.name} > ${firstTopic.name}`,
                        type: "topic",
                      };
                    }
                  } catch (error) {
                    // Continue without topics
                  }
                  return {
                    url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}`,
                    label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name} > ${firstChapter.name}`,
                    type: "chapter",
                  };
                }
              } catch (error) {
                // Continue without chapters
              }
              return {
                url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}`,
                label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name}`,
                type: "unit",
              };
            }
          } catch (error) {
            // Continue without units
          }
          return {
            url: `/${nextExamSlug}/${firstSubjectSlug}`,
            label: `${nextExam.name} > ${firstSubject.name}`,
            type: "subject",
          };
        }
      } catch (error) {}
      return {
        url: `/${nextExamSlug}`,
        label: nextExam.name,
        type: "exam",
      };
    }
  } catch (error) {
    logger.error("Error fetching next exam:", {
      error: error.message,
      context: { examId },
    });
  }

  return null;
}

/**
 * Get previous navigation for Topic level
 */
export async function getPreviousTopic({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  topicId,
  topicSlug,
  currentIndex,
  allItems,
}) {
  // 1. First check if current topic has subtopics - if yes, go to last subtopic or definition
  try {
    const currentTopicSubtopics = await fetchSubTopicsByTopic(topicId);
    if (currentTopicSubtopics.length > 0) {
      const lastSubtopic =
        currentTopicSubtopics[currentTopicSubtopics.length - 1];
      const lastSubtopicSlug = createSlug(lastSubtopic.name);
      const definitions = await fetchDefinitionsBySubTopic(lastSubtopic._id);
      if (definitions.length > 0) {
        const lastDefinition = definitions[definitions.length - 1];
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${lastSubtopicSlug}/${createSlug(
            lastDefinition.name
          )}`,
          label: `${allItems[currentIndex]?.name || "Topic"} > ${
            lastSubtopic.name
          } > ${lastDefinition.name}`,
          type: "definition",
        };
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${lastSubtopicSlug}`,
          label: `${allItems[currentIndex]?.name || "Topic"} > ${
            lastSubtopic.name
          }`,
          type: "subtopic",
        };
      }
    }
  } catch (error) {}

  // 2. If no subtopics in current topic, try previous topic in same chapter
  if (currentIndex !== undefined && currentIndex > 0) {
    const prev = allItems[currentIndex - 1];
    const prevSlug = createSlug(prev.name);
    try {
      const subtopics = await fetchSubTopicsByTopic(prev._id);
      if (subtopics.length > 0) {
        const lastSubtopic = subtopics[subtopics.length - 1];
        const lastSubtopicSlug = createSlug(lastSubtopic.name);
        const definitions = await fetchDefinitionsBySubTopic(lastSubtopic._id);
        if (definitions.length > 0) {
          const lastDefinition = definitions[definitions.length - 1];
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${prevSlug}/${lastSubtopicSlug}/${createSlug(
              lastDefinition.name
            )}`,
            label: `${prev.name} > ${lastSubtopic.name} > ${lastDefinition.name}`,
            type: "definition",
          };
        }
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${prevSlug}/${lastSubtopicSlug}`,
          label: `${prev.name} > ${lastSubtopic.name}`,
          type: "subtopic",
        };
      }
    } catch (error) {}
    return {
      url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${prevSlug}`,
      label: prev.name,
      type: "topic",
    };
  }

  // 3. Try previous chapter in same unit
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    const chapterIndex = chapters.findIndex((c) => c._id === chapterId);
    if (chapterIndex > 0) {
      const prevChapter = chapters[chapterIndex - 1];
      const prevChapterSlug = createSlug(prevChapter.name);
      const topics = await fetchTopicsByChapter(prevChapter._id);
      if (topics.length > 0) {
        const lastTopic = topics[topics.length - 1];
        const lastTopicSlug = createSlug(lastTopic.name);
        const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
        if (subtopics.length > 0) {
          const lastSubtopic = subtopics[subtopics.length - 1];
          const lastSubtopicSlug = createSlug(lastSubtopic.name);
          // Check if last subtopic has definitions
          try {
            const definitions = await fetchDefinitionsBySubTopic(
              lastSubtopic._id
            );
            if (definitions.length > 0) {
              const lastDefinition = definitions[definitions.length - 1];
              return {
                url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}/${createSlug(
                  lastDefinition.name
                )}`,
                label: `${prevChapter.name} > ${lastTopic.name} > ${lastSubtopic.name} > ${lastDefinition.name}`,
                type: "definition",
              };
            }
          } catch (error) {}
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}`,
            label: `${prevChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
            type: "subtopic",
          };
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}/${lastTopicSlug}`,
            label: `${prevChapter.name} > ${lastTopic.name}`,
            type: "topic",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}`,
          label: prevChapter.name,
          type: "chapter",
        };
      }
    }
  } catch (error) {
    logger.error("Error fetching previous chapter:", {
      error: error.message,
      context: { chapterId, unitId },
    });
  }

  // 4. Try previous unit in same subject
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    const unitIndex = units.findIndex((u) => u._id === unitId);
    if (unitIndex > 0) {
      const prevUnit = units[unitIndex - 1];
      const prevUnitSlug = createSlug(prevUnit.name);
      const chapters = await fetchChaptersByUnit(prevUnit._id);
      if (chapters.length > 0) {
        const lastChapter = chapters[chapters.length - 1];
        const lastChapterSlug = createSlug(lastChapter.name);
        const topics = await fetchTopicsByChapter(lastChapter._id);
        if (topics.length > 0) {
          const lastTopic = topics[topics.length - 1];
          const lastTopicSlug = createSlug(lastTopic.name);
          const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
          if (subtopics.length > 0) {
            const lastSubtopic = subtopics[subtopics.length - 1];
            const lastSubtopicSlug = createSlug(lastSubtopic.name);
            // Check if last subtopic has definitions
            try {
              const definitions = await fetchDefinitionsBySubTopic(
                lastSubtopic._id
              );
              if (definitions.length > 0) {
                const lastDefinition = definitions[definitions.length - 1];
                return {
                  url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}/${createSlug(
                    lastDefinition.name
                  )}`,
                  label: `${prevUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name} > ${lastDefinition.name}`,
                  type: "definition",
                };
              }
            } catch (error) {
              // Continue without definitions
            }
            return {
              url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}`,
              label: `${prevUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
              type: "subtopic",
            };
          } else {
            return {
              url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}/${lastTopicSlug}`,
              label: `${prevUnit.name} > ${lastChapter.name} > ${lastTopic.name}`,
              type: "topic",
            };
          }
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}`,
            label: `${prevUnit.name} > ${lastChapter.name}`,
            type: "chapter",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}`,
          label: prevUnit.name,
          type: "unit",
        };
      }
    }
  } catch (error) {
    logger.error("Error fetching previous unit:", {
      error: error.message,
      context: { unitId, subjectId },
    });
  }

  // 5. Try previous subject in same exam
  try {
    const subjects = await fetchSubjectsByExam(examId);
    const subjectIndex = subjects.findIndex((s) => s._id === subjectId);
    if (subjectIndex > 0) {
      const prevSubject = subjects[subjectIndex - 1];
      const prevSubjectSlug = createSlug(prevSubject.name);
      const units = await fetchUnitsBySubject(prevSubject._id, examId);
      if (units.length > 0) {
        const lastUnit = units[units.length - 1];
        const lastUnitSlug = createSlug(lastUnit.name);
        const chapters = await fetchChaptersByUnit(lastUnit._id);
        if (chapters.length > 0) {
          const lastChapter = chapters[chapters.length - 1];
          const lastChapterSlug = createSlug(lastChapter.name);
          const topics = await fetchTopicsByChapter(lastChapter._id);
          if (topics.length > 0) {
            const lastTopic = topics[topics.length - 1];
            const lastTopicSlug = createSlug(lastTopic.name);
            const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
            if (subtopics.length > 0) {
              const lastSubtopic = subtopics[subtopics.length - 1];
              const lastSubtopicSlug = createSlug(lastSubtopic.name);
              // Check if last subtopic has definitions
              try {
                const definitions = await fetchDefinitionsBySubTopic(
                  lastSubtopic._id
                );
                if (definitions.length > 0) {
                  const lastDefinition = definitions[definitions.length - 1];
                  return {
                    url: `/${examSlug}/${prevSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}/${createSlug(
                      lastDefinition.name
                    )}`,
                    label: `${prevSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name} > ${lastDefinition.name}`,
                    type: "definition",
                  };
                }
              } catch (error) {
                // Continue without definitions
              }
              return {
                url: `/${examSlug}/${prevSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}`,
                label: `${prevSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
                type: "subtopic",
              };
            } else {
              return {
                url: `/${examSlug}/${prevSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}`,
                label: `${prevSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name}`,
                type: "topic",
              };
            }
          } else {
            return {
              url: `/${examSlug}/${prevSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}`,
              label: `${prevSubject.name} > ${lastUnit.name} > ${lastChapter.name}`,
              type: "chapter",
            };
          }
        } else {
          return {
            url: `/${examSlug}/${prevSubjectSlug}/${lastUnitSlug}`,
            label: `${prevSubject.name} > ${lastUnit.name}`,
            type: "unit",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${prevSubjectSlug}`,
          label: prevSubject.name,
          type: "subject",
        };
      }
    }
  } catch (error) {
    logger.error("Error fetching previous subject:", {
      error: error.message,
      context: { subjectId, examId },
    });
  }

  // 6. Try previous exam
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex > 0) {
      const prevExam = exams[examIndex - 1];
      const prevExamSlug = createSlug(prevExam.name);
      const subjects = await fetchSubjectsByExam(prevExam._id);
      if (subjects.length > 0) {
        const lastSubject = subjects[subjects.length - 1];
        const lastSubjectSlug = createSlug(lastSubject.name);
        const units = await fetchUnitsBySubject(lastSubject._id, prevExam._id);
        if (units.length > 0) {
          const lastUnit = units[units.length - 1];
          const lastUnitSlug = createSlug(lastUnit.name);
          const chapters = await fetchChaptersByUnit(lastUnit._id);
          if (chapters.length > 0) {
            const lastChapter = chapters[chapters.length - 1];
            const lastChapterSlug = createSlug(lastChapter.name);
            const topics = await fetchTopicsByChapter(lastChapter._id);
            if (topics.length > 0) {
              const lastTopic = topics[topics.length - 1];
              const lastTopicSlug = createSlug(lastTopic.name);
              const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
              if (subtopics.length > 0) {
                const lastSubtopic = subtopics[subtopics.length - 1];
                const lastSubtopicSlug = createSlug(lastSubtopic.name);
                // Check if last subtopic has definitions
                try {
                  const definitions = await fetchDefinitionsBySubTopic(
                    lastSubtopic._id
                  );
                  if (definitions.length > 0) {
                    const lastDefinition = definitions[definitions.length - 1];
                    return {
                      url: `/${prevExamSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}/${createSlug(
                        lastDefinition.name
                      )}`,
                      label: `${prevExam.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name} > ${lastDefinition.name}`,
                      type: "definition",
                    };
                  }
                } catch (error) {
                  // Continue without definitions
                }
                return {
                  url: `/${prevExamSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${lastSubtopicSlug}`,
                  label: `${prevExam.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
                  type: "subtopic",
                };
              } else {
                return {
                  url: `/${prevExamSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}`,
                  label: `${prevExam.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name}`,
                  type: "topic",
                };
              }
            } else {
              return {
                url: `/${prevExamSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}`,
                label: `${prevExam.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name}`,
                type: "chapter",
              };
            }
          } else {
            return {
              url: `/${prevExamSlug}/${lastSubjectSlug}/${lastUnitSlug}`,
              label: `${prevExam.name} > ${lastSubject.name} > ${lastUnit.name}`,
              type: "unit",
            };
          }
        } else {
          return {
            url: `/${prevExamSlug}/${lastSubjectSlug}`,
            label: `${prevExam.name} > ${lastSubject.name}`,
            type: "subject",
          };
        }
      } else {
        return {
          url: `/${prevExamSlug}`,
          label: prevExam.name,
          type: "exam",
        };
      }
    }
  } catch (error) {
    logger.error("Error fetching previous exam:", {
      error: error.message,
      context: { examId },
    });
  }

  return null;
}

/**
 * Get previous navigation for Chapter level
 */
export async function getPreviousChapter({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try previous chapter in same unit
  if (currentIndex !== undefined && currentIndex > 0) {
    const prev = allItems[currentIndex - 1];
    const prevSlug = createSlug(prev.name);
    // Get last item in previous chapter
    try {
      const topics = await fetchTopicsByChapter(prev._id);
      if (topics.length > 0) {
        const lastTopic = topics[topics.length - 1];
        const lastTopicSlug = createSlug(lastTopic.name);
        const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
        if (subtopics.length > 0) {
          const lastSubtopic = subtopics[subtopics.length - 1];
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevSlug}/${lastTopicSlug}/${createSlug(
              lastSubtopic.name
            )}`,
            label: `${prev.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
            type: "subtopic",
          };
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevSlug}/${lastTopicSlug}`,
            label: `${prev.name} > ${lastTopic.name}`,
            type: "topic",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevSlug}`,
          label: prev.name,
          type: "chapter",
        };
      }
    } catch (error) {
      logger.error("Error fetching previous chapter items:", {
        error: error.message,
        context: { chapterId },
      });
    }
  }

  // 2. Try previous unit
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    const unitIndex = units.findIndex((u) => u._id === unitId);
    if (unitIndex > 0) {
      const prevUnit = units[unitIndex - 1];
      const prevUnitSlug = createSlug(prevUnit.name);
      const chapters = await fetchChaptersByUnit(prevUnit._id);
      if (chapters.length > 0) {
        const lastChapter = chapters[chapters.length - 1];
        const lastChapterSlug = createSlug(lastChapter.name);
        const topics = await fetchTopicsByChapter(lastChapter._id);
        if (topics.length > 0) {
          const lastTopic = topics[topics.length - 1];
          const lastTopicSlug = createSlug(lastTopic.name);
          const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
          if (subtopics.length > 0) {
            const lastSubtopic = subtopics[subtopics.length - 1];
            return {
              url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${createSlug(
                lastSubtopic.name
              )}`,
              label: `${prevUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
              type: "subtopic",
            };
          } else {
            return {
              url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}/${lastTopicSlug}`,
              label: `${prevUnit.name} > ${lastChapter.name} > ${lastTopic.name}`,
              type: "topic",
            };
          }
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}`,
            label: `${prevUnit.name} > ${lastChapter.name}`,
            type: "chapter",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}`,
          label: prevUnit.name,
          type: "unit",
        };
      }
    }
  } catch (error) {
    logger.error("Error fetching previous unit:", {
      error: error.message,
      context: { unitId, subjectId },
    });
  }

  return null;
}

/**
 * Get next navigation for Chapter level
 */
export async function getNextChapter({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try first topic in this chapter
  try {
    const topics = await fetchTopicsByChapter(chapterId);
    if (topics.length > 0) {
      const firstTopic = topics[0];
      const firstTopicSlug = createSlug(firstTopic.name);
      return {
        url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${firstTopicSlug}`,
        label: firstTopic.name,
        type: "topic",
      };
    }
  } catch (error) {
    logger.error("Error fetching topics:", {
      error: error.message,
      context: { chapterId },
    });
  }

  // 2. If no topics in this chapter, go to next chapter
  if (currentIndex !== undefined && currentIndex < allItems.length - 1) {
    const next = allItems[currentIndex + 1];
    const nextSlug = createSlug(next.name);
    // Check if next chapter has topics
    try {
      const nextChapterTopics = await fetchTopicsByChapter(next._id);
      if (nextChapterTopics.length > 0) {
        const firstTopic = nextChapterTopics[0];
        const firstTopicSlug = createSlug(firstTopic.name);
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextSlug}/${firstTopicSlug}`,
          label: `${next.name} > ${firstTopic.name}`,
          type: "topic",
        };
      }
    } catch (error) {
      // Continue without topics
    }
    // No topics in next chapter, just go to chapter page
    return {
      url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextSlug}`,
      label: next.name,
      type: "chapter",
    };
  }

  // 3. Try next unit in same subject
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    const unitIndex = units.findIndex((u) => u._id === unitId);
    if (unitIndex < units.length - 1) {
      const nextUnit = units[unitIndex + 1];
      const nextUnitSlug = createSlug(nextUnit.name);
      // Check if next unit has chapters
      try {
        const nextUnitChapters = await fetchChaptersByUnit(nextUnit._id);
        if (nextUnitChapters.length > 0) {
          const firstChapter = nextUnitChapters[0];
          const firstChapterSlug = createSlug(firstChapter.name);
          return {
            url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}/${firstChapterSlug}`,
            label: `${nextUnit.name} > ${firstChapter.name}`,
            type: "chapter",
          };
        }
      } catch (error) {}
      return {
        url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}`,
        label: nextUnit.name,
        type: "unit",
      };
    }
  } catch (error) {
    logger.error("Error fetching next unit:", {
      error: error.message,
      context: { unitId, subjectId },
    });
  }

  // 4. Try next subject in same exam
  try {
    const subjects = await fetchSubjectsByExam(examId);
    const subjectIndex = subjects.findIndex((s) => s._id === subjectId);
    if (subjectIndex < subjects.length - 1) {
      const nextSubject = subjects[subjectIndex + 1];
      const nextSubjectSlug = createSlug(nextSubject.name);
      // Check if next subject has units
      try {
        const nextSubjectUnits = await fetchUnitsBySubject(
          nextSubject._id,
          examId
        );
        if (nextSubjectUnits.length > 0) {
          const firstUnit = nextSubjectUnits[0];
          const firstUnitSlug = createSlug(firstUnit.name);
          // Check if first unit has chapters
          try {
            const firstUnitChapters = await fetchChaptersByUnit(firstUnit._id);
            if (firstUnitChapters.length > 0) {
              const firstChapter = firstUnitChapters[0];
              const firstChapterSlug = createSlug(firstChapter.name);
              return {
                url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}`,
                label: `${nextSubject.name} > ${firstUnit.name} > ${firstChapter.name}`,
                type: "chapter",
              };
            }
          } catch (error) {
            // Continue without chapters
          }
          return {
            url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}`,
            label: `${nextSubject.name} > ${firstUnit.name}`,
            type: "unit",
          };
        }
      } catch (error) {}
      return {
        url: `/${examSlug}/${nextSubjectSlug}`,
        label: nextSubject.name,
        type: "subject",
      };
    }
  } catch (error) {
    logger.error("Error fetching next subject:", {
      error: error.message,
      context: { subjectId, examId },
    });
  }

  // 5. Try next exam
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex < exams.length - 1) {
      const nextExam = exams[examIndex + 1];
      const nextExamSlug = createSlug(nextExam.name);
      // Check if next exam has subjects
      try {
        const nextExamSubjects = await fetchSubjectsByExam(nextExam._id);
        if (nextExamSubjects.length > 0) {
          const firstSubject = nextExamSubjects[0];
          const firstSubjectSlug = createSlug(firstSubject.name);
          // Check if first subject has units
          try {
            const firstSubjectUnits = await fetchUnitsBySubject(
              firstSubject._id,
              nextExam._id
            );
            if (firstSubjectUnits.length > 0) {
              const firstUnit = firstSubjectUnits[0];
              const firstUnitSlug = createSlug(firstUnit.name);
              return {
                url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}`,
                label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name}`,
                type: "unit",
              };
            }
          } catch (error) {
            // Continue without units
          }
          return {
            url: `/${nextExamSlug}/${firstSubjectSlug}`,
            label: `${nextExam.name} > ${firstSubject.name}`,
            type: "subject",
          };
        }
      } catch (error) {}
      return {
        url: `/${nextExamSlug}`,
        label: nextExam.name,
        type: "exam",
      };
    }
  } catch (error) {
    logger.error("Error fetching next exam:", {
      error: error.message,
      context: { examId },
    });
  }

  return null;
}

/**
 * Get next navigation for Unit level
 */
export async function getNextUnit({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try first chapter in this unit
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    if (chapters.length > 0) {
      const firstChapter = chapters[0];
      const firstChapterSlug = createSlug(firstChapter.name);
      return {
        url: `/${examSlug}/${subjectSlug}/${unitSlug}/${firstChapterSlug}`,
        label: firstChapter.name,
        type: "chapter",
      };
    }
  } catch (error) {
    logger.error("Error fetching chapters:", {
      error: error.message,
      context: { unitId },
    });
  }

  // 2. Try next unit in same subject
  if (currentIndex !== undefined && currentIndex < allItems.length - 1) {
    const next = allItems[currentIndex + 1];
    const nextSlug = createSlug(next.name);
    // Check if next unit has chapters
    try {
      const nextUnitChapters = await fetchChaptersByUnit(next._id);
      if (nextUnitChapters.length > 0) {
        const firstChapter = nextUnitChapters[0];
        const firstChapterSlug = createSlug(firstChapter.name);
        return {
          url: `/${examSlug}/${subjectSlug}/${nextSlug}/${firstChapterSlug}`,
          label: `${next.name} > ${firstChapter.name}`,
          type: "chapter",
        };
      }
    } catch (error) {
      // Continue without chapters
    }
    // No chapters in next unit, just go to unit page
    return {
      url: `/${examSlug}/${subjectSlug}/${nextSlug}`,
      label: next.name,
      type: "unit",
    };
  }

  // Continue with subject, exam...
  return null;
}

/**
 * Get next navigation for Subject level
 */
export async function getNextSubject({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try first unit in this subject
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    if (units.length > 0) {
      const firstUnit = units[0];
      const firstUnitSlug = createSlug(firstUnit.name);
      return {
        url: `/${examSlug}/${subjectSlug}/${firstUnitSlug}`,
        label: firstUnit.name,
        type: "unit",
      };
    }
  } catch (error) {
    logger.error("Error fetching units:", {
      error: error.message,
      context: { subjectId },
    });
  }

  // 2. Try next subject in same exam
  if (currentIndex !== undefined && currentIndex < allItems.length - 1) {
    const next = allItems[currentIndex + 1];
    const nextSlug = createSlug(next.name);
    // Check if next subject has units
    try {
      const nextSubjectUnits = await fetchUnitsBySubject(next._id, examId);
      if (nextSubjectUnits.length > 0) {
        const firstUnit = nextSubjectUnits[0];
        const firstUnitSlug = createSlug(firstUnit.name);
        return {
          url: `/${examSlug}/${nextSlug}/${firstUnitSlug}`,
          label: `${next.name} > ${firstUnit.name}`,
          type: "unit",
        };
      }
    } catch (error) {
      // Continue without units
    }
    // No units in next subject, just go to subject page
    return {
      url: `/${examSlug}/${nextSlug}`,
      label: next.name,
      type: "subject",
    };
  }

  // 3. Try next exam
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex < exams.length - 1) {
      const nextExam = exams[examIndex + 1];
      const nextExamSlug = createSlug(nextExam.name);
      // Check if next exam has subjects
      try {
        const nextExamSubjects = await fetchSubjectsByExam(nextExam._id);
        if (nextExamSubjects.length > 0) {
          const firstSubject = nextExamSubjects[0];
          const firstSubjectSlug = createSlug(firstSubject.name);
          // Check if first subject has units
          try {
            const firstSubjectUnits = await fetchUnitsBySubject(
              firstSubject._id,
              nextExam._id
            );
            if (firstSubjectUnits.length > 0) {
              const firstUnit = firstSubjectUnits[0];
              const firstUnitSlug = createSlug(firstUnit.name);
              return {
                url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}`,
                label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name}`,
                type: "unit",
              };
            }
          } catch (error) {
            // Continue without units
          }
          return {
            url: `/${nextExamSlug}/${firstSubjectSlug}`,
            label: `${nextExam.name} > ${firstSubject.name}`,
            type: "subject",
          };
        }
      } catch (error) {}
      return {
        url: `/${nextExamSlug}`,
        label: nextExam.name,
        type: "exam",
      };
    }
  } catch (error) {
    logger.error("Error fetching next exam:", {
      error: error.message,
      context: { examId },
    });
  }

  return null;
}

/**
 * Get previous navigation for Unit level
 */
export async function getPreviousUnit({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try previous unit in same subject
  if (currentIndex !== undefined && currentIndex > 0) {
    const prev = allItems[currentIndex - 1];
    const prevSlug = createSlug(prev.name);
    // Get last item in previous unit
    try {
      const chapters = await fetchChaptersByUnit(prev._id);
      if (chapters.length > 0) {
        const lastChapter = chapters[chapters.length - 1];
        const lastChapterSlug = createSlug(lastChapter.name);
        const topics = await fetchTopicsByChapter(lastChapter._id);
        if (topics.length > 0) {
          const lastTopic = topics[topics.length - 1];
          const lastTopicSlug = createSlug(lastTopic.name);
          const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
          if (subtopics.length > 0) {
            const lastSubtopic = subtopics[subtopics.length - 1];
            return {
              url: `/${examSlug}/${subjectSlug}/${prevSlug}/${lastChapterSlug}/${lastTopicSlug}/${createSlug(
                lastSubtopic.name
              )}`,
              label: `${prev.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
              type: "subtopic",
            };
          } else {
            return {
              url: `/${examSlug}/${subjectSlug}/${prevSlug}/${lastChapterSlug}/${lastTopicSlug}`,
              label: `${prev.name} > ${lastChapter.name} > ${lastTopic.name}`,
              type: "topic",
            };
          }
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${prevSlug}/${lastChapterSlug}`,
            label: `${prev.name} > ${lastChapter.name}`,
            type: "chapter",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${prevSlug}`,
          label: prev.name,
          type: "unit",
        };
      }
    } catch (error) {
      logger.error("Error fetching previous unit items:", {
        error: error.message,
        context: { unitId },
      });
    }
  }

  // 2. Try previous subject
  try {
    const subjects = await fetchSubjectsByExam(examId);
    const subjectIndex = subjects.findIndex((s) => s._id === subjectId);
    if (subjectIndex > 0) {
      const prevSubject = subjects[subjectIndex - 1];
      const prevSubjectSlug = createSlug(prevSubject.name);
      const units = await fetchUnitsBySubject(prevSubject._id, examId);
      if (units.length > 0) {
        const lastUnit = units[units.length - 1];
        const lastUnitSlug = createSlug(lastUnit.name);
        return {
          url: `/${examSlug}/${prevSubjectSlug}/${lastUnitSlug}`,
          label: `${prevSubject.name} > ${lastUnit.name}`,
          type: "unit",
        };
      } else {
        return {
          url: `/${examSlug}/${prevSubjectSlug}`,
          label: prevSubject.name,
          type: "subject",
        };
      }
    }
  } catch (error) {
    logger.error("Error fetching previous subject:", {
      error: error.message,
      context: { subjectId, examId },
    });
  }

  return null;
}

/**
 * Get previous navigation for Subject level
 */
export async function getPreviousSubject({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try previous subject in same exam
  if (currentIndex !== undefined && currentIndex > 0) {
    const prev = allItems[currentIndex - 1];
    const prevSlug = createSlug(prev.name);
    // Get last item in previous subject
    try {
      const units = await fetchUnitsBySubject(prev._id, examId);
      if (units.length > 0) {
        const lastUnit = units[units.length - 1];
        const lastUnitSlug = createSlug(lastUnit.name);
        const chapters = await fetchChaptersByUnit(lastUnit._id);
        if (chapters.length > 0) {
          const lastChapter = chapters[chapters.length - 1];
          const lastChapterSlug = createSlug(lastChapter.name);
          const topics = await fetchTopicsByChapter(lastChapter._id);
          if (topics.length > 0) {
            const lastTopic = topics[topics.length - 1];
            const lastTopicSlug = createSlug(lastTopic.name);
            const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
            if (subtopics.length > 0) {
              const lastSubtopic = subtopics[subtopics.length - 1];
              return {
                url: `/${examSlug}/${prevSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${createSlug(
                  lastSubtopic.name
                )}`,
                label: `${prev.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
                type: "subtopic",
              };
            } else {
              return {
                url: `/${examSlug}/${prevSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}`,
                label: `${prev.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name}`,
                type: "topic",
              };
            }
          } else {
            return {
              url: `/${examSlug}/${prevSlug}/${lastUnitSlug}/${lastChapterSlug}`,
              label: `${prev.name} > ${lastUnit.name} > ${lastChapter.name}`,
              type: "chapter",
            };
          }
        } else {
          return {
            url: `/${examSlug}/${prevSlug}/${lastUnitSlug}`,
            label: `${prev.name} > ${lastUnit.name}`,
            type: "unit",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${prevSlug}`,
          label: prev.name,
          type: "subject",
        };
      }
    } catch (error) {
      logger.error("Error fetching previous subject items:", {
        error: error.message,
        context: { subjectId },
      });
    }
  }

  // 2. Try previous exam
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex > 0) {
      const prevExam = exams[examIndex - 1];
      const prevExamSlug = createSlug(prevExam.name);
      const subjects = await fetchSubjectsByExam(prevExam._id);
      if (subjects.length > 0) {
        const lastSubject = subjects[subjects.length - 1];
        const lastSubjectSlug = createSlug(lastSubject.name);
        return {
          url: `/${prevExamSlug}/${lastSubjectSlug}`,
          label: `${prevExam.name} > ${lastSubject.name}`,
          type: "subject",
        };
      } else {
        return {
          url: `/${prevExamSlug}`,
          label: prevExam.name,
          type: "exam",
        };
      }
    }
  } catch (error) {
    logger.error("Error fetching previous exam:", {
      error: error.message,
      context: { examId },
    });
  }

  return null;
}

/**
 * Get previous navigation for Exam level
 */
export async function getPreviousExam({
  examId,
  examSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try previous exam
  if (currentIndex !== undefined && currentIndex > 0) {
    const prev = allItems[currentIndex - 1];
    const prevSlug = createSlug(prev.name);
    // Get last item in previous exam
    try {
      const subjects = await fetchSubjectsByExam(prev._id);
      if (subjects.length > 0) {
        const lastSubject = subjects[subjects.length - 1];
        const lastSubjectSlug = createSlug(lastSubject.name);
        const units = await fetchUnitsBySubject(lastSubject._id, prev._id);
        if (units.length > 0) {
          const lastUnit = units[units.length - 1];
          const lastUnitSlug = createSlug(lastUnit.name);
          const chapters = await fetchChaptersByUnit(lastUnit._id);
          if (chapters.length > 0) {
            const lastChapter = chapters[chapters.length - 1];
            const lastChapterSlug = createSlug(lastChapter.name);
            const topics = await fetchTopicsByChapter(lastChapter._id);
            if (topics.length > 0) {
              const lastTopic = topics[topics.length - 1];
              const lastTopicSlug = createSlug(lastTopic.name);
              const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
              if (subtopics.length > 0) {
                const lastSubtopic = subtopics[subtopics.length - 1];
                return {
                  url: `/${prevSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${createSlug(
                    lastSubtopic.name
                  )}`,
                  label: `${prev.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
                  type: "subtopic",
                };
              } else {
                return {
                  url: `/${prevSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}`,
                  label: `${prev.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name}`,
                  type: "topic",
                };
              }
            } else {
              return {
                url: `/${prevSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}`,
                label: `${prev.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name}`,
                type: "chapter",
              };
            }
          } else {
            return {
              url: `/${prevSlug}/${lastSubjectSlug}/${lastUnitSlug}`,
              label: `${prev.name} > ${lastSubject.name} > ${lastUnit.name}`,
              type: "unit",
            };
          }
        } else {
          return {
            url: `/${prevSlug}/${lastSubjectSlug}`,
            label: `${prev.name} > ${lastSubject.name}`,
            type: "subject",
          };
        }
      } else {
        return {
          url: `/${prevSlug}`,
          label: prev.name,
          type: "exam",
        };
      }
    } catch (error) {
      logger.error("Error fetching previous exam items:", {
        error: error.message,
        context: { examId },
      });
    }
  }

  return null;
}

/**
 * Get next navigation for Exam level
 */
export async function getNextExam({
  examId,
  examSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try first subject in this exam
  try {
    const subjects = await fetchSubjectsByExam(examId);
    if (subjects.length > 0) {
      const firstSubject = subjects[0];
      const firstSubjectSlug = createSlug(firstSubject.name);
      return {
        url: `/${examSlug}/${firstSubjectSlug}`,
        label: firstSubject.name,
        type: "subject",
      };
    }
  } catch (error) {
    logger.error("Error fetching subjects:", {
      error: error.message,
      context: { examId },
    });
  }

  // 2. Try next exam
  if (currentIndex !== undefined && currentIndex < allItems.length - 1) {
    const next = allItems[currentIndex + 1];
    const nextSlug = createSlug(next.name);
    // Check if next exam has subjects
    try {
      const nextExamSubjects = await fetchSubjectsByExam(next._id);
      if (nextExamSubjects.length > 0) {
        const firstSubject = nextExamSubjects[0];
        const firstSubjectSlug = createSlug(firstSubject.name);
        return {
          url: `/${nextSlug}/${firstSubjectSlug}`,
          label: `${next.name} > ${firstSubject.name}`,
          type: "subject",
        };
      }
    } catch (error) {
      // Continue without subjects
    }
    // No subjects in next exam, just go to exam page
    return {
      url: `/${nextSlug}`,
      label: next.name,
      type: "exam",
    };
  }

  return null;
}

/**
 * Helper: Get deepest definition path from a topic
 * Returns: { url, label, type } or null
 */
async function getDeepestDefinitionPath({
  examSlug,
  subjectSlug,
  unitSlug,
  chapterSlug,
  topicSlug,
  topicId,
}) {
  try {
    const subtopics = await fetchSubTopicsByTopic(topicId);
    if (subtopics.length > 0) {
      const firstSubTopic = subtopics[0];
      const firstSubTopicSlug = createSlug(firstSubTopic.name);
      const definitions = await fetchDefinitionsBySubTopic(firstSubTopic._id);
      if (definitions.length > 0) {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${firstSubTopicSlug}/${createSlug(
            definitions[0].name
          )}`,
          label: `${firstSubTopic.name} > ${definitions[0].name}`,
          type: "definition",
        };
      }
    }
  } catch (error) {}
  return null;
}

/**
 * Helper: Get deepest definition path from a chapter
 */
async function getDeepestDefinitionPathFromChapter({
  examSlug,
  subjectSlug,
  unitSlug,
  chapterSlug,
  chapterId,
}) {
  try {
    const topics = await fetchTopicsByChapter(chapterId);
    if (topics.length > 0) {
      const firstTopic = topics[0];
      const firstTopicSlug = createSlug(firstTopic.name);
      const result = await getDeepestDefinitionPath({
        examSlug,
        subjectSlug,
        unitSlug,
        chapterSlug,
        topicSlug: firstTopicSlug,
        topicId: firstTopic._id,
      });
      if (result) {
        return {
          ...result,
          label: `${firstTopic.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}
  return null;
}

/**
 * Helper: Get deepest definition path from a unit
 */
async function getDeepestDefinitionPathFromUnit({
  examSlug,
  subjectSlug,
  unitSlug,
  unitId,
}) {
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    if (chapters.length > 0) {
      const firstChapter = chapters[0];
      const firstChapterSlug = createSlug(firstChapter.name);
      const result = await getDeepestDefinitionPathFromChapter({
        examSlug,
        subjectSlug,
        unitSlug,
        chapterSlug: firstChapterSlug,
        chapterId: firstChapter._id,
      });
      if (result) {
        return {
          ...result,
          label: `${firstChapter.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}
  return null;
}

/**
 * Helper: Get deepest definition path from a subject
 */
async function getDeepestDefinitionPathFromSubject({
  examSlug,
  subjectSlug,
  subjectId,
  examId,
}) {
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    if (units.length > 0) {
      const firstUnit = units[0];
      const firstUnitSlug = createSlug(firstUnit.name);
      const result = await getDeepestDefinitionPathFromUnit({
        examSlug,
        subjectSlug,
        unitSlug: firstUnitSlug,
        unitId: firstUnit._id,
      });
      if (result) {
        return {
          ...result,
          label: `${firstUnit.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}
  return null;
}

/**
 * Helper: Get deepest definition path from an exam
 */
async function getDeepestDefinitionPathFromExam({ examSlug, examId }) {
  try {
    const subjects = await fetchSubjectsByExam(examId);
    if (subjects.length > 0) {
      const firstSubject = subjects[0];
      const firstSubjectSlug = createSlug(firstSubject.name);
      const result = await getDeepestDefinitionPathFromSubject({
        examSlug,
        subjectSlug: firstSubjectSlug,
        subjectId: firstSubject._id,
        examId,
      });
      if (result) {
        return {
          ...result,
          label: `${firstSubject.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}
  return null;
}

/**
 * Helper: Get last definition of deepest path from a topic
 */
async function getLastDefinitionPath({
  examSlug,
  subjectSlug,
  unitSlug,
  chapterSlug,
  topicSlug,
  topicId,
}) {
  try {
    const subtopics = await fetchSubTopicsByTopic(topicId);
    if (subtopics.length > 0) {
      const lastSubTopic = subtopics[subtopics.length - 1];
      const lastSubTopicSlug = createSlug(lastSubTopic.name);
      const definitions = await fetchDefinitionsBySubTopic(lastSubTopic._id);
      if (definitions.length > 0) {
        const lastDefinition = definitions[definitions.length - 1];
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${lastSubTopicSlug}/${createSlug(
            lastDefinition.name
          )}`,
          label: `${lastSubTopic.name} > ${lastDefinition.name}`,
          type: "definition",
        };
      }
    }
  } catch (error) {}
  return null;
}

/**
 * Helper: Get last definition of deepest path from a chapter
 */
async function getLastDefinitionPathFromChapter({
  examSlug,
  subjectSlug,
  unitSlug,
  chapterSlug,
  chapterId,
}) {
  try {
    const topics = await fetchTopicsByChapter(chapterId);
    if (topics.length > 0) {
      const lastTopic = topics[topics.length - 1];
      const lastTopicSlug = createSlug(lastTopic.name);
      const result = await getLastDefinitionPath({
        examSlug,
        subjectSlug,
        unitSlug,
        chapterSlug,
        topicSlug: lastTopicSlug,
        topicId: lastTopic._id,
      });
      if (result) {
        return {
          ...result,
          label: `${lastTopic.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}
  return null;
}

/**
 * Helper: Get last definition of deepest path from a unit
 */
async function getLastDefinitionPathFromUnit({
  examSlug,
  subjectSlug,
  unitSlug,
  unitId,
}) {
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    if (chapters.length > 0) {
      const lastChapter = chapters[chapters.length - 1];
      const lastChapterSlug = createSlug(lastChapter.name);
      const result = await getLastDefinitionPathFromChapter({
        examSlug,
        subjectSlug,
        unitSlug,
        chapterSlug: lastChapterSlug,
        chapterId: lastChapter._id,
      });
      if (result) {
        return {
          ...result,
          label: `${lastChapter.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}
  return null;
}

/**
 * Helper: Get last definition of deepest path from a subject
 */
async function getLastDefinitionPathFromSubject({
  examSlug,
  subjectSlug,
  subjectId,
  examId,
}) {
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    if (units.length > 0) {
      const lastUnit = units[units.length - 1];
      const lastUnitSlug = createSlug(lastUnit.name);
      const result = await getLastDefinitionPathFromUnit({
        examSlug,
        subjectSlug,
        unitSlug: lastUnitSlug,
        unitId: lastUnit._id,
      });
      if (result) {
        return {
          ...result,
          label: `${lastUnit.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}
  return null;
}

/**
 * Helper: Get last definition of deepest path from an exam
 */
async function getLastDefinitionPathFromExam({ examSlug, examId }) {
  try {
    const subjects = await fetchSubjectsByExam(examId);
    if (subjects.length > 0) {
      const lastSubject = subjects[subjects.length - 1];
      const lastSubjectSlug = createSlug(lastSubject.name);
      const result = await getLastDefinitionPathFromSubject({
        examSlug,
        subjectSlug: lastSubjectSlug,
        subjectId: lastSubject._id,
        examId,
      });
      if (result) {
        return {
          ...result,
          label: `${lastSubject.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}
  return null;
}

/**
 * Get next navigation for Definition level
 */
export async function getNextDefinition({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  topicId,
  topicSlug,
  subTopicId,
  subTopicSlug,
  currentIndex,
  allItems,
}) {
  // 1. Next definition in same subtopic
  if (currentIndex !== undefined && currentIndex < allItems.length - 1) {
    const next = allItems[currentIndex + 1];
    return {
      url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${subTopicSlug}/${createSlug(
        next.name
      )}`,
      label: next.name,
      type: "definition",
    };
  }

  // 2. Next subtopic → first definition
  try {
    const subtopics = await fetchSubTopicsByTopic(topicId);
    const subtopicIndex = subtopics.findIndex((st) => st._id === subTopicId);
    if (subtopicIndex < subtopics.length - 1) {
      const nextSubTopic = subtopics[subtopicIndex + 1];
      const nextSubTopicSlug = createSlug(nextSubTopic.name);
      const definitions = await fetchDefinitionsBySubTopic(nextSubTopic._id);
      if (definitions.length > 0) {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${nextSubTopicSlug}/${createSlug(
            definitions[0].name
          )}`,
          label: `${nextSubTopic.name} > ${definitions[0].name}`,
          type: "definition",
        };
      }
    }
  } catch (error) {}

  // 3. Next topic → first subtopic → first definition
  try {
    const topics = await fetchTopicsByChapter(chapterId);
    const topicIndex = topics.findIndex((t) => t._id === topicId);
    if (topicIndex < topics.length - 1) {
      const nextTopic = topics[topicIndex + 1];
      const nextTopicSlug = createSlug(nextTopic.name);
      const result = await getDeepestDefinitionPath({
        examSlug,
        subjectSlug,
        unitSlug,
        chapterSlug,
        topicSlug: nextTopicSlug,
        topicId: nextTopic._id,
      });
      if (result) {
        return {
          ...result,
          label: `${nextTopic.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}

  // 4. Next chapter → first topic → first subtopic → first definition
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    const chapterIndex = chapters.findIndex((c) => c._id === chapterId);
    if (chapterIndex < chapters.length - 1) {
      const nextChapter = chapters[chapterIndex + 1];
      const nextChapterSlug = createSlug(nextChapter.name);
      const result = await getDeepestDefinitionPathFromChapter({
        examSlug,
        subjectSlug,
        unitSlug,
        chapterSlug: nextChapterSlug,
        chapterId: nextChapter._id,
      });
      if (result) {
        return {
          ...result,
          label: `${nextChapter.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}

  // 5. Next unit → first chapter → first topic → first subtopic → first definition
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    const unitIndex = units.findIndex((u) => u._id === unitId);
    if (unitIndex < units.length - 1) {
      const nextUnit = units[unitIndex + 1];
      const nextUnitSlug = createSlug(nextUnit.name);
      const result = await getDeepestDefinitionPathFromUnit({
        examSlug,
        subjectSlug,
        unitSlug: nextUnitSlug,
        unitId: nextUnit._id,
      });
      if (result) {
        return {
          ...result,
          label: `${nextUnit.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}

  // 6. Next subject → first unit → ... → first definition
  try {
    const subjects = await fetchSubjectsByExam(examId);
    const subjectIndex = subjects.findIndex((s) => s._id === subjectId);
    if (subjectIndex < subjects.length - 1) {
      const nextSubject = subjects[subjectIndex + 1];
      const nextSubjectSlug = createSlug(nextSubject.name);
      const result = await getDeepestDefinitionPathFromSubject({
        examSlug,
        subjectSlug: nextSubjectSlug,
        subjectId: nextSubject._id,
        examId,
      });
      if (result) {
        return {
          ...result,
          label: `${nextSubject.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}

  // 7. Next exam → first subject → ... → first definition
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex < exams.length - 1) {
      const nextExam = exams[examIndex + 1];
      const nextExamSlug = createSlug(nextExam.name);
      const result = await getDeepestDefinitionPathFromExam({
        examSlug: nextExamSlug,
        examId: nextExam._id,
      });
      if (result) {
        return {
          ...result,
          label: `${nextExam.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}

  return null;
}

/**
 * Get previous navigation for Definition level
 */
export async function getPreviousDefinition({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  topicId,
  topicSlug,
  subTopicId,
  subTopicSlug,
  currentIndex,
  allItems,
}) {
  // 1. Previous definition in same subtopic
  if (currentIndex !== undefined && currentIndex > 0) {
    const prev = allItems[currentIndex - 1];
    return {
      url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${subTopicSlug}/${createSlug(
        prev.name
      )}`,
      label: prev.name,
      type: "definition",
    };
  }

  // 2. Previous subtopic → last definition
  try {
    const subtopics = await fetchSubTopicsByTopic(topicId);
    const subtopicIndex = subtopics.findIndex((st) => st._id === subTopicId);
    if (subtopicIndex > 0) {
      const prevSubTopic = subtopics[subtopicIndex - 1];
      const prevSubTopicSlug = createSlug(prevSubTopic.name);
      const definitions = await fetchDefinitionsBySubTopic(prevSubTopic._id);
      if (definitions.length > 0) {
        const lastDefinition = definitions[definitions.length - 1];
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${prevSubTopicSlug}/${createSlug(
            lastDefinition.name
          )}`,
          label: `${prevSubTopic.name} > ${lastDefinition.name}`,
          type: "definition",
        };
      }
    }
  } catch (error) {}

  // 3. Previous topic → last subtopic → last definition
  try {
    const topics = await fetchTopicsByChapter(chapterId);
    const topicIndex = topics.findIndex((t) => t._id === topicId);
    if (topicIndex > 0) {
      const prevTopic = topics[topicIndex - 1];
      const prevTopicSlug = createSlug(prevTopic.name);
      const result = await getLastDefinitionPath({
        examSlug,
        subjectSlug,
        unitSlug,
        chapterSlug,
        topicSlug: prevTopicSlug,
        topicId: prevTopic._id,
      });
      if (result) {
        return {
          ...result,
          label: `${prevTopic.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}

  // 4. Previous chapter → last topic → last subtopic → last definition
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    const chapterIndex = chapters.findIndex((c) => c._id === chapterId);
    if (chapterIndex > 0) {
      const prevChapter = chapters[chapterIndex - 1];
      const prevChapterSlug = createSlug(prevChapter.name);
      const result = await getLastDefinitionPathFromChapter({
        examSlug,
        subjectSlug,
        unitSlug,
        chapterSlug: prevChapterSlug,
        chapterId: prevChapter._id,
      });
      if (result) {
        return {
          ...result,
          label: `${prevChapter.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}

  // 5. Previous unit → last chapter → last topic → last subtopic → last definition
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    const unitIndex = units.findIndex((u) => u._id === unitId);
    if (unitIndex > 0) {
      const prevUnit = units[unitIndex - 1];
      const prevUnitSlug = createSlug(prevUnit.name);
      const result = await getLastDefinitionPathFromUnit({
        examSlug,
        subjectSlug,
        unitSlug: prevUnitSlug,
        unitId: prevUnit._id,
      });
      if (result) {
        return {
          ...result,
          label: `${prevUnit.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}

  // 6. Previous subject → last unit → ... → last definition
  try {
    const subjects = await fetchSubjectsByExam(examId);
    const subjectIndex = subjects.findIndex((s) => s._id === subjectId);
    if (subjectIndex > 0) {
      const prevSubject = subjects[subjectIndex - 1];
      const prevSubjectSlug = createSlug(prevSubject.name);
      const result = await getLastDefinitionPathFromSubject({
        examSlug,
        subjectSlug: prevSubjectSlug,
        subjectId: prevSubject._id,
        examId,
      });
      if (result) {
        return {
          ...result,
          label: `${prevSubject.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}

  // 7. Previous exam → last subject → ... → last definition
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex > 0) {
      const prevExam = exams[examIndex - 1];
      const prevExamSlug = createSlug(prevExam.name);
      const result = await getLastDefinitionPathFromExam({
        examSlug: prevExamSlug,
        examId: prevExam._id,
      });
      if (result) {
        return {
          ...result,
          label: `${prevExam.name} > ${result.label}`,
        };
      }
    }
  } catch (error) {}

  return null;
}
