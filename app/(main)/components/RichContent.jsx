"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import loadMathJax from "../lib/utils/mathJaxLoader";
import { logger } from "@/utils/logger";
import FormRenderer from "./forms/FormRenderer";

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

    loadMathJax()
      .then((MathJax) => {
        if (!MathJax || !isMounted || !containerRef.current) return;
        setMathJaxError(false);

        try {
          // Get all content divs within the container
          const contentDivs = containerRef.current.querySelectorAll(
            "[data-content-part]"
          );
          const elementsToProcess =
            contentDivs.length > 0
              ? Array.from(contentDivs)
              : [containerRef.current];

          if (typeof MathJax.typesetClear === "function") {
            MathJax.typesetClear(elementsToProcess);
          }

          if (typeof MathJax.texReset === "function") {
            MathJax.texReset();
          }

          if (typeof MathJax.typesetPromise === "function") {
            return MathJax.typesetPromise(elementsToProcess);
          }

          if (typeof MathJax.typeset === "function") {
            MathJax.typeset(elementsToProcess);
          }
        } catch (error) {
          logger.error("MathJax typeset failed", error);
        }
      })
      .catch((error) => {
        logger.error("Unable to load MathJax", error);
        if (isMounted) {
          setMathJaxError(true);
        }
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
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                style={{
                  display: "inline-block",
                  verticalAlign: "baseline",
                  cursor: "pointer",
                  lineHeight: "1.5",
                  margin: "0 4px",
                  whiteSpace: "nowrap",
                }}
              >
                {buttonText || "Open Form"}
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
          <div key={formKey} className="my-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {formName}
                  </h4>
                  {formDescription && (
                    <p className="text-xs text-gray-600 mb-1">
                      {formDescription}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {isOpen ? "Close" : buttonText}
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
