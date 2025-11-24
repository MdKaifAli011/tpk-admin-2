"use client";
import React from "react";
import MainLayout from "../layout/MainLayout";
import ContactForm from "../components/ContactForm";

const ContactPage = () => {
  return (
    <MainLayout showSidebar={false}>
      <ContactForm />
    </MainLayout>
  );
};

export default ContactPage;
