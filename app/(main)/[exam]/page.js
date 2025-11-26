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
  fetchUnitsBySubject,
} from "../lib/api";
import { ERROR_MESSAGES, PLACEHOLDERS } from "@/constants";
import { getNextExam, getPreviousExam } from "../lib/hierarchicalNavigation";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export const dynamic = "force-dynamic";
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

  // Fetch units for each subject
  const subjectsWithUnits = await Promise.all(
    subjects.map(async (subject) => {
      const units = await fetchUnitsBySubject(subject._id, exam._id).catch(
        () => []
      );
      return {
        ...subject,
        units: units || [],
      };
    })
  );

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
      <div className="space-y-4">
        {/* Header */}
        <section className="bg-linear-to-b from-purple-50/40 via-white to-purple-50/30 border border-purple-100 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-indigo-900 mb-1">
                {exam.name} Exam Preparation
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Prepare with expert guidance and resources for your {exam.name}{" "}
                exam.
              </p>
            </div>

            {/* Progress */}
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1.5">My Preparation</p>
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
          content={examDetails?.content}
          examId={exam._id}
          entityName={exam.name}
          entityType="exam"
          examSlug={examSlug}
          subjectsWithUnits={subjectsWithUnits}
        />

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
