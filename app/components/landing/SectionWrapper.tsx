import React from "react";

interface SectionWrapperProps {
  children: React.ReactNode;
  id?: string;
  className?: string; // إضافة مرونة للتنسيق
}

export default function SectionWrapper({ children, id, className = "" }: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={`container mx-auto px-6 scroll-mt-24 ${className}`}
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 500px" }}
    >
      {children}
    </section>
  );
}