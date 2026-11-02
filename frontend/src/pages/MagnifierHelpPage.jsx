import { Link } from "react-router-dom";
import { ArrowLeft, MousePointer2, ScanSearch, Maximize2, Keyboard, Smartphone } from "lucide-react";
import { ThemeProvider } from "@/components/deployment/ThemeProvider";
import { SiteHeader } from "@/components/deployment/SiteHeader";
import { SiteFooter } from "@/components/deployment/SiteFooter";

const MAGNIFIERS = [
  {
    id: "souris",
    icon: MousePointer2,
    name: "Loupe souris",
    levels: "×2 à ×4",
    what: "Une bulle ronde suit le pointeur, ou le doigt sur mobile, et agrandit ce qui se trouve dessous.",
    when: "Pour relire ponctuellement un petit texte, un prix, une mention légale.",
  },
  {
    id: "focus",
    icon: ScanSearch,
    name: "Focus-loupe",
    levels: "×2 à ×9",
    what: "Deux temps. D'abord le focus se promène dans la page sans grossir, repéré par une petite loupe dans son coin : la tabulation le déplace. Un clic, un tap ou Entrée grossit l'élément visé ; Échap., le clic droit ou le bouton Retour reviennent au premier temps. La fenêtre épouse l'objet : juste un mot, ou toute la largeur pour une phrase, et plus haute pour deux ou trois lignes.",
    when: "Pour naviguer au clavier sans perdre le fil du focus.",
  },
  {
    id: "agrandisseur",
    icon: Maximize2,
    name: "Agrandisseur",
    levels: "×8 à ×20",
    what: "Tout l'écran est agrandi. On se déplace à la souris, aux flèches ou au doigt, et la page défile en atteignant un bord. Une bande rouge épaisse signale le bout de la page.",
    when: "Pour un grossissement fort et permanent.",
  },
];

const SHORTCUTS = [
  ["Ctrl + Maj + Z", "Allume ou éteint la loupe, sans ouvrir la palette. Elle revient sur le dernier réglage utilisé."],
  ["Ctrl + molette, ou + et −", "Change le niveau de zoom."],
  ["Flèches", "Explore : déplace la vue, ou parcourt le texte dans le Focus-loupe. Avec Ctrl, le pas est plus fin."],
  ["Tabulation", "Passe d'un élément à l'autre ; le Focus-loupe suit."],
  ["Échap. ou clic droit", "Focus-loupe : revient au focus non grossi, là où vous étiez. Loupe souris et Agrandisseur : escamote la loupe, qui reste au bout du pointeur."],
  ["Clic ou Entrée", "Grossit l'élément visé. Un second clic l'active : un lien ne s'ouvre jamais tant que la loupe n'est pas posée dessus."],
];

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-black/10 dark:border-confort-orange bg-white dark:bg-confort-ink p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

export default function MagnifierHelpPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-confort-cream dark:bg-black transition-colors" data-testid="magnifier-help-page">
        <SiteHeader />

        <main className="max-w-4xl mx-auto px-6 py-14">
          <Link
            to="/"
            data-testid="help-back-link"
            className="inline-flex items-center gap-2 text-sm font-semibold text-confort-ink/85 dark:text-white hover:text-confort-orange transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Retour au téléchargement
          </Link>

          <h1 className="text-4xl sm:text-5xl font-bold text-confort-ink dark:text-white mb-4">
            Les trois loupes
          </h1>
          <p className="text-confort-ink/85 dark:text-white max-w-2xl mb-12">
            Le bouton <strong>Loupe</strong> de la palette passe d'une loupe à l'autre sans
            coupure : au-delà du grossissement maximal d'un type, Confort+ bascule dans le
            suivant, et redescendre revient au précédent.
          </p>

          <div className="space-y-5 mb-14">
            {MAGNIFIERS.map(({ id, icon: Icon, name, levels, what, when }) => (
              <Card key={id}>
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-confort-orange/10 p-3 shrink-0">
                    <Icon className="w-6 h-6 text-confort-orange" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-confort-ink dark:text-white m-0">{name}</h2>
                      <span className="rounded-full bg-confort-ink/[0.06] dark:bg-white/10 px-3 py-0.5 text-xs font-semibold text-confort-ink/85 dark:text-white">
                        {levels}
                      </span>
                    </div>
                    <p className="text-confort-ink/85 dark:text-white leading-relaxed mb-2">{what}</p>
                    <p className="text-sm text-confort-ink/85 dark:text-white/70 m-0">{when}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-confort-ink dark:text-white mb-2 flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-confort-orange" aria-hidden="true" />
            Raccourcis sur ordinateur
          </h2>
          <p className="text-confort-ink/85 dark:text-white mb-6">
            Ces touches agissent pendant que la loupe est allumée, sauf Ctrl + Maj + Z qui
            fonctionne à tout moment.
          </p>

          <Card className="mb-14 overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="help-shortcuts-table">
              <caption className="sr-only">Raccourcis clavier des loupes Confort+</caption>
              <thead>
                <tr className="border-b border-black/10 dark:border-white/20">
                  <th scope="col" className="py-2 pr-6 text-sm font-semibold text-confort-ink dark:text-white">Touches</th>
                  <th scope="col" className="py-2 text-sm font-semibold text-confort-ink dark:text-white">Effet</th>
                </tr>
              </thead>
              <tbody>
                {SHORTCUTS.map(([keys, effect]) => (
                  <tr key={keys} className="border-b border-black/5 dark:border-white/10 last:border-0 align-top">
                    <th scope="row" className="py-3 pr-6 whitespace-nowrap font-mono text-sm font-semibold text-confort-ink dark:text-white">
                      {keys}
                    </th>
                    <td className="py-3 text-sm text-confort-ink/85 dark:text-white leading-relaxed">{effect}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <h2 className="text-2xl font-bold text-confort-ink dark:text-white mb-2 flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-confort-orange" aria-hidden="true" />
            Sur téléphone
          </h2>
          <Card>
            <ul className="space-y-3 text-confort-ink/85 dark:text-white m-0 list-disc pl-5">
              <li>
                Un bouton <strong>+ / −</strong> apparaît trois secondes en bas de l'écran après
                chaque appui sur le bouton Loupe, et à chaque changement de niveau.
              </li>
              <li>
                Un <strong>appui long</strong> n'importe où dans la page allume la loupe sur son
                dernier réglage, sans ouvrir la palette.
              </li>
              <li>La Loupe souris et l'Agrandisseur suivent le doigt.</li>
              <li>Le Focus-loupe se pose sur l'élément touché et y reste.</li>
            </ul>
          </Card>

          <p className="text-sm text-confort-ink/85 dark:text-white/70 mt-10">
            Les réglages fins — type de loupe et niveau de zoom — se trouvent dans la fenêtre de
            réglages du bouton Loupe. Toute combinaison qui sort des valeurs du bouton devient sa
            quatrième valeur, « personnalisé ».
          </p>
        </main>

        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}
