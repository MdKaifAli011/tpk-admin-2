import { generateMetadata as generateSEO } from "@/utils/seo";
import { createSlug } from "@/utils/slug";
import { logger } from "@/utils/logger";

// Force dynamic rendering to ensure fresh metadata
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { exam: examSlug, subject: subjectSlug } = await params;

  try {
    // Try to fetch data, but don't fail if it doesn't work
    let exam = null;
    let subject = null;
    let subjectDetails = null;

    try {
      const { fetchExamById, fetchSubjectById, fetchSubjectDetailsById, fetchSubjectsByExam, findByIdOrSlug } = await import("../../lib/api");
      
      // Fetch exam first
      exam = await fetchExamById(examSlug).catch(() => null);
      
      // Fetch subject - try by ID first, then by slug if needed
      if (exam?._id) {
        const subjects = await fetchSubjectsByExam(exam._id).catch(() => []);
        if (subjects.length > 0) {
          // Find subject by slug
          subject = findByIdOrSlug(subjects, subjectSlug);
          
          // If found by slug, fetch full subject data by ID
          if (subject?._id) {
            const fullSubjectData = await fetchSubjectById(subject._id).catch(() => null);
            if (fullSubjectData) {
              subject = fullSubjectData;
            }
          }
        }
      }
      
      // Fetch subject details separately
      if (subject?._id) {
        subjectDetails = await fetchSubjectDetailsById(subject._id).catch(() => null);
      }
    } catch (fetchError) {
      // Silently fail - we'll use defaults
      logger.warn("Could not fetch data for metadata:", fetchError.message);
    }

    if (!subject) {
      return generateSEO(
        {},
        { type: "subject", name: subjectSlug || "Subject" }
      );
    }

    // Use SEO fields from Details: title, metaDescription, keywords
    // Prioritize admin-provided meta data over auto-generated
    const adminTitle = subjectDetails?.title?.trim();
    const adminMetaDescription = subjectDetails?.metaDescription?.trim();
    const adminKeywords = subjectDetails?.keywords?.trim();
    
    const seoData = {
      title: (adminTitle && adminTitle.length > 0)
        ? adminTitle
        : (subject.name && exam?.name
          ? `${subject.name} - ${exam.name} Exam Preparation | Study Materials & Practice Tests`
          : `${subject.name || "Subject"} - Exam Preparation`),
      metaDescription: (adminMetaDescription && adminMetaDescription.length > 0)
        ? adminMetaDescription
        : (subject.name && exam?.name
          ? `Prepare for ${subject.name} in ${exam.name} exam with comprehensive study materials, practice tests, and expert guidance. Access free ${subject.name} preparation resources and track your progress.`
          : `Prepare for ${subject.name || "Subject"} with comprehensive study materials, practice tests, and expert guidance.`),
      keywords: (adminKeywords && adminKeywords.length > 0)
        ? adminKeywords
        : (subject.name && exam?.name
          ? `${subject.name}, ${exam.name}, ${subject.name} ${exam.name}, ${subject.name} preparation, ${subject.name} study materials, ${exam.name} ${subject.name} practice tests`
          : `${subject.name || "Subject"}, ${subject.name || "Subject"} preparation, study materials`),
    };

    return generateSEO(seoData, {
      type: "subject",
      name: subject.name,
      path: `/${createSlug(exam?.name || "")}/${createSlug(subject.name)}`,
    });
  } catch (error) {
    // Always return valid metadata even on error
    logger.warn("Error generating metadata:", error.message);
    return generateSEO({}, { type: "subject", name: subjectSlug || "Subject" });
  }
}

export default function SubjectLayout({ children }) {
  return <>{children}</>;
}
