import { MonitorSmartphone, Code2 } from "lucide-react";
import { DEPLOYMENT } from "@/constants/testIds";

export const ServerVersionInfo = () => {
  return (
    <section data-testid={DEPLOYMENT.serverVersionSection} className="bg-white">
      <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <MonitorSmartphone className="w-5 h-5 text-confort-orange" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-confort-ink m-0">
              La « version serveur », active ici même
            </h2>
          </div>
          <p className="text-confort-ink/70 leading-relaxed">
            Confort+ ne fonctionne pas uniquement comme extension de navigateur. Un site peut
            aussi l'intégrer directement, sans installation, via un simple script hébergé. C'est
            le cas sur cette page&nbsp;: la pastille d'accessibilité affichée à l'écran vient de
            ce script, exactement comme sur{" "}
            <a
              href="https://www.confort-plus.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium hover:text-confort-orange"
            >
              confort-plus.fr
            </a>
            . Ouvrez la palette pour retrouver les mêmes modes d'usage et boutons multi-clics que
            dans l'extension mobile.
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-confort-ink/[0.03] p-6 min-w-0">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-confort-ink">
            <Code2 className="w-4 h-4 text-confort-orange" aria-hidden="true" />
            Intégration développeur
          </div>
          <pre className="text-xs bg-confort-ink text-white/90 rounded-lg p-4 overflow-x-auto max-w-full">
            <code className="whitespace-pre-wrap break-all">{`<script src="https://votre-site.fr/js/toolbar.min.js">\n</script>`}</code>
          </pre>
          <p className="text-sm text-confort-ink/60 mt-3">
            Une ligne suffit pour proposer Confort+ à tous les visiteurs de votre site, mobile
            compris — sans passer par une extension.
          </p>
        </div>
      </div>
    </section>
  );
};
