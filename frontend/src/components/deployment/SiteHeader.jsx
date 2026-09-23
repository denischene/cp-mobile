import { Download, Github } from "lucide-react";
import { DEPLOYMENT } from "@/constants/testIds";

export const SiteHeader = () => {
  return (
    <header className="bg-confort-ink text-white">
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-2 flex justify-end">
          <a
            href="https://www.confort-plus.fr"
            target="_blank"
            rel="noopener noreferrer"
            data-testid={DEPLOYMENT.officialSiteLink}
            className="text-xs text-white/60 hover:text-confort-orange transition-colors"
          >
            confort-plus.fr — site officiel
          </a>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <p className="text-2xl font-extrabold tracking-tight m-0">
          Confort<span className="text-confort-orange">+</span>{" "}
          <span className="text-sm font-medium text-white/50 align-middle">mobile</span>
        </p>
        <nav aria-label="Navigation principale" className="flex items-center gap-5">
          <a
            href="#telechargement"
            data-testid={DEPLOYMENT.downloadNavLink}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-confort-orange transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Téléchargement
          </a>
          <a
            href="https://github.com/Orange-OpenSource/Orange-Confort-plus/tree/develop"
            target="_blank"
            rel="noopener noreferrer"
            data-testid={DEPLOYMENT.githubNavLink}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-confort-orange transition-colors"
          >
            <Github className="w-4 h-4" aria-hidden="true" />
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
};
