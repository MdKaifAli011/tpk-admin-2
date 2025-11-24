import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Exam from "@/models/Exam";
import Subject from "@/models/Subject";
import Unit from "@/models/Unit";
import Chapter from "@/models/Chapter";
import Topic from "@/models/Topic";
import SubTopic from "@/models/SubTopic";
import mongoose from "mongoose";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/utils/apiResponse";
import { STATUS, ERROR_MESSAGES } from "@/constants";

/**
 * GET /api/tree
 * Returns complete hierarchical tree structure
 * Query params:
 *   - status: "active" | "inactive" | "all" (default: "active")
 *   - examId: Optional - filter by specific exam
 */
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const statusFilterParam = searchParams.get("status") || STATUS.ACTIVE;
    const statusFilter = statusFilterParam.toLowerCase();
    const examIdParam = searchParams.get("examId");

    // Build status query
    const statusQuery =
      statusFilter !== "all"
        ? { status: { $regex: new RegExp(`^${statusFilter}$`, "i") } }
        : {};

    // Build exam query - validate ObjectId if provided
    let examQuery = {};
    if (examIdParam) {
      if (!mongoose.Types.ObjectId.isValid(examIdParam)) {
        return errorResponse("Invalid examId", 400);
      }
      examQuery = { _id: new mongoose.Types.ObjectId(examIdParam) };
    }

    // Fetch all exams
    const exams = await Exam.find({ ...examQuery, ...statusQuery })
      .select("_id name slug status orderNumber")
      .sort({ orderNumber: 1, createdAt: -1 })
      .lean();

    if (exams.length === 0) {
      return successResponse([]);
    }

    // Get all exam IDs
    const examIds = exams.map((exam) => exam._id);

    // Fetch all subjects for these exams
    const subjects = await Subject.find({
      examId: { $in: examIds },
      ...statusQuery,
    })
      .select("_id name slug orderNumber examId status")
      .sort({ orderNumber: 1, createdAt: -1 })
      .lean();

    // Get all subject IDs
    const subjectIds = subjects.map((subject) => subject._id);

    // Fetch all units for these subjects
    const units = await Unit.find({
      subjectId: { $in: subjectIds },
      ...statusQuery,
    })
      .select("_id name slug orderNumber subjectId examId status")
      .sort({ orderNumber: 1, createdAt: -1 })
      .lean();

    // Get all unit IDs
    const unitIds = units.map((unit) => unit._id);

    // Fetch all chapters for these units
    const chapters = await Chapter.find({
      unitId: { $in: unitIds },
      ...statusQuery,
    })
      .select(
        "_id name slug orderNumber unitId subjectId examId status weightage time questions"
      )
      .sort({ orderNumber: 1, createdAt: -1 })
      .lean();

    // Get all chapter IDs
    const chapterIds = chapters.map((chapter) => chapter._id);

    // Fetch all topics for these chapters
    const topics = await Topic.find({
      chapterId: { $in: chapterIds },
      ...statusQuery,
    })
      .select(
        "_id name slug orderNumber chapterId unitId subjectId examId status"
      )
      .sort({ orderNumber: 1, createdAt: -1 })
      .lean();

    // Get all topic IDs
    const topicIds = topics.map((topic) => topic._id);

    // Fetch all subtopics for these topics
    const subTopics = await SubTopic.find({
      topicId: { $in: topicIds },
      ...statusQuery,
    })
      .select(
        "_id name slug orderNumber topicId chapterId unitId subjectId examId status"
      )
      .sort({ orderNumber: 1, createdAt: -1 })
      .lean();

    // Build hierarchical tree structure
    const buildTree = () => {
      // Group by parent IDs
      const subjectsByExam = {};
      const unitsBySubject = {};
      const chaptersByUnit = {};
      const topicsByChapter = {};
      const subTopicsByTopic = {};

      // Group subjects by exam
      subjects.forEach((subject) => {
        const examIdStr = subject.examId.toString();
        if (!subjectsByExam[examIdStr]) {
          subjectsByExam[examIdStr] = [];
        }
        subjectsByExam[examIdStr].push(subject);
      });

      // Group units by subject
      units.forEach((unit) => {
        const subjectIdStr = unit.subjectId.toString();
        if (!unitsBySubject[subjectIdStr]) {
          unitsBySubject[subjectIdStr] = [];
        }
        unitsBySubject[subjectIdStr].push(unit);
      });

      // Group chapters by unit
      chapters.forEach((chapter) => {
        const unitIdStr = chapter.unitId.toString();
        if (!chaptersByUnit[unitIdStr]) {
          chaptersByUnit[unitIdStr] = [];
        }
        chaptersByUnit[unitIdStr].push(chapter);
      });

      // Group topics by chapter
      topics.forEach((topic) => {
        const chapterIdStr = topic.chapterId.toString();
        if (!topicsByChapter[chapterIdStr]) {
          topicsByChapter[chapterIdStr] = [];
        }
        topicsByChapter[chapterIdStr].push(topic);
      });

      // Group subtopics by topic
      subTopics.forEach((subTopic) => {
        const topicIdStr = subTopic.topicId.toString();
        if (!subTopicsByTopic[topicIdStr]) {
          subTopicsByTopic[topicIdStr] = [];
        }
        subTopicsByTopic[topicIdStr].push(subTopic);
      });

      // Build tree structure
      return exams.map((exam) => {
        const examIdStr = exam._id.toString();
        const examSubjects = subjectsByExam[examIdStr] || [];

        return {
          ...exam,
          subjects: examSubjects.map((subject) => {
            const subjectIdStr = subject._id.toString();
            const subjectUnits = unitsBySubject[subjectIdStr] || [];

            return {
              ...subject,
              units: subjectUnits.map((unit) => {
                const unitIdStr = unit._id.toString();
                const unitChapters = chaptersByUnit[unitIdStr] || [];

                return {
                  ...unit,
                  chapters: unitChapters.map((chapter) => {
                    const chapterIdStr = chapter._id.toString();
                    const chapterTopics = topicsByChapter[chapterIdStr] || [];

                    return {
                      ...chapter,
                      topics: chapterTopics.map((topic) => {
                        const topicIdStr = topic._id.toString();
                        const topicSubTopics =
                          subTopicsByTopic[topicIdStr] || [];

                        return {
                          ...topic,
                          subTopics: topicSubTopics,
                        };
                      }),
                    };
                  }),
                };
              }),
            };
          }),
        };
      });
    };

    const tree = buildTree();

    return successResponse(tree);
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.FETCH_FAILED);
  }
}
