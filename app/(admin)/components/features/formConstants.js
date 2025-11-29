import {
  countriesWithCodesSorted,
  classOptions,
} from "@/app/(main)/components/constants/formConstants";

// Default required fields for Lead model
export const DEFAULT_REQUIRED_FIELDS = [
  {
    fieldId: `field-${Date.now()}-1`,
    type: "text",
    label: "Name",
    placeholder: "Enter your full name",
    name: "name",
    required: true,
    validation: {
      minLength: 2,
      message: "Name must be at least 2 characters",
    },
    options: [],
    defaultValue: "",
    order: 0,
  },
  {
    fieldId: `field-${Date.now()}-2`,
    type: "email",
    label: "Email Address",
    placeholder: "Enter your email address",
    name: "email",
    required: true,
    validation: {},
    options: [],
    defaultValue: "",
    order: 1,
  },
  {
    fieldId: `field-${Date.now()}-3`,
    type: "select",
    label: "Country",
    placeholder: "-- Select Country --",
    name: "country",
    required: true,
    validation: {},
    options: countriesWithCodesSorted.map((c) => c.name),
    defaultValue: "",
    order: 2,
  },
  {
    fieldId: `field-${Date.now()}-4`,
    type: "select",
    label: "Class Name",
    placeholder: "Select Class",
    name: "className",
    required: true,
    validation: {},
    options: classOptions,
    defaultValue: "",
    order: 3,
  },
  {
    fieldId: `field-${Date.now()}-5`,
    type: "tel",
    label: "Phone Number",
    placeholder: "Contact No",
    name: "phoneNumber",
    required: true,
    validation: {},
    options: [],
    defaultValue: "",
    order: 4,
  },
];

export const getDefaultRequiredFields = () => {
  const now = Date.now();
  return DEFAULT_REQUIRED_FIELDS.map((field, index) => ({
    ...field,
    fieldId: `field-${now}-${index + 1}`,
  }));
};

