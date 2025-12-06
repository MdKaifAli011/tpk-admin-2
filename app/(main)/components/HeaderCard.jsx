"use client";

import React from "react";

const HeaderCard = ({ title, breadcrumb = [], progress = null }) => {
  return (
    <section
      className="
        rounded-xl
        p-3 sm:p-4
        bg-gradient-to-br from-indigo-50 via-white to-purple-50
        border border-indigo-100/60
        shadow-[0_2px_12px_rgba(120,90,200,0.08)]
      "
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2.5">
        
        {/* Left: Title + Breadcrumb */}
        <div className="flex-1 leading-tight">
          <h1 className="text-lg sm:text-xl font-bold text-indigo-900">
            {title}
          </h1>

          {breadcrumb.length > 0 && (
            <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
              {breadcrumb.join(" > ")}
            </p>
          )}
        </div>

        {/* Right: Progress Component */}
        {progress && (
          <div>
            {progress}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeaderCard;
