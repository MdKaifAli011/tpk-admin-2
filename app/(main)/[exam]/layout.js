import { generateMetadata as generateSEO } from "@/utils/seo";
import { createSlug } from "@/utils/slug";
import { logger } from "@/utils/logger";

// Force dynamic rendering to ensure fresh metadata
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Generate metadata for exam pages from admin SEO data
export async function generateMetadata({ params }) {
  const { exam: examSlug } = await params;

  try {
    // Try to fetch exam data and details, but don't fail if it doesn't work
    let exam = null;
    let examDetails = null;
    
    try {
      const { fetchExamById, fetchExamDetailsById } = await import("../lib/api");
      exam = await fetchExamById(examSlug).catch(() => null);
      
      if (exam?._id) {
        examDetails = await fetchExamDetailsById(exam._id).catch(() => null);
      }
    } catch (fetchError) {
      // Silently fail - we'll use defaults
      logger.warn("Could not fetch exam for metadata:", fetchError.message);
    }

    if (!exam) {
      return generateSEO({}, { type: "exam", name: examSlug || "Exam" });
    }

    // Use SEO fields from Details: title, metaDescription, keywords
    // Prioritize admin-provided meta data over auto-generated
    const adminTitle = examDetails?.title?.trim();
    const adminMetaDescription = examDetails?.metaDescription?.trim();
    const adminKeywords = examDetails?.keywords?.trim();
    
    const seoData = {
      title: (adminTitle && adminTitle.length > 0) 
        ? adminTitle 
        : `${exam.name} Exam Preparation - Study Materials & Practice Tests`,
      metaDescription: (adminMetaDescription && adminMetaDescription.length > 0)
        ? adminMetaDescription
        : `Prepare for ${exam.name} exam with comprehensive resources, study materials, practice tests, and expert guidance. Access free exam preparation content and track your progress.`,
      keywords: (adminKeywords && adminKeywords.length > 0)
        ? adminKeywords
        : `${exam.name}, ${exam.name} exam, ${exam.name} preparation, ${exam.name} study materials, ${exam.name} practice tests, exam preparation`,
    };

    return generateSEO(seoData, {
      type: "exam",
      name: exam.name,
      path: `/${createSlug(exam.name)}`,
    });
  } catch (error) {
    // Always return valid metadata even on error
    logger.warn("Error generating metadata:", error.message);
    return generateSEO({}, { type: "exam", name: examSlug || "Exam" });
  }
}

export default function ExamLayout({ children }) {
  return <>{children}</>;
}
