"use client";
import { useState } from "react";
import ExamTable from "../table/ExamTable";

const ExamList = () => {
  const [exams, setExams] = useState([
    { id: 1, name: "AP", status: "Active" },
    { id: 2, name: "SAT", status: "Active" },
    { id: 3, name: "JEE", status: "Active" },
    { id: 4, name: "NEET", status: "Active" },
  ]);
  // 👉 To test "No Data" UI, set exams = []

  const lastUpdated = new Date().toLocaleTimeString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Exams List</h2>
            <p className="text-xs text-gray-500 mt-1">
              Manage your exams, view details, and perform actions
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.836 0H20V4m0 0H4m16 0v5M4 20v-5h.582m15.836 0H20v5m0 0H4m16 0v-5"
              />
            </svg>
            <span className="text-xs">
              Last updated: <span className="font-medium">{lastUpdated}</span>
            </span>
          </div>
        </div>

        {/* Table / No Data */}
        <ExamTable exams={exams} />
      </div>
    </div>
  );
};

export default ExamList;
