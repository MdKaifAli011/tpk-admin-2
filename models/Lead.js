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
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email",
      ],
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
      required: [true, "Phone number is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "archived", "updated"],
      default: "new",
    },
    updateCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    form_name: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },
    prepared: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ country: 1 });
leadSchema.index({ className: 1 });
leadSchema.index({ form_name: 1 });
leadSchema.index({ source: 1 });

if (mongoose.models?.Lead) {
  delete mongoose.models.Lead;
}
if (mongoose.modelSchemas?.Lead) {
  delete mongoose.modelSchemas.Lead;
}

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;
