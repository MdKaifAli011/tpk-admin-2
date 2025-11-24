import mongoose from "mongoose";

const definitionDetailsSchema = new mongoose.Schema(
  {
    definitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Definition",
      required: true,
      // Unique constraint enforced via schema.index() below
    },
    content: {
      type: String,
      default: "",
    },
    // SEO title
    title: {
      type: String,
      trim: true,
      default: "",
    },
    // SEO description
    metaDescription: {
      type: String,
      trim: true,
      default: "",
    },
    // SEO keywords
    keywords: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Ensure one details record per definition
definitionDetailsSchema.index({ definitionId: 1 }, { unique: true });

// Cascading delete: When a Definition is deleted, delete its details
definitionDetailsSchema.pre("findOneAndDelete", async function () {
  // Details are automatically cleaned up via the Definition model's cascading delete
});

const DefinitionDetails =
  mongoose.models.DefinitionDetails ||
  mongoose.model("DefinitionDetails", definitionDetailsSchema);

export default DefinitionDetails;

