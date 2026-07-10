import { Hero } from "@/components/Hero";
import { ProblemSection } from "@/components/ProblemSection";
import { SolutionSection } from "@/components/SolutionSection";
import { ReadinessAssessment } from "@/components/ReadinessAssessment";
import { FrameworkSection } from "@/components/FrameworkSection";
import { IndustryUseCases } from "@/components/IndustryUseCases";
import { ReportPreview } from "@/components/ReportPreview";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PricingSection } from "@/components/PricingSection";
import { CaseStudies } from "@/components/CaseStudies";
import { ResearchSection } from "@/components/ResearchSection";
import { FounderSection } from "@/components/FounderSection";
import { FAQ } from "@/components/FAQ";
import { ContactSection } from "@/components/ContactSection";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <ErrorBoundary label="the assessment">
        <ReadinessAssessment />
      </ErrorBoundary>
      <FrameworkSection />
      <IndustryUseCases />
      <ReportPreview />
      <FeaturesSection />
      <PricingSection />
      <CaseStudies />
      <ResearchSection />
      <FounderSection />
      <FAQ />
      <ErrorBoundary label="the contact form">
        <ContactSection />
      </ErrorBoundary>
    </>
  );
}
