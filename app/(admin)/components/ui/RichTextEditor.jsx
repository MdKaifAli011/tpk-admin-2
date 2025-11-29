"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
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
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-end">
            <button
              onClick={() => setShowFormModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
              type="button"
            >
              <svg
                className="w-3.5 h-3.5"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                Insert Form
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {!selectedForm ? (
                <>
                  {loadingForms ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-600 border-t-transparent mb-3"></div>
                        <p className="text-sm text-gray-600">
                          Loading forms...
                        </p>
                      </div>
                    </div>
                  ) : forms.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-gray-600">
                        No active forms available.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Create a form in Form Management first.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 mb-4">
                        Select a form to insert:
                      </p>
                      {forms.map((form) => (
                        <button
                          key={form._id}
                          onClick={() => handleFormSelect(form)}
                          className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                {form.formName}
                              </h3>
                              {form.description && (
                                <p className="text-xs text-gray-600 mb-2">
                                  {form.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>
                                  <code className="bg-gray-100 px-2 py-0.5 rounded">
                                    {form.formId}
                                  </code>
                                </span>
                                <span>{form.fields?.length || 0} fields</span>
                                <span>
                                  {form.submissionCount || 0} submissions
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedForm.formName}
                      </h3>
                      <button
                        onClick={() => setSelectedForm(null)}
                        className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                      >
                        ← Change form
                      </button>
                    </div>
                  </div>

                  <div>
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
                      placeholder="e.g., Connect With TestprepKart"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Main title displayed at the top of the form
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Form Description{" "}
                      <span className="text-gray-500 text-xs">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={insertOptions.description}
                      onChange={(e) =>
                        setInsertOptions({
                          ...insertOptions,
                          description: e.target.value,
                        })
                      }
                      placeholder="e.g., WE WILL CALL YOU SOON"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Description shown as blue badge below the title
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Form Image URL{" "}
                      <span className="text-gray-500 text-xs">(optional)</span>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Image displayed in the left blue area of the form modal
                      (auto-fits)
                    </p>
                    {insertOptions.imageUrl && (
                      <div className="mt-3 p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg border border-gray-200">
                        <img
                          src={insertOptions.imageUrl}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded border border-gray-200"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

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
                      placeholder="e.g., Download Now, Get Started"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Text displayed on the inline form button
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Button Link{" "}
                      <span className="text-gray-500 text-xs">(optional)</span>
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
                      placeholder="https://example.com/download"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      URL to redirect after successful form submission
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
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
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              {selectedForm && (
                <button
                  onClick={insertFormCode}
                  disabled={
                    !insertOptions.buttonText.trim() ||
                    !insertOptions.title.trim()
                  }
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert Form
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RichTextEditor;
