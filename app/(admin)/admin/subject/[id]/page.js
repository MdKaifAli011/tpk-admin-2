import React from "react";
import MainLayout from "../../../layouts/MainLayout";
import SubjectDetailPage from "../../../components/features/SubjectDetailPage";

const SubjectDetailRoute = async ({ params }) => {
  const { id } = await params;
  return (
    <MainLayout>
      <SubjectDetailPage subjectId={id} />
    </MainLayout>
  );
};

export default SubjectDetailRoute;

