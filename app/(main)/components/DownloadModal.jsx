"use client";
import React, { useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaGlobe,
  FaGraduationCap,
  FaComment,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaTimes,
  FaDownload,
} from "react-icons/fa";
import api from "@/lib/api";

const DownloadModal = ({ isOpen, onClose, unitName }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    className: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [submitMessage, setSubmitMessage] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    // Clear submit status when user starts typing
    if (submitStatus) {
      setSubmitStatus(null);
      setSubmitMessage("");
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    if (!formData.className.trim()) {
      newErrors.className = "Class name is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage("");

    try {
      const response = await api.post("/lead", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        country: formData.country.trim(),
        className: formData.className.trim(),
        message: formData.message.trim(),
      });

      if (response.data?.success) {
        // Success
        setSubmitStatus("success");
        setSubmitMessage(
          "Thank you! Your request has been submitted successfully. We'll get back to you soon."
        );
        // Reset form
        setFormData({
          name: "",
          email: "",
          country: "",
          className: "",
          message: "",
        });
        setErrors({});
        // Close modal after 2 seconds on success
        setTimeout(() => {
          onClose();
          setSubmitStatus(null);
          setSubmitMessage("");
        }, 2000);
      } else {
        // API returned error
        setSubmitStatus("error");
        setSubmitMessage(
          response.data?.message ||
            "Failed to submit your request. Please try again."
        );
      }
    } catch (error) {
      // Handle error
      setSubmitStatus("error");
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit your request. Please check your connection and try again.";
      setSubmitMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: "",
        email: "",
        country: "",
        className: "",
        message: "",
      });
      setErrors({});
      setSubmitStatus(null);
      setSubmitMessage("");
      onClose();
    }
  };

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaDownload className="text-blue-600 text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Download Study Materials
              </h2>
              <p className="text-sm text-gray-500">
                Fill out the form to download {unitName} materials
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Success/Error Message */}
            {submitStatus && (
              <div
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  submitStatus === "success"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {submitStatus === "success" ? (
                  <FaCheckCircle className="text-green-600 text-base shrink-0 mt-0.5" />
                ) : (
                  <FaExclamationCircle className="text-red-600 text-base shrink-0 mt-0.5" />
                )}
                <p className="text-sm font-medium">{submitMessage}</p>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label
                htmlFor="modal-name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400 text-sm" />
                </div>
                <input
                  type="text"
                  id="modal-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.name
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="modal-email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400 text-sm" />
                </div>
                <input
                  type="email"
                  id="modal-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.email
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="Enter your email address"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Country Field */}
            <div>
              <label
                htmlFor="modal-country"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Country <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaGlobe className="text-gray-400 text-sm" />
                </div>
                <input
                  type="text"
                  id="modal-country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.country
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="Enter your country"
                  disabled={isSubmitting}
                />
              </div>
              {errors.country && (
                <p className="mt-1 text-sm text-red-600">{errors.country}</p>
              )}
            </div>

            {/* Class Name Field */}
            <div>
              <label
                htmlFor="modal-className"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Class Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaGraduationCap className="text-gray-400 text-sm" />
                </div>
                <input
                  type="text"
                  id="modal-className"
                  name="className"
                  value={formData.className}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.className
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="Enter your class name (e.g., Grade 10, Class 12)"
                  disabled={isSubmitting}
                />
              </div>
              {errors.className && (
                <p className="mt-1 text-sm text-red-600">{errors.className}</p>
              )}
            </div>

            {/* Message Field */}
            <div>
              <label
                htmlFor="modal-message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Message <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <FaComment className="text-gray-400 text-sm" />
                </div>
                <textarea
                  id="modal-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                    errors.message
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="Tell us about your inquiry or what materials you need..."
                  disabled={isSubmitting}
                />
              </div>
              {errors.message && (
                <p className="mt-1 text-sm text-red-600">{errors.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FaDownload />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>

            {/* Required Field Note */}
            <p className="text-xs text-gray-500 text-center">
              <span className="text-red-500">*</span> Required fields
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;

