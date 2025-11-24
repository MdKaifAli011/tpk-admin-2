import React from "react";
import { notFound } from "next/navigation";
import MainLayout from "../layout/MainLayout";
import { FaGraduationCap } from "react-icons/fa";
import ListItem from "../components/ListItem";
import TabsClient from "../components/TabsClient";
import NavigationClient from "../components/NavigationClient";
import {
  fetchExamById,
  fetchSubjectsByExam,
  createSlug,
  fetchExams,
  fetchExamDetailsById,
} from "../lib/api";
import { ERROR_MESSAGES, PLACEHOLDERS } from "@/constants";
import { getNextExam, getPreviousExam } from "../lib/hierarchicalNavigation";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ExamPage = async ({ params }) => {
  const { exam: examId } = await params;

  // Fetch exam data
  const exam = await fetchExamById(examId);
  if (!exam) {
    notFound();
  }

  // Fetch exam details and subjects in parallel
  const [examDetails, subjects] = await Promise.all([
    fetchExamDetailsById(exam._id).catch(() => ({
      content: "",
      title: "",
      metaDescription: "",
      keywords: "",
    })),
    fetchSubjectsByExam(exam._id || examId),
  ]);

  // Calculate navigation
  const allExams = await fetchExams({ limit: 100 });
  const examIndex = allExams.findIndex((e) => e._id === exam._id);
  const examSlug = createSlug(exam.name);

  const [nextNav, prevNav] = await Promise.all([
    getNextExam({
      examId: exam._id,
      examSlug: examSlug,
      currentIndex: examIndex,
      allItems: allExams,
    }),
    getPreviousExam({
      examId: exam._id,
      examSlug: examSlug,
      currentIndex: examIndex,
      allItems: allExams,
    }),
  ]);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <section className="bg-linear-to-b from-purple-50/40 via-white to-purple-50/30 border border-purple-100 rounded-xl p-5 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-indigo-900">
                {exam.name} Exam Preparation
              </h1>
              <p className="text-sm text-gray-600">
                Prepare with expert guidance and resources for your {exam.name}{" "}
                exam.
              </p>
            </div>

            {/* Progress */}
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">My Preparation</p>
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
          content={examDetails?.content}
          examId={exam._id}
          entityName={exam.name}
          entityType="exam"
        />

        {/* Subjects Section */}
        <section className="bg-transparent">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <div className="flex items-start gap-2">
                <FaGraduationCap className="text-lg sm:text-xl text-indigo-600" />
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {exam.name} Subjects
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Explore subjects and track completion progress for this
                    exam.
                  </p>
                </div>
              </div>
              <div className="mt-3 hidden sm:grid sm:grid-cols-[minmax(0,1fr)_140px_180px] gap-6 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <span className="text-left">Subject</span>
                <span className="text-center">Status</span>
                <span className="text-center">Progress</span>
              </div>
            </div>

            {subjects && subjects.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {subjects.map((subject, index) => {
                  const subjectSlug = subject.slug || createSlug(subject.name);
                  return (
                    <ListItem
                      key={subject._id}
                      item={subject}
                      index={index}
                      href={`/${examSlug}/${subjectSlug}`}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="px-4 sm:px-6 py-10 text-center text-gray-500">
                {PLACEHOLDERS.NO_DATA}
              </div>
            )}
          </div>
        </section>

        {/* Navigation */}
        <NavigationClient
          backUrl="/"
          backLabel="Back to Home"
          prevNav={prevNav}
          nextNav={nextNav}
        />
      </div>
    </MainLayout>
  );
};

export default ExamPage;
