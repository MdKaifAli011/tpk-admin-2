import React from "react";
import { notFound } from "next/navigation";
import MainLayout from "../../../../../../../layout/MainLayout";
import { FaBookOpen } from "react-icons/fa";
import TabsClient from "../../../../../../../components/TabsClient";
import NavigationClient from "../../../../../../../components/NavigationClient";
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
  fetchDefinitionById,
  createSlug,
  findByIdOrSlug,
  fetchDefinitionDetailsById,
} from "../../../../../../../lib/api";
import {
  getNextDefinition,
  getPreviousDefinition,
} from "../../../../../../../lib/hierarchicalNavigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DefinitionPage = async ({ params }) => {
  const {
    exam: examId,
    subject: subjectSlug,
    unit: unitSlug,
    chapter: chapterSlug,
    topic: topicSlug,
    subtopic: subtopicSlug,
    definition: definitionSlug,
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

  // Fetch full subtopic data
  const fullSubTopicData = await fetchSubTopicById(foundSubTopic._id);
  const subTopic = fullSubTopicData || foundSubTopic;

  // Fetch definitions for this subtopic
  const fetchedDefinitions = await fetchDefinitionsBySubTopic(foundSubTopic._id).catch(() => []);

  // Find definition by slug
  const foundDefinition = findByIdOrSlug(fetchedDefinitions, definitionSlug);
  if (!foundDefinition) {
    notFound();
  }

  // Fetch full definition data and details in parallel
  const [fullDefinitionData, definitionDetails] = await Promise.all([
    fetchDefinitionById(foundDefinition._id),
    fetchDefinitionDetailsById(foundDefinition._id).catch(() => ({
      content: "",
      title: "",
      metaDescription: "",
      keywords: "",
    })),
  ]);

  const definition = fullDefinitionData || foundDefinition;

  // Find current definition index for navigation
  const index = fetchedDefinitions.findIndex(
    (def) =>
      def._id === foundDefinition._id ||
      createSlug(def.name) === definitionSlug ||
      def.name?.toLowerCase() === definitionSlug.toLowerCase()
  );

  const examSlug = createSlug(fetchedExam.name);
  const subjectSlugValue = subject.slug || createSlug(subject.name);
  const unitSlugValue = unit.slug || createSlug(unit.name);
  const chapterSlugValue = chapter.slug || createSlug(chapter.name);
  const topicSlugValue = topic.slug || createSlug(topic.name);
  const subTopicSlugValue = subTopic.slug || createSlug(subTopic.name);

  // Calculate hierarchical navigation
  const [nextNav, prevNav] = await Promise.all([
    getNextDefinition({
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
      allItems: fetchedDefinitions,
    }),
    getPreviousDefinition({
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
      allItems: fetchedDefinitions,
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
                <FaBookOpen className="text-2xl text-indigo-600" />
                <div>
                  <h1 className="text-2xl font-bold text-indigo-900">
                    {definition.name}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {fetchedExam.name} &gt; {subject.name} &gt; {unit.name} &gt;{" "}
                    {chapter.name} &gt; {topic.name} &gt; {subTopic.name} &gt; {definition.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Definition Progress</p>
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
          content={definitionDetails?.content}
          examId={fetchedExam._id}
          subjectId={subject._id}
          unitId={unit._id}
          chapterId={chapter._id}
          topicId={topic._id}
          subTopicId={subTopic._id}
          entityName={definition.name}
          entityType="definition"
          definitions={fetchedDefinitions}
          currentDefinitionId={definition._id}
          examSlug={examSlug}
          subjectSlug={subjectSlugValue}
          unitSlug={unitSlugValue}
          chapterSlug={chapterSlugValue}
          topicSlug={topicSlugValue}
          subTopicSlug={subTopicSlugValue}
        />

        {/* Navigation */}
        <NavigationClient
          backUrl={`/${examSlug}/${subjectSlugValue}/${unitSlugValue}/${chapterSlugValue}/${topicSlugValue}/${subTopicSlugValue}`}
          backLabel={`Back to ${subTopic.name}`}
          prevNav={prevNav}
          nextNav={nextNav}
        />
      </div>
    </MainLayout>
  );
};

export default DefinitionPage;

