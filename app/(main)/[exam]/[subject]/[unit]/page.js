import React from "react";
import { notFound } from "next/navigation";
import MainLayout from "../../../layout/MainLayout";
import { FaBook } from "react-icons/fa";
import TabsClient from "../../../components/TabsClient";
import NavigationClient from "../../../components/NavigationClient";
import ChaptersSectionClient from "../../../components/ChaptersSectionClient";
import UnitProgressClient from "../../../components/UnitProgressClient";
import UnitCompletionTracker from "../../../components/UnitCompletionTracker";
import { ERROR_MESSAGES } from "@/constants";
import {
  fetchExamById,
  fetchSubjectsByExam,
  fetchSubjectById,
  fetchUnitsBySubject,
  fetchUnitById,
  fetchChaptersByUnit,
  createSlug,
  findByIdOrSlug,
  fetchUnitDetailsById,
} from "../../../lib/api";
import {
  getNextUnit,
  getPreviousUnit,
} from "../../../lib/hierarchicalNavigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UnitPage = async ({ params }) => {
  const { exam: examId, subject: subjectSlug, unit: unitSlug } = await params;

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

  // Fetch full subject data
  const fullSubjectData = await fetchSubjectById(foundSubject._id);
  const subject = fullSubjectData || foundSubject;

  // Fetch units for this subject
  const fetchedUnits = await fetchUnitsBySubject(foundSubject._id, examIdValue);

  // Find unit by slug
  const foundUnit = findByIdOrSlug(fetchedUnits, unitSlug);
  if (!foundUnit) {
    notFound();
  }

  // Fetch full unit data and details in parallel
  const [fullUnitData, unitDetails, fetchedChapters] = await Promise.all([
    fetchUnitById(foundUnit._id),
    fetchUnitDetailsById(foundUnit._id).catch(() => ({
      content: "",
      title: "",
      metaDescription: "",
      keywords: "",
    })),
    fetchChaptersByUnit(foundUnit._id),
  ]);

  const unit = fullUnitData || foundUnit;

  // Find current unit index for navigation
  const unitIndex = fetchedUnits.findIndex(
    (u) =>
      u._id === foundUnit._id ||
      createSlug(u.name) === unitSlug ||
      u.name?.toLowerCase() === unitSlug.toLowerCase()
  );

  const examSlug = createSlug(fetchedExam.name);
  const subjectSlugValue = subject.slug || createSlug(subject.name);
  const unitSlugValue = unit.slug || createSlug(unit.name);

  // Calculate hierarchical navigation
  const [nextNav, prevNav] = await Promise.all([
    getNextUnit({
      examId: examIdValue,
      examSlug: examSlug,
      subjectId: foundSubject._id,
      subjectSlug: subjectSlugValue,
      unitId: foundUnit._id,
      unitSlug: unitSlugValue,
      currentIndex: unitIndex,
      allItems: fetchedUnits,
    }),
    getPreviousUnit({
      examId: examIdValue,
      examSlug: examSlug,
      subjectId: foundSubject._id,
      subjectSlug: subjectSlugValue,
      unitId: foundUnit._id,
      unitSlug: unitSlugValue,
      currentIndex: unitIndex,
      allItems: fetchedUnits,
    }),
  ]);

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header */}
        <section className="bg-linear-to-b from-purple-50/40 via-white to-purple-50/30 border border-purple-100 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-1.5">
                <FaBook className="text-xl text-indigo-600" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-indigo-900">
                    {unit.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {fetchedExam.name} &gt; {subject.name} &gt; {unit.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <UnitProgressClient unitId={unit._id} initialProgress={0} />
          </div>
        </section>

        {/* Tabs */}
        <TabsClient
          content={unitDetails?.content}
          examId={fetchedExam._id}
          subjectId={subject._id}
          unitId={unit._id}
          entityName={unit.name}
          entityType="unit"
          chapters={fetchedChapters}
          examSlug={examSlug}
          subjectSlug={subjectSlugValue}
          unitSlug={unitSlugValue}
          unitName={unit.name}
        />

        {/* Chapters Section */}
        <ChaptersSectionClient
          chapters={fetchedChapters}
          unitId={unit._id}
          examSlug={examSlug}
          subjectSlug={subjectSlugValue}
          unitSlug={unitSlugValue}
          examName={fetchedExam.name}
          subjectName={subject.name}
          unitName={unit.name}
        />

        {/* Navigation */}
        <NavigationClient
          backUrl={`/${examSlug}/${subjectSlugValue}`}
          backLabel={`Back to ${subject.name}`}
          prevNav={prevNav}
          nextNav={nextNav}
        />

        {/* Unit Completion Tracker */}
        <UnitCompletionTracker unitId={unit._id} unitName={unit.name} />
      </div>
    </MainLayout>
  );
};

export default UnitPage;
