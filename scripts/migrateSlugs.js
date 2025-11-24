/**
 * Migration script to regenerate slugs for all records
 * This script will:
 * - Process ALL records (not just those without slugs)
 * - Regenerate slugs based on current names
 * - Update slugs if they differ from the generated slug
 * - Ensure unique slugs within their respective scopes
 *
 * Usage: node scripts/migrateSlugs.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
dotenv.config({ path: join(projectRoot, '.env.local') });
// Fallback to .env if .env.local doesn't exist
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: join(projectRoot, '.env') });
}


// Import models using relative paths
import Exam from "../models/Exam.js";
import Subject from "../models/Subject.js";
import Unit from "../models/Unit.js";
import Chapter from "../models/Chapter.js";
import Topic from "../models/Topic.js";
import SubTopic from "../models/SubTopic.js";
import { createSlug, generateUniqueSlug } from "../utils/serverSlug.js";

// Connect to MongoDB directly (without using lib/mongodb.js to avoid path alias issues)
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI;
  const mongoDbName = process.env.MONGO_DB_NAME;

  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is required");
  }

  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      dbName: mongoDbName,
    });
    console.log("✅ Connected to MongoDB successfully");
    return mongoose.connection;
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    throw error;
  }
};

async function migrateSlugs() {
  try {
    console.log("🔄 Starting slug migration...");
    await connectDB();

    // Migrate Exams (regenerate all slugs)
    console.log("\n📝 Migrating Exam slugs...");
    const exams = await Exam.find({});
    let examCount = 0;
    let examUpdated = 0;
    for (const exam of exams) {
      const baseSlug = createSlug(exam.name);
      const checkExists = async (slug, excludeId) => {
        const query = { slug };
        if (excludeId) {
          query._id = { $ne: excludeId };
        }
        const existing = await Exam.findOne(query);
        return !!existing;
      };
      const newSlug = await generateUniqueSlug(baseSlug, checkExists, exam._id);
      if (exam.slug !== newSlug) {
        exam.slug = newSlug;
        await exam.save();
        examUpdated++;
      }
      examCount++;
    }
    console.log(`✅ Processed ${examCount} Exams, Updated ${examUpdated} slugs`);

    // Migrate Subjects (regenerate all slugs)
    console.log("\n📝 Migrating Subject slugs...");
    const subjects = await Subject.find({});
    let subjectCount = 0;
    let subjectUpdated = 0;
    for (const subject of subjects) {
      const baseSlug = createSlug(subject.name);
      const checkExists = async (slug, excludeId) => {
        const query = { examId: subject.examId, slug };
        if (excludeId) {
          query._id = { $ne: excludeId };
        }
        const existing = await Subject.findOne(query);
        return !!existing;
      };
      const newSlug = await generateUniqueSlug(
        baseSlug,
        checkExists,
        subject._id
      );
      if (subject.slug !== newSlug) {
        subject.slug = newSlug;
        await subject.save();
        subjectUpdated++;
      }
      subjectCount++;
    }
    console.log(`✅ Processed ${subjectCount} Subjects, Updated ${subjectUpdated} slugs`);

    // Migrate Units (regenerate all slugs)
    console.log("\n📝 Migrating Unit slugs...");
    const units = await Unit.find({});
    let unitCount = 0;
    let unitUpdated = 0;
    for (const unit of units) {
      const baseSlug = createSlug(unit.name);
      const checkExists = async (slug, excludeId) => {
        const query = { subjectId: unit.subjectId, slug };
        if (excludeId) {
          query._id = { $ne: excludeId };
        }
        const existing = await Unit.findOne(query);
        return !!existing;
      };
      const newSlug = await generateUniqueSlug(baseSlug, checkExists, unit._id);
      if (unit.slug !== newSlug) {
        unit.slug = newSlug;
        await unit.save();
        unitUpdated++;
      }
      unitCount++;
    }
    console.log(`✅ Processed ${unitCount} Units, Updated ${unitUpdated} slugs`);

    // Migrate Chapters (regenerate all slugs)
    console.log("\n📝 Migrating Chapter slugs...");
    const chapters = await Chapter.find({});
    let chapterCount = 0;
    let chapterUpdated = 0;
    for (const chapter of chapters) {
      const baseSlug = createSlug(chapter.name);
      const checkExists = async (slug, excludeId) => {
        const query = { unitId: chapter.unitId, slug };
        if (excludeId) {
          query._id = { $ne: excludeId };
        }
        const existing = await Chapter.findOne(query);
        return !!existing;
      };
      const newSlug = await generateUniqueSlug(
        baseSlug,
        checkExists,
        chapter._id
      );
      if (chapter.slug !== newSlug) {
        chapter.slug = newSlug;
        await chapter.save();
        chapterUpdated++;
      }
      chapterCount++;
    }
    console.log(`✅ Processed ${chapterCount} Chapters, Updated ${chapterUpdated} slugs`);

    // Migrate Topics (regenerate all slugs)
    console.log("\n📝 Migrating Topic slugs...");
    const topics = await Topic.find({});
    let topicCount = 0;
    let topicUpdated = 0;
    for (const topic of topics) {
      const baseSlug = createSlug(topic.name);
      const checkExists = async (slug, excludeId) => {
        const query = { chapterId: topic.chapterId, slug };
        if (excludeId) {
          query._id = { $ne: excludeId };
        }
        const existing = await Topic.findOne(query);
        return !!existing;
      };
      const newSlug = await generateUniqueSlug(baseSlug, checkExists, topic._id);
      if (topic.slug !== newSlug) {
        topic.slug = newSlug;
        await topic.save();
        topicUpdated++;
      }
      topicCount++;
    }
    console.log(`✅ Processed ${topicCount} Topics, Updated ${topicUpdated} slugs`);

    // Migrate SubTopics (regenerate all slugs)
    console.log("\n📝 Migrating SubTopic slugs...");
    const subTopics = await SubTopic.find({});
    let subTopicCount = 0;
    let subTopicUpdated = 0;
    for (const subTopic of subTopics) {
      const baseSlug = createSlug(subTopic.name);
      const checkExists = async (slug, excludeId) => {
        const query = { topicId: subTopic.topicId, slug };
        if (excludeId) {
          query._id = { $ne: excludeId };
        }
        const existing = await SubTopic.findOne(query);
        return !!existing;
      };
      const newSlug = await generateUniqueSlug(
        baseSlug,
        checkExists,
        subTopic._id
      );
      if (subTopic.slug !== newSlug) {
        subTopic.slug = newSlug;
        await subTopic.save();
        subTopicUpdated++;
      }
      subTopicCount++;
    }
    console.log(`✅ Processed ${subTopicCount} SubTopics, Updated ${subTopicUpdated} slugs`);

    console.log("\n✅ Slug migration completed successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   - Exams: ${examCount} processed, ${examUpdated} updated`);
    console.log(`   - Subjects: ${subjectCount} processed, ${subjectUpdated} updated`);
    console.log(`   - Units: ${unitCount} processed, ${unitUpdated} updated`);
    console.log(`   - Chapters: ${chapterCount} processed, ${chapterUpdated} updated`);
    console.log(`   - Topics: ${topicCount} processed, ${topicUpdated} updated`);
    console.log(`   - SubTopics: ${subTopicCount} processed, ${subTopicUpdated} updated`);
    const totalProcessed = examCount + subjectCount + unitCount + chapterCount + topicCount + subTopicCount;
    const totalUpdated = examUpdated + subjectUpdated + unitUpdated + chapterUpdated + topicUpdated + subTopicUpdated;
    console.log(`   - Total Processed: ${totalProcessed}`);
    console.log(`   - Total Updated: ${totalUpdated}`);

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("\n✅ MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during slug migration:", error);
    // Close connection on error
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run migration
migrateSlugs();
