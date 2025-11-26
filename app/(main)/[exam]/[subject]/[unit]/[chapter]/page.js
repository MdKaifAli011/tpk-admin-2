import React from "react";
import { notFound } from "next/navigation";
import MainLayout from "../../../../layout/MainLayout";
import { FaBook } from "react-icons/fa";
import ListItem from "../../../../components/ListItem";
import TabsClient from "../../../../components/TabsClient";
import NavigationClient from "../../../../components/NavigationClient";
import { ERROR_MESSAGES } from "@/constants";
import {
  fetchExamById,
  fetchSubjectsByExam,
  fetchSubjectById,
  fetchUnitsBySubject,
  fetchUnitById,
  fetchChaptersByUnit,
  fetchChapterById,
  fetchTopicsByChapter,
  createSlug,
  findByIdOrSlug,
  fetchChapterDetailsById,
} from "../../../../lib/api";
import {
  getNextChapter,
  getPreviousChapter,
} from "../../../../lib/hierarchicalNavigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ChapterPage = async ({ params }) => {
  const {
    exam: examId,
    subject: subjectSlug,
    unit: unitSlug,
    chapter: chapterSlug,
  } = await params;

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

  // Fetch full unit data
  const fullUnitData = await fetchUnitById(foundUnit._id);
  const unit = fullUnitData || foundUnit;

  // Fetch chapters for this unit
  const fetchedChapters = await fetchChaptersByUnit(foundUnit._id);

  // Find chapter by slug
  const foundChapter = findByIdOrSlug(fetchedChapters, chapterSlug);
  if (!foundChapter) {
    notFound();
  }

  // Fetch full chapter data, details, and topics in parallel
  const [fullChapterData, chapterDetails, fetchedTopics] = await Promise.all([
    fetchChapterById(foundChapter._id),
    fetchChapterDetailsById(foundChapter._id).catch(() => ({
      content: "",
      title: "",
      metaDescription: "",
      keywords: "",
    })),
    fetchTopicsByChapter(foundChapter._id),
  ]);

  const chapter = fullChapterData || foundChapter;

  // Find current chapter index for navigation
  const chapterIndex = fetchedChapters.findIndex(
    (c) =>
      c._id === foundChapter._id ||
      createSlug(c.name) === chapterSlug ||
      c.name?.toLowerCase() === chapterSlug.toLowerCase()
  );

  const examSlug = createSlug(fetchedExam.name);
  const subjectSlugValue = subject.slug || createSlug(subject.name);
  const unitSlugValue = unit.slug || createSlug(unit.name);
  const chapterSlugValue = chapter.slug || createSlug(chapter.name);

  // Calculate hierarchical navigation
  const [nextNav, prevNav] = await Promise.all([
    getNextChapter({
      examId: examIdValue,
      examSlug: examSlug,
      subjectId: foundSubject._id,
      subjectSlug: subjectSlugValue,
      unitId: foundUnit._id,
      unitSlug: unitSlugValue,
      chapterId: foundChapter._id,
      chapterSlug: chapterSlugValue,
      currentIndex: chapterIndex,
      allItems: fetchedChapters,
    }),
    getPreviousChapter({
      examId: examIdValue,
      examSlug: examSlug,
      subjectId: foundSubject._id,
      subjectSlug: subjectSlugValue,
      unitId: foundUnit._id,
      unitSlug: unitSlugValue,
      chapterId: foundChapter._id,
      chapterSlug: chapterSlugValue,
      currentIndex: chapterIndex,
      allItems: fetchedChapters,
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
                    {chapter.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {fetchedExam.name} &gt; {subject.name} &gt; {unit.name} &gt;{" "}
                    {chapter.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1.5">Chapter Progress</p>
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-sm text-gray-700">0%</span>
                <div className="w-24 sm:w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
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
          content={chapterDetails?.content}
          examId={fetchedExam._id}
          subjectId={subject._id}
          unitId={unit._id}
          chapterId={chapter._id}
          entityName={chapter.name}
          entityType="chapter"
          topics={fetchedTopics}
          examSlug={examSlug}
          subjectSlug={subjectSlugValue}
          unitSlug={unitSlugValue}
          chapterSlug={chapterSlugValue}
        />

        {/* Topics Section */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <FaBook className="text-xl text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {fetchedExam.name} &gt; {subject.name} &gt; {unit.name} &gt;{" "}
              {chapter.name} Topics
            </h2>
          </div>

          <div className="space-y-3">
            {fetchedTopics.length > 0 ? (
              fetchedTopics.map((topic, index) => {
                const topicSlug = topic.slug || createSlug(topic.name);
                return (
                  <ListItem
                    key={topic._id || index}
                    item={{
                      name: topic.name,
                      weightage: topic.weightage || "20%",
                      engagement: topic.engagement || "2.2K",
                      isCompleted: topic.isCompleted || false,
                      progress: topic.progress || 0,
                    }}
                    index={index}
                    href={`/${examSlug}/${subjectSlugValue}/${unitSlugValue}/${chapterSlugValue}/${topicSlug}`}
                  />
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No topics available for this chapter.
              </div>
            )}
          </div>
        </section>

        {/* Navigation */}
        <NavigationClient
          backUrl={`/${examSlug}/${subjectSlugValue}/${unitSlugValue}`}
          backLabel={`Back to ${unit.name}`}
          prevNav={prevNav}
          nextNav={nextNav}
        />
      </div>
    </MainLayout>
  );
};

export default ChapterPage;
