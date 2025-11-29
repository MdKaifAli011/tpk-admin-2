"use client";

import { FaTrash, FaArrowUp, FaArrowDown } from "react-icons/fa";

const FormFieldEditor = ({
  field,
  index,
  totalFields,
  errors,
  fieldTypes,
  onUpdate,
  onRemove,
  onMove,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Field {index + 1}
          </span>
          <button
            onClick={() => onMove(index, "up")}
            disabled={index === 0}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Move up"
          >
            <FaArrowUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => onMove(index, "down")}
            disabled={index === totalFields - 1}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Move down"
          >
            <FaArrowDown className="w-3 h-3" />
          </button>
        </div>
        <button
          onClick={() => onRemove(index)}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove field"
        >
          <FaTrash className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Field Type <span className="text-red-500">*</span>
          </label>
          <select
            value={field.type}
            onChange={(e) => {
              const updates = { type: e.target.value };
              if (e.target.value === "select" && !field.options) {
                updates.options = [];
              }
              onUpdate(index, updates);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {fieldTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Field Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={field.name}
            onChange={(e) => onUpdate(index, { name: e.target.value })}
            placeholder="e.g., name, email, phoneNumber"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
              errors[`field-${index}-name`]
                ? "border-red-300 bg-red-50"
                : "border-gray-300"
            }`}
          />
          {errors[`field-${index}-name`] && (
            <p className="mt-1 text-xs text-red-600">
              {errors[`field-${index}-name`]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Label <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate(index, { label: e.target.value })}
            placeholder="e.g., Full Name, Email Address"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
              errors[`field-${index}-label`]
                ? "border-red-300 bg-red-50"
                : "border-gray-300"
            }`}
          />
          {errors[`field-${index}-label`] && (
            <p className="mt-1 text-xs text-red-600">
              {errors[`field-${index}-label`]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Placeholder
          </label>
          <input
            type="text"
            value={field.placeholder}
            onChange={(e) => onUpdate(index, { placeholder: e.target.value })}
            placeholder="e.g., Enter your name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {field.type === "select" && (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Options <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {field.options?.map((option, optIndex) => (
                <div key={optIndex} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...field.options];
                      newOptions[optIndex] = e.target.value;
                      onUpdate(index, { options: newOptions });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Option value"
                  />
                  <button
                    onClick={() => {
                      const newOptions = field.options.filter(
                        (_, i) => i !== optIndex
                      );
                      onUpdate(index, { options: newOptions });
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  onUpdate(index, {
                    options: [...(field.options || []), ""],
                  });
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Option
              </button>
            </div>
            {errors[`field-${index}-options`] && (
              <p className="mt-1 text-xs text-red-600">
                {errors[`field-${index}-options`]}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate(index, { required: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-gray-700">Required</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default FormFieldEditor;

