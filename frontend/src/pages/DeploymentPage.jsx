import { SiteHeader } from "@/components/deployment/SiteHeader";
import { ExperimentalBanner } from "@/components/deployment/ExperimentalBanner";
import { Hero } from "@/components/deployment/Hero";
import { DownloadCard } from "@/components/deployment/DownloadCard";
import { ServerVersionInfo } from "@/components/deployment/ServerVersionInfo";
import { SiteFooter } from "@/components/deployment/SiteFooter";
import { ThemeProvider } from "@/components/deployment/ThemeProvider";

export default function DeploymentPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-confort-ink transition-colors" data-testid="deployment-page">
        <SiteHeader />
        <ExperimentalBanner />
        <Hero />
        <DownloadCard />
        <ServerVersionInfo />
        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}
