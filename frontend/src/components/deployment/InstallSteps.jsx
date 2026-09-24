import { Settings, Upload } from "lucide-react";

const StepSection = ({ icon: Icon, label, title, subtitle, items }) => (
  <div className="rounded-xl border border-black/10 dark:border-white/10 p-5">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-confort-orange shrink-0" aria-hidden="true" />
      <h4 className="text-sm font-semibold text-confort-ink dark:text-white m-0">
        <span className="text-confort-orange mr-1">{label}</span>
        {title}
      </h4>
    </div>
    {subtitle && (
      <p className="text-xs text-confort-ink/50 dark:text-white/40 mb-3 ml-6 italic">{subtitle}</p>
    )}
    <ol className="space-y-2 text-sm text-confort-ink/70 dark:text-white/60 list-decimal list-inside">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  </div>
);

export const InstallSteps = () => {
  return (
    <div className="grid sm:grid-cols-2 gap-4 mt-6" data-testid="install-steps">
      <StepSection
        icon={Settings}
        label="A."
        title="Installer et configurer le navigateur"
        subtitle="à ne faire qu'une fois"
        items={[
          "Télécharger et lancer « Firefox Nightly ».",
          <>Accéder à la page <code className="bg-black/5 dark:bg-white/10 px-1 rounded text-xs">about:config</code> en tapant <code className="bg-black/5 dark:bg-white/10 px-1 rounded text-xs">about:config</code> dans la barre d'adresse.</>,
          "Cliquer sur « Accepter le risque et continuer ».",
          <>Taper <code className="bg-black/5 dark:bg-white/10 px-1 rounded text-xs">xpinstall.signatures.required</code> dans « Rechercher ».</>,
          <>Double-cliquez dessus pour le mettre à <strong className="dark:text-white">false</strong>. <span className="block text-xs text-confort-ink/50 dark:text-white/40 mt-1">(Cela désactive la vérification des signatures pour les extensions, permettant d'installer des extensions non signées.)</span></>,
        ]}
      />
      <StepSection
        icon={Upload}
        label="B."
        title="Charger l'extension temporaire"
        subtitle="à faire à chaque fois"
        items={[
          "Télécharger le fichier xpi.",
          "Lancer Firefox Nightly.",
          "Ouvrir le menu (trois petits points en haut à droite) puis Paramètres puis tout en bas « À propos de Firefox Nightly » et cliquer 5 fois sur le logo (pour activer le menu secret de dev).",
          "Dans « Paramètres », cliquer sur « Installer une extension depuis un fichier ». Pointer le fichier xpi.",
          "Activer l'extension dans « Paramètres / Extensions ».",
        ]}
      />
    </div>
  );
};
