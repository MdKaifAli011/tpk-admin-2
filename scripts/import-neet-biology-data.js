/**
 * Import NEET Biology data from CSV file
 * 
 * Usage: node scripts/import-neet-biology-data.js
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Creates or gets NEET exam
 * 3. Creates or gets Biology subject
 * 4. Reads Neet.csv and imports Units, Chapters, Topics, and SubTopics
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models (Note: Need to fix model imports to include .js extension)
// For now, we'll use require-like approach or fix the models
import mongoose from "mongoose";

// Load models dynamically to avoid circular dependency issues
const Exam = mongoose.models.Exam || (await import("../models/Exam.js")).default;
const Subject = mongoose.models.Subject || (await import("../models/Subject.js")).default;
const Unit = mongoose.models.Unit || (await import("../models/Unit.js")).default;
const Chapter = mongoose.models.Chapter || (await import("../models/Chapter.js")).default;
const Topic = mongoose.models.Topic || (await import("../models/Topic.js")).default;
const SubTopic = mongoose.models.SubTopic || (await import("../models/SubTopic.js")).default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const EXAM_NAME = "NEET";
const SUBJECT_NAME = "Biology"; // Only import Biology for now
const CSV_FILE_PATH = path.join(__dirname, "Neet.csv");

/**
 * Parse CSV file
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const data = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handle commas inside quotes)
    const columns = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        columns.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    columns.push(current.trim());

    // Extract data
    const [
      examNo,
      subjectName,
      unitNo,
      unitName,
      chapterNo,
      chapterName,
      topicName,
      subTopicName,
    ] = columns;

    // Only process Biology rows
    if (subjectName && subjectName.trim().toLowerCase() === "biology") {
      data.push({
        examNo: examNo?.trim(),
        subjectName: subjectName?.trim(),
        unitNo: unitNo?.trim() ? parseInt(unitNo.trim()) : null,
        unitName: unitName?.trim(),
        chapterNo: chapterNo?.trim() ? parseInt(chapterNo.trim()) : null,
        chapterName: chapterName?.trim(),
        topicName: topicName?.trim(),
        subTopicName: subTopicName?.trim(),
      });
    }
  }

  return data;
}

// Database configuration
const MONGODB_URI = process.env.MONGODB_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI environment variable is required");
  process.exit(1);
}

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log("🔄 Connecting to MongoDB...");
      await mongoose.connect(MONGODB_URI, {
        dbName: MONGO_DB_NAME,
      });
      console.log("✅ Connected to MongoDB successfully");
    }
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    throw error;
  }
}

/**
 * Get or create exam
 */
async function getOrCreateExam(examName) {
  let exam = await Exam.findOne({ name: examName });
  if (!exam) {
    exam = new Exam({
      name: examName,
      status: "active",
    });
    await exam.save();
    console.log(`✅ Created exam: ${examName}`);
  } else {
    // Update status to active if not already active
    if (exam.status !== "active") {
      exam.status = "active";
      await exam.save();
      console.log(`✅ Updated exam status to active: ${examName}`);
    } else {
      console.log(`ℹ️  Found existing exam: ${examName}`);
    }
  }
  return exam;
}

/**
 * Get or create subject
 */
async function getOrCreateSubject(subjectName, examId) {
  let subject = await Subject.findOne({
    name: subjectName,
    examId: examId,
  });
  if (!subject) {
    // Find max order number for this exam
    const maxOrder = await Subject.findOne({ examId })
      .sort({ orderNumber: -1 })
      .select("orderNumber");
    
    subject = new Subject({
      name: subjectName,
      examId: examId,
      orderNumber: maxOrder?.orderNumber ? maxOrder.orderNumber + 1 : 1,
      status: "active",
    });
    await subject.save();
    console.log(`✅ Created subject: ${subjectName}`);
  } else {
    // Update status to active if not already active
    if (subject.status !== "active") {
      subject.status = "active";
      await subject.save();
      console.log(`✅ Updated subject status to active: ${subjectName}`);
    } else {
      console.log(`ℹ️  Found existing subject: ${subjectName}`);
    }
  }
  return subject;
}

/**
 * Get or create unit
 */
async function getOrCreateUnit(unitName, unitOrderNumber, subjectId, examId) {
  let unit = await Unit.findOne({
    name: unitName,
    subjectId: subjectId,
    examId: examId,
  });

  if (!unit) {
    unit = new Unit({
      name: unitName,
      orderNumber: unitOrderNumber,
      subjectId: subjectId,
      examId: examId,
      status: "active",
    });
    await unit.save();
    console.log(`  ✅ Created unit: ${unitName} (Order: ${unitOrderNumber})`);
  } else {
    // Update order number and status if different
    let needsUpdate = false;
    if (unit.orderNumber !== unitOrderNumber) {
      unit.orderNumber = unitOrderNumber;
      needsUpdate = true;
    }
    if (unit.status !== "active") {
      unit.status = "active";
      needsUpdate = true;
    }
    if (needsUpdate) {
      await unit.save();
      console.log(`  ✅ Updated unit: ${unitName}`);
    } else {
      console.log(`  ℹ️  Found existing unit: ${unitName}`);
    }
  }
  return unit;
}

/**
 * Get or create chapter
 */
async function getOrCreateChapter(
  chapterName,
  chapterOrderNumber,
  unitId,
  subjectId,
  examId
) {
  let chapter = await Chapter.findOne({
    name: chapterName,
    unitId: unitId,
    subjectId: subjectId,
    examId: examId,
  });

  if (!chapter) {
    chapter = new Chapter({
      name: chapterName,
      orderNumber: chapterOrderNumber,
      unitId: unitId,
      subjectId: subjectId,
      examId: examId,
      status: "active",
    });
    await chapter.save();
    console.log(
      `    ✅ Created chapter: ${chapterName} (Order: ${chapterOrderNumber})`
    );
  } else {
    // Update order number and status if different
    let needsUpdate = false;
    if (chapter.orderNumber !== chapterOrderNumber) {
      chapter.orderNumber = chapterOrderNumber;
      needsUpdate = true;
    }
    if (chapter.status !== "active") {
      chapter.status = "active";
      needsUpdate = true;
    }
    if (needsUpdate) {
      await chapter.save();
      console.log(`    ✅ Updated chapter: ${chapterName}`);
    } else {
      console.log(`    ℹ️  Found existing chapter: ${chapterName}`);
    }
  }
  return chapter;
}

/**
 * Get or create topic
 */
async function getOrCreateTopic(
  topicName,
  topicOrderNumber,
  chapterId,
  unitId,
  subjectId,
  examId
) {
  if (!topicName || !topicName.trim()) {
    return null;
  }

  let topic = await Topic.findOne({
    name: topicName,
    chapterId: chapterId,
    unitId: unitId,
    subjectId: subjectId,
    examId: examId,
  });

  if (!topic) {
    topic = new Topic({
      name: topicName,
      orderNumber: topicOrderNumber,
      chapterId: chapterId,
      unitId: unitId,
      subjectId: subjectId,
      examId: examId,
      status: "active",
    });
    await topic.save();
    console.log(
      `      ✅ Created topic: ${topicName} (Order: ${topicOrderNumber})`
    );
  } else {
    // Update order number and status if different
    let needsUpdate = false;
    if (topic.orderNumber !== topicOrderNumber) {
      topic.orderNumber = topicOrderNumber;
      needsUpdate = true;
    }
    if (topic.status !== "active") {
      topic.status = "active";
      needsUpdate = true;
    }
    if (needsUpdate) {
      await topic.save();
      console.log(`      ✅ Updated topic: ${topicName}`);
    } else {
      console.log(`      ℹ️  Found existing topic: ${topicName}`);
    }
  }
  return topic;
}

/**
 * Get or create subtopic
 */
async function getOrCreateSubtopic(
  subTopicName,
  subTopicOrderNumber,
  topicId,
  chapterId,
  unitId,
  subjectId,
  examId
) {
  if (!subTopicName || !subTopicName.trim() || !topicId) {
    return null;
  }

  let subTopic = await SubTopic.findOne({
    name: subTopicName,
    topicId: topicId,
    chapterId: chapterId,
    unitId: unitId,
    subjectId: subjectId,
    examId: examId,
  });

  if (!subTopic) {
    subTopic = new SubTopic({
      name: subTopicName,
      orderNumber: subTopicOrderNumber,
      topicId: topicId,
      chapterId: chapterId,
      unitId: unitId,
      subjectId: subjectId,
      examId: examId,
      status: "active",
    });
    await subTopic.save();
    console.log(
      `        ✅ Created subtopic: ${subTopicName} (Order: ${subTopicOrderNumber})`
    );
  } else {
    // Update order number and status if different
    let needsUpdate = false;
    if (subTopic.orderNumber !== subTopicOrderNumber) {
      subTopic.orderNumber = subTopicOrderNumber;
      needsUpdate = true;
    }
    if (subTopic.status !== "active") {
      subTopic.status = "active";
      needsUpdate = true;
    }
    if (needsUpdate) {
      await subTopic.save();
      console.log(`        ✅ Updated subtopic: ${subTopicName}`);
    } else {
      console.log(`        ℹ️  Found existing subtopic: ${subTopicName}`);
    }
  }
  return subTopic;
}

/**
 * Main import function
 */
async function importData() {
  try {
    console.log("🚀 Starting NEET Biology data import...\n");

    // Connect to database
    await connectDB();

    // Get or create exam
    const exam = await getOrCreateExam(EXAM_NAME);
    const examId = exam._id;

    // Get or create subject
    const subject = await getOrCreateSubject(SUBJECT_NAME, examId);
    const subjectId = subject._id;

    // Parse CSV
    console.log(`\n📖 Reading CSV file: ${CSV_FILE_PATH}`);
    const csvData = parseCSV(CSV_FILE_PATH);
    console.log(`✅ Parsed ${csvData.length} rows from CSV\n`);

    // Track current hierarchy for order numbers
    let currentUnit = null;
    let currentUnitOrderNumber = 0;
    let currentChapter = null;
    let currentChapterOrderNumber = 0;
    let currentTopic = null;
    let currentTopicOrderNumber = 0;
    let currentSubtopicOrderNumber = 0;

    // Track topic names per chapter to manage order numbers properly
    const topicMap = new Map(); // chapterId -> Map(topicName -> topicOrderNumber)
    
    // Track subtopic names per topic to manage order numbers and avoid duplicates
    const subtopicMap = new Map(); // topicId -> Map(subtopicName -> subtopicOrderNumber)

    let unitsCreated = 0;
    let chaptersCreated = 0;
    let topicsCreated = 0;
    let subtopicsCreated = 0;

    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const {
        unitNo,
        unitName,
        chapterNo,
        chapterName,
        topicName,
        subTopicName,
      } = row;

      // Skip completely empty rows
      if (!unitName && !chapterName && !topicName && !subTopicName) {
        continue;
      }

      // Process Unit (only if unit name and number are present)
      if (unitName && unitNo) {
        // New unit detected
        currentUnit = await getOrCreateUnit(
          unitName,
          unitNo,
          subjectId,
          examId
        );
        currentUnitOrderNumber = unitNo;
        currentChapter = null;
        currentChapterOrderNumber = 0;
        currentTopic = null;
        currentTopicOrderNumber = 0;
        currentSubtopicOrderNumber = 0;
        topicMap.clear(); // Clear topic map for new unit
        subtopicMap.clear(); // Clear subtopic map for new unit
        unitsCreated++;
      }

      // Process Chapter (only if chapter name and number are present)
      if (chapterName && chapterNo && currentUnit) {
        // New chapter detected
        currentChapter = await getOrCreateChapter(
          chapterName,
          chapterNo,
          currentUnit._id,
          subjectId,
          examId
        );
        currentChapterOrderNumber = chapterNo;
        currentTopic = null;
        currentTopicOrderNumber = 0;
        currentSubtopicOrderNumber = 0;
        
        // Initialize topic map for this chapter
        if (!topicMap.has(currentChapter._id.toString())) {
          topicMap.set(currentChapter._id.toString(), new Map());
        }
        
        chaptersCreated++;
      }

      // Process Topic (only if topic name is present and chapter exists)
      if (topicName && topicName.trim() && currentChapter) {
        const chapterKey = currentChapter._id.toString();
        const chapterTopicMap = topicMap.get(chapterKey);
        
        // Check if this is a new topic (compare with previous row)
        const prevRow = i > 0 ? csvData[i - 1] : null;
        const isNewTopic =
          !prevRow ||
          prevRow.topicName !== topicName ||
          prevRow.chapterName !== chapterName ||
          prevRow.unitName !== unitName;
        
        // Check if this topic already exists in the map
        if (!chapterTopicMap.has(topicName)) {
          // New topic - increment order number
          currentTopicOrderNumber = chapterTopicMap.size + 1;
          chapterTopicMap.set(topicName, currentTopicOrderNumber);
          
          currentTopic = await getOrCreateTopic(
            topicName,
            currentTopicOrderNumber,
            currentChapter._id,
            currentUnit._id,
            subjectId,
            examId
          );
          // Initialize subtopic map for this topic
          if (currentTopic && !subtopicMap.has(currentTopic._id.toString())) {
            subtopicMap.set(currentTopic._id.toString(), new Map());
          }
          currentSubtopicOrderNumber = 0; // Reset for new topic
          if (currentTopic) topicsCreated++;
        } else if (isNewTopic) {
          // Topic exists in map but we're encountering it again (new row)
          // This means we're re-entering this topic - reset subtopic counter
          currentTopicOrderNumber = chapterTopicMap.get(topicName);
          currentTopic = await Topic.findOne({
            name: topicName,
            chapterId: currentChapter._id,
            unitId: currentUnit._id,
            subjectId: subjectId,
            examId: examId,
          });
          // Initialize subtopic map for this topic if not exists
          if (currentTopic && !subtopicMap.has(currentTopic._id.toString())) {
            subtopicMap.set(currentTopic._id.toString(), new Map());
          }
          // Don't reset subtopic order - continue from where we left off
          // Only reset if topic actually changed
          if (!currentTopic || currentSubtopicOrderNumber === 0) {
            currentSubtopicOrderNumber = 0;
          }
        } else {
          // Same topic continues - keep current topic
          if (!currentTopic || currentTopic.name !== topicName) {
            currentTopicOrderNumber = chapterTopicMap.get(topicName);
            currentTopic = await Topic.findOne({
              name: topicName,
              chapterId: currentChapter._id,
              unitId: currentUnit._id,
              subjectId: subjectId,
              examId: examId,
            });
            // Initialize subtopic map for this topic if not exists
            if (currentTopic && !subtopicMap.has(currentTopic._id.toString())) {
              subtopicMap.set(currentTopic._id.toString(), new Map());
            }
          }
        }
      }

      // Process SubTopic (only if subtopic name is present and topic exists)
      if (subTopicName && subTopicName.trim() && currentTopic) {
        const topicKey = currentTopic._id.toString();
        
        // Initialize subtopic map for this topic if not exists
        if (!subtopicMap.has(topicKey)) {
          subtopicMap.set(topicKey, new Map());
        }
        
        const topicSubtopicMap = subtopicMap.get(topicKey);
        
        // Check if this subtopic already exists in the map
        if (!topicSubtopicMap.has(subTopicName)) {
          // New subtopic - increment order number
          currentSubtopicOrderNumber = topicSubtopicMap.size + 1;
          topicSubtopicMap.set(subTopicName, currentSubtopicOrderNumber);
          
          const subTopic = await getOrCreateSubtopic(
            subTopicName,
            currentSubtopicOrderNumber,
            currentTopic._id,
            currentChapter._id,
            currentUnit._id,
            subjectId,
            examId
          );
          if (subTopic) subtopicsCreated++;
        } else {
          // Subtopic already exists - skip duplicate
          console.log(`        ⏭️  Skipping duplicate subtopic: ${subTopicName}`);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Import completed successfully!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   - Units: ${unitsCreated} created`);
    console.log(`   - Chapters: ${chaptersCreated} created`);
    console.log(`   - Topics: ${topicsCreated} created`);
    console.log(`   - SubTopics: ${subtopicsCreated} created`);
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Error during import:", error);
    throw error;
  } finally {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("🔌 Database connection closed");
    }
    process.exit(0);
  }
}

// Run the import
importData().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

