"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  FaClock,
  FaFileAlt,
  FaPlay,
  FaTimesCircle,
  FaArrowLeft,
  FaArrowRight,
  FaFlag,
  FaCheck,
  FaSave,
  FaCheckCircle,
  FaArrowLeft as FaBack,
  FaTimes,
} from "react-icons/fa";
import {
  fetchPracticeTests,
  fetchPracticeCategories,
  fetchPracticeTestById,
  fetchPracticeTestQuestions,
} from "../lib/api";
import LoadingState from "./LoadingState";
import { logger } from "@/utils/logger";

const PracticeTestList = ({
  examId,
  subjectId,
  unitId,
  chapterId,
  topicId,
  subTopicId,
}) => {
  const [practiceTests, setPracticeTests] = useState([]);
  const [practiceCategories, setPracticeCategories] = useState([]);
  const [groupedData, setGroupedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Test taking state
  const [selectedTest, setSelectedTest] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const loadPracticeData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch categories first based on examId and subjectId
        // Clean filters to remove undefined values
        const categoryFilters = {
          examId,
          subjectId,
          status: "active",
        };
        const cleanCategoryFilters = {};
        Object.keys(categoryFilters).forEach((key) => {
          if (
            categoryFilters[key] !== null &&
            categoryFilters[key] !== undefined
          ) {
            cleanCategoryFilters[key] = categoryFilters[key];
          }
        });
        const categories = await fetchPracticeCategories(cleanCategoryFilters);
        setPracticeCategories(categories);

        // Cascading filter: Try current level first, then its children only
        // Logic based on page level:
        // - Subject page: Show all tests for that subject
        // - Unit page: Try unit first, then children (chapters, topics, subtopics)
        // - Chapter page: Try chapter first, then children (topics, subtopics)
        // - Topic page: Try topic first, then children (subtopics)
        // - Subtopic page: Show tests for that subtopic only (no children)
        let tests = [];

        // Helper function to clean filters
        const cleanFilters = (filters) => {
          const cleaned = {};
          Object.keys(filters).forEach((key) => {
            if (filters[key] !== null && filters[key] !== undefined) {
              cleaned[key] = filters[key];
            }
          });
          return cleaned;
        };

        // Determine page level and implement cascading logic
        if (subTopicId) {
          // Subtopic page: Show tests for that subtopic only (no children)
          const filters = cleanFilters({
            examId,
            subjectId,
            unitId,
            chapterId,
            topicId,
            subTopicId,
            status: "active",
          });
          tests = await fetchPracticeTests(filters);
        } else if (topicId) {
          // Topic page: Try topic first, then children (subtopics)
          // Step 1: Try current level (topic) - tests directly linked to this topic
          const currentFilters = cleanFilters({
            examId,
            subjectId,
            unitId,
            chapterId,
            topicId,
            status: "active",
          });
          tests = await fetchPracticeTests(currentFilters);

          // Step 2: If no tests, try children (subtopics under this topic)
          // Fetch by categoryId to bypass hierarchical filtering, then filter client-side
          if (!tests || tests.length === 0) {
            const allCategoryTests = [];
            for (const category of categories) {
              const categoryId = category._id || category.id;
              if (categoryId) {
                const categoryFilters = cleanFilters({
                  categoryId,
                  status: "active",
                });
                const categoryTests = await fetchPracticeTests(categoryFilters);
                if (categoryTests && categoryTests.length > 0) {
                  allCategoryTests.push(...categoryTests);
                }
              }
            }
            // Filter to only include tests that are children of this topic (have topicId and subTopicId)
            tests = allCategoryTests.filter((test) => {
              const testTopicId = test.topicId?._id || test.topicId;
              const testSubTopicId = test.subTopicId?._id || test.subTopicId;
              return (
                testTopicId &&
                String(testTopicId) === String(topicId) &&
                testSubTopicId // Must have subTopicId to be a child
              );
            });
          }
        } else if (chapterId) {
          // Chapter page: Try chapter first, then children (topics, subtopics)
          // Step 1: Try current level (chapter) - tests directly linked to this chapter
          const currentFilters = cleanFilters({
            examId,
            subjectId,
            unitId,
            chapterId,
            status: "active",
          });
          tests = await fetchPracticeTests(currentFilters);

          // Step 2: If no tests, try children (topics and subtopics under this chapter)
          // Fetch by categoryId to bypass hierarchical filtering, then filter client-side
          if (!tests || tests.length === 0) {
            const allCategoryTests = [];
            for (const category of categories) {
              const categoryId = category._id || category.id;
              if (categoryId) {
                const categoryFilters = cleanFilters({
                  categoryId,
                  status: "active",
                });
                const categoryTests = await fetchPracticeTests(categoryFilters);
                if (categoryTests && categoryTests.length > 0) {
                  allCategoryTests.push(...categoryTests);
                }
              }
            }
            // Filter to only include tests that are children of this chapter
            // (have chapterId and either topicId or subTopicId)
            tests = allCategoryTests.filter((test) => {
              const testChapterId = test.chapterId?._id || test.chapterId;
              const testTopicId = test.topicId?._id || test.topicId;
              const testSubTopicId = test.subTopicId?._id || test.subTopicId;
              return (
                testChapterId &&
                String(testChapterId) === String(chapterId) &&
                (testTopicId || testSubTopicId) // Must have topicId or subTopicId to be a child
              );
            });
          }
        } else if (unitId) {
          // Unit page: Try unit first, then children (chapters, topics, subtopics)
          // Step 1: Try current level (unit) - tests directly linked to this unit
          const currentFilters = cleanFilters({
            examId,
            subjectId,
            unitId,
            status: "active",
          });
          tests = await fetchPracticeTests(currentFilters);

          // Step 2: If no tests, try children (chapters, topics, subtopics under this unit)
          // Fetch by categoryId to bypass hierarchical filtering, then filter client-side
          if (!tests || tests.length === 0) {
            const allCategoryTests = [];
            for (const category of categories) {
              const categoryId = category._id || category.id;
              if (categoryId) {
                const categoryFilters = cleanFilters({
                  categoryId,
                  status: "active",
                });
                const categoryTests = await fetchPracticeTests(categoryFilters);
                if (categoryTests && categoryTests.length > 0) {
                  allCategoryTests.push(...categoryTests);
                }
              }
            }
            // Filter to only include tests that are children of this unit
            // (have unitId and at least one of chapterId/topicId/subTopicId)
            tests = allCategoryTests.filter((test) => {
              const testUnitId = test.unitId?._id || test.unitId;
              const testChapterId = test.chapterId?._id || test.chapterId;
              const testTopicId = test.topicId?._id || test.topicId;
              const testSubTopicId = test.subTopicId?._id || test.subTopicId;
              return (
                testUnitId &&
                String(testUnitId) === String(unitId) &&
                (testChapterId || testTopicId || testSubTopicId) // Must have at least one child level
              );
            });
          }
        } else if (subjectId) {
          // Subject page: Show all test categories and papers for that subject
          // Fetch tests by categoryId to get ALL tests for each category, regardless of hierarchy
          // First, we already have categories fetched above
          // Now fetch tests for each category
          const allTests = [];
          for (const category of categories) {
            const categoryId = category._id || category.id;
            if (categoryId) {
              const categoryFilters = cleanFilters({
                categoryId, // Fetch by categoryId directly to bypass hierarchical filtering
                status: "active",
              });
              const categoryTests = await fetchPracticeTests(categoryFilters);
              if (categoryTests && categoryTests.length > 0) {
                allTests.push(...categoryTests);
              }
            }
          }
          tests = allTests;
        } else if (examId) {
          // Exam page: Show all tests for this exam
          const filters = cleanFilters({
            examId,
            status: "active",
          });
          tests = await fetchPracticeTests(filters);
        }

        setPracticeTests(tests);

        // Group tests by category - Only show categories that have subcategories (papers/tests)
        // If a category has no subcategories, don't show it
        const grouped = categories
          .map((category) => {
            const categoryId = category._id || category.id;
            const categoryTests = tests.filter((test) => {
              // Handle different categoryId formats
              // API populates categoryId as: { _id: "...", name: "...", ... }
              // Or it might be just a string ID
              let testCategoryId = null;

              if (test.categoryId) {
                if (typeof test.categoryId === "object") {
                  // Populated object
                  testCategoryId = test.categoryId._id || test.categoryId.id;
                } else {
                  // String ID
                  testCategoryId = test.categoryId;
                }
              }

              // Also check alternative field names
              if (!testCategoryId && test.category) {
                if (typeof test.category === "object") {
                  testCategoryId = test.category._id || test.category.id;
                } else {
                  testCategoryId = test.category;
                }
              }

              // Compare as strings to handle ObjectId vs string mismatches
              const matches =
                testCategoryId &&
                categoryId &&
                String(testCategoryId).trim() === String(categoryId).trim();

              return matches;
            });
            return {
              category,
              tests: categoryTests,
            };
          })
          .filter((group) => group.tests.length > 0); // Only show categories that have subcategories (papers)

        // Debug logging (can be removed in production)
        if (process.env.NODE_ENV === "development") {
          console.log("PracticeTestList Debug:", {
            categoriesCount: categories.length,
            testsCount: tests.length,
            groupedCount: grouped.length,
            categories: categories.map((c) => ({
              id: c._id || c.id,
              name: c.name,
            })),
            tests: tests.map((t) => ({
              id: t._id,
              name: t.name,
              categoryId: t.categoryId?._id || t.categoryId,
            })),
            grouped: grouped.map((g) => ({
              categoryName: g.category.name,
              testsCount: g.tests.length,
            })),
          });
        }

        setGroupedData(grouped);
      } catch (err) {
        logger.error("Error loading practice data:", err);
        setError("Failed to load practice tests. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (examId || subjectId || unitId || chapterId || topicId || subTopicId) {
      loadPracticeData();
    } else {
      setIsLoading(false);
    }
  }, [examId, subjectId, unitId, chapterId, topicId, subTopicId]);

  // Parse duration string (e.g., "60 Min" or "60")
  const parseDuration = (durationStr) => {
    if (!durationStr) return null;
    const match = durationStr.match(/(\d+)/);
    return match ? parseInt(match[1]) * 60 : null;
  };

  // Load test and questions when a test is selected
  useEffect(() => {
    const loadTest = async () => {
      if (!selectedTest) return;

      try {
        setIsLoadingTest(true);
        setError(null);

        const [testData, questionsData] = await Promise.all([
          fetchPracticeTestById(selectedTest),
          fetchPracticeTestQuestions(selectedTest),
        ]);

        if (!testData) {
          setError("Practice test not found");
          setIsLoadingTest(false);
          return;
        }

        setTest(testData);
        setQuestions(questionsData);

        const initialAnswers = {};
        questionsData.forEach((q) => {
          initialAnswers[q._id] = null;
        });
        setAnswers(initialAnswers);

        const durationSeconds = parseDuration(testData.duration);
        if (durationSeconds) {
          setTimeRemaining(durationSeconds);
        }
      } catch (err) {
        logger.error("Error loading practice test:", err);
        setError("Failed to load practice test. Please try again.");
      } finally {
        setIsLoadingTest(false);
      }
    };

    loadTest();
  }, [selectedTest]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (seconds === null) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Start test
  const handleStartTest = () => {
    setIsTestStarted(true);
    startTimeRef.current = Date.now();
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Toggle marked for review
  const handleToggleMarked = (questionId) => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Navigate to question
  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Calculate results
  const calculateResults = React.useCallback(() => {
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalMarks = 0;
    const questionResults = [];

    const marksPerQuestion = test.maximumMarks / questions.length;
    const negativeMarks = test.negativeMarks || 0;

    questions.forEach((question) => {
      const userAnswer = answers[question._id];
      const correctAnswer = question.answer;

      if (!userAnswer) {
        unansweredCount++;
        questionResults.push({
          questionId: question._id,
          question: question.question,
          userAnswer: null,
          correctAnswer,
          isCorrect: false,
          marks: 0,
        });
      } else if (userAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
        correctCount++;
        totalMarks += marksPerQuestion;
        questionResults.push({
          questionId: question._id,
          question: question.question,
          userAnswer,
          correctAnswer,
          isCorrect: true,
          marks: marksPerQuestion,
        });
      } else {
        incorrectCount++;
        // For incorrect answers: subtract negative marks only (don't add marksPerQuestion)
        totalMarks -= negativeMarks;
        questionResults.push({
          questionId: question._id,
          question: question.question,
          userAnswer,
          correctAnswer,
          isCorrect: false,
          marks: -negativeMarks,
        });
      }
    });

    const percentage = (totalMarks / test.maximumMarks) * 100;

    return {
      totalQuestions: questions.length,
      correctCount,
      incorrectCount,
      unansweredCount,
      totalMarks: Math.max(0, totalMarks),
      maximumMarks: test.maximumMarks,
      percentage: Math.round(percentage * 100) / 100,
      questionResults,
      timeTaken: startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0,
    };
  }, [questions, answers, test]);

  // Show submit confirmation modal
  const handleShowSubmitModal = () => {
    setShowSubmitModal(true);
  };

  // Submit test (called after confirmation)
  const handleSubmitTest = React.useCallback(
    (autoSubmit = false) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      setShowSubmitModal(false);
      const calculatedResults = calculateResults();
      setResults(calculatedResults);
      setIsTestSubmitted(true);
      setIsTestStarted(false);
    },
    [calculateResults]
  );

  // Timer effect
  useEffect(() => {
    if (isTestStarted && timeRemaining !== null && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitTest(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [isTestStarted, timeRemaining, handleSubmitTest]);

  // Reset test view
  const handleBackToList = () => {
    setSelectedTest(null);
    setTest(null);
    setQuestions([]);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeRemaining(null);
    setIsTestStarted(false);
    setIsTestSubmitted(false);
    setResults(null);
    setMarkedForReview(new Set());
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  // Helper function to get the deepest hierarchy level
  const getHierarchyPath = (test) => {
    if (test.subTopicId?.name) {
      return {
        label: "Subtopic",
        name: test.subTopicId.name,
        color: "bg-cyan-100 text-cyan-700",
      };
    }
    if (test.topicId?.name) {
      return {
        label: "Topic",
        name: test.topicId.name,
        color: "bg-yellow-100 text-yellow-700",
      };
    }
    if (test.chapterId?.name) {
      return {
        label: "Chapter",
        name: test.chapterId.name,
        color: "bg-pink-100 text-pink-700",
      };
    }
    if (test.unitId?.name) {
      return {
        label: "Unit",
        name: test.unitId.name,
        color: "bg-purple-100 text-purple-700",
      };
    }
    return null;
  };

  // Show test list loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-600 border-t-transparent mb-3"></div>
          <p className="text-xs text-gray-600">Loading practice tests...</p>
        </div>
      </div>
    );
  }

  // Show error
  if (error && !selectedTest) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <FaTimesCircle className="text-sm" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Show test taking interface
  if (selectedTest) {
    // Loading test
    if (isLoadingTest) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-600 border-t-transparent mb-3"></div>
            <p className="text-xs text-gray-600">Loading practice test...</p>
          </div>
        </div>
      );
    }

    // Error loading test
    if (error || !test) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 text-red-700">
              <FaTimesCircle className="text-sm" />
              <p className="text-xs font-medium">
                {error || "Practice test not found"}
              </p>
            </div>
          </div>
          <button
            onClick={handleBackToList}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs font-medium transition-colors"
          >
            Back to Tests
          </button>
        </div>
      );
    }

    // No questions
    if (questions.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">📝</div>
            <h3 className="text-base font-semibold text-gray-900 mb-1.5">
              No Questions Available
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              This practice test doesn&apos;t have any questions yet.
            </p>
            <button
              onClick={handleBackToList}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs font-medium transition-colors"
            >
              Back to Tests
            </button>
          </div>
        </div>
      );
    }

    // Results view
    if (isTestSubmitted && results) {
      return (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1.5">
                Test Results
              </h1>
              <p className="text-xs text-gray-600">{test.name}</p>
            </div>
          </div>

          {/* Score Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-semibold text-gray-900 mb-0.5">
                  {results.percentage}%
                </div>
                <div className="text-xs text-gray-600">Score</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-semibold text-gray-900 mb-0.5">
                  {results.correctCount}
                </div>
                <div className="text-xs text-gray-600">Correct</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-semibold text-gray-900 mb-0.5">
                  {results.incorrectCount}
                </div>
                <div className="text-xs text-gray-600">Incorrect</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-semibold text-gray-900 mb-0.5">
                  {results.unansweredCount}
                </div>
                <div className="text-xs text-gray-600">Unanswered</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {results.totalMarks.toFixed(2)} / {results.maximumMarks}
                  </div>
                  <div className="text-xs text-gray-600">Total Marks</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">
                    Time Taken: {Math.floor(results.timeTaken / 60)}m{" "}
                    {results.timeTaken % 60}s
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Question-wise Results */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Question-wise Results
            </h2>
            <div className="space-y-4">
              {results.questionResults.map((result, index) => {
                const question = questions.find(
                  (q) => q._id === result.questionId
                );
                return (
                  <div
                    key={result.questionId}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full font-medium bg-gray-100 text-gray-900 border border-gray-200 text-xs">
                          {index + 1}
                        </span>
                        <h3 className="text-base font-semibold text-gray-900">
                          {result.question}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.isCorrect ? (
                          <FaCheckCircle className="text-green-600 text-xl" />
                        ) : (
                          <FaTimesCircle className="text-red-600 text-xl" />
                        )}
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            result.isCorrect
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {result.marks > 0
                            ? `+${result.marks.toFixed(2)}`
                            : result.marks.toFixed(2)}{" "}
                          marks
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {["A", "B", "C", "D"].map((option) => {
                        const optionKey = `option${option}`;
                        const optionText = question[optionKey];
                        const isUserAnswer = result.userAnswer === option;
                        const isCorrectAnswer = result.correctAnswer === option;

                        return (
                          <div
                            key={option}
                            className={`p-4 rounded-lg border ${
                              isCorrectAnswer
                                ? "bg-green-50 border-green-200"
                                : isUserAnswer && !isCorrectAnswer
                                ? "bg-red-50 border-red-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                                  isCorrectAnswer
                                    ? "bg-green-600 text-white"
                                    : isUserAnswer && !isCorrectAnswer
                                    ? "bg-red-600 text-white"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {option}
                              </span>
                              <span className="text-sm font-medium text-gray-900 flex-1">
                                {optionText}
                              </span>
                              {isCorrectAnswer && (
                                <FaCheckCircle className="text-green-600" />
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <FaTimesCircle className="text-red-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {question.detailsExplanation && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="text-xs font-semibold text-gray-900 mb-1.5">
                          Explanation:
                        </h4>
                        <p className="text-xs text-gray-600">
                          {question.detailsExplanation}
                        </p>
                      </div>
                    )}

                    {question.videoLink && (
                      <div className="mt-4">
                        <a
                          href={question.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Watch Video Explanation →
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleBackToList}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs font-medium transition-colors"
            >
              Back to Tests
            </button>
            <button
              onClick={() => {
                setIsTestSubmitted(false);
                setResults(null);
                setAnswers({});
                setCurrentQuestionIndex(0);
                setMarkedForReview(new Set());
                const durationSeconds = parseDuration(test.duration);
                if (durationSeconds) {
                  setTimeRemaining(durationSeconds);
                }
              }}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Retake Test
            </button>
          </div>
        </div>
      );
    }

    // Pre-test start screen
    if (!isTestStarted) {
      return (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            {/* Header */}
            <div className="text-center mb-4">
              <h1 className="text-xl font-semibold text-gray-900 mb-1.5 leading-tight">
                {test.name}
              </h1>
            </div>

            {/* Test Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <FaClock className="text-gray-600 text-xs" />
                  <span className="text-xs font-medium text-gray-600">
                    Duration
                  </span>
                </div>
                <div className="text-base font-semibold text-gray-900">
                  {test.duration || "No Limit"}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-600">
                    Total Questions
                  </span>
                </div>
                <div className="text-base font-semibold text-gray-900">
                  {questions.length}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-600">
                    Maximum Marks
                  </span>
                </div>
                <div className="text-base font-semibold text-gray-900">
                  {test.maximumMarks || 0}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-600">
                    Negative Marks
                  </span>
                </div>
                <div className="text-base font-semibold text-gray-900">
                  {test.negativeMarks || 0} per wrong answer
                </div>
              </div>
            </div>

            {/* Instructions Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Instructions
              </h3>
              {test.description && test.description.trim() ? (
                <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside leading-relaxed">
                  {test.description
                    .split("\n")
                    .filter((line) => line.trim())
                    .map((line, index) => (
                      <li key={index}>{line.trim()}</li>
                    ))}
                </ul>
              ) : (
                <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>
                    Read each question carefully before selecting your answer
                  </li>
                  <li>
                    You can navigate between questions using the navigation
                    buttons
                  </li>
                  <li>
                    Mark questions for review if you want to come back to them
                    later
                  </li>
                  <li>
                    {test.duration
                      ? `You have ${test.duration} to complete the test`
                      : "There is no time limit for this test"}
                  </li>
                  <li>
                    {test.negativeMarks > 0
                      ? `Incorrect answers will result in -${test.negativeMarks} marks`
                      : "There are no negative marks for incorrect answers"}
                  </li>
                  <li>Review your answers before submitting</li>
                </ul>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-3 border-t border-gray-200">
              <button
                onClick={handleBackToList}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTest}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <FaCheck className="text-xs" />
                Start Test
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Test taking interface
    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = Object.values(answers).filter(
      (a) => a !== null
    ).length;
    const markedCount = markedForReview.size;
    const unansweredCount = questions.length - answeredCount;

    return (
      <div className="space-y-4">
        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 h-screen">
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg max-w-md w-full mx-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">
                  Submit Test?
                </h3>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-4 py-4">
                <p className="text-xs text-gray-600">
                  {unansweredCount > 0 ? (
                    <>
                      You have{" "}
                      <strong className="font-semibold text-gray-900">
                        {unansweredCount}
                      </strong>{" "}
                      unanswered{" "}
                      {unansweredCount === 1 ? "question" : "questions"}. After
                      you submit, you can&apos;t edit this test. Do you want to
                      continue?
                    </>
                  ) : (
                    <>
                      You have answered all {answeredCount}{" "}
                      {answeredCount === 1 ? "question" : "questions"}. After
                      you submit, you can&apos;t edit this test. Do you want to
                      continue?
                    </>
                  )}
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs font-medium transition-colors"
                >
                  Keep working
                </button>
                <button
                  onClick={() => handleSubmitTest(false)}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Test Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm sticky top-0 z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-base font-semibold text-gray-900 mb-1">
                {test.name}
              </h1>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span>•</span>
                <span>{answeredCount} Answered</span>
                {markedCount > 0 && (
                  <>
                    <span>•</span>
                    <span>{markedCount} Marked</span>
                  </>
                )}
              </div>
            </div>

            {timeRemaining !== null && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                  timeRemaining < 300
                    ? "bg-red-50 border-red-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <FaClock
                  className={`text-xs ${
                    timeRemaining < 300 ? "text-red-600" : "text-gray-600"
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    timeRemaining < 300 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Question Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Question Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full font-medium bg-gray-100 text-gray-900 border border-gray-200 text-xs">
                    {currentQuestionIndex + 1}
                  </span>
                  <h2 className="text-base font-semibold text-gray-900">
                    {currentQuestion.question}
                  </h2>
                </div>
                <button
                  onClick={() => handleToggleMarked(currentQuestion._id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    markedForReview.has(currentQuestion._id)
                      ? "bg-gray-100 text-gray-900"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  }`}
                  title="Mark for Review"
                >
                  <FaFlag className="text-xs" />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {["A", "B", "C", "D"].map((option) => {
                  const optionKey = `option${option}`;
                  const optionText = currentQuestion[optionKey];
                  const isSelected = answers[currentQuestion._id] === option;

                  return (
                    <button
                      key={option}
                      onClick={() =>
                        handleAnswerSelect(currentQuestion._id, option)
                      }
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-blue-50 border-blue-500"
                          : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {option}
                        </div>
                        <span className="text-xs font-medium text-gray-800 flex-1">
                          {optionText}
                        </span>
                        {isSelected && (
                          <FaCheckCircle className="text-blue-600 text-xs" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
              <button
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaArrowLeft className="text-xs" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShowSubmitModal}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <FaSave className="text-xs" />
                  <span>Submit Test</span>
                </button>
              </div>

              <button
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <FaArrowRight className="text-xs" />
              </button>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm sticky top-24">
              <h3 className="text-xs font-semibold text-gray-900 mb-2">
                Question Navigator
              </h3>
              <div className="grid grid-cols-5 gap-1.5 max-h-80 overflow-y-auto">
                {questions.map((question, index) => {
                  const isAnswered = answers[question._id] !== null;
                  const isMarked = markedForReview.has(question._id);
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={question._id}
                      onClick={() => goToQuestion(index)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        isCurrent
                          ? "bg-blue-600 text-white ring-2 ring-blue-500 shadow-md"
                          : isAnswered && isMarked
                          ? "bg-purple-500 text-white border-2 border-purple-600 hover:bg-purple-600"
                          : isAnswered
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : isMarked
                          ? "bg-yellow-400 text-gray-900 border-2 border-yellow-500 hover:bg-yellow-500"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200"
                      }`}
                      title={`Question ${index + 1}${
                        isMarked ? " (Marked)" : ""
                      }${isAnswered ? " (Answered)" : ""}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-yellow-400 border-2 border-yellow-500"></div>
                  <span className="text-gray-600">Marked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-purple-500"></div>
                  <span className="text-gray-600">Answered & Marked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
                  <span className="text-gray-600">Unanswered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-blue-600 ring-2 ring-blue-500"></div>
                  <span className="text-gray-600">Current</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div>
                    Answered: {answeredCount} / {questions.length}
                  </div>
                  <div>
                    Unanswered: {questions.length - answeredCount} /{" "}
                    {questions.length}
                  </div>
                  {markedCount > 0 && <div>Marked: {markedCount}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show test list
  if (groupedData.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm text-center">
        <FaFileAlt className="text-3xl text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-900 mb-1.5">
          No Practice Categories Available
        </h3>
        <p className="text-xs text-gray-600">
          There are no practice categories available for this section yet. Check
          back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
    {groupedData.map((group, groupIndex) => (
      <div
        key={groupIndex}
        className="
          bg-white 
          rounded-xl 
          border border-gray-200 
          shadow-sm 
          hover:shadow-md 
          transition-all 
          duration-200
          overflow-hidden
        "
      >
        {/* TABLE FOR DESKTOP */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full table-fixed">
            
            {/* FIXED HEADER */}
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                
                {/* Column 1 */}
                <th className="px-4 py-2 text-left w-[28%] text-sm text-blue-600">
                  {group.category.name}
                </th>
  
                {/* Column 2 */}
                <th className="px-3 py-2 text-center w-[10%]">Questions</th>
  
                {/* Column 3 */}
                <th className="px-3 py-2 text-center w-[12%]">Max. Marks</th>
  
                {/* Column 4 */}
                <th className="px-3 py-2 text-center w-[12%]">Duration</th>
  
                {/* Column 5 */}
                <th className="px-3 py-2 text-center w-[12%]">Attempted</th>
  
                {/* Column 6 */}
                <th className="px-3 py-2 text-right w-[13%]">Practice</th>
  
                {/* Column 7 */}
                <th className="px-4 py-2 text-right w-[13%]">My Score</th>
              </tr>
            </thead>
  
            {/* BODY */}
            <tbody className="divide-y divide-gray-200 bg-white">
              {group.tests.map((test, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-all">
  
                  {/* Col 1 */}
                  <td className="px-4 py-2 w-[28%]">
                    <div className="text-sm font-semibold text-gray-900">
                      <span className="mr-1">
                        {test.orderNumber}.
                      </span>
                      {test.name}
                    </div>
                  </td>
  
                  {/* Col 2 */}
                  <td className="px-3 py-2 text-center text-sm text-gray-700 w-[10%]">
                    {test.numberOfQuestions || 0}
                  </td>
  
                  {/* Col 3 */}
                  <td className="px-3 py-2 text-center text-sm text-gray-700 w-[12%]">
                    {test.maximumMarks || 0}
                  </td>
  
                  {/* Col 4 */}
                  <td className="px-3 py-2 text-center text-sm text-gray-700 w-[12%]">
                    {test.duration || "N/A"}
                  </td>
  
                  {/* Col 5 */}
                  <td className="px-3 py-2 text-center text-sm text-gray-500 w-[12%]">
                    –
                  </td>
  
                  {/* Col 6 */}
                  <td className="px-3 py-2 text-right w-[13%]">
                    <button
                      onClick={() => setSelectedTest(test._id)}
                      className="
                        px-4 py-1.5
                        bg-blue-600 
                        hover:bg-blue-700 
                        text-white 
                        text-xs font-semibold 
                        rounded-md 
                        shadow-sm 
                        hover:shadow
                        transition-all
                      "
                    >
                      Start
                    </button>
                  </td>
  
                  {/* Col 7 */}
                  <td className="px-4 py-2 text-right text-sm font-bold w-[13%]">
                    <span className="text-gray-500">NA</span>
                  </td>
                </tr>
              ))}
            </tbody>
  
          </table>
        </div>
  
     {/* 🎯 MOBILE CARD VIEW */}
<div className="md:hidden divide-y divide-gray-200">
  {group.tests.map((test, i) => (
    <div key={i} className="px-4 py-3">

      {/* Show category name ONLY for the first test */}
      {i === 0 && (
        <div className="text-sm font-bold text-blue-600 mb-2">
          {group.category.name}
        </div>
      )}

      {/* Paper Name */}
      <div className="text-sm font-semibold text-gray-900">
        <span className=" mr-1">{test.orderNumber}.</span>
        {test.name}
      </div>

      {/* Details */}
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-700">
        <div>Questions: {test.numberOfQuestions || 0}</div>
        <div>Marks: {test.maximumMarks || 0}</div>
        <div>Duration: {test.duration || "N/A"}</div>
        <div>Attempted: –</div>
      </div>

      {/* Button + Score */}
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => setSelectedTest(test._id)}
          className="
            px-4 py-1.5 
            bg-blue-600 
            text-white 
            text-[11px]
            font-semibold 
            rounded-md 
            hover:bg-blue-700 
            shadow-sm 
            transition-all
          "
        >
          Start
        </button>

        <div className="text-xs font-bold text-gray-500">
          NA
        </div>
      </div>

    </div>
  ))}
</div>

      </div>
    ))}
  </div>
  
  );
};

export default PracticeTestList;
