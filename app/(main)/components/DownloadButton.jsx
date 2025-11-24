"use client";
import React, { useState } from "react";
import { FaDownload } from "react-icons/fa";
import DownloadModal from "./DownloadModal";

const DownloadButton = ({ unitName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
      >
        <FaDownload className="text-sm" />
        <span>Download</span>
      </button>
      <DownloadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        unitName={unitName}
      />
    </>
  );
};

export default DownloadButton;

