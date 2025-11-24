import mongoose from "mongoose";
import Exam from "./Exam.js";
import { createSlug, generateUniqueSlug } from "../utils/serverSlug.js";

const subjectSchema = new mongoose.Schema(
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
    // Order number for subject within an exam (independent per exam)
    orderNumber: {
      type: Number,
      min: 1,
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

// Compound index for unique slug per exam
subjectSchema.index({ examId: 1, slug: 1 }, { unique: true, sparse: true });

// Ensure unique ordering per exam only when orderNumber is set
// This keeps order numbers independent per exam and avoids conflicts for docs without orderNumber
subjectSchema.index(
  { examId: 1, orderNumber: 1 },
  { unique: true, partialFilterExpression: { orderNumber: { $exists: true } } }
);

// Pre-save hook to auto-generate slug
subjectSchema.pre("save", async function (next) {
  if (this.isModified("name") || this.isNew) {
    const baseSlug = createSlug(this.name);
    
    // Check if slug exists within the same exam (excluding current document for updates)
    const checkExists = async (slug, excludeId) => {
      const query = { examId: this.examId, slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      const existing = await mongoose.models.Subject.findOne(query);
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

// Cascading delete: When a Subject is deleted, delete all related Units, Chapters, Definitions, Topics, and SubTopics
subjectSchema.pre("findOneAndDelete", async function () {
  try {
    const subject = await this.model.findOne(this.getQuery());
    if (subject) {
      console.log(
        `🗑️ Cascading delete: Deleting all entities for subject ${subject._id}`
      );

      // Get models - dynamically import if not already registered
      const Unit = mongoose.models.Unit || (await import("./Unit.js")).default;
      const Chapter = mongoose.models.Chapter || (await import("./Chapter.js")).default;
      const Topic = mongoose.models.Topic || (await import("./Topic.js")).default;
      const SubTopic = mongoose.models.SubTopic || (await import("./SubTopic.js")).default;
      const Definition = mongoose.models.Definition || (await import("./Definition.js")).default;
      const DefinitionDetails = mongoose.models.DefinitionDetails || (await import("./DefinitionDetails.js")).default;
      const SubjectDetails = mongoose.models.SubjectDetails || (await import("./SubjectDetails.js")).default;
      const PracticeCategory = mongoose.models.PracticeCategory || (await import("./PracticeCategory.js")).default;
      const PracticeSubCategory = mongoose.models.PracticeSubCategory || (await import("./PracticeSubCategory.js")).default;
      const PracticeQuestion = mongoose.models.PracticeQuestion || (await import("./PracticeQuestion.js")).default;

      // Delete subject details first
      const subjectDetailsResult = await SubjectDetails.deleteMany({
        subjectId: subject._id,
      });
      console.log(
        `🗑️ Cascading delete: Deleted ${subjectDetailsResult.deletedCount} SubjectDetails for subject ${subject._id}`
      );

      // Find all units in this subject
      const units = await Unit.find({ subjectId: subject._id });
      const unitIds = units.map((unit) => unit._id);
      console.log(`🗑️ Found ${units.length} units for subject ${subject._id}`);

      // Find all chapters in these units
      const chapters = await Chapter.find({ unitId: { $in: unitIds } });
      const chapterIds = chapters.map((chapter) => chapter._id);
      console.log(
        `🗑️ Found ${chapters.length} chapters for subject ${subject._id}`
      );

      // Find all definitions in these chapters
      const definitions = await Definition.find({ chapterId: { $in: chapterIds } });
      const definitionIds = definitions.map((definition) => definition._id);
      console.log(
        `🗑️ Found ${definitions.length} definitions for subject ${subject._id}`
      );

      // Delete all definition details
      let definitionDetailsResult = { deletedCount: 0 };
      if (definitionIds.length > 0) {
        definitionDetailsResult = await DefinitionDetails.deleteMany({
          definitionId: { $in: definitionIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${definitionDetailsResult.deletedCount} DefinitionDetails for subject ${subject._id}`
      );

      // Delete all definitions in these chapters
      let definitionsResult = { deletedCount: 0 };
      if (chapterIds.length > 0) {
        definitionsResult = await Definition.deleteMany({
          chapterId: { $in: chapterIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${definitionsResult.deletedCount} Definitions for subject ${subject._id}`
      );

      // Find all topics in these chapters
      const topics = await Topic.find({ chapterId: { $in: chapterIds } });
      const topicIds = topics.map((topic) => topic._id);
      console.log(
        `🗑️ Found ${topics.length} topics for subject ${subject._id}`
      );

      // Delete all subtopics in these topics
      let subTopicsResult = { deletedCount: 0 };
      if (topicIds.length > 0) {
        subTopicsResult = await SubTopic.deleteMany({
          topicId: { $in: topicIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${subTopicsResult.deletedCount} SubTopics for subject ${subject._id}`
      );

      // Delete all topics in these chapters
      let topicsResult = { deletedCount: 0 };
      if (chapterIds.length > 0) {
        topicsResult = await Topic.deleteMany({
          chapterId: { $in: chapterIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${topicsResult.deletedCount} Topics for subject ${subject._id}`
      );

      // Delete all chapters in these units
      let chaptersResult = { deletedCount: 0 };
      if (unitIds.length > 0) {
        chaptersResult = await Chapter.deleteMany({ unitId: { $in: unitIds } });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${chaptersResult.deletedCount} Chapters for subject ${subject._id}`
      );

      // Delete all units in this subject
      const unitsResult = await Unit.deleteMany({ subjectId: subject._id });
      console.log(
        `🗑️ Cascading delete: Deleted ${unitsResult.deletedCount} Units for subject ${subject._id}`
      );

      // Find all practice categories for this subject
      const practiceCategories = await PracticeCategory.find({ subjectId: subject._id });
      const practiceCategoryIds = practiceCategories.map((category) => category._id);
      console.log(
        `🗑️ Found ${practiceCategories.length} practice categories for subject ${subject._id}`
      );

      // Find all practice subcategories in these categories
      const practiceSubCategories = await PracticeSubCategory.find({
        categoryId: { $in: practiceCategoryIds },
      });
      const practiceSubCategoryIds = practiceSubCategories.map(
        (subCategory) => subCategory._id
      );
      console.log(
        `🗑️ Found ${practiceSubCategories.length} practice subcategories for subject ${subject._id}`
      );

      // Delete all practice questions in these subcategories
      let practiceQuestionsResult = { deletedCount: 0 };
      if (practiceSubCategoryIds.length > 0) {
        practiceQuestionsResult = await PracticeQuestion.deleteMany({
          subCategoryId: { $in: practiceSubCategoryIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${practiceQuestionsResult.deletedCount} PracticeQuestions for subject ${subject._id}`
      );

      // Delete all practice subcategories
      let practiceSubCategoriesResult = { deletedCount: 0 };
      if (practiceCategoryIds.length > 0) {
        practiceSubCategoriesResult = await PracticeSubCategory.deleteMany({
          categoryId: { $in: practiceCategoryIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${practiceSubCategoriesResult.deletedCount} PracticeSubCategories for subject ${subject._id}`
      );

      // Delete all practice categories
      const practiceCategoriesResult = await PracticeCategory.deleteMany({
        subjectId: subject._id,
      });
      console.log(
        `🗑️ Cascading delete: Deleted ${practiceCategoriesResult.deletedCount} PracticeCategories for subject ${subject._id}`
      );
    }
  } catch (error) {
    console.error("❌ Error in Subject cascading delete middleware:", error);
    // Don't throw - allow the delete to continue even if cascading fails
  }
});

// Ensure the latest schema is used during dev hot-reload
// If a previous version of the model exists (with an outdated schema), delete it first
if (mongoose.connection?.models?.Subject) {
  delete mongoose.connection.models.Subject;
}

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
