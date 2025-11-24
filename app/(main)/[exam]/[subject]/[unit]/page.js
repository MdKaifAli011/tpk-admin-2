import React from "react";
import { notFound } from "next/navigation";
import MainLayout from "../../../layout/MainLayout";
import { FaBook } from "react-icons/fa";
import ListItem from "../../../components/ListItem";
import TabsClient from "../../../components/TabsClient";
import NavigationClient from "../../../components/NavigationClient";
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
      <div className="space-y-6">
        {/* Header */}
        <section className="bg-linear-to-b from-purple-50/40 via-white to-purple-50/30 border border-purple-100 rounded-xl p-5 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FaBook className="text-2xl text-indigo-600" />
                <div>
                  <h1 className="text-2xl font-bold text-indigo-900">
                    {unit.name}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {fetchedExam.name} &gt; {subject.name} &gt; {unit.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Unit Progress</p>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-700">0%</span>
                <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: "0%" }}
                  ></div>
                </div>
              </div>
            </div>
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
        <section className="bg-transparent">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <div className="flex items-start gap-2">
                <FaBook className="text-lg sm:text-xl text-indigo-600" />
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {fetchedExam.name} &gt; {subject.name} &gt; {unit.name}{" "}
                    Chapters
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Review your status and progress for each chapter in this
                    unit.
                  </p>
                </div>
              </div>
              <div className="mt-3 hidden sm:grid sm:grid-cols-[minmax(0,1fr)_140px_180px] gap-6 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <span className="text-left">Chapter</span>
                <span className="text-center">Status</span>
                <span className="text-center">Progress</span>
              </div>
            </div>

            {fetchedChapters.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {fetchedChapters.map((chapter, index) => {
                  const chapterSlug = chapter.slug || createSlug(chapter.name);
                  return (
                    <ListItem
                      key={chapter._id}
                      item={{
                        name: chapter.name,
                        weightage: chapter.weightage || "20%",
                        engagement: chapter.engagement || "2.2K",
                        isCompleted: chapter.isCompleted || false,
                        progress: chapter.progress || 0,
                      }}
                      index={index}
                      href={`/${examSlug}/${subjectSlugValue}/${unitSlugValue}/${chapterSlug}`}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="px-4 sm:px-6 py-10 text-center text-gray-500">
                No chapters available for this unit.
              </div>
            )}
          </div>
        </section>

        {/* Navigation */}
        <NavigationClient
          backUrl={`/${examSlug}/${subjectSlugValue}`}
          backLabel={`Back to ${subject.name}`}
          prevNav={prevNav}
          nextNav={nextNav}
        />
      </div>
    </MainLayout>
  );
};

export default UnitPage;
