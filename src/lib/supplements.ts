import type { Objectif, SupplementId } from "@/types";

/* ------------------------------------------------------------------ */
/* Catalogue des compléments : contenu pédagogique vulgarisé.          */
/* Le bénéfice affiché s'adapte à l'objectif choisi à l'onboarding.    */
/* ------------------------------------------------------------------ */

export interface SupplementInfo {
  id: SupplementId;
  name: string;
  dose: string;
  shortDesc: string;
  cQuoi: string;
  obligatoire: string;
  benefitByObjectif: Record<Objectif, string>;
  securite: string;
}

export const SUPPLEMENTS: SupplementInfo[] = [
  {
    id: "whey",
    name: "Whey / Protéine Végétale",
    dose: "20-30 g",
    shortDesc: "Protéine en poudre issue du lait ou des végétaux.",
    cQuoi:
      "La Whey est simplement une protéine issue du lait filtré (version végétale : pois ou riz). C'est un aliment pratique en poudre, pas un produit dopant.",
    obligatoire:
      "Non. L'alimentation solide (œufs, poisson, légumineuses, viande) passe toujours en premier. La poudre ne fait que compléter si tes repas n'atteignent pas ton quota de protéines.",
    benefitByObjectif: {
      perte_poids:
        "T'aide à préserver tes muscles pendant le déficit calorique et augmente la satiété entre les repas.",
      prise_masse:
        "Facilite l'atteinte de tes 2 g de protéines par kg de poids de corps, indispensables pour construire du muscle.",
      endurance: "Soutient la récupération musculaire après tes séances cardio longues.",
      bien_etre:
        "Un moyen simple de compléter tes apports les jours où tes repas manquent de protéines.",
    },
    securite:
      "20 à 30 g par prise, 1 à 2 prises par jour. Aucun danger démontré chez l'adulte en bonne santé à ces doses — c'est un aliment, pas un médicament.",
  },
  {
    id: "creatine",
    name: "Créatine",
    dose: "3-5 g / jour",
    shortDesc: "La molécule la plus étudiée de la nutrition sportive.",
    cQuoi:
      "Une molécule naturellement présente dans tes muscles (et dans la viande rouge). C'est le complément le plus étudié au monde, utilisé depuis des décennies.",
    obligatoire:
      "Non. Tes progrès viennent d'abord de l'entraînement, du sommeil et de l'assiette. La créatine n'est qu'un petit bonus mesurable.",
    benefitByObjectif: {
      perte_poids: "T'aide à maintenir ta force et ta masse musculaire pendant le déficit.",
      prise_masse:
        "Améliore ta force et ton volume d'entraînement (+5 à 10 % sur les charges), ce qui accélère la construction musculaire.",
      endurance: "Utile pour les efforts répétés à haute intensité (sprints, fractionné).",
      bien_etre: "Peut soutenir l'énergie cellulaire, y compris au niveau cognitif.",
    },
    securite:
      "3 à 5 g par jour, tous les jours, avec une bonne hydratation. Pas de phase de charge nécessaire. Sûre pour des reins en bonne santé — au-delà de 5 g, aucun bénéfice supplémentaire.",
  },
  {
    id: "omega3",
    name: "Oméga-3",
    dose: "1-2 g EPA+DHA",
    shortDesc: "Acides gras essentiels des poissons gras.",
    cQuoi:
      "Des acides gras essentiels (EPA et DHA) présents dans les poissons gras. Ton corps ne sait pas les fabriquer : ils doivent venir de l'alimentation.",
    obligatoire:
      "Non. Deux portions de poisson gras par semaine (sardine, maquereau, saumon) couvrent les besoins. Le complément sert uniquement si tu n'en manges pas.",
    benefitByObjectif: {
      perte_poids: "Soutient la santé métabolique et hormonale pendant le déficit calorique.",
      prise_masse:
        "Contribue à la récupération et à la santé articulaire quand les charges deviennent lourdes.",
      endurance: "Soutient le système cardiovasculaire et limite l'inflammation post-effort.",
      bien_etre: "Associés à l'équilibre de l'humeur et à la santé du cerveau.",
    },
    securite:
      "1 à 2 g d'EPA+DHA par jour, pendant un repas pour une meilleure absorption. Choisis un produit certifié, purifié des métaux lourds.",
  },
  {
    id: "multivitamines",
    name: "Multivitamines & Minéraux",
    dose: "1 dose / jour",
    shortDesc: "Un filet de sécurité micro-nutritionnel.",
    cQuoi:
      "Un mélange de vitamines et minéraux essentiels réunis en une prise. C'est un filet de sécurité, pas un substitut de repas.",
    obligatoire:
      "Non. Une assiette variée et colorée fait mieux qu'une gélule : les multivitamines ne compensent jamais une mauvaise alimentation.",
    benefitByObjectif: {
      perte_poids: "Évite les carences en micronutriments quand tu manges moins que d'habitude.",
      prise_masse: "Couvre les besoins accrus par un entraînement intensif.",
      endurance: "Compense les minéraux perdus par la transpiration répétée.",
      bien_etre: "Un filet de sécurité si ton alimentation manque parfois de variété.",
    },
    securite:
      "1 dose par jour maximum : le surdosage de certaines vitamines (A, D) est nocif. Respecte strictement la posologie du fabricant.",
  },
  {
    id: "electrolytes",
    name: "Électrolytes / BCAA",
    dose: "Pendant l'effort",
    shortDesc: "Minéraux et acides aminés de l'effort long.",
    cQuoi:
      "Les électrolytes (sodium, potassium, magnésium) sont les minéraux que tu perds en transpirant. Les BCAA sont trois acides aminés déjà présents dans toute protéine complète.",
    obligatoire:
      "Non. Pour une séance de moins d'une heure, de l'eau et une alimentation équilibrée suffisent largement.",
    benefitByObjectif: {
      perte_poids: "Limite la fatigue et les crampes pendant les séances en déficit calorique.",
      prise_masse: "Soutient l'hydratation et la performance lors des grosses séances.",
      endurance:
        "Indispensables au-delà d'une heure d'effort intense, surtout par forte chaleur.",
      bien_etre: "Utile après une grosse transpiration (sauna, canicule, séance intense).",
    },
    securite:
      "À réserver aux séances longues ou intenses. Attention à l'apport en sodium si tu surveilles ta tension artérielle.",
  },
];

export function getSupplement(id: SupplementId): SupplementInfo {
  return SUPPLEMENTS.find((s) => s.id === id)!;
}
