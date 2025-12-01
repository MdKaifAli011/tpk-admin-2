import { generateMetadata as generateSEO } from "@/utils/seo";
import { createSlug } from "@/utils/slug";
import { logger } from "@/utils/logger";

// Force dynamic rendering to ensure fresh metadata
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { exam: examSlug, subject: subjectSlug, unit: unitSlug } = await params;

    try {
      // Try to fetch data, but don't fail if it doesn't work
      let exam = null;
      let subject = null;
      let unit = null;
      let unitDetails = null;

      try {
        const { fetchExamById, fetchSubjectById, fetchUnitById, fetchUnitDetailsById, fetchUnitsBySubject, fetchSubjectsByExam, findByIdOrSlug, createSlug } = await import("../../../lib/api");
        
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
          } else {
            logger.warn(`No subjects found for exam ${exam._id}`);
          }
        } else {
          logger.warn("Cannot fetch subjects - exam not found");
        }
        
        // Since fetchUnitById only works with ObjectIds, we need to fetch all units and find by slug
        // This is the correct approach for metadata generation
        if (subject?._id && exam?._id) {
          try {
            const units = await fetchUnitsBySubject(subject._id, exam._id).catch(() => []);
            
            if (units.length > 0) {
              // Find unit by slug
              unit = findByIdOrSlug(units, unitSlug);
              
              // If found by slug, fetch full unit data by ID to ensure we have all fields
              if (unit?._id) {
                const fullUnitData = await fetchUnitById(unit._id).catch(() => null);
                if (fullUnitData) {
                  unit = fullUnitData;
                }
              }
            } else {
              logger.warn(`No units found for subject ${subject._id}`);
            }
          } catch (err) {
            logger.warn("Could not fetch units by subject:", err.message);
          }
        } else {
          logger.warn("Cannot fetch units - missing subject or exam ID");
        }
        
        if (!unit) {
          logger.warn(`Unit not found for slug: ${unitSlug}`);
        }
        
        // Fetch unit details separately - only if unit was found and has an _id
        if (unit?._id) {
          try {
            unitDetails = await fetchUnitDetailsById(unit._id);
            // Log for debugging (only in development)
            if (unitDetails && process.env.NODE_ENV === "development") {
              logger.debug(`Unit details fetched successfully for ${unit._id}:`, {
                unitId: unitDetails.unitId,
                title: unitDetails.title,
                titleLength: unitDetails.title?.length || 0,
                titleAfterTrim: unitDetails.title?.trim(),
                hasTitle: !!unitDetails.title,
                hasMetaDescription: !!unitDetails.metaDescription,
                hasKeywords: !!unitDetails.keywords,
              });
            } else {
              console.warn(`[METADATA] No unit details found for unitId: ${unit._id}`);
              logger.warn(`No unit details found for unitId: ${unit._id}`);
            }
          } catch (detailsError) {
            console.error(`[METADATA] Error fetching unit details:`, detailsError);
            logger.warn("Could not fetch unit details:", detailsError.message);
            unitDetails = null;
          }
        } else {
          console.warn(`[METADATA] Unit found but no _id available:`, unit);
          logger.warn("Unit found but no _id available:", unit);
        }
    } catch (fetchError) {
      // Silently fail - we'll use defaults
      logger.warn("Could not fetch data for metadata:", fetchError.message);
    }

    if (!unit) {
      return generateSEO({}, { type: "unit", name: unitSlug || "Unit" });
    }

    // Use SEO fields from Details: title, metaDescription, keywords
    // Prioritize admin-provided meta data over auto-generated
    // Check if title exists and has content after trimming
    const adminTitle = unitDetails?.title?.trim();
    const adminMetaDescription = unitDetails?.metaDescription?.trim();
    const adminKeywords = unitDetails?.keywords?.trim();
    
    const seoData = {
      title: (adminTitle && adminTitle.length > 0) 
        ? adminTitle 
        : (unit.name && subject?.name && exam?.name 
          ? `${unit.name} - ${subject.name} - ${exam.name} | Study Materials & Practice Tests`
          : `${unit.name || "Unit"} - Exam Preparation`),
      metaDescription: (adminMetaDescription && adminMetaDescription.length > 0)
        ? adminMetaDescription
        : (unit.name && subject?.name && exam?.name
          ? `Study ${unit.name} in ${subject.name} for ${exam.name} exam. Get comprehensive notes, practice questions, solved examples, and expert guidance. Access free ${unit.name} study materials and track your progress.`
          : `Study ${unit.name || "Unit"} with comprehensive study materials, practice questions, and expert guidance.`),
      keywords: (adminKeywords && adminKeywords.length > 0)
        ? adminKeywords
        : (unit.name && subject?.name && exam?.name 
          ? `${unit.name}, ${subject.name}, ${exam.name}, ${unit.name} ${subject.name}, ${unit.name} study materials, ${exam.name} ${unit.name} practice tests`
          : `${unit.name || "Unit"}, ${unit.name || "Unit"} preparation, study materials`),
    };

    // Log metadata generation (only in development)
    if (process.env.NODE_ENV === "development") {
      logger.info(`Generating metadata for unit ${unit._id}:`, {
        adminTitle: adminTitle,
        adminTitleLength: adminTitle?.length || 0,
        finalTitle: seoData.title,
        finalDescription: seoData.metaDescription?.substring(0, 50) + '...',
        finalKeywords: seoData.keywords,
        usingAdminTitle: (adminTitle && adminTitle.length > 0),
        usingAdminMetaDescription: (adminMetaDescription && adminMetaDescription.length > 0),
        usingAdminKeywords: (adminKeywords && adminKeywords.length > 0),
      });
    }

    const metadata = generateSEO(seoData, {
      type: "unit",
      name: unit.name,
      path: `/${createSlug(exam?.name || "")}/${createSlug(subject?.name || "")}/${createSlug(unit.name)}`,
    });

    return metadata;
  } catch (error) {
    // Always return valid metadata even on error
    logger.warn("Error generating metadata:", error.message);
    return generateSEO({}, { type: "unit", name: unitSlug || "Unit" });
  }
}

export default function UnitLayout({ children }) {
  return <>{children}</>;
}

