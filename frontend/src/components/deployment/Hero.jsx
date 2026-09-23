import { Smartphone, FlaskConical } from "lucide-react";
import { DEPLOYMENT } from "@/constants/testIds";

const Badge = ({ testId, icon: Icon, children }) => (
  <span
    data-testid={testId}
    className="inline-flex items-center gap-1.5 rounded-full border border-confort-orange/40 bg-white px-3 py-1 text-xs font-semibold text-confort-orange"
  >
    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
    {children}
  </span>
);

export const Hero = () => {
  return (
    <section className="bg-white">
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge testId={DEPLOYMENT.heroBadgeMobile} icon={Smartphone}>
            Extension pour téléphone mobile
          </Badge>
          <Badge testId={DEPLOYMENT.heroBadgeFirefox} icon={Smartphone}>
            Firefox Nightly Android
          </Badge>
          <Badge testId={DEPLOYMENT.heroBadgeExperimental} icon={FlaskConical}>
            Version expérimentale
          </Badge>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] text-confort-ink max-w-3xl">
          Confort<span className="text-confort-orange">+</span>
          <br />
          arrive sur mobile.
        </h1>
        <p className="mt-6 text-base md:text-lg text-confort-ink/70 max-w-2xl leading-relaxed">
          Confort+ facilite la lecture et la navigation sur les pages web : texte plus lisible,
          vocalisation, gros pointeur, boutons multi-clics et modes d'usage. Ce portage adapte la
          palette et le fonctionnement de l'extension pour les petits écrans de Firefox Nightly
          pour Android.
        </p>
        <a
          href="#telechargement"
          data-testid={DEPLOYMENT.heroDownloadCta}
          className="mt-8 inline-flex items-center rounded-full bg-confort-orange px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-confort-orange/30 transition-transform hover:-translate-y-0.5 hover:bg-confort-orange-dark"
        >
          Télécharger le .xpi Android
        </a>
      </div>
    </section>
  );
};
