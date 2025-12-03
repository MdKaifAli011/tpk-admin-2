"use client";

import React from "react";

/**
 * SubjectCompletionTracker - Empty component
 * 
 * Congratulations are now handled by SubjectProgressClient component
 * This component is kept for backward compatibility but does nothing
 */
const SubjectCompletionTracker = ({ subjectId, subjectName, unitIds = [] }) => {
  // Congratulations are handled by SubjectProgressClient
  // This component is kept to avoid breaking existing imports
  return null;
};

export default SubjectCompletionTracker;

