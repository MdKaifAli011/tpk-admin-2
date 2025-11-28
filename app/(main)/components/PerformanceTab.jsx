"use client";

import React from "react";

const PerformanceTab = ({ entityType, entityName }) => {
  const getDescription = () => {
    switch (entityType) {
      case "exam":
        return `Track your performance across all subjects in ${entityName}. Monitor your progress and identify areas for improvement.`;
      case "subject":
        return `Track your performance in ${entityName} across all categories and topics. Analyze your strengths and weaknesses.`;
      case "unit":
        return `Track your performance in ${entityName} across all chapters. See detailed insights and progress metrics.`;
      case "chapter":
        return `Track your performance in ${entityName}. Monitor your learning progress and test scores.`;
      case "topic":
        return `Track your performance in ${entityName}. Analyze your understanding and practice test results.`;
      case "subtopic":
        return `Track your performance in ${entityName}. See detailed analytics and improvement suggestions.`;
      case "definition":
        return `Track your performance in ${entityName}. Monitor your mastery level and learning progress.`;
      default:
        return `Track your performance. Monitor your progress and identify areas for improvement.`;
    }
  };

  const getFooterText = () => {
    if (entityType === "exam") {
      return "Performance analytics dashboard will be available soon.";
    }
    return `Performance analytics features will be available soon. Monitor your progress and improve your scores with detailed insights!`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          Performance Analytics
        </h3>
        <p className="text-sm text-gray-700 leading-normal">{getDescription()}</p>
      </div>
      <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700">Coming Soon</p>
        </div>
        <p className="text-xs text-gray-600 leading-normal">{getFooterText()}</p>
      </div>
    </div>
  );
};

export default PerformanceTab;

