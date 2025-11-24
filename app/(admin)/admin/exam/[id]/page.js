import React from "react";
import MainLayout from "../../../layouts/MainLayout";
import ExamDetailPage from "../../../components/features/ExamDetailPage";

const ExamDetailRoute = async ({ params }) => {
  const { id } = await params;
  return (
    <MainLayout>
      <ExamDetailPage examId={id} />
    </MainLayout>
  );
};

export default ExamDetailRoute;
