import { AlertTriangle } from "lucide-react";
import { DEPLOYMENT } from "@/constants/testIds";

export const ExperimentalBanner = () => {
  return (
    <div
      data-testid={DEPLOYMENT.experimentalBanner}
      className="border-y border-confort-orange/30 bg-confort-orange/10 dark:bg-confort-ink dark:border-t-4 dark:border-t-confort-orange dark:border-b-confort-orange/30"
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-confort-orange shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-confort-ink/80 dark:text-white leading-relaxed">
          <span className="font-semibold text-confort-ink dark:text-white">Portage expérimental non officiel.</span>{" "}
          Cette adaptation mobile de Confort+ n'est pas distribuée par Orange ni sur les stores
          officiels. Elle est fournie pour test technique sur Firefox Nightly Android uniquement.
          Utilisez-la à vos risques et partagez vos retours via{" "}
          <a
            href="https://github.com/Orange-OpenSource/Orange-Confort-plus/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium hover:text-confort-orange dark:text-confort-orange"
          >
            les issues GitHub du projet
          </a>
          .
        </p>
      </div>
    </div>
  );
};
