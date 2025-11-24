"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { FaSearch, FaChevronDown } from "react-icons/fa";
import TextEllipsis from "./TextEllipsis";

/**
 * ExamDropdown - Accessible searchable exam selection dropdown
 * @param {Array} exams - List of exam objects
 * @param {string} activeExamId - Currently active exam ID
 * @param {Function} onSelect - Callback when exam is selected
 */
const ExamDropdown = ({ exams = [], activeExamId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const listRef = useRef(null);
  const triggerRef = useRef(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return exams;
    return exams.filter((e) => e.name.toLowerCase().includes(q));
  }, [exams, filter]);

  // Reset filter and highlight when dropdown closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setFilter("");
        setHighlightIndex(-1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    const onDoc = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const scrollToHighlight = () => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlightIndex];
    if (item) item.scrollIntoView({ block: "nearest" });
  };

  const handleKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
      scrollToHighlight();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
      scrollToHighlight();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[highlightIndex] || filtered[0];
      if (item) onSelect(item);
      setOpen(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const activeExam = exams.find((e) => e._id === activeExamId) || null;

  return (
    <div className="relative" ref={triggerRef}>
      <button
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200/80 bg-white px-3 py-2 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-1 transition"
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          <span className="text-[11px] uppercase tracking-wide text-gray-500 shrink-0">
            Exam
          </span>
          <TextEllipsis
            maxW="max-w-[200px]"
            className="font-semibold text-gray-900"
          >
            {activeExam ? activeExam.name : "Select exam"}
          </TextEllipsis>
        </div>
        <FaChevronDown
          className={`text-gray-400 shrink-0 transition-transform duration-300 ease-in-out ${
            open ? "-rotate-180" : "rotate-0"
          }`}
          size={14}
        />
      </button>

      <div
        className={`absolute left-0 right-0 mt-2 z-40 ${
          open ? "block" : "hidden"
        }`}
      >
        <div className="rounded-lg bg-white shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-2 border-b border-gray-100 bg-gray-50/60">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Filter exams..."
                className="w-full rounded-md border border-gray-200 bg-white px-8 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/80 transition"
                autoFocus
              />
            </div>
          </div>

          <ul
            ref={listRef}
            role="listbox"
            aria-activedescendant={filtered[highlightIndex]?._id}
            tabIndex={-1}
            className="max-h-64 overflow-y-auto overflow-x-hidden divide-y divide-gray-100 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-500 text-center">
                No exams found
              </li>
            )}

            {filtered.map((exam, idx) => {
              const isActive = exam._id === activeExamId;
              const highlighted = idx === highlightIndex;
              return (
                <li key={exam._id}>
                  <button
                    id={exam._id}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    onClick={() => {
                      onSelect(exam);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                      highlighted ? "bg-blue-50" : "hover:bg-gray-50"
                    } ${
                      isActive ? "font-semibold text-blue-600" : "text-gray-700"
                    }`}
                  >
                    <TextEllipsis
                      maxW="max-w-[220px]"
                      className={isActive ? "text-blue-600" : ""}
                    >
                      {exam.name}
                    </TextEllipsis>
                    {isActive && (
                      <span className="text-[11px] font-medium text-blue-600 shrink-0 ml-2 rounded-full border border-blue-100 px-2 py-0.5 bg-blue-50/70">
                        Active
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExamDropdown;

