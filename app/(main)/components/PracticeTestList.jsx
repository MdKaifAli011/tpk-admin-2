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
    const loadPracticeTests = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const filters = {
          examId,
          subjectId,
          unitId,
          chapterId,
          topicId,
          subTopicId,
          status: "active",
        };

        const tests = await fetchPracticeTests(filters);
        setPracticeTests(tests);
      } catch (err) {
        logger.error("Error loading practice tests:", err);
        setError("Failed to load practice tests. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (examId || subjectId || unitId || chapterId || topicId || subTopicId) {
      loadPracticeTests();
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error
  if (error && !selectedTest) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <FaTimesCircle />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Show test taking interface
  if (selectedTest) {
    // Loading test
    if (isLoadingTest) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Error loading test
    if (error || !test) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-700">
              <FaTimesCircle />
              <p className="text-sm">{error || "Practice test not found"}</p>
            </div>
          </div>
          <button
            onClick={handleBackToList}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Tests
          </button>
        </div>
      );
    }

    // No questions
    if (questions.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Questions Available
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              This practice test doesn&apos;t have any questions yet.
            </p>
            <button
              onClick={handleBackToList}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-colors"
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
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                Test Results
              </h1>
              <p className="text-sm text-gray-600">{test.name}</p>
            </div>
          </div>

          {/* Score Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-3xl font-semibold text-gray-900 mb-1">
                  {results.percentage}%
                </div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-3xl font-semibold text-gray-900 mb-1">
                  {results.correctCount}
                </div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-3xl font-semibold text-gray-900 mb-1">
                  {results.incorrectCount}
                </div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-3xl font-semibold text-gray-900 mb-1">
                  {results.unansweredCount}
                </div>
                <div className="text-sm text-gray-600">Unanswered</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {results.totalMarks.toFixed(2)} / {results.maximumMarks}
                  </div>
                  <div className="text-sm text-gray-600">Total Marks</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Time Taken: {Math.floor(results.timeTaken / 60)}m{" "}
                    {results.timeTaken % 60}s
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Question-wise Results */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Question-wise Results
            </h2>
            <div className="space-y-6">
              {results.questionResults.map((result, index) => {
                const question = questions.find(
                  (q) => q._id === result.questionId
                );
                return (
                  <div
                    key={result.questionId}
                    className="border border-gray-200 rounded-lg p-6 bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-full font-medium bg-gray-100 text-gray-900 border border-gray-200">
                          {index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          Explanation:
                        </h4>
                        <p className="text-sm text-gray-600">
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
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleBackToList}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-colors"
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
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2 leading-tight">
                {test.name}
              </h1>
            </div>

            {/* Test Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <FaClock className="text-gray-600 text-base" />
                  <span className="text-sm font-medium text-gray-600">
                    Duration
                  </span>
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {test.duration || "No Limit"}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    Total Questions
                  </span>
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {questions.length}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    Maximum Marks
                  </span>
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {test.maximumMarks || 0}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    Negative Marks
                  </span>
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {test.negativeMarks || 0} per wrong answer
                </div>
              </div>
            </div>

            {/* Instructions Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Instructions
              </h3>
              {test.description && test.description.trim() ? (
                <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside leading-relaxed">
                  {test.description
                    .split("\n")
                    .filter((line) => line.trim())
                    .map((line, index) => (
                      <li key={index}>{line.trim()}</li>
                    ))}
                </ul>
              ) : (
                <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside leading-relaxed">
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
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleBackToList}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTest}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <FaCheck className="text-sm" />
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
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Submit Test?
                </h3>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6">
                <p className="text-sm text-gray-600">
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
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-colors"
                >
                  Keep working
                </button>
                <button
                  onClick={() => handleSubmitTest(false)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Test Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm sticky top-0 z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {test.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
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
                className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
                  timeRemaining < 300
                    ? "bg-red-50 border-red-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <FaClock
                  className={
                    timeRemaining < 300 ? "text-red-600" : "text-gray-600"
                  }
                />
                <span
                  className={`text-lg font-semibold ${
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
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full font-medium bg-gray-100 text-gray-900 border border-gray-200">
                    {currentQuestionIndex + 1}
                  </span>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentQuestion.question}
                  </h2>
                </div>
                <button
                  onClick={() => handleToggleMarked(currentQuestion._id)}
                  className={`p-2 rounded-lg transition-colors ${
                    markedForReview.has(currentQuestion._id)
                      ? "bg-gray-100 text-gray-900"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  }`}
                  title="Mark for Review"
                >
                  <FaFlag />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-3">
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
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-blue-50 border-blue-500"
                          : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                            isSelected
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {option}
                        </div>
                        <span className="text-sm font-medium text-gray-800 flex-1">
                          {optionText}
                        </span>
                        {isSelected && (
                          <FaCheckCircle className="text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <button
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaArrowLeft />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShowSubmitModal}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <FaSave />
                  <span>Submit Test</span>
                </button>
              </div>

              <button
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <FaArrowRight />
              </button>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm sticky top-24">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Question Navigator
              </h3>
              <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
                {questions.map((question, index) => {
                  const isAnswered = answers[question._id] !== null;
                  const isMarked = markedForReview.has(question._id);
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={question._id}
                      onClick={() => goToQuestion(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        isCurrent
                          ? "bg-blue-600 text-white ring-2 ring-blue-500 shadow-md scale-105"
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

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-400 border-2 border-yellow-500"></div>
                  <span className="text-gray-600">Marked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500"></div>
                  <span className="text-gray-600">Answered & Marked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200"></div>
                  <span className="text-gray-600">Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-600 ring-2 ring-blue-500"></div>
                  <span className="text-gray-600">Current</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-600 space-y-1">
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
  if (practiceTests.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
        <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Practice Tests Available
        </h3>
        <p className="text-sm text-gray-500">
          There are no practice tests available for this section yet. Check back
          later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card View - All Screen Sizes */}
      {practiceTests.map((test, index) => {
        const hierarchyPath = getHierarchyPath(test);
        return (
          <div
            key={test._id || index}
            className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  {test.orderNumber && (
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-2">
                      {test.orderNumber}
                    </div>
                  )}
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 mb-3">
                    {test.name}
                  </h3>
                  {/* Hierarchy Path */}
                  <div className="mb-4">
                    {hierarchyPath ? (
                      <div className="inline-flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          {hierarchyPath.label}:
                        </span>
                        <span
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm"
                          style={
                            hierarchyPath.label === "Topic"
                              ? {
                                  backgroundColor: "#F59E0B",
                                  boxShadow:
                                    "0 2px 4px rgba(245, 158, 11, 0.3)",
                                }
                              : hierarchyPath.label === "Subtopic"
                              ? {
                                  backgroundColor: "#06B6D4",
                                  boxShadow: "0 2px 4px rgba(6, 182, 212, 0.3)",
                                }
                              : hierarchyPath.label === "Chapter"
                              ? {
                                  backgroundColor: "#EC4899",
                                  boxShadow:
                                    "0 2px 4px rgba(236, 72, 153, 0.3)",
                                }
                              : {
                                  backgroundColor: "#8B5CF6",
                                  boxShadow:
                                    "0 2px 4px rgba(139, 92, 246, 0.3)",
                                }
                          }
                        >
                          {hierarchyPath.name}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-400 italic rounded-md text-xs">
                        Not Assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Test Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <FaClock className="text-gray-500 text-xs flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500 font-medium">
                      Duration
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {test.duration || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-indigo-50 rounded-lg">
                  <div className="w-5 h-5 rounded bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-700">M</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-indigo-600 font-medium">
                      Max Marks
                    </div>
                    <div className="text-sm font-bold text-indigo-900">
                      {test.maximumMarks || 0}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-purple-50 rounded-lg">
                  <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-purple-700">Q</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-purple-600 font-medium">
                      Questions
                    </div>
                    <div className="text-sm font-bold text-purple-900">
                      {test.numberOfQuestions || 0}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg">
                  <div className="w-5 h-5 rounded bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-700">-</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-red-600 font-medium">
                      Negative
                    </div>
                    <div className="text-sm font-bold text-red-900">
                      {test.negativeMarks || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedTest(test._id)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <FaPlay className="text-xs" />
                <span>Start Test</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PracticeTestList;
