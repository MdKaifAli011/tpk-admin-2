"use client";

import React from "react";

// Truncate text to specific character count
const truncateText = (text, maxChars) => {
  if (!text) return "";
  const str = String(text);
  if (str.length <= maxChars) return str;
  return str.substring(0, maxChars) + "...";
};

/**
 * TextEllipsis - Text component with ellipsis truncation and tooltip
 * @param {string} children - Text content
 * @param {string} maxW - Max width class (default: "max-w-[240px]")
 * @param {string} className - Additional CSS classes
 * @param {number} truncateChars - Number of characters before truncating (optional)
 * @param {string} fontSize - Font size class (default: "text-sm")
 * @param {object} style - Inline styles
 */
const TextEllipsis = ({
  children,
  maxW = "max-w-[240px]",
  className = "",
  truncateChars = null,
  fontSize = "text-sm",
  style = {},
}) => {
  const displayText = truncateChars
    ? truncateText(children, truncateChars)
    : children;

  const maxWidthClass = maxW === "max-w-full" ? "w-full" : maxW;
  
  return (
    <span
      className={`truncate whitespace-nowrap overflow-hidden block ${maxWidthClass} ${fontSize} ${className}`}
      title={typeof children === "string" ? children : undefined}
      style={style}
    >
      {displayText}
    </span>
  );
};

export default TextEllipsis;

