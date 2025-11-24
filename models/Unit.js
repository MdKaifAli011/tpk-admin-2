import mongoose from "mongoose";
import Subject from "./Subject.js";
import Exam from "./Exam.js";
import { createSlug, generateUniqueSlug } from "../utils/serverSlug.js";

const unitSchema = new mongoose.Schema(
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
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

// Add compound index to ensure unique orderNumber per subject within an exam
unitSchema.index({ subjectId: 1, orderNumber: 1 }, { unique: true });

// Compound index for unique slug per subject
unitSchema.index({ subjectId: 1, slug: 1 }, { unique: true, sparse: true });

// Pre-save hook to auto-generate slug
unitSchema.pre("save", async function (next) {
  if (this.isModified("name") || this.isNew) {
    const baseSlug = createSlug(this.name);
    
    // Check if slug exists within the same subject (excluding current document for updates)
    const checkExists = async (slug, excludeId) => {
      const query = { subjectId: this.subjectId, slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      const existing = await mongoose.models.Unit.findOne(query);
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

// Cascading delete: When a Unit is deleted, delete all related Chapters, Definitions, Topics, and SubTopics
unitSchema.pre("findOneAndDelete", async function () {
  try {
    const unit = await this.model.findOne(this.getQuery());
    if (unit) {
      console.log(
        `🗑️ Cascading delete: Deleting all entities for unit ${unit._id}`
      );

      // Get models - dynamically import if not already registered
      const Chapter = mongoose.models.Chapter || (await import("./Chapter.js")).default;
      const Topic = mongoose.models.Topic || (await import("./Topic.js")).default;
      const SubTopic = mongoose.models.SubTopic || (await import("./SubTopic.js")).default;
      const Definition = mongoose.models.Definition || (await import("./Definition.js")).default;
      const DefinitionDetails = mongoose.models.DefinitionDetails || (await import("./DefinitionDetails.js")).default;
      const UnitDetails = mongoose.models.UnitDetails || (await import("./UnitDetails.js")).default;
      const PracticeSubCategory = mongoose.models.PracticeSubCategory || (await import("./PracticeSubCategory.js")).default;
      const PracticeQuestion = mongoose.models.PracticeQuestion || (await import("./PracticeQuestion.js")).default;

      // Delete unit details first
      const unitDetailsResult = await UnitDetails.deleteMany({ unitId: unit._id });
      console.log(
        `🗑️ Cascading delete: Deleted ${unitDetailsResult.deletedCount} UnitDetails for unit ${unit._id}`
      );

      // Find all chapters in this unit
      const chapters = await Chapter.find({ unitId: unit._id });
      const chapterIds = chapters.map((chapter) => chapter._id);
      console.log(`🗑️ Found ${chapters.length} chapters for unit ${unit._id}`);

      // Find all definitions in these chapters
      const definitions = await Definition.find({ chapterId: { $in: chapterIds } });
      const definitionIds = definitions.map((definition) => definition._id);
      console.log(`🗑️ Found ${definitions.length} definitions for unit ${unit._id}`);

      // Delete all definition details
      let definitionDetailsResult = { deletedCount: 0 };
      if (definitionIds.length > 0) {
        definitionDetailsResult = await DefinitionDetails.deleteMany({
          definitionId: { $in: definitionIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${definitionDetailsResult.deletedCount} DefinitionDetails for unit ${unit._id}`
      );

      // Delete all definitions in these chapters
      let definitionsResult = { deletedCount: 0 };
      if (chapterIds.length > 0) {
        definitionsResult = await Definition.deleteMany({
          chapterId: { $in: chapterIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${definitionsResult.deletedCount} Definitions for unit ${unit._id}`
      );

      // Find all topics in these chapters
      const topics = await Topic.find({ chapterId: { $in: chapterIds } });
      const topicIds = topics.map((topic) => topic._id);
      console.log(`🗑️ Found ${topics.length} topics for unit ${unit._id}`);

      // Delete all subtopics in these topics
      let subTopicsResult = { deletedCount: 0 };
      if (topicIds.length > 0) {
        subTopicsResult = await SubTopic.deleteMany({
          topicId: { $in: topicIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${subTopicsResult.deletedCount} SubTopics for unit ${unit._id}`
      );

      // Delete all topics in these chapters
      let topicsResult = { deletedCount: 0 };
      if (chapterIds.length > 0) {
        topicsResult = await Topic.deleteMany({
          chapterId: { $in: chapterIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${topicsResult.deletedCount} Topics for unit ${unit._id}`
      );

      // Delete all chapters in this unit
      const chaptersResult = await Chapter.deleteMany({ unitId: unit._id });
      console.log(
        `🗑️ Cascading delete: Deleted ${chaptersResult.deletedCount} Chapters for unit ${unit._id}`
      );

      // Find all practice subcategories for this unit
      const practiceSubCategories = await PracticeSubCategory.find({ unitId: unit._id });
      const practiceSubCategoryIds = practiceSubCategories.map(
        (subCategory) => subCategory._id
      );
      console.log(
        `🗑️ Found ${practiceSubCategories.length} practice subcategories for unit ${unit._id}`
      );

      // Delete all practice questions in these subcategories
      let practiceQuestionsResult = { deletedCount: 0 };
      if (practiceSubCategoryIds.length > 0) {
        practiceQuestionsResult = await PracticeQuestion.deleteMany({
          subCategoryId: { $in: practiceSubCategoryIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${practiceQuestionsResult.deletedCount} PracticeQuestions for unit ${unit._id}`
      );

      // Delete all practice subcategories
      const practiceSubCategoriesResult = await PracticeSubCategory.deleteMany({
        unitId: unit._id,
      });
      console.log(
        `🗑️ Cascading delete: Deleted ${practiceSubCategoriesResult.deletedCount} PracticeSubCategories for unit ${unit._id}`
      );
    }
  } catch (error) {
    console.error("❌ Error in Unit cascading delete middleware:", error);
    // Don't throw - allow the delete to continue even if cascading fails
  }
});

const Unit = mongoose.models.Unit || mongoose.model("Unit", unitSchema);

export default Unit;

