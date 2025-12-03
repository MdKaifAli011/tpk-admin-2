"use client";

import React from "react";

/**
 * UnitCompletionTracker - Empty component
 * 
 * Congratulations are now handled by UnitProgressClient component
 * This component is kept for backward compatibility but does nothing
 */
const UnitCompletionTracker = ({ unitId, unitName }) => {
  // Congratulations are handled by UnitProgressClient
  // This component is kept to avoid breaking existing imports
  return null;
};

export default UnitCompletionTracker;

