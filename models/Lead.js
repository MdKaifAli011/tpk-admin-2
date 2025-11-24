import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    className: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "archived"],
      default: "new",
    },
  },
  { timestamps: true }
);

// Index for status (for filtering)
leadSchema.index({ status: 1 });

// Index for createdAt (for date filtering and sorting)
leadSchema.index({ createdAt: -1 });

// Index for country (for filtering)
leadSchema.index({ country: 1 });

// Index for className (for filtering)
leadSchema.index({ className: 1 });

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);

export default Lead;

