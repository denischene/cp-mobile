import { Usb, ShieldCheck } from "lucide-react";

const Step = ({ icon: Icon, title, items }) => (
  <div className="rounded-xl border border-black/10 p-5">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-confort-orange" aria-hidden="true" />
      <h4 className="text-sm font-semibold text-confort-ink m-0">{title}</h4>
    </div>
    <ol className="space-y-2 text-sm text-confort-ink/70 list-decimal list-inside">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  </div>
);

export const InstallSteps = () => {
  return (
    <div className="grid sm:grid-cols-2 gap-4 mt-6">
      <Step
        icon={Usb}
        title="Test temporaire (USB, recommandé)"
        items={[
          "Activez le débogage USB : Paramètres Firefox → À propos de Firefox → tapez 5× sur le logo.",
          "Branchez le téléphone au PC et vérifiez avec adb devices.",
          "Lancez : web-ext run -t firefox-android --firefox-apk org.mozilla.fenix",
        ]}
      />
      <Step
        icon={ShieldCheck}
        title="Installation permanente (signée AMO)"
        items={[
          "Créez des clés API sur addons.mozilla.org/developers/addon/api/key.",
          "Signez le .xpi : web-ext sign --channel=unlisted.",
          "Sur le téléphone : menu développeur → « Installer une extension à partir d'un fichier ».",
        ]}
      />
    </div>
  );
};
