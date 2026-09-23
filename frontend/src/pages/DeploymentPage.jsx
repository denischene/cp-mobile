import { SiteHeader } from "@/components/deployment/SiteHeader";
import { ExperimentalBanner } from "@/components/deployment/ExperimentalBanner";
import { Hero } from "@/components/deployment/Hero";
import { DownloadCard } from "@/components/deployment/DownloadCard";
import { ServerVersionInfo } from "@/components/deployment/ServerVersionInfo";
import { SiteFooter } from "@/components/deployment/SiteFooter";

export default function DeploymentPage() {
  return (
    <div className="min-h-screen bg-white" data-testid="deployment-page">
      <SiteHeader />
      <ExperimentalBanner />
      <Hero />
      <DownloadCard />
      <ServerVersionInfo />
      <SiteFooter />
    </div>
  );
}
