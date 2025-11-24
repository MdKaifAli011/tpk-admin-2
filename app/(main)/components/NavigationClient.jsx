"use client";

import React from "react";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const NavigationClient = ({ 
  backUrl, 
  backLabel, 
  prevNav, 
  nextNav 
}) => {
  return (
    <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        {backUrl && (
          <Link
            href={backUrl}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            <FaChevronLeft className="text-xs" />
            <span>{backLabel || "Back"}</span>
          </Link>
        )}

        <div className="flex items-center gap-3 sm:gap-4">
          {prevNav && (
            <Link
              href={prevNav.url}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              title={prevNav.label}
            >
              <FaChevronLeft className="text-xs" />
              <span className="hidden sm:inline">Previous</span>
            </Link>
          )}
          {nextNav && (
            <Link
              href={nextNav.url}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              title={nextNav.label}
            >
              <span className="hidden sm:inline">Next</span>
              <FaChevronRight className="text-xs" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default NavigationClient;

