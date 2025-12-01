"use client";
import React from "react";

/**
 * Reusable skeleton loader component for better loading states
 */
export const SkeletonCard = ({ className = "" }) => (
  <div className={`bg-gray-200 animate-pulse rounded-xl ${className}`} aria-hidden="true" />
);

export const SkeletonText = ({ lines = 1, className = "" }) => (
  <div className={`space-y-2 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`h-4 bg-gray-200 animate-pulse rounded ${
          i === lines - 1 ? "w-3/4" : "w-full"
        }`}
      />
    ))}
  </div>
);

export const SkeletonCircle = ({ size = "w-12 h-12", className = "" }) => (
  <div
    className={`${size} bg-gray-200 animate-pulse rounded-full ${className}`}
    aria-hidden="true"
  />
);

export const SkeletonButton = ({ className = "" }) => (
  <div
    className={`h-10 bg-gray-200 animate-pulse rounded-lg ${className}`}
    aria-hidden="true"
  />
);

export const ExamCardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-lg">
    <SkeletonCard className="h-40 sm:h-44 md:h-48" />
    <div className="p-5 sm:p-6">
      <SkeletonText lines={1} className="mb-4" />
      <SkeletonText lines={5} className="mb-4" />
      <SkeletonButton className="w-32 ml-auto" />
    </div>
  </div>
);

export default SkeletonCard;

