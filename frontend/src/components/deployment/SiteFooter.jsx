import { Github } from "lucide-react";
import { DEPLOYMENT } from "@/constants/testIds";

export const SiteFooter = () => {
  return (
    <footer className="bg-confort-ink text-white/70">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm m-0 max-w-md">
          Adaptation expérimentale et communautaire, non officielle, du projet open-source{" "}
          <span className="text-white">Orange Confort+</span> pour Firefox Nightly Android.
        </p>
        <div className="flex gap-5">
          <a
            href="https://www.confort-plus.fr"
            target="_blank"
            rel="noopener noreferrer"
            data-testid={DEPLOYMENT.footerOfficialSiteLink}
            className="text-sm font-medium hover:text-confort-orange transition-colors"
          >
            Site officiel
          </a>
          <a
            href="https://github.com/Orange-OpenSource/Orange-Confort-plus/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid={DEPLOYMENT.footerGithubLink}
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-confort-orange transition-colors"
          >
            <Github className="w-4 h-4" aria-hidden="true" />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};
