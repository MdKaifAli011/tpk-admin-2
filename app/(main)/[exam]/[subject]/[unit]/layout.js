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
        console.log(`[METADATA] Fetching exam with slug: ${examSlug}`);
        exam = await fetchExamById(examSlug).catch(() => null);
        console.log(`[METADATA] Exam: ${exam?._id || 'not found'}, Name: ${exam?.name || 'N/A'}`);
        
        // Fetch subject - try by ID first, then by slug if needed
        if (exam?._id) {
          console.log(`[METADATA] Fetching subjects for exam ${exam._id}`);
          const subjects = await fetchSubjectsByExam(exam._id).catch(() => []);
          console.log(`[METADATA] Fetched ${subjects.length} subjects for exam`);
          
          if (subjects.length > 0) {
            // Find subject by slug
            subject = findByIdOrSlug(subjects, subjectSlug);
            console.log(`[METADATA] Subject found by slug:`, subject ? { id: subject._id, name: subject.name } : 'not found');
            
            // If found by slug, fetch full subject data by ID
            if (subject?._id) {
              const fullSubjectData = await fetchSubjectById(subject._id).catch(() => null);
              if (fullSubjectData) {
                subject = fullSubjectData;
                console.log(`[METADATA] Full subject data fetched:`, { id: subject._id, name: subject.name });
              }
            }
          } else {
            console.warn(`[METADATA] No subjects found for exam ${exam._id}`);
          }
        } else {
          console.warn(`[METADATA] Cannot fetch subjects - exam not found`);
        }
        
        console.log(`[METADATA] Final Exam: ${exam?._id || 'not found'}, Final Subject: ${subject?._id || 'not found'}`);
        
        // Since fetchUnitById only works with ObjectIds, we need to fetch all units and find by slug
        // This is the correct approach for metadata generation
        if (subject?._id && exam?._id) {
          try {
            console.log(`[METADATA] Fetching units for subject ${subject._id} and exam ${exam._id}`);
            const units = await fetchUnitsBySubject(subject._id, exam._id).catch(() => []);
            console.log(`[METADATA] Fetched ${units.length} units for subject`);
            
            if (units.length > 0) {
              // Find unit by slug
              unit = findByIdOrSlug(units, unitSlug);
              console.log(`[METADATA] Unit found by slug:`, unit ? { id: unit._id, name: unit.name } : 'not found');
              
              // If found by slug, fetch full unit data by ID to ensure we have all fields
              if (unit?._id) {
                console.log(`[METADATA] Fetching full unit data for ID: ${unit._id}`);
                const fullUnitData = await fetchUnitById(unit._id).catch(() => null);
                if (fullUnitData) {
                  unit = fullUnitData;
                  console.log(`[METADATA] Full unit data fetched:`, { id: unit._id, name: unit.name });
                }
              }
            } else {
              console.warn(`[METADATA] No units found for subject ${subject._id}`);
            }
          } catch (err) {
            console.error(`[METADATA] Error fetching units by subject:`, err);
            logger.warn("Could not fetch units by subject:", err.message);
          }
        } else {
          console.warn(`[METADATA] Cannot fetch units - missing subject or exam ID`);
        }
        
        if (!unit) {
          console.error(`[METADATA] Unit not found at all! Slug: ${unitSlug}`);
        } else {
          console.log(`[METADATA] Unit found successfully. ID: ${unit._id}, Name: ${unit.name}`);
        }
        
        // Fetch unit details separately - only if unit was found and has an _id
        if (unit?._id) {
          try {
            console.log(`[METADATA] Fetching unit details for unitId: ${unit._id}`);
            console.log(`[METADATA] Unit ID type: ${typeof unit._id}, value: ${unit._id}`);
            logger.info(`Fetching unit details for unitId: ${unit._id}`);
            unitDetails = await fetchUnitDetailsById(unit._id);
            console.log(`[METADATA] Unit details response (raw):`, unitDetails);
            console.log(`[METADATA] Unit details response (stringified):`, JSON.stringify(unitDetails, null, 2));
            // Log for debugging
            if (unitDetails) {
              console.log(`[METADATA] Unit details found:`, {
                unitId: unitDetails.unitId,
                title: unitDetails.title,
                titleType: typeof unitDetails.title,
                titleLength: unitDetails.title?.length || 0,
                titleAfterTrim: unitDetails.title?.trim(),
                hasTitle: !!unitDetails.title,
                hasMetaDescription: !!unitDetails.metaDescription,
                hasKeywords: !!unitDetails.keywords,
              });
              logger.info(`Unit details fetched successfully for ${unit._id}:`, {
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

    // Log the final SEO data being used
    console.log('=== METADATA DEBUG ===');
    console.log('Unit ID:', unit._id);
    console.log('Unit Details Object:', JSON.stringify(unitDetails, null, 2));
    console.log('Unit Details Title Raw:', unitDetails?.title);
    console.log('Unit Details Title Type:', typeof unitDetails?.title);
    console.log('Admin Title (after trim):', adminTitle);
    console.log('Admin Title Length:', adminTitle?.length || 0);
    console.log('Admin Title Truthy Check:', !!adminTitle);
    console.log('Admin Title Length Check:', (adminTitle && adminTitle.length > 0));
    console.log('SEO Data:', JSON.stringify(seoData, null, 2));
    
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

    const metadata = generateSEO(seoData, {
      type: "unit",
      name: unit.name,
      path: `/${createSlug(exam?.name || "")}/${createSlug(subject?.name || "")}/${createSlug(unit.name)}`,
    });

    // Log the final metadata being returned
    console.log('Final Metadata Title:', metadata.title);
    console.log('Final Metadata:', JSON.stringify(metadata, null, 2));
    console.log('=== END METADATA DEBUG ===');
    
    logger.info(`Final metadata title: "${metadata.title}"`);

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

