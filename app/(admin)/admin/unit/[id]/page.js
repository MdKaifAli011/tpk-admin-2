import React from "react";
import MainLayout from "../../../layouts/MainLayout";
import UnitDetailPage from "../../../components/features/UnitDetailPage";

const UnitDetailRoute = async ({ params }) => {
  const { id } = await params;
  return (
    <MainLayout>
      <UnitDetailPage unitId={id} />
    </MainLayout>
  );
};

export default UnitDetailRoute;

