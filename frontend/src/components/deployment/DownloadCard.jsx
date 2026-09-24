import { Download, FileArchive, Github, FileText, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { DEPLOYMENT } from "@/constants/testIds";
import { InstallSteps } from "@/components/deployment/InstallSteps";

const XPI_PATH = "/downloads/orange-confort-plus-5.5.1-android.xpi";

export const DownloadCard = () => {
  const xpiUrl = `${window.location.origin}${XPI_PATH}`;

  return (
    <section id="telechargement" className="bg-confort-ink/[0.03] dark:bg-confort-slate transition-colors">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-confort-ink dark:text-white mb-2">
          Test temporaire sur Firefox Nightly Android
        </h2>
        <p className="text-confort-ink/70 dark:text-white/60 max-w-2xl mb-8">
          Extension non signée à charger manuellement dans Firefox Nightly pour Android.
          Suivez les étapes ci-dessous pour configurer le navigateur puis installer l'extension.
        </p>

        <div
          data-testid={DEPLOYMENT.downloadCard}
          className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-confort-ink p-6 md:p-8 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-confort-orange/10 p-3">
                <FileArchive className="w-6 h-6 text-confort-orange" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-confort-ink dark:text-white m-0">
                  orange-confort-plus-5.5.1-android.xpi
                </p>
                <p className="text-sm text-confort-ink/60 dark:text-white/50 m-0">
                  Version 5.5.1 · ~1,5 Mo · non signée
                </p>
              </div>
            </div>
            <a
              href={XPI_PATH}
              download
              data-testid={DEPLOYMENT.downloadXpiButton}
              className="inline-flex items-center gap-2 rounded-full bg-confort-orange px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-confort-orange-dark"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Télécharger le .xpi
            </a>
          </div>

          {/* QR Code */}
          <div
            data-testid={DEPLOYMENT.qrCodeSection}
            className="mt-6 flex flex-col sm:flex-row items-center gap-5 rounded-xl border border-dashed border-confort-orange/30 dark:border-confort-orange/20 bg-confort-orange/[0.04] dark:bg-confort-orange/[0.06] p-5"
          >
            <div className="shrink-0 rounded-xl bg-white p-3 shadow-sm">
              <QRCodeSVG
                value={xpiUrl}
                size={120}
                level="M"
                fgColor="#0D0D0D"
                bgColor="#FFFFFF"
              />
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <QrCode className="w-4 h-4 text-confort-orange" aria-hidden="true" />
                <p className="text-sm font-semibold text-confort-ink dark:text-white m-0">
                  Télécharger depuis votre téléphone
                </p>
              </div>
              <p className="text-xs text-confort-ink/60 dark:text-white/50 m-0 leading-relaxed max-w-sm">
                Scannez ce QR code avec l'appareil photo de votre téléphone pour télécharger le
                fichier .xpi directement sur votre appareil Android.
              </p>
            </div>
          </div>

          <InstallSteps />

          <div className="mt-6 flex flex-wrap gap-4 border-t border-black/10 dark:border-white/10 pt-5">
            <a
              href="/downloads/ANDROID_FIREFOX.md"
              target="_blank"
              rel="noopener noreferrer"
              data-testid={DEPLOYMENT.downloadGuideLink}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-confort-ink/70 dark:text-white/60 hover:text-confort-orange"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              Guide d'installation complet
            </a>
            <a
              href="https://github.com/Orange-OpenSource/Orange-Confort-plus/tree/develop"
              target="_blank"
              rel="noopener noreferrer"
              data-testid={DEPLOYMENT.downloadGithubLink}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-confort-ink/70 dark:text-white/60 hover:text-confort-orange"
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
