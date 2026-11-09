import { Suspense, lazy } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import SectionWrapper from "./components/landing/SectionWrapper";

// Lazy‑loaded sections
const Features = lazy(() => import("./components/landing/Features"));
const Pricing = lazy(() => import("./components/Pricing"));
const Testimonials = lazy(() => import("./components/landing/Testimonials"));
const FAQ = lazy(() => import("./components/landing/FAQ"));
const Contact = lazy(() => import("./components/landing/Contact"));

// Skeleton loader with adaptive height
const SectionSkeleton = () => (
  <div className="min-h-96 w-full rounded-2xl bg-gray-200 animate-pulse" />
);

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-radial-top-right from-blue-400/10 to-transparent will-change-transform" />

      <Navbar />

      <main className="relative pt-20">
        <Hero />

        <div className="flex flex-col gap-32 pb-32">
          <SectionWrapper id="features">
            <Suspense fallback={<SectionSkeleton />}>
              <Features />
            </Suspense>
          </SectionWrapper>

          <SectionWrapper id="pricing">
            <Suspense fallback={<SectionSkeleton />}>
              <Pricing />
            </Suspense>
          </SectionWrapper>

          <SectionWrapper id="testimonials">
            <Suspense fallback={<SectionSkeleton />}>
              <Testimonials />
            </Suspense>
          </SectionWrapper>

          <SectionWrapper id="faq">
            <Suspense fallback={<SectionSkeleton />}>
              <FAQ />
            </Suspense>
          </SectionWrapper>

          <SectionWrapper id="contact">
            <Suspense fallback={<SectionSkeleton />}>
              <Contact />
            </Suspense>
          </SectionWrapper>
        </div>
      </main>

      <Footer />
    </div>
  );
}