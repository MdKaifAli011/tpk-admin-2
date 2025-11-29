"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaTimes, FaSearch } from "react-icons/fa";
import api from "@/lib/api";

const CKEDITOR_SCRIPT = "/vendor/ckeditor/ckeditor.js";
const MATHJAX_SCRIPT = "/vendor/mathjax/MathJax.js?config=TeX-AMS_HTML";

const RichTextEditor = ({
  value = "",
  onChange,
  placeholder = "Start writing your content...",
  disabled = false,
  className = "",
}) => {
  const textareaRef = useRef(null);
  const editorRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [forms, setForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [insertOptions, setInsertOptions] = useState({
    title: "",
    description: "",
    buttonText: "",
    buttonLink: "",
    imageUrl: "",
  });
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const placeholderRef = useRef(placeholder);

  const instanceId = useMemo(
    () => `rte-${Math.random().toString(36).slice(2, 10)}`,
    []
  );

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    placeholderRef.current = placeholder;
  }, [placeholder]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalWarn = console.warn;
    const originalError = console.error;
    const marker = "CKEditor 4.22.1";

    const shouldSuppress = (args) =>
      args.some((arg) => typeof arg === "string" && arg.includes(marker));

    console.warn = (...args) => {
      if (shouldSuppress(args)) return;
      originalWarn(...args);
    };

    console.error = (...args) => {
      if (shouldSuppress(args)) return;
      originalError(...args);
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const toolbarConfig = useMemo(
    () => [
      {
        name: "document",
        items: ["Source", "NewPage", "Preview", "Print", "Templates"],
      },
      { name: "clipboard", items: ["Cut", "Copy", "Paste", "Undo", "Redo"] },
      { name: "editing", items: ["Find", "Replace", "SelectAll", "Scayt"] },
      { name: "styles", items: ["Format", "Font", "FontSize"] },
      {
        name: "basicstyles",
        items: [
          "Bold",
          "Italic",
          "Underline",
          "Strike",
          "Subscript",
          "Superscript",
          "RemoveFormat",
        ],
      },
      { name: "colors", items: ["TextColor", "BGColor"] },
      {
        name: "paragraph",
        items: [
          "NumberedList",
          "BulletedList",
          "Outdent",
          "Indent",
          "Blockquote",
          "JustifyLeft",
          "JustifyCenter",
          "JustifyRight",
          "JustifyBlock",
        ],
      },
      {
        name: "insert",
        items: [
          "Image",
          "Table",
          "HorizontalRule",
          "Smiley",
          "SpecialChar",
          "Iframe",
          "Mathjax",
        ],
      },
      { name: "links", items: ["Link", "Unlink", "Anchor"] },
      { name: "tools", items: ["Maximize", "ShowBlocks"] },
      { name: "about", items: ["About"] },
    ],
    []
  );

  useEffect(() => {
    let isMounted = true;
    const ensureScript = (src, attr) =>
      new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[${attr}]`);
        if (existing) {
          if (
            existing.dataset.loaded === "true" ||
            existing.readyState === "complete"
          ) {
            resolve();
            return;
          }
          existing.addEventListener("load", () => resolve(), { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.setAttribute(attr, "true");
        script.addEventListener("load", () => {
          script.dataset.loaded = "true";
          resolve();
        });
        script.addEventListener("error", reject);
        document.head.appendChild(script);
      });

    const initializeEditor = async () => {
      if (typeof window === "undefined") return;

      await ensureScript(CKEDITOR_SCRIPT, "data-ckeditor");
      await ensureScript(MATHJAX_SCRIPT, "data-mathjax");

      if (!isMounted || !textareaRef.current) return;

      const { CKEDITOR } = window;
      if (!CKEDITOR) return;

      try {
        if (CKEDITOR.config) {
          CKEDITOR.config.versionCheck = false;
        }
      } catch (error) {
        // silently ignore inability to override version check
      }

      if (!CKEDITOR._suppressLegacyWarning) {
        CKEDITOR._suppressLegacyWarning = true;
        CKEDITOR.on("notificationShow", (evt) => {
          try {
            const message = evt?.data?.notification?.message;
            if (
              typeof message === "string" &&
              message.includes("CKEditor 4.22.1")
            ) {
              evt.data.notification?.hide?.();
              evt.cancel();
            }
          } catch (error) {
            // ignore suppression errors
          }
        });
      }

      if (CKEDITOR.instances[instanceId]) {
        CKEDITOR.instances[instanceId].destroy(true);
      }

      const editor = CKEDITOR.replace(textareaRef.current, {
        height: 420,
        removePlugins: "resize",
        extraPlugins:
          "mathjax,colorbutton,colordialog,justify,font,clipboard,smiley",
        mathJaxLib: MATHJAX_SCRIPT,
        autoParagraph: true,
        ignoreEmptyParagraph: true,
        allowedContent: true,
        placeholder: placeholderRef.current,
        readOnly: false,
        toolbar: toolbarConfig,
      });

      editorRef.current = editor;

      editor.on("instanceReady", () => {
        if (!isMounted) return;
        setIsReady(true);
        if (valueRef.current) {
          editor.setData(valueRef.current);
        }
        if (disabled) {
          editor.setReadOnly(true);
        }
        editor.fire("change");
      });

      editor.on("change", () => {
        const data = editor.getData();
        onChangeRef.current?.(data);
      });
    };

    initializeEditor().catch((error) => {
      console.error("Failed to initialize CKEditor", error);
    });

    return () => {
      isMounted = false;
      if (editorRef.current) {
        editorRef.current.destroy(true);
        editorRef.current = null;
      }
    };
  }, [toolbarConfig, instanceId, disabled]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const currentData = editor.getData();
    if (value !== undefined && value !== currentData) {
      editor.setData(value || "");
    }
  }, [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.setReadOnly(disabled);
  }, [disabled]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.config.placeholder = placeholder;
  }, [placeholder]);

  // Fetch forms when modal opens
  useEffect(() => {
    if (showFormModal) {
      fetchForms();
    }
  }, [showFormModal]);

  const fetchForms = async () => {
    try {
      setLoadingForms(true);
      const response = await api.get("/form?status=active");
      if (response.data?.success) {
        setForms(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoadingForms(false);
    }
  };

  const handleFormSelect = (form) => {
    setSelectedForm(form);
    setInsertOptions({
      title: form.settings?.title || form.formName || "",
      description: form.settings?.description || "",
      buttonText: form.settings?.buttonText || "Open Form",
      buttonLink: "",
      imageUrl: "",
    });
  };

  const insertFormCode = () => {
    const editor = editorRef.current;
    if (!editor || !selectedForm) return;

    const formId = selectedForm.formId;
    const title = insertOptions.title.trim() || selectedForm.formName;
    const description = insertOptions.description.trim();
    const buttonText = insertOptions.buttonText.trim() || "Open Form";
    const buttonLink = insertOptions.buttonLink.trim();
    const imageUrl = insertOptions.imageUrl.trim();

    const escapeHtml = (str) => {
      if (!str) return "";
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

    const buttonStyle =
      "display: inline-block; padding: 8px 16px; background-color: #2563eb; color: #ffffff; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; vertical-align: middle; font-family: inherit; transition: background-color 0.2s; line-height: normal; margin: 0;";
    const buttonHtml = `<button type="button" style="${buttonStyle}" contenteditable="false" readonly disabled>${escapeHtml(
      buttonText
    )}</button>`;

    const formCode = `<span class="form-embed-inline" data-form-id="${formId}" data-title="${escapeHtml(
      title
    )}" data-description="${escapeHtml(
      description
    )}" data-button-text="${escapeHtml(
      buttonText
    )}" data-button-link="${escapeHtml(
      buttonLink
    )}" data-image-url="${escapeHtml(
      imageUrl
    )}" style="display: inline-block; vertical-align: middle; margin: 0 4px; line-height: 1.5;" contenteditable="false">${buttonHtml}</span>`;

    editor.insertHtml(formCode);
    setShowFormModal(false);
    setSelectedForm(null);
    setInsertOptions({
      title: "",
      description: "",
      buttonText: "",
      buttonLink: "",
      imageUrl: "",
    });
  };

  return (
    <>
      <div
        className={`rounded-lg border border-gray-200 bg-white shadow-sm ${
          disabled ? "opacity-90" : ""
        } ${className}`}
      >
        {/* Insert Form Button */}
        {isReady && !disabled && (
          <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center justify-end">
            <button
              onClick={() => setShowFormModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              type="button"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Insert Form
            </button>
          </div>
        )}

        {!isReady && (
          <div className="flex min-h-[240px] items-center justify-center text-sm text-gray-500">
            Loading editor...
          </div>
        )}
        <textarea
          id={instanceId}
          ref={textareaRef}
          defaultValue={value}
          style={{ display: isReady ? "none" : "block" }}
          aria-label="Rich text editor"
        />
      </div>

      {/* Form Selection Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Modal Container */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Insert Form
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Embed an existing form into your content
                </p>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 120px)" }}
            >
              {/* Left Column - Form List */}
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search forms..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Form List */}
                <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                  {loadingForms ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mb-3"></div>
                        <p className="text-sm text-gray-600">
                          Loading forms...
                        </p>
                      </div>
                    </div>
                  ) : forms.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <p className="text-sm font-medium text-gray-800 mb-1">
                        No active forms
                      </p>
                      <p className="text-xs text-gray-500">
                        Create a form in Form Management first.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200 max-h-[calc(90vh-280px)] overflow-y-auto">
                      {forms.map((form) => (
                        <li key={form._id}>
                          <button
                            onClick={() => handleFormSelect(form)}
                            className={`w-full text-left p-4 transition-colors ${
                              selectedForm?._id === form._id
                                ? "bg-blue-50 border-l-4 border-blue-600"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="text-sm font-semibold text-gray-900">
                                {form.formName}
                              </h3>
                              {form.submissionCount > 0 && (
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {form.submissionCount} submission
                                  {form.submissionCount !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>

                            {form.description && (
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {form.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 flex-wrap">
                              <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                                {form.formId}
                              </code>
                              <span className="text-xs text-gray-500">
                                {form.fields?.length || 0} field
                                {form.fields?.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Right Column - Form Configuration */}
              <div className="space-y-4">
                {!selectedForm ? (
                  <div className="h-full min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center p-6 bg-gray-50">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Select a form
                    </p>
                    <p className="text-xs text-gray-500">
                      Choose a form from the list to configure and insert it
                      into your content.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Form Header */}
                    <div className="flex items-start justify-between pb-3 border-b border-gray-200">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {selectedForm.formName}
                        </h3>
                        <button
                          onClick={() => setSelectedForm(null)}
                          className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          ← Change form
                        </button>
                      </div>
                      {selectedForm.submissionCount > 0 && (
                        <span className="text-xs text-gray-500">
                          {selectedForm.submissionCount} submission
                          {selectedForm.submissionCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Preview Card */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="p-4 flex gap-4 items-center">
                        <div className="w-24 h-20 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white overflow-hidden shrink-0">
                          {insertOptions.imageUrl ? (
                            <img
                              src={insertOptions.imageUrl}
                              alt="Form preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-xs font-semibold">FORM</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate text-center text-white bg-blue-500 p-2 rounded-lg">
                         
                             {insertOptions.description ||
                                selectedForm.description}
                          </h4>
                          {(insertOptions.description ||
                            selectedForm.description) && (
                            <p className="text-xs text-gray-600 mt-1">
                                {insertOptions.title || selectedForm.formName}
                            </p>
                          )}
                          <div className="mt-3">
                            <span className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md">
                              {insertOptions.buttonText || "Submit"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Configuration Fields */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Form Settings
                      </h4>

                      {/* Form Title */}
                      <div>
                         {/* Form Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Form Description
                        </label>
                        <textarea
                          value={insertOptions.description}
                          onChange={(e) =>
                            setInsertOptions({
                              ...insertOptions,
                              description: e.target.value,
                            })
                          }
                          placeholder="Enter form description (optional)"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                        />
                      </div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Form Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={insertOptions.title}
                          onChange={(e) =>
                            setInsertOptions({
                              ...insertOptions,
                              title: e.target.value,
                            })
                          }
                          placeholder="Enter form title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                     

                      {/* Image URL */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={insertOptions.imageUrl}
                          onChange={(e) =>
                            setInsertOptions({
                              ...insertOptions,
                              imageUrl: e.target.value,
                            })
                          }
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Image displayed in the form modal (optional)
                        </p>
                      </div>

                      {/* Button Configuration */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Button Text <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={insertOptions.buttonText}
                            onChange={(e) =>
                              setInsertOptions({
                                ...insertOptions,
                                buttonText: e.target.value,
                              })
                            }
                            placeholder="e.g., Download, Submit"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Button Link{" "}
                            <span className="text-gray-500 text-xs">
                              (optional)
                            </span>
                          </label>
                          <input
                            type="url"
                            value={insertOptions.buttonLink}
                            onChange={(e) =>
                              setInsertOptions({
                                ...insertOptions,
                                buttonLink: e.target.value,
                              })
                            }
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowFormModal(false);
                          setSelectedForm(null);
                          setInsertOptions({
                            title: "",
                            description: "",
                            buttonText: "",
                            buttonLink: "",
                            imageUrl: "",
                          });
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={insertFormCode}
                        disabled={
                          !insertOptions.title.trim() ||
                          !insertOptions.buttonText.trim()
                        }
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Insert Form
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RichTextEditor;
