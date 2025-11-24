import { generateMetadata as generateSEO } from "@/utils/seo";
import { createSlug } from "@/utils/slug";
import { logger } from "@/utils/logger";

// Force dynamic rendering to ensure fresh metadata
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Generate metadata for definition pages from admin SEO data
export async function generateMetadata({ params }) {
  const { definition: definitionSlug } = await params;

  try {
    // Try to fetch definition data and details, but don't fail if it doesn't work
    let definition = null;
    let definitionDetails = null;

    try {
      // We need to extract all params to find the definition
      const { exam, subject, unit, chapter, topic, subtopic } = await params;

      // Fetch the full hierarchy to get to the definition
      const {
        fetchExamById,
        fetchSubjectsByExam,
        fetchSubjectById,
        fetchUnitsBySubject,
        fetchUnitById,
        fetchChaptersByUnit,
        fetchChapterById,
        fetchTopicsByChapter,
        fetchTopicById,
        fetchSubTopicsByTopic,
        fetchDefinitionsBySubTopic,
        fetchDefinitionById,
        fetchDefinitionDetailsById,
        findByIdOrSlug,
      } = await import("../../../../../../../lib/api");

      const examData = await fetchExamById(exam).catch(() => null);
      if (!examData) {
        return generateSEO(
          {},
          { type: "definition", name: definitionSlug || "Definition" }
        );
      }

      const subjects = await fetchSubjectsByExam(examData._id).catch(() => []);
      const foundSubject = findByIdOrSlug(subjects, subject);
      if (!foundSubject) {
        return generateSEO(
          {},
          { type: "definition", name: definitionSlug || "Definition" }
        );
      }

      const units = await fetchUnitsBySubject(
        foundSubject._id,
        examData._id
      ).catch(() => []);
      const foundUnit = findByIdOrSlug(units, unit);
      if (!foundUnit) {
        return generateSEO(
          {},
          { type: "definition", name: definitionSlug || "Definition" }
        );
      }

      const chapters = await fetchChaptersByUnit(foundUnit._id).catch(() => []);
      const foundChapter = findByIdOrSlug(chapters, chapter);
      if (!foundChapter) {
        return generateSEO(
          {},
          { type: "definition", name: definitionSlug || "Definition" }
        );
      }

      const topics = await fetchTopicsByChapter(foundChapter._id).catch(
        () => []
      );
      const foundTopic = findByIdOrSlug(topics, topic);
      if (!foundTopic) {
        return generateSEO(
          {},
          { type: "definition", name: definitionSlug || "Definition" }
        );
      }

      const subtopics = await fetchSubTopicsByTopic(foundTopic._id).catch(
        () => []
      );
      const foundSubtopic = findByIdOrSlug(subtopics, subtopic);
      if (!foundSubtopic) {
        return generateSEO(
          {},
          { type: "definition", name: definitionSlug || "Definition" }
        );
      }

      const definitions = await fetchDefinitionsBySubTopic(
        foundSubtopic._id
      ).catch(() => []);
      definition = findByIdOrSlug(definitions, definitionSlug);

      if (definition?._id) {
        definitionDetails = await fetchDefinitionDetailsById(
          definition._id
        ).catch(() => null);
      }
    } catch (fetchError) {
      // Silently fail - we'll use defaults
      logger.warn(
        "Could not fetch definition for metadata:",
        fetchError.message
      );
    }

    if (!definition) {
      return generateSEO(
        {},
        { type: "definition", name: definitionSlug || "Definition" }
      );
    }

    // Use SEO fields from Details: title, metaDescription, keywords
    // Prioritize admin-provided meta data over auto-generated
    const adminTitle = definitionDetails?.title?.trim();
    const adminMetaDescription = definitionDetails?.metaDescription?.trim();
    const adminKeywords = definitionDetails?.keywords?.trim();

    const seoData = {
      title:
        adminTitle && adminTitle.length > 0
          ? adminTitle
          : `${definition.name} - Definition & Explanation`,
      metaDescription:
        adminMetaDescription && adminMetaDescription.length > 0
          ? adminMetaDescription
          : `Learn about ${definition.name}. Comprehensive definition, explanation, and study materials for exam preparation.`,
      keywords:
        adminKeywords && adminKeywords.length > 0
          ? adminKeywords
          : `${definition.name}, definition, explanation, study material, exam preparation`,
    };

    const examSlug = createSlug(definition.examId?.name || "");
    const subjectSlug = createSlug(definition.subjectId?.name || "");
    const unitSlug = createSlug(definition.unitId?.name || "");
    const chapterSlug = createSlug(definition.chapterId?.name || "");
    const topicSlug = createSlug(definition.topicId?.name || "");
    const subtopicSlug = createSlug(definition.subTopicId?.name || "");
    const definitionSlugValue = createSlug(definition.name);

    return generateSEO(seoData, {
      type: "definition",
      name: definition.name,
      path: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${subtopicSlug}/${definitionSlugValue}`,
    });
  } catch (error) {
    // Always return valid metadata even on error
    logger.warn("Error generating metadata:", error.message);
    return generateSEO(
      {},
      { type: "definition", name: definitionSlug || "Definition" }
    );
  }
}

export default function DefinitionLayout({ children }) {
  return <>{children}</>;
}
