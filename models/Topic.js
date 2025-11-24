import mongoose from "mongoose";
import { createSlug, generateUniqueSlug } from "../utils/serverSlug.js";

const topicSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Add compound index to ensure unique orderNumber per chapter within an exam
topicSchema.index({ chapterId: 1, orderNumber: 1 }, { unique: true });

// Compound index for unique slug per chapter
topicSchema.index({ chapterId: 1, slug: 1 }, { unique: true, sparse: true });

// Pre-save hook to auto-generate slug
topicSchema.pre("save", async function (next) {
  if (this.isModified("name") || this.isNew) {
    const baseSlug = createSlug(this.name);
    
    // Check if slug exists within the same chapter (excluding current document for updates)
    const checkExists = async (slug, excludeId) => {
      const query = { chapterId: this.chapterId, slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      const existing = await mongoose.models.Topic.findOne(query);
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

// Cascading delete: When a Topic is deleted, delete all related SubTopics
topicSchema.pre("findOneAndDelete", async function () {
  try {
    const topic = await this.model.findOne(this.getQuery());
    if (topic) {
      console.log(
        `🗑️ Cascading delete: Deleting all entities for topic ${topic._id}`
      );

      // Get models - use mongoose.model() to ensure models are loaded
      const SubTopic = mongoose.models.SubTopic || mongoose.model("SubTopic");
      const TopicDetails = mongoose.models.TopicDetails || mongoose.model("TopicDetails");
      const PracticeSubCategory = mongoose.models.PracticeSubCategory || mongoose.model("PracticeSubCategory");
      const PracticeQuestion = mongoose.models.PracticeQuestion || mongoose.model("PracticeQuestion");

      // Delete topic details first
      const topicDetailsResult = await TopicDetails.deleteMany({ topicId: topic._id });
      console.log(
        `🗑️ Cascading delete: Deleted ${topicDetailsResult.deletedCount} TopicDetails for topic ${topic._id}`
      );

      const result = await SubTopic.deleteMany({ topicId: topic._id });
      console.log(
        `🗑️ Cascading delete: Deleted ${result.deletedCount} SubTopics for topic ${topic._id}`
      );

      // Find all practice subcategories for this topic
      const practiceSubCategories = await PracticeSubCategory.find({
        topicId: topic._id,
      });
      const practiceSubCategoryIds = practiceSubCategories.map(
        (subCategory) => subCategory._id
      );
      console.log(
        `🗑️ Found ${practiceSubCategories.length} practice subcategories for topic ${topic._id}`
      );

      // Delete all practice questions in these subcategories
      let practiceQuestionsResult = { deletedCount: 0 };
      if (practiceSubCategoryIds.length > 0) {
        practiceQuestionsResult = await PracticeQuestion.deleteMany({
          subCategoryId: { $in: practiceSubCategoryIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${practiceQuestionsResult.deletedCount} PracticeQuestions for topic ${topic._id}`
      );

      // Delete all practice subcategories
      const practiceSubCategoriesResult = await PracticeSubCategory.deleteMany({
        topicId: topic._id,
      });
      console.log(
        `🗑️ Cascading delete: Deleted ${practiceSubCategoriesResult.deletedCount} PracticeSubCategories for topic ${topic._id}`
      );
    }
  } catch (error) {
    console.error("❌ Error in Topic cascading delete middleware:", error);
    // Don't throw - allow the delete to continue even if cascading fails
  }
});

// Ensure the latest schema is used during dev hot-reload
// If a previous version of the model exists (with an outdated schema), delete it first
if (mongoose.connection?.models?.Topic) {
  delete mongoose.connection.models.Topic;
}

const Topic = mongoose.model("Topic", topicSchema);

export default Topic;
