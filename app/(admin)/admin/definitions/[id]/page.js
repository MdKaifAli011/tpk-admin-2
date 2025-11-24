import React from "react";
import MainLayout from "../../../layouts/MainLayout";
import DefinitionDetailPage from "../../../components/features/DefinitionDetailPage";

const DefinitionDetailRoute = async ({ params }) => {
  const { id } = await params;
  return (
    <MainLayout>
      <DefinitionDetailPage definitionId={id} />
    </MainLayout>
  );
};

export default DefinitionDetailRoute;

