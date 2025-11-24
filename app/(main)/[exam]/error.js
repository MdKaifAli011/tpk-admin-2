"use client";

import React from "react";
import MainLayout from "../layout/MainLayout";
import { ERROR_MESSAGES } from "@/constants";

export default function Error({ error, reset }) {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <h2 className="font-semibold mb-2">Something went wrong!</h2>
          <p className="mb-4">
            {error?.message || ERROR_MESSAGES.EXAM_NOT_FOUND}
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

