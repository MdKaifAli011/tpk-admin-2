import { generateMetadata as generateSEO } from "@/utils/seo";
import { createSlug } from "@/utils/slug";
import { logger } from "@/utils/logger";

// Force dynamic rendering to ensure fresh metadata
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { exam: examSlug, subject: subjectSlug, unit: unitSlug, chapter: chapterSlug, topic: topicSlug, subtopic: subtopicSlug } = await params;

  try {
    // Try to fetch data, but don't fail if it doesn't work
    let exam = null;
    let subject = null;
    let unit = null;
    let chapter = null;
    let topic = null;
    let subtopic = null;
    let subtopicDetails = null;

    try {
      const { fetchExamById, fetchSubjectById, fetchUnitById, fetchChapterById, fetchTopicById, fetchSubTopicById, fetchSubTopicDetailsById, fetchSubjectsByExam, fetchUnitsBySubject, fetchChaptersByUnit, fetchTopicsByChapter, fetchSubTopicsByTopic, findByIdOrSlug } = await import("../../../../../../lib/api");
      
      // Fetch exam first
      exam = await fetchExamById(examSlug).catch(() => null);
      
      // Fetch subject
      if (exam?._id) {
        const subjects = await fetchSubjectsByExam(exam._id).catch(() => []);
        if (subjects.length > 0) {
          subject = findByIdOrSlug(subjects, subjectSlug);
          if (subject?._id) {
            const fullSubjectData = await fetchSubjectById(subject._id).catch(() => null);
            if (fullSubjectData) subject = fullSubjectData;
          }
        }
      }
      
      // Fetch unit
      if (subject?._id && exam?._id) {
        const units = await fetchUnitsBySubject(subject._id, exam._id).catch(() => []);
        if (units.length > 0) {
          unit = findByIdOrSlug(units, unitSlug);
          if (unit?._id) {
            const fullUnitData = await fetchUnitById(unit._id).catch(() => null);
            if (fullUnitData) unit = fullUnitData;
          }
        }
      }
      
      // Fetch chapter
      if (unit?._id) {
        const chapters = await fetchChaptersByUnit(unit._id).catch(() => []);
        if (chapters.length > 0) {
          chapter = findByIdOrSlug(chapters, chapterSlug);
          if (chapter?._id) {
            const fullChapterData = await fetchChapterById(chapter._id).catch(() => null);
            if (fullChapterData) chapter = fullChapterData;
          }
        }
      }
      
      // Fetch topic
      if (chapter?._id) {
        const topics = await fetchTopicsByChapter(chapter._id).catch(() => []);
        if (topics.length > 0) {
          topic = findByIdOrSlug(topics, topicSlug);
          if (topic?._id) {
            const fullTopicData = await fetchTopicById(topic._id).catch(() => null);
            if (fullTopicData) topic = fullTopicData;
          }
        }
      }
      
      // Fetch subtopic - using fetchSubTopicsByTopic and findByIdOrSlug
      if (topic?._id) {
        const subtopics = await fetchSubTopicsByTopic(topic._id).catch(() => []);
        if (subtopics.length > 0) {
          subtopic = findByIdOrSlug(subtopics, subtopicSlug);
          if (subtopic?._id) {
            const fullSubTopicData = await fetchSubTopicById(subtopic._id).catch(() => null);
            if (fullSubTopicData) subtopic = fullSubTopicData;
          }
        }
      }
      
      // Fetch subtopic details separately
      if (subtopic?._id) {
        subtopicDetails = await fetchSubTopicDetailsById(subtopic._id).catch(() => null);
      }
    } catch (fetchError) {
      // Silently fail - we'll use defaults
      logger.warn("Could not fetch data for metadata:", fetchError.message);
    }

    if (!subtopic) {
      return generateSEO({}, { type: "subtopic", name: subtopicSlug || "SubTopic" });
    }

    // Use SEO fields from Details: title, metaDescription, keywords
    // Prioritize admin-provided meta data over auto-generated
    const adminTitle = subtopicDetails?.title?.trim();
    const adminMetaDescription = subtopicDetails?.metaDescription?.trim();
    const adminKeywords = subtopicDetails?.keywords?.trim();
    
    const seoData = {
      title: (adminTitle && adminTitle.length > 0)
        ? adminTitle
        : (subtopic.name && subject?.name && exam?.name 
          ? `${subtopic.name} - ${subject.name} - ${exam.name} | Step-by-Step Guide & Practice Exercises`
          : `${subtopic.name || "SubTopic"} - Exam Preparation`),
      metaDescription: (adminMetaDescription && adminMetaDescription.length > 0)
        ? adminMetaDescription
        : (subtopic.name && subject?.name && exam?.name
          ? `Learn ${subtopic.name} in ${subject.name} for ${exam.name} exam. Get step-by-step explanations, detailed examples, practice exercises, and expert guidance. Master ${subtopic.name} concepts with comprehensive study materials.`
          : `Learn ${subtopic.name || "SubTopic"} with step-by-step explanations, examples, and practice exercises.`),
      keywords: (adminKeywords && adminKeywords.length > 0)
        ? adminKeywords
        : (subtopic.name && subject?.name && exam?.name 
          ? `${subtopic.name}, ${subject.name}, ${exam.name}, ${subtopic.name} ${subject.name}, ${subtopic.name} guide, ${exam.name} ${subtopic.name} practice exercises`
          : `${subtopic.name || "SubTopic"}, ${subtopic.name || "SubTopic"} preparation, study guide`),
    };

    return generateSEO(seoData, {
      type: "subtopic",
      name: subtopic.name,
      path: `/${createSlug(exam?.name || "")}/${createSlug(subject?.name || "")}/${createSlug(unit?.name || "")}/${createSlug(chapter?.name || "")}/${createSlug(topic?.name || "")}/${createSlug(subtopic.name)}`,
    });
  } catch (error) {
    // Always return valid metadata even on error
    logger.warn("Error generating metadata:", error.message);
    return generateSEO({}, { type: "subtopic", name: subtopicSlug || "SubTopic" });
  }
}

export default function SubTopicLayout({ children }) {
  return <>{children}</>;
}

