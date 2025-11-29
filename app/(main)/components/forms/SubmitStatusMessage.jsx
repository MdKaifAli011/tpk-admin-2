"use client";

import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

const SubmitStatusMessage = ({ status, message }) => {
  if (!status) return null;

  return (
    <div
      className={`p-3 rounded-lg flex items-start gap-2 ${
        status === "success"
          ? "bg-green-50 border border-green-200 text-green-800"
          : "bg-red-50 border border-red-200 text-red-800"
      }`}
    >
      {status === "success" ? (
        <FaCheckCircle className="text-green-600 text-sm shrink-0 mt-0.5" />
      ) : (
        <FaExclamationCircle className="text-red-600 text-sm shrink-0 mt-0.5" />
      )}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

export default SubmitStatusMessage;

