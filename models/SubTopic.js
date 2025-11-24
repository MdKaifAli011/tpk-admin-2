import mongoose from "mongoose";
import { createSlug, generateUniqueSlug } from "../utils/serverSlug.js";

const subTopicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
    },
    orderNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Add compound index to ensure unique orderNumber per topic within an exam
subTopicSchema.index({ topicId: 1, orderNumber: 1 }, { unique: true });

// Compound index for unique slug per topic
subTopicSchema.index({ topicId: 1, slug: 1 }, { unique: true, sparse: true });

// Pre-save hook to auto-generate slug
subTopicSchema.pre("save", async function (next) {
  if (this.isModified("name") || this.isNew) {
    const baseSlug = createSlug(this.name);
    
    // Check if slug exists within the same topic (excluding current document for updates)
    const checkExists = async (slug, excludeId) => {
      const query = { topicId: this.topicId, slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      const existing = await mongoose.models.SubTopic.findOne(query);
      return !!existing;
    };
    
    this.slug = await generateUniqueSlug(
      baseSlug,
      checkExists,
      this._id || null
    );
  }
  next();
});

// Cascading delete: When a SubTopic is deleted, delete its details
subTopicSchema.pre("findOneAndDelete", async function () {
  try {
    const subTopic = await this.model.findOne(this.getQuery());
    if (subTopic) {
      console.log(
        `🗑️ Cascading delete: Deleting details for subtopic ${subTopic._id}`
      );

      // Get model - use mongoose.model() to ensure model is loaded
      const SubTopicDetails = mongoose.models.SubTopicDetails || mongoose.model("SubTopicDetails");

      const result = await SubTopicDetails.deleteMany({ subTopicId: subTopic._id });
      console.log(
        `🗑️ Cascading delete: Deleted ${result.deletedCount} SubTopicDetails for subtopic ${subTopic._id}`
      );
    }
  } catch (error) {
    console.error("❌ Error in SubTopic cascading delete middleware:", error);
    // Don't throw - allow the delete to continue even if cascading fails
  }
});

// Ensure the latest schema is used during dev hot-reload
// If a previous version of the model exists (with an outdated schema), delete it first
if (mongoose.connection?.models?.SubTopic) {
  delete mongoose.connection.models.SubTopic;
}

const SubTopic = mongoose.model("SubTopic", subTopicSchema);

export default SubTopic;
