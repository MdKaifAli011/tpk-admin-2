"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import loadMathJax from "../lib/utils/mathJaxLoader";
import { logger } from "@/utils/logger";
import FormRenderer from "./forms/FormRenderer";

// Helper function to capitalize button text
const capitalizeButtonText = (text) => {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const RichContent = ({ html }) => {
  const containerRef = useRef(null);
  const [mathJaxError, setMathJaxError] = useState(false);
  const [formStates, setFormStates] = useState({});
  const [formConfigs, setFormConfigs] = useState({});

  useEffect(() => {
    let isMounted = true;

    if (!html || typeof window === "undefined") {
      return () => {
        isMounted = false;
      };
    }

    const processMathJax = (MathJaxInstance) => {
      if (!MathJaxInstance || !isMounted || !containerRef.current) return;

      try {
        // Get all content divs within the container
        const contentDivs = containerRef.current.querySelectorAll(
          "[data-content-part]"
        );
        const elementsToProcess =
          contentDivs.length > 0
            ? Array.from(contentDivs)
            : [containerRef.current];

        // Use MathJax 2.x Hub API
        if (
          MathJaxInstance.Hub &&
          typeof MathJaxInstance.Hub.Typeset === "function"
        ) {
          MathJaxInstance.Hub.Typeset(elementsToProcess);
        } else if (typeof MathJaxInstance.typeset === "function") {
          // Fallback for MathJax 3.x
          MathJaxInstance.typeset(elementsToProcess);
        }
      } catch (error) {
        logger.error("MathJax typeset failed", error);
        if (isMounted) {
          setMathJaxError(true);
        }
      }
    };

    loadMathJax()
      .then((MathJax) => {
        if (!MathJax || !isMounted || !containerRef.current) return;
        setMathJaxError(false);

        try {
          // Ensure MathJax Hub is ready (MathJax 2.x)
          if (MathJax.Hub) {
            if (MathJax.isReady) {
              // MathJax is ready, process immediately
              processMathJax(MathJax);
            } else {
              // Wait for MathJax to finish initialization
              if (MathJax.Hub.Register) {
                MathJax.Hub.Register.StartupHook("End", () => {
                  if (isMounted && containerRef.current) {
                    processMathJax(MathJax);
                  }
                });
              } else {
                // Fallback: retry after delay
                setTimeout(() => {
                  if (isMounted && containerRef.current && window.MathJax) {
                    processMathJax(window.MathJax);
                  }
                }, 1000);
              }
            }
          } else {
            // Try processing anyway (might be MathJax 3.x)
            processMathJax(MathJax);
          }
        } catch (error) {
          logger.error("MathJax initialization failed", error);
          if (isMounted) {
            setMathJaxError(true);
          }
        }
      })
      .catch((error) => {
        console.error("Unable to load MathJax:", error);
        logger.error("Unable to load MathJax", error);
        if (isMounted) {
          setMathJaxError(true);
        }
        // Don't block rendering if MathJax fails - just show error message
      });

    return () => {
      isMounted = false;
    };
  }, [html]);

  // Parse HTML and extract form embeds (both div and inline span)
  const { processedHtml, forms } = useMemo(() => {
    if (!html) return { processedHtml: "", forms: [] };

    const formsFound = [];
    let processedHtml = html;
    let formIndex = 0;

    // Match inline form embeds (span.form-embed-inline) - extract data attributes in any order
    const inlineFormRegex =
      /<span[^>]*class="form-embed-inline"[^>]*>[\s\S]*?<\/span>/gi;
    let match;
    while ((match = inlineFormRegex.exec(html)) !== null) {
      const fullMatch = match[0];

      // Extract data attributes using a more flexible approach
      // Handle both quoted and unquoted attributes
      const formIdMatch = fullMatch.match(
        /data-form-id=["']?([^"'\s>]+)["']?/i
      );
      const titleMatch = fullMatch.match(/data-title=["']([^"']*)["']/i);
      const descriptionMatch = fullMatch.match(
        /data-description=["']([^"']*)["']/i
      );
      const buttonTextMatch = fullMatch.match(
        /data-button-text=["']([^"']*)["']/i
      );
      const buttonLinkMatch = fullMatch.match(
        /data-button-link=["']([^"']*)["']/i
      );
      const imageUrlMatch = fullMatch.match(/data-image-url=["']([^"']*)["']/i);

      const formId = formIdMatch ? formIdMatch[1] : "";

      // Decode HTML entities properly
      const decodeAttr = (str) => {
        if (!str) return "";
        return str
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#39;/g, "'")
          .replace(/&#x27;/g, "'")
          .trim();
      };

      const title = titleMatch ? decodeAttr(titleMatch[1]) : "";
      const description = descriptionMatch
        ? decodeAttr(descriptionMatch[1])
        : "";
      const buttonText = buttonTextMatch ? decodeAttr(buttonTextMatch[1]) : "";
      const buttonLink = buttonLinkMatch ? decodeAttr(buttonLinkMatch[1]) : "";
      const imageUrl = imageUrlMatch ? decodeAttr(imageUrlMatch[1]) : "";

      if (formId) {
        const placeholder = `<!--FORM_PLACEHOLDER_${formIndex}-->`;
        processedHtml = processedHtml.replace(fullMatch, placeholder);
        formsFound.push({
          formId,
          placeholder,
          index: formIndex,
          buttonText,
          title,
          description,
          buttonLink,
          imageUrl,
          isInline: true,
        });
        formIndex++;
      }
    }

    // Match block form embeds (div.form-embed) - legacy support
    const blockFormRegex =
      /<div[^>]*class="form-embed"[^>]*data-form-id="([^"]+)"[^>]*(?:data-button-text="([^"]*)")?[^>]*>[\s\S]*?<\/div>/gi;
    while ((match = blockFormRegex.exec(html)) !== null) {
      const formId = match[1];
      const buttonText = match[2] || "";
      const fullMatch = match[0];
      const placeholder = `<!--FORM_PLACEHOLDER_${formIndex}-->`;
      processedHtml = processedHtml.replace(fullMatch, placeholder);
      formsFound.push({
        formId,
        placeholder,
        index: formIndex,
        buttonText,
        isInline: false,
      });
      formIndex++;
    }

    return { processedHtml, forms: formsFound };
  }, [html]);

  // Fetch form configs for all embedded forms
  useEffect(() => {
    if (forms.length === 0) return;

    const fetchFormConfigs = async () => {
      const configs = {};
      for (const form of forms) {
        try {
          const response = await fetch(`/api/form/${form.formId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              configs[form.formId] = data.data;
            }
          }
        } catch (error) {
          console.error(
            `Error fetching form config for ${form.formId}:`,
            error
          );
        }
      }
      setFormConfigs(configs);
    };

    fetchFormConfigs();
  }, [forms]);

  // Reprocess MathJax when forms are loaded or DOM updates
  useEffect(() => {
    if (
      !html ||
      !window.MathJax ||
      !window.MathJax.isReady ||
      !containerRef.current
    )
      return;

    // Wait for DOM to update after form configs load
    const timer = setTimeout(() => {
      try {
        const contentDivs = containerRef.current.querySelectorAll(
          "[data-content-part]"
        );
        const elementsToProcess =
          contentDivs.length > 0
            ? Array.from(contentDivs)
            : [containerRef.current];

        if (window.MathJax && window.MathJax.Hub) {
          window.MathJax.Hub.Typeset(elementsToProcess);
        }
      } catch (error) {
        // Silently fail - MathJax will process on next load
      }
    }, 500);

    return () => clearTimeout(timer);
    // Depend on html and formConfigs only - forms and processedHtml are derived from html
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, formConfigs]);

  // Helper function to check if HTML content is inline
  const isInlineContent = (html) => {
    if (!html || !html.trim()) return false;
    const trimmed = html.trim();

    // Check if it starts with block-level tags
    const blockLevelTags = [
      "<p",
      "<div",
      "<h1",
      "<h2",
      "<h3",
      "<h4",
      "<h5",
      "<h6",
      "<ul",
      "<ol",
      "<li",
      "<blockquote",
      "<pre",
      "<table",
      "<section",
      "<article",
      "<header",
      "<footer",
      "<nav",
      "<aside",
      "<main",
      "<figure",
      "<hr",
    ];

    const isBlockLevel = blockLevelTags.some((tag) =>
      trimmed.toLowerCase().startsWith(tag)
    );

    return !isBlockLevel;
  };

  // Render content with forms
  const renderContent = () => {
    if (!processedHtml) return null;

    const parts = processedHtml.split(/(<!--FORM_PLACEHOLDER_\d+-->)/);
    const formMap = {};
    const formDataMap = {};
    forms.forEach((form) => {
      formMap[form.placeholder] = form.formId;
      formDataMap[form.placeholder] = form;
    });

    // Determine if we have inline forms in the content
    const hasInlineForms = forms.some((f) => f.isInline);

    return parts.map((part, index) => {
      if (formMap[part]) {
        const formId = formMap[part];
        const formData = formDataMap[part];
        const formKey = `form-${formId}-${index}`;
        const isOpen = formStates[formKey] || false;
        const formConfig = formConfigs[formId];

        // For inline forms
        if (formData?.isInline) {
          // Priority: formData (from HTML attributes) > formConfig > default
          const buttonText =
            (formData.buttonText && formData.buttonText.trim()) ||
            formConfig?.settings?.buttonText ||
            "Open Form";
          const imageUrl =
            (formData.imageUrl && formData.imageUrl.trim()) || "";
          const buttonLink =
            (formData.buttonLink && formData.buttonLink.trim()) || "";

          return (
            <React.Fragment key={formKey}>
              <button
                onClick={() =>
                  setFormStates((prev) => ({
                    ...prev,
                    [formKey]: !prev[formKey],
                  }))
                }
                className="inline-block px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md sm:rounded-lg text-xs sm:text-sm md:text-base font-medium transition-all duration-200 transform active:scale-95"
                style={{
                  display: "inline-block",
                  verticalAlign: "baseline",
                  cursor: "pointer",
                  lineHeight: "1.5",
                  margin: "0 2px",
                  whiteSpace: "nowrap",
                }}
              >
                {capitalizeButtonText(buttonText || "Open Form")}
              </button>
              {isOpen && (
                <FormRenderer
                  formId={formId}
                  isOpen={isOpen}
                  onClose={() =>
                    setFormStates((prev) => ({
                      ...prev,
                      [formKey]: false,
                    }))
                  }
                  prepared=""
                  buttonLink={buttonLink}
                  imageUrl={imageUrl}
                  title={formData.title || ""}
                  description={formData.description || ""}
                />
              )}
            </React.Fragment>
          );
        }

        // For block forms (legacy)
        const buttonText =
          formConfig?.settings?.buttonText ||
          formData?.buttonText ||
          "Open Form";
        const formName = formConfig?.formName || formId;
        const formDescription = formConfig?.description || "";

        return (
          <div key={formKey} className="my-3 sm:my-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 md:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3">
                <div className="flex-1">
                  <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-1">
                    {formName}
                  </h4>
                  {formDescription && (
                    <p className="text-[11px] sm:text-xs text-gray-600 mb-1">
                      {formDescription}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    Click the button below to open the form
                  </p>
                </div>
                <button
                  onClick={() =>
                    setFormStates((prev) => ({
                      ...prev,
                      [formKey]: !prev[formKey],
                    }))
                  }
                  className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md sm:rounded-lg text-xs sm:text-sm md:text-base font-medium transition-all duration-200 transform active:scale-95 whitespace-nowrap"
                >
                  {isOpen ? "Close" : capitalizeButtonText(buttonText)}
                </button>
              </div>
              {isOpen && (
                <FormRenderer
                  formId={formId}
                  isOpen={isOpen}
                  onClose={() =>
                    setFormStates((prev) => ({
                      ...prev,
                      [formKey]: false,
                    }))
                  }
                  prepared=""
                />
              )}
            </div>
          </div>
        );
      }

      // Regular HTML content - render inline if content is inline and we have inline forms
      if (part.trim()) {
        const inline = hasInlineForms && isInlineContent(part);

        if (inline) {
          return (
            <span
              key={`content-${index}`}
              data-content-part="true"
              className="inline"
              style={{ display: "inline" }}
              dangerouslySetInnerHTML={{ __html: part }}
            />
          );
        } else {
          return (
            <div
              key={`content-${index}`}
              data-content-part="true"
              dangerouslySetInnerHTML={{ __html: part }}
            />
          );
        }
      }
      return null;
    });
  };

  return (
    <>
      {mathJaxError && (
        <div className="text-yellow-600 text-sm mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
          Note: Math equations may not render correctly. Please refresh the
          page.
        </div>
      )}
      <div ref={containerRef} className="rich-text-content">
        {renderContent()}
      </div>
    </>
  );
};

export default RichContent;
