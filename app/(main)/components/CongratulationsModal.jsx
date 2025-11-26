"use client";

import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";

const CongratulationsModal = ({ isOpen, onClose, chapterName }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "unset";
      return;
    }

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    // Trigger confetti animation
    const timer = setTimeout(() => setShowConfetti(true), 100);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "unset";
      setShowConfetti(false);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex z-60 items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Animated Backdrop with decorative shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 via-indigo-50/70 to-purple-50/90">
        {/* Animated decorative shapes */}
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/25 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 animate-pulse"></div>
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-purple-200/25 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-sm"
        style={{ animation: "fadeIn 0.3s ease-out" }}
      />

      {/* Modal Card with Glassmorphism */}
      <div
        className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full mx-4 p-6 sm:p-8 md:p-10 lg:p-12 transform transition-all duration-500"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow:
            "0 25px 70px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          animation: "fadeInScale 0.5s ease-out",
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-all duration-200 p-1.5 sm:p-2 rounded-full hover:bg-gray-100/50 backdrop-blur-sm z-10"
          aria-label="Close"
        >
          <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Award Ribbon Icon */}
        <div className="relative flex justify-center mb-6 sm:mb-8">
          <div
            className="relative"
            style={{ animation: "fadeInScale 0.7s ease-out 0.2s both" }}
          >
            {/* Enhanced Confetti Elements */}
            {showConfetti && (
              <>
                <div
                  className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 text-yellow-400 text-lg sm:text-2xl animate-bounce drop-shadow-lg"
                  style={{ animationDelay: "0s", animationDuration: "1.5s" }}
                >
                  ✨
                </div>
                <div
                  className="absolute -top-1 -right-3 sm:-top-2 sm:-right-4 text-red-400 text-base sm:text-xl animate-bounce drop-shadow-lg"
                  style={{ animationDelay: "0.2s", animationDuration: "1.3s" }}
                >
                  ✨
                </div>
                <div
                  className="absolute -bottom-2 -left-3 sm:-bottom-3 sm:-left-4 text-blue-400 text-base sm:text-xl animate-bounce drop-shadow-lg"
                  style={{ animationDelay: "0.4s", animationDuration: "1.4s" }}
                >
                  ✨
                </div>
                <div
                  className="absolute -bottom-1 -right-2 sm:-bottom-2 sm:-right-3 text-yellow-400 text-lg sm:text-2xl animate-bounce drop-shadow-lg"
                  style={{ animationDelay: "0.6s", animationDuration: "1.6s" }}
                >
                  ✨
                </div>
                <div
                  className="absolute top-2 -left-4 sm:top-3 sm:-left-5 text-red-400 text-sm sm:text-lg animate-bounce drop-shadow-lg"
                  style={{ animationDelay: "0.8s", animationDuration: "1.2s" }}
                >
                  ✨
                </div>
                <div
                  className="absolute top-3 -right-4 sm:top-4 sm:-right-5 text-blue-400 text-sm sm:text-lg animate-bounce drop-shadow-lg"
                  style={{ animationDelay: "1s", animationDuration: "1.5s" }}
                >
                  ✨
                </div>
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 text-purple-400 text-base sm:text-xl animate-bounce drop-shadow-lg"
                  style={{ animationDelay: "0.3s", animationDuration: "1.4s" }}
                >
                  ✨
                </div>
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-pink-400 text-base sm:text-xl animate-bounce drop-shadow-lg"
                  style={{ animationDelay: "0.7s", animationDuration: "1.3s" }}
                >
                  ✨
                </div>
              </>
            )}

            {/* Award Ribbon with Animation */}
            <div
              className="relative w-24 h-28 sm:w-28 sm:h-32 md:w-32 md:h-36 mx-auto"
              style={{ animation: "fadeInScale 1s ease-out 0.3s both" }}
            >
              {/* Ribbon Tails with Animation */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-1 sm:gap-1.5">
                <div
                  className="w-8 h-14 sm:w-10 sm:h-16 md:w-12 md:h-20 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 rounded-t-full transform -rotate-12 origin-bottom shadow-lg"
                  style={{
                    animation: "slideInLeft 0.7s ease-out 0.5s both",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
                  }}
                ></div>
                <div
                  className="w-8 h-14 sm:w-10 sm:h-16 md:w-12 md:h-20 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 rounded-t-full transform rotate-12 origin-bottom shadow-lg"
                  style={{
                    animation: "slideInLeft 0.7s ease-out 0.6s both",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
                  }}
                ></div>
              </div>

              {/* Circular Medal with Glow Effect */}
              <div
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full shadow-2xl border-3 sm:border-4 border-blue-200/80 flex items-center justify-center ring-2 sm:ring-4 ring-blue-200/30"
                style={{
                  animation: "fadeInScale 1s ease-out 0.4s both",
                  boxShadow:
                    "0 10px 30px rgba(37, 99, 235, 0.5), 0 0 0 4px rgba(147, 197, 253, 0.3)",
                }}
              >
                {/* Animated Star */}
                <svg
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white drop-shadow-2xl"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    animation: "spin 3s linear infinite",
                    filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                  }}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Text Content with Animation */}
        <div
          className="text-center mb-6 sm:mb-8"
          style={{ animation: "fadeIn 0.7s ease-out 0.6s both" }}
        >
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-600 mb-3 sm:mb-4 leading-tight"
            style={{
              textShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
            }}
          >
            Congratulations
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-blue-600 font-medium leading-relaxed px-2">
            {chapterName ? (
              <>
                You completed{" "}
                <span className="font-bold text-blue-700">{chapterName}</span>!
              </>
            ) : (
              "You did a Great job in the test!"
            )}
          </p>
        </div>

        {/* Continue Button with Animation */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold py-3 sm:py-3.5 md:py-4 px-5 sm:px-6 rounded-lg sm:rounded-xl shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl text-sm sm:text-base"
          style={{
            animation: "fadeIn 0.7s ease-out 0.8s both",
            boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default CongratulationsModal;
