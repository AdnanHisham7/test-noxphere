// src/features/landing/LandingPage.tsx
import React from "react";
import LandingNavbar from "./components/LandingNavbar";
import HeroSection from "./components/HeroSection";
import ProblemSection from "./components/ProblemSection";
import FeaturesSection from "./components/FeaturesSection";
import HowItWorksSection from "./components/HowItWorksSection";
import RolesSection from "./components/RolesSection";
import AnalyticsSection from "./components/AnalyticsSection";
import WhySection from "./components/WhySection";
import PilotSection from "./components/PilotSection";
import FAQSection from "./components/FAQSection";
import FinalCTASection from "./components/FinalCTASection";
import LandingFooter from "./components/LandingFooter";

const LandingPage: React.FC = () => {
  return (
    <div className="nox-landing min-h-screen">
      <LandingNavbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <RolesSection />
        <AnalyticsSection />
        <WhySection />
        <PilotSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
