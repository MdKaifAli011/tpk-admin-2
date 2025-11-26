import React from "react";
import { notFound } from "next/navigation";
import MainLayout from "../../layout/MainLayout";
import { FaGraduationCap } from "react-icons/fa";
import TabsClient from "../../components/TabsClient";
import NavigationClient from "../../components/NavigationClient";
import UnitsSectionClient from "../../components/UnitsSectionClient";
import SubjectProgressClient from "../../components/SubjectProgressClient";
import SubjectCompletionTracker from "../../components/SubjectCompletionTracker";
import {
  fetchExamById,
  fetchSubjectsByExam,
  fetchSubjectById,
  fetchUnitsBySubject,
  createSlug,
  findByIdOrSlug,
  fetchSubjectDetailsById,
} from "../../lib/api";
import {
  getNextSubject,
  getPreviousSubject,
} from "../../lib/hierarchicalNavigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SubjectPage = async ({ params }) => {
  const { exam: examId, subject: subjectSlug } = await params;

  // Fetch exam
  const fetchedExam = await fetchExamById(examId);
  if (!fetchedExam) {
    notFound();
  }

  const examIdValue = fetchedExam._id || examId;

  // Fetch subjects for this exam
  const fetchedSubjects = await fetchSubjectsByExam(examIdValue);

  // Find subject by slug
  const foundSubject = findByIdOrSlug(fetchedSubjects, subjectSlug);
  if (!foundSubject) {
    notFound();
  }

  // Fetch full subject data and details in parallel
  const [fullSubjectData, subjectDetails, fetchedUnits] = await Promise.all([
    fetchSubjectById(foundSubject._id),
    fetchSubjectDetailsById(foundSubject._id).catch(() => ({
      content: "",
      title: "",
      metaDescription: "",
      keywords: "",
    })),
    fetchUnitsBySubject(foundSubject._id, examIdValue),
  ]);

  const subject = fullSubjectData || foundSubject;

  // Find current subject index for navigation
  const subjectIndex = fetchedSubjects.findIndex(
    (s) =>
      s._id === foundSubject._id ||
      createSlug(s.name) === subjectSlug ||
      s.name?.toLowerCase() === subjectSlug.toLowerCase()
  );

  const examSlug = createSlug(fetchedExam.name);
  const subjectSlugValue = subject.slug || createSlug(subject.name);

  // Calculate hierarchical navigation
  const [nextNav, prevNav] = await Promise.all([
    getNextSubject({
      examId: examIdValue,
      examSlug: examSlug,
      subjectId: foundSubject._id,
      subjectSlug: subjectSlugValue,
      currentIndex: subjectIndex,
      allItems: fetchedSubjects,
    }),
    getPreviousSubject({
      examId: examIdValue,
      examSlug: examSlug,
      subjectId: foundSubject._id,
      subjectSlug: subjectSlugValue,
      currentIndex: subjectIndex,
      allItems: fetchedSubjects,
    }),
  ]);

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header */}
        <section className="bg-linear-to-b from-purple-50/40 via-white to-purple-50/30 border border-purple-100 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2.5 mb-1.5">
                <FaGraduationCap className="text-xl text-indigo-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-indigo-900">
                  {subject.name}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 ml-0 md:ml-9">
                {fetchedExam.name} &gt; {subject.name}
              </p>
            </div>

            {/* Progress */}
            <SubjectProgressClient
              subjectId={subject._id}
              unitIds={fetchedUnits.map((unit) => unit._id)}
              initialProgress={0}
            />
          </div>
        </section>

        {/* Tabs */}
        <TabsClient
          content={subjectDetails?.content}
          examId={fetchedExam._id}
          subjectId={subject._id}
          entityName={subject.name}
          entityType="subject"
          unitsCount={fetchedUnits.length}
          examSlug={examSlug}
          subjectSlug={subjectSlugValue}
          units={fetchedUnits}
        />

        {/* Units Section */}
        <UnitsSectionClient
          units={fetchedUnits}
          subjectId={subject._id}
          examSlug={examSlug}
          subjectSlug={subjectSlugValue}
          examName={fetchedExam.name}
          subjectName={subject.name}
        />

        {/* Navigation */}
        <NavigationClient
          backUrl={`/${examSlug}`}
          backLabel={`Back to ${fetchedExam.name}`}
          prevNav={prevNav}
          nextNav={nextNav}
        />

        {/* Subject Completion Tracker */}
        <SubjectCompletionTracker
          subjectId={subject._id}
          subjectName={subject.name}
          unitIds={fetchedUnits.map((unit) => unit._id)}
        />
      </div>
    </MainLayout>
  );
};

export default SubjectPage;
