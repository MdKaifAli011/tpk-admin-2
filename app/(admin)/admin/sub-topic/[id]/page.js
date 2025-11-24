import React from "react";
import MainLayout from "../../../layouts/MainLayout";
import SubTopicDetailPage from "../../../components/features/SubTopicDetailPage";

const SubTopicDetailRoute = async ({ params }) => {
  const { id } = await params;
  return (
    <MainLayout>
      <SubTopicDetailPage subTopicId={id} />
    </MainLayout>
  );
};

export default SubTopicDetailRoute;

