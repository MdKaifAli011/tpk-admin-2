import React from "react";
import MainLayout from "../../../layouts/MainLayout";
import TopicDetailPage from "../../../components/features/TopicDetailPage";

const TopicDetailRoute = async ({ params }) => {
  const { id } = await params;
  return (
    <MainLayout>
      <TopicDetailPage topicId={id} />
    </MainLayout>
  );
};

export default TopicDetailRoute;

