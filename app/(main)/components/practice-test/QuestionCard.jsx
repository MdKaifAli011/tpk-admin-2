"use client";

import React from "react";
import { FaFlag, FaCheckCircle } from "react-icons/fa";

const QuestionCard = ({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerSelect,
  onToggleMarked,
  isMarked,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full font-medium bg-gray-100 text-gray-900 border border-gray-200 text-xs">
            {questionNumber}
          </span>
          <h2 className="text-base font-semibold text-gray-900">
            {question.question}
          </h2>
        </div>
        <button
          onClick={() => onToggleMarked(question._id)}
          className={`p-1.5 rounded-lg transition-colors ${
            isMarked
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
          const optionText = question[optionKey];
          const isSelected = selectedAnswer === option;

          return (
            <button
              key={option}
              onClick={() => onAnswerSelect(question._id, option)}
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
  );
};

export default QuestionCard;

