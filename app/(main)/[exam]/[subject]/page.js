import React from "react";
import { notFound } from "next/navigation";
import MainLayout from "../../layout/MainLayout";
import { FaBook, FaGraduationCap, FaChartLine, FaTrophy } from "react-icons/fa";
import ListItem from "../../components/ListItem";
import TabsClient from "../../components/TabsClient";
import NavigationClient from "../../components/NavigationClient";
import { ERROR_MESSAGES } from "@/constants";
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
      <div className="space-y-6">
        {/* Header */}
        <section className="bg-linear-to-b from-purple-50/40 via-white to-purple-50/30 border border-purple-100 rounded-xl p-5 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-2">
                <FaGraduationCap className="text-2xl text-indigo-600" />
                <h1 className="text-2xl font-bold text-indigo-900">
                  {subject.name}
                </h1>
              </div>
              <p className="text-sm text-gray-600 ml-0 md:ml-11">
                {fetchedExam.name} &gt; {subject.name}
              </p>
            </div>

            {/* Progress */}
            <div className="w-full md:w-auto text-left md:text-right">
              <p className="text-xs text-gray-500 mb-2 md:mb-1 uppercase tracking-wide">
                My Preparation
              </p>
              <div className="flex items-center gap-3 md:justify-end">
                <span className="font-semibold text-gray-700">0%</span>
                <div className="w-full max-w-[160px] h-2 bg-gray-200 rounded-full overflow-hidden">
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
        <section className="bg-transparent">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <div className="flex items-start gap-2">
                <FaBook className="text-lg sm:text-xl text-indigo-600" />
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {fetchedExam.name} &gt; {subject.name} Units
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Review each unit, its weightage, and completion progress.
                  </p>
                </div>
              </div>
              <div className="mt-3 hidden sm:grid sm:grid-cols-[minmax(0,1fr)_140px_180px] gap-6 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <span className="text-left">Unit</span>
                <span className="text-center">Status</span>
                <span className="text-center">Progress</span>
              </div>
            </div>

            {fetchedUnits.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {fetchedUnits.map((unit, index) => {
                  const unitSlug = unit.slug || createSlug(unit.name);
                  return (
                    <ListItem
                      key={unit._id}
                      item={{
                        name: unit.name,
                        weightage: unit.weightage || "20%",
                        engagement: unit.engagement || "2.2K",
                        isCompleted: unit.isCompleted || false,
                        progress: unit.progress || 0,
                      }}
                      index={index}
                      href={`/${examSlug}/${subjectSlugValue}/${unitSlug}`}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="px-4 sm:px-6 py-10 text-center text-gray-500">
                No units available for this subject.
              </div>
            )}
          </div>
        </section>

        {/* Navigation */}
        <NavigationClient
          backUrl={`/${examSlug}`}
          backLabel={`Back to ${fetchedExam.name}`}
          prevNav={prevNav}
          nextNav={nextNav}
        />
      </div>
    </MainLayout>
  );
};

export default SubjectPage;
