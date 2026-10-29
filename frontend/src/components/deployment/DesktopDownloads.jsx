import { Download, FileArchive, Monitor, Chrome } from "lucide-react";

const BASE = process.env.PUBLIC_URL || "";

const PACKAGES = [
  {
    id: "firefox-pc",
    icon: Monitor,
    title: "Firefox pour ordinateur",
    file: "orange-confort-plus-6.0.0.1-firefox.xpi",
    detail: "Fichier .xpi · ~1,6 Mo · non signé",
    help: "Ouvrez about:debugging, puis « Ce Firefox », puis « Charger un module temporaire », et sélectionnez le fichier .xpi.",
    label: "Télécharger le .xpi Firefox",
  },
  {
    id: "chrome-edge",
    icon: Chrome,
    title: "Chrome et Edge pour ordinateur",
    file: "orange-confort-plus-6.0.0.1-chrome-edge.zip",
    detail: "Archive .zip · ~1,6 Mo · à décompresser",
    help: "Décompressez l'archive, puis dans chrome://extensions (ou edge://extensions) activez le mode développeur et cliquez sur « Charger l'extension non empaquetée ».",
    label: "Télécharger le .zip",
  },
];

export const DesktopDownloads = () => {
  return (
    <section
      id="ordinateur"
      data-testid="desktop-downloads-section"
      className="bg-white dark:bg-confort-ink transition-colors"
    >
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-confort-ink dark:text-white mb-2">
          Et sur ordinateur
        </h2>
        <p className="text-confort-ink/85 dark:text-white max-w-2xl mb-8">
          Les mêmes fonctions, loupes comprises, pour tester Confort+ sur un poste de travail.
          Ces paquets ne sont pas signés&nbsp;: ils se chargent manuellement, le temps d'une session
          de test.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          {PACKAGES.map(({ id, icon: Icon, title, file, detail, help, label }) => (
            <div
              key={id}
              data-testid={`desktop-package-${id}`}
              className="flex flex-col rounded-2xl border border-black/10 dark:border-confort-orange bg-confort-ink/[0.03] dark:bg-confort-ink p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-confort-orange/10 p-3">
                  <Icon className="w-6 h-6 text-confort-orange" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-confort-ink dark:text-white m-0">{title}</p>
                  <p className="text-sm text-confort-ink/85 dark:text-white/70 m-0">{detail}</p>
                </div>
              </div>

              <p className="text-sm text-confort-ink/85 dark:text-white leading-relaxed mb-5">
                {help}
              </p>

              <div className="mt-auto flex flex-wrap items-center gap-3">
                <a
                  href={`${BASE}/downloads/${file}`}
                  download
                  data-testid={`desktop-download-${id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-confort-orange px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-confort-orange-dark"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  {label}
                </a>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-confort-ink/85 dark:text-white/70">
                  <FileArchive className="w-3.5 h-3.5" aria-hidden="true" />
                  {file}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
