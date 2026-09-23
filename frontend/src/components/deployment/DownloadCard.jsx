import { Download, FileArchive, Github, FileText } from "lucide-react";
import { DEPLOYMENT } from "@/constants/testIds";
import { InstallSteps } from "@/components/deployment/InstallSteps";

export const DownloadCard = () => {
  return (
    <section id="telechargement" className="bg-confort-ink/[0.03]">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-confort-ink mb-2">Téléchargement de l'extension</h2>
        <p className="text-confort-ink/70 max-w-2xl mb-8">
          Paquet non signé, destiné aux tests sur appareil réel via débogage USB ou après
          signature AMO. Firefox Android n'installe de façon permanente que les extensions
          signées par Mozilla.
        </p>

        <div
          data-testid={DEPLOYMENT.downloadCard}
          className="rounded-2xl border border-black/10 bg-white p-6 md:p-8 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-confort-orange/10 p-3">
                <FileArchive className="w-6 h-6 text-confort-orange" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-confort-ink m-0">
                  orange-confort-plus-5.5.1-android.xpi
                </p>
                <p className="text-sm text-confort-ink/60 m-0">Version 5.5.1 · ~1,5 Mo · non signée</p>
              </div>
            </div>
            <a
              href="/downloads/orange-confort-plus-5.5.1-android.xpi"
              download
              data-testid={DEPLOYMENT.downloadXpiButton}
              className="inline-flex items-center gap-2 rounded-full bg-confort-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-confort-orange-dark"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Télécharger le .xpi
            </a>
          </div>

          <InstallSteps />

          <div className="mt-6 flex flex-wrap gap-4 border-t border-black/10 pt-5">
            <a
              href="/downloads/ANDROID_FIREFOX.md"
              target="_blank"
              rel="noopener noreferrer"
              data-testid={DEPLOYMENT.downloadGuideLink}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-confort-ink/70 hover:text-confort-orange"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              Guide d'installation complet
            </a>
            <a
              href="https://github.com/Orange-OpenSource/Orange-Confort-plus/tree/develop"
              target="_blank"
              rel="noopener noreferrer"
              data-testid={DEPLOYMENT.downloadGithubLink}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-confort-ink/70 hover:text-confort-orange"
            >
              <Github className="w-4 h-4" aria-hidden="true" />
              Code source (branche develop)
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
