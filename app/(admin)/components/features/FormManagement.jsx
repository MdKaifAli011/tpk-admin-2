"use client";
import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCopy,
  FaEye,
  FaClipboardList,
  FaCode,
  FaTimes,
} from "react-icons/fa";
import { ToastContainer, useToast } from "../ui/Toast";
import api from "@/lib/api";
import { LoadingSpinner } from "../ui/SkeletonLoader";
import FormBuilder from "./FormBuilder";

const FormManagement = () => {
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const { toasts, removeToast, success, error: showError } = useToast();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/form");
      if (response.data?.success) {
        setForms(response.data.data || []);
      } else {
        setError(response.data?.message || "Failed to fetch forms");
      }
    } catch (err) {
      console.error("Error fetching forms:", err);
      setError(err?.response?.data?.message || "Failed to fetch forms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (form) => {
    if (
      !window.confirm(`Are you sure you want to delete "${form.formName}"?`)
    ) {
      return;
    }

    try {
      const response = await api.delete(`/form/${form.formId}`);
      if (response.data?.success) {
        success("Form deleted successfully!");
        fetchForms();
      } else {
        showError(response.data?.message || "Failed to delete form");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to delete form");
    }
  };

  const handleEdit = (form) => {
    setEditingForm(form);
    setShowBuilder(true);
  };

  const handleCreateNew = () => {
    setEditingForm(null);
    setShowBuilder(true);
  };

  const handleBuilderClose = () => {
    setShowBuilder(false);
    setEditingForm(null);
    fetchForms();
  };

  const handleShowCode = (form) => {
    setSelectedForm(form);
    setShowCodeModal(true);
  };

  const generateCode = (form) => {
    const componentName = form.formId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
    return `import FormRenderer from '@/components/forms/FormRenderer';
import { useState } from 'react';

export const ${componentName}Form = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Open Form
      </button>
      <FormRenderer 
        formId="${form.formId}"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        prepared=""
      />
    </>
  );
};`;
  };

  if (showBuilder) {
    return <FormBuilder form={editingForm} onClose={handleBuilderClose} />;
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Form Management
            </h1>
            <p className="text-xs text-gray-600">
              Create and manage dynamic forms. Generate code to embed forms
              anywhere in your application.
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <FaPlus className="text-sm" />
            Create New Form
          </button>
        </div>
      </div>

      {/* Forms List */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">
            Forms ({forms.length})
          </h2>
        </div>

        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="medium" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-red-100 rounded-full mb-4">
                <FaClipboardList className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error Loading Forms
              </h3>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <button
                onClick={fetchForms}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          ) : forms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <FaClipboardList className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Forms Found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Create your first form to get started.
              </p>
              <button
                onClick={handleCreateNew}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Form
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fields
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submissions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forms.map((form) => (
                    <tr
                      key={form._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {form.formName}
                        </div>
                        {form.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {form.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                          {form.formId}
                        </code>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {form.fields?.length || 0} fields
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {form.submissionCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            form.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {form.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleShowCode(form)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                            title="Get Code"
                          >
                            <FaCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(form)}
                            className="p-1.5 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                            title="Edit Form"
                          >
                            <FaEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(form)}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                            title="Delete Form"
                          >
                            <FaTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Code Modal */}
      {showCodeModal && selectedForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                Generated Code for {selectedForm.formName}
              </h2>
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setSelectedForm(null);
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Copy this code and paste it in your component:
                </label>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{generateCode(selectedForm)}</code>
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateCode(selectedForm));
                      success("Code copied to clipboard!");
                    }}
                    className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    title="Copy Code"
                  >
                    <FaCopy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Usage Instructions:
                </h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Copy the code above</li>
                  <li>
                    Create a new component file or paste in your existing
                    component
                  </li>
                  <li>
                    Import FormRenderer:{" "}
                    <code className="bg-blue-100 px-1 rounded">
                      import FormRenderer from '@/components/forms/FormRenderer'
                    </code>
                  </li>
                  <li>Use the component with a button to open the form</li>
                  <li>
                    The form will automatically capture: form_name, source
                    (URL), and prepared field
                  </li>
                </ol>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setSelectedForm(null);
                }}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormManagement;
