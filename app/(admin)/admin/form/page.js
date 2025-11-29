import FormManagement from "../../components/features/FormManagement";
import MainLayout from "../../layouts/MainLayout";

export const metadata = {
  title: "Form Management | Admin Panel",
  description: "Create and manage dynamic forms",
};

export default function FormManagementPage() {
  return (  
  <MainLayout>
  <FormManagement />
  </MainLayout >
)
};

