"use client";

import { getFieldIcon, getSelectOptions } from "./formUtils";

const FormFieldInput = ({
  field,
  value,
  error,
  formData,
  isSubmitting,
  onChange,
}) => {
  const icon = getFieldIcon(field.name);

  if (field.type === "select") {
    const options = getSelectOptions(field);
    return (
      <div>
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10">
              {icon}
            </div>
          )}
          <select
            id={`form-${field.name}`}
            name={field.name}
            value={value}
            onChange={onChange}
            className={`w-full ${
              icon ? "pl-8" : "pl-3"
            } pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white text-sm ${
              error ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
            disabled={isSubmitting}
          >
            <option value="">
              {field.placeholder || `-- Select ${field.label} --`}
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <textarea
          id={`form-${field.name}`}
          name={field.name}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${
            error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
          }`}
          disabled={isSubmitting}
        />
        {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // Phone number with country code
  if (field.type === "tel" && field.name === "phoneNumber") {
    const countryCode = formData.countryCode || "+91";
    return (
      <div>
        <div className="flex gap-2">
          <div className="w-20">
            <input
              type="text"
              name="countryCode"
              value={countryCode}
              onChange={onChange}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 text-center text-sm"
              placeholder="+91"
              readOnly
              disabled={isSubmitting}
            />
          </div>
          <div className="flex-1 relative">
            {icon && (
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                {icon}
              </div>
            )}
            <input
              type="tel"
              id={`form-${field.name}`}
              name={field.name}
              value={value}
              onChange={onChange}
              placeholder={field.placeholder || "Contact No"}
              className={`w-full ${
                icon ? "pl-8" : "pl-3"
              } pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${
                error
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 bg-white"
              }`}
              disabled={isSubmitting}
            />
          </div>
        </div>
        {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // Default text/email/number input
  return (
    <div>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={field.type}
          id={`form-${field.name}`}
          name={field.name}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          className={`w-full ${
            icon ? "pl-8" : "pl-3"
          } pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${
            error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
          }`}
          disabled={isSubmitting}
        />
      </div>
      {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default FormFieldInput;

