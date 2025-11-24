import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import MainLayout from "../../../../../../layout/MainLayout";
import {
  FaFileAlt,
} from "react-icons/fa";
import TabsClient from "../../../../../../components/TabsClient";
import NavigationClient from "../../../../../../components/NavigationClient";
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
  fetchTopicById,
  fetchSubTopicsByTopic,
  fetchSubTopicById,
  fetchDefinitionsBySubTopic,
  createSlug,
  findByIdOrSlug,
  fetchSubTopicDetailsById,
} from "../../../../../../lib/api";
import {
  getNextSubtopic,
  getPreviousSubtopic,
} from "../../../../../../lib/hierarchicalNavigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SubTopicPage = async ({ params }) => {
  const {
    exam: examId,
    subject: subjectSlug,
    unit: unitSlug,
    chapter: chapterSlug,
    topic: topicSlug,
    subtopic: subtopicSlug,
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
  const fetchedUnits = await fetchUnitsBySubject(
    foundSubject._id,
    examIdValue
  );

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

  // Fetch full chapter data
  const fullChapterData = await fetchChapterById(foundChapter._id);
  const chapter = fullChapterData || foundChapter;

  // Fetch topics for this chapter
  const fetchedTopics = await fetchTopicsByChapter(foundChapter._id);

  // Find topic by slug
  const foundTopic = findByIdOrSlug(fetchedTopics, topicSlug);
  if (!foundTopic) {
    notFound();
  }

  // Fetch full topic data
  const fullTopicData = await fetchTopicById(foundTopic._id);
  const topic = fullTopicData || foundTopic;

  // Fetch subtopics for this topic
  const fetchedSubTopics = await fetchSubTopicsByTopic(foundTopic._id);

  // Find subtopic by slug
  const foundSubTopic = findByIdOrSlug(fetchedSubTopics, subtopicSlug);
  if (!foundSubTopic) {
    notFound();
  }

  // Fetch full subtopic data, details, and definitions in parallel
  const [fullSubTopicData, subTopicDetails, fetchedDefinitions] = await Promise.all([
    fetchSubTopicById(foundSubTopic._id),
    fetchSubTopicDetailsById(foundSubTopic._id).catch(() => ({
      content: "",
      title: "",
      metaDescription: "",
      keywords: "",
    })),
    fetchDefinitionsBySubTopic(foundSubTopic._id).catch(() => []),
  ]);

  const subTopic = fullSubTopicData || foundSubTopic;

  // Find current subtopic index for navigation
  const index = fetchedSubTopics.findIndex(
    (st) =>
      st._id === foundSubTopic._id ||
      createSlug(st.name) === subtopicSlug ||
      st.name?.toLowerCase() === subtopicSlug.toLowerCase()
  );

  const examSlug = createSlug(fetchedExam.name);
  const subjectSlugValue = subject.slug || createSlug(subject.name);
  const unitSlugValue = unit.slug || createSlug(unit.name);
  const chapterSlugValue = chapter.slug || createSlug(chapter.name);
  const topicSlugValue = topic.slug || createSlug(topic.name);
  const subTopicSlugValue = subTopic.slug || createSlug(subTopic.name);

  // Calculate hierarchical navigation
  const [nextNav, prevNav] = await Promise.all([
    getNextSubtopic({
      examId: examIdValue,
      examSlug: examSlug,
      subjectId: foundSubject._id,
      subjectSlug: subjectSlugValue,
      unitId: foundUnit._id,
      unitSlug: unitSlugValue,
      chapterId: foundChapter._id,
      chapterSlug: chapterSlugValue,
      topicId: foundTopic._id,
      topicSlug: topicSlugValue,
      subTopicId: foundSubTopic._id,
      subTopicSlug: subTopicSlugValue,
      currentIndex: index,
      allItems: fetchedSubTopics,
    }),
    getPreviousSubtopic({
      examId: examIdValue,
      examSlug: examSlug,
      subjectId: foundSubject._id,
      subjectSlug: subjectSlugValue,
      unitId: foundUnit._id,
      unitSlug: unitSlugValue,
      chapterId: foundChapter._id,
      chapterSlug: chapterSlugValue,
      topicId: foundTopic._id,
      topicSlug: topicSlugValue,
      subTopicId: foundSubTopic._id,
      subTopicSlug: subTopicSlugValue,
      currentIndex: index,
      allItems: fetchedSubTopics,
    }),
  ]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <section className="bg-linear-to-b from-purple-50/40 via-white to-purple-50/30 border border-purple-100 rounded-xl p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FaFileAlt className="text-2xl text-indigo-600" />
                <div>
                  <h1 className="text-2xl font-bold text-indigo-900">
                    {subTopic.name}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {fetchedExam.name} &gt; {subject.name} &gt; {unit.name} &gt;{" "}
                    {chapter.name} &gt; {topic.name} &gt; {subTopic.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Sub Topic Progress</p>
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
          content={subTopicDetails?.content}
          examId={fetchedExam._id}
          subjectId={subject._id}
          unitId={unit._id}
          chapterId={chapter._id}
          topicId={topic._id}
          subTopicId={subTopic._id}
          entityName={subTopic.name}
          entityType="subtopic"
          definitions={fetchedDefinitions}
        />

        {/* Definitions Section */}
        {fetchedDefinitions && fetchedDefinitions.length > 0 && (
          <section className="bg-transparent">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                <div className="flex items-start gap-2">
                  <FaFileAlt className="text-lg sm:text-xl text-indigo-600" />
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                      Definitions
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                      Explore definitions related to this subtopic.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {fetchedDefinitions.map((definition, index) => {
                  const definitionSlug = definition.slug || createSlug(definition.name);
                  return (
                    <a
                      key={definition._id}
                      href={`/${examSlug}/${subjectSlugValue}/${unitSlugValue}/${chapterSlugValue}/${topicSlugValue}/${subTopicSlugValue}/${definitionSlug}`}
                      className="block px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                            {definition.name}
                          </h3>
                          {definition.orderNumber && (
                            <p className="text-xs text-gray-500 mt-1">
                              Order: {definition.orderNumber}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <span className="text-xs text-gray-400">→</span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Navigation */}
        <NavigationClient
          backUrl={`/${examSlug}/${subjectSlugValue}/${unitSlugValue}/${chapterSlugValue}/${topicSlugValue}`}
          backLabel={`Back to ${topic.name}`}
          prevNav={prevNav}
          nextNav={nextNav}
        />
      </div>
    </MainLayout>
  );
};

export default SubTopicPage;
