import { generateMetadata as generateSEO } from "@/utils/seo";
import { createSlug } from "@/utils/slug";
import { logger } from "@/utils/logger";

// Force dynamic rendering to ensure fresh metadata
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { exam: examSlug, subject: subjectSlug, unit: unitSlug, chapter: chapterSlug, topic: topicSlug } = await params;

  try {
    // Try to fetch data, but don't fail if it doesn't work
    let exam = null;
    let subject = null;
    let unit = null;
    let chapter = null;
    let topic = null;
    let topicDetails = null;

    try {
      const { fetchExamById, fetchSubjectById, fetchUnitById, fetchChapterById, fetchTopicById, fetchTopicDetailsById, fetchSubjectsByExam, fetchUnitsBySubject, fetchChaptersByUnit, fetchTopicsByChapter, findByIdOrSlug } = await import("../../../../../lib/api");
      
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
      
      // Fetch topic - using fetchTopicsByChapter and findByIdOrSlug
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
      
      // Fetch topic details separately
      if (topic?._id) {
        topicDetails = await fetchTopicDetailsById(topic._id).catch(() => null);
      }
    } catch (fetchError) {
      // Silently fail - we'll use defaults
      logger.warn("Could not fetch data for metadata:", fetchError.message);
    }

    if (!topic) {
      return generateSEO({}, { type: "topic", name: topicSlug || "Topic" });
    }

    // Use SEO fields from Details: title, metaDescription, keywords
    // Prioritize admin-provided meta data over auto-generated
    const adminTitle = topicDetails?.title?.trim();
    const adminMetaDescription = topicDetails?.metaDescription?.trim();
    const adminKeywords = topicDetails?.keywords?.trim();
    
    const seoData = {
      title: (adminTitle && adminTitle.length > 0)
        ? adminTitle
        : (topic.name && subject?.name && exam?.name 
          ? `${topic.name} - ${subject.name} - ${exam.name} | Detailed Study Guide & Practice Problems`
          : `${topic.name || "Topic"} - Exam Preparation`),
      metaDescription: (adminMetaDescription && adminMetaDescription.length > 0)
        ? adminMetaDescription
        : (topic.name && subject?.name && exam?.name
          ? `Master ${topic.name} in ${subject.name} for ${exam.name} exam. Study with detailed explanations, step-by-step examples, practice problems, and expert tips. Access free ${topic.name} study materials and improve your understanding.`
          : `Master ${topic.name || "Topic"} with detailed explanations, examples, and practice problems.`),
      keywords: (adminKeywords && adminKeywords.length > 0)
        ? adminKeywords
        : (topic.name && subject?.name && exam?.name 
          ? `${topic.name}, ${subject.name}, ${exam.name}, ${topic.name} ${subject.name}, ${topic.name} explanation, ${exam.name} ${topic.name} practice problems`
          : `${topic.name || "Topic"}, ${topic.name || "Topic"} preparation, study guide`),
    };

    return generateSEO(seoData, {
      type: "topic",
      name: topic.name,
      path: `/${createSlug(exam?.name || "")}/${createSlug(subject?.name || "")}/${createSlug(unit?.name || "")}/${createSlug(chapter?.name || "")}/${createSlug(topic.name)}`,
    });
  } catch (error) {
    // Always return valid metadata even on error
    logger.warn("Error generating metadata:", error.message);
    return generateSEO({}, { type: "topic", name: topicSlug || "Topic" });
  }
}

export default function TopicLayout({ children }) {
  return <>{children}</>;
}

