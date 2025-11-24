import React from "react";
import MainLayout from "../../../layouts/MainLayout";
import ChapterDetailPage from "../../../components/features/ChapterDetailPage";

const ChapterDetailRoute = async ({ params }) => {
  // ChapterDetailPage uses useParams() hook internally, so params is not needed here
  // But we still need to await params to make this route compatible
  await params;
  return (
    <MainLayout>
      <ChapterDetailPage />
    </MainLayout>
  );
};

export default ChapterDetailRoute;

