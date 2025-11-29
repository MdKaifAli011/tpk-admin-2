import {
  FaUser,
  FaEnvelope,
  FaGlobe,
  FaGraduationCap,
  FaPhone,
} from "react-icons/fa";
import {
  countriesWithCodesSorted,
  classOptions,
} from "../constants/formConstants";

// Field icon mapping
export const getFieldIcon = (name) => {
  const iconMap = {
    name: <FaUser className="text-gray-400 text-xs" />,
    email: <FaEnvelope className="text-gray-400 text-xs" />,
    country: <FaGlobe className="text-gray-400 text-xs" />,
    className: <FaGraduationCap className="text-gray-400 text-xs" />,
    phoneNumber: <FaPhone className="text-gray-400 text-xs" />,
    countryCode: <FaPhone className="text-gray-400 text-xs" />,
  };
  return iconMap[name] || null;
};

// Get options for select fields
export const getSelectOptions = (field) => {
  if (field.name === "country") {
    return countriesWithCodesSorted.map((c) => c.name);
  }
  if (field.name === "className") {
    return classOptions;
  }
  return field.options || [];
};

// Validate a single field
export const validateField = (field, value) => {
  if (field.required && (!value || !value.trim())) {
    return `${field.label} is required`;
  }

  if (value && field.validation) {
    if (
      field.validation.minLength &&
      value.length < field.validation.minLength
    ) {
      return (
        field.validation.message ||
        `${field.label} must be at least ${field.validation.minLength} characters`
      );
    }
    if (
      field.validation.maxLength &&
      value.length > field.validation.maxLength
    ) {
      return (
        field.validation.message ||
        `${field.label} must be less than ${field.validation.maxLength} characters`
      );
    }
    if (field.validation.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        return field.validation.message || `${field.label} is invalid`;
      }
    }
  }

  // Type-specific validation
  if (field.type === "email" && value) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
  }

  return "";
};

