import HeroSection from "@/components/landing/HeroSection";
import EcosystemSection from "@/components/landing/EcosystemSection";
import PillarsSection from "@/components/landing/PillarsSection";
import IntegrationSection from "@/components/landing/IntegrationSection";
import ComplianceSection from "@/components/landing/ComplianceSection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <WhatsAppButton />
      <HeroSection />
      <EcosystemSection />
      <PillarsSection />
      <IntegrationSection />
      <ComplianceSection />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Index;
