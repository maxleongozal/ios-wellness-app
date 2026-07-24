import type { DailyActivity, GamificationState } from "./types";

/* ================================================================== */
/* CHARTE DU MODULE — À LIRE AVANT TOUTE MODIFICATION                 */
/*                                                                    */
/* AUCUNE RÉCOMPENSE SUR UN RÉSULTAT CORPOREL.                        */
/*                                                                    */
/* SaneFit gamifie des COMPORTEMENTS, jamais des RÉSULTATS. Aucun     */
/* point, badge ou niveau ne doit être attribué pour :                */
/*   - du poids perdu ou gagné, un tour de taille, un IMC ;           */
/*   - un déficit calorique ou un faible apport ;                     */
/*   - une durée ou une intensité d'entraînement élevée ;             */
/*   - un jeûne ou un repas sauté.                                    */
/* Récompenser ces résultats pousse aux comportements à risque        */
/* (restriction, surentraînement) — exactement ce que l'app combat.   */
/*                                                                    */
/* Ce que l'on récompense : la régularité, la récupération, le        */
/* sommeil, les protéines, l'hydratation, et le simple fait de        */
/* renseigner ses données. Le jour de repos rapporte AUTANT qu'une    */
/* séance (mécanique signature, verrouillée par WORKOUT_REST_POINTS   */
/* et par un test unitaire).                                          */
/*                                                                    */
/* Deux garde-fous font respecter cette charte :                      */
/*   1. Structurel : `DailyActivity` (types.ts) n'expose aucun champ  */
/*      corporel — une règle "résultat" est impossible à écrire.      */
/*   2. Aucune perte : la sanction d'un mauvais jour est l'absence    */
/*      de gain. XP, niveaux, badges et compteurs ne diminuent        */
/*      JAMAIS (pas de streak cassé, pas de remise à zéro).           */
/*                                                                    */
/* Pour ajouter ou retirer une règle, un badge ou un niveau : éditez  */
/* uniquement les tableaux de ce fichier. Le moteur (engine.ts) les   */
/* parcourt sans rien connaître de leur contenu.                      */
/* ================================================================== */

/* ------------------------- Constantes ----------------------------- */

export const SLEEP_TARGET_HOURS = 7;
/** Jours actifs visés par semaine — 4/7, pas une chaîne parfaite. */
export const ACTIVE_DAYS_TARGET = 4;
/** Jokers mensuels qui absorbent une semaine ratée sans remise à zéro. */
export const JOKERS_PER_MONTH = 2;
/** Mécanique signature : le repos rapporte exactement autant qu'une séance. */
export const WORKOUT_REST_POINTS = 25;

/* ------------------------ Règles de points ------------------------ */

export interface GamificationRule {
  id: string;
  label: string;
  description: string;
  points: number;
  /** Plafond de validations par jour — empêche tout "grinding". */
  maxPerDay: number;
  /** Nombre de validations pour la journée (0 = rien). */
  trigger: (day: DailyActivity) => number;
}

export const GAMIFICATION_RULES: GamificationRule[] = [
  {
    id: "repas_renseigne",
    label: "Repas renseigné",
    description: "Renseigner un repas dans le journal — la donnée avant la perfection.",
    points: 10,
    maxPerDay: 4,
    trigger: (d) => d.mealsLogged,
  },
  {
    id: "proteines_atteintes",
    label: "Cible de protéines atteinte",
    description: "Atteindre sa cible de protéines du jour.",
    points: 20,
    maxPerDay: 1,
    trigger: (d) => (d.proteinTargetMet ? 1 : 0),
  },
  {
    id: "sommeil_7h",
    label: "Nuit de 7 h ou plus",
    description: "Dormir au moins sept heures.",
    points: 20,
    maxPerDay: 1,
    trigger: (d) => (d.sleepHours !== null && d.sleepHours >= SLEEP_TARGET_HOURS ? 1 : 0),
  },
  {
    id: "seance_terminee",
    label: "Séance planifiée terminée",
    description: "Terminer la séance prévue au programme — une seule compte par jour.",
    points: WORKOUT_REST_POINTS,
    maxPerDay: 1,
    trigger: (d) => (d.plannedWorkoutDone ? 1 : 0),
  },
  {
    id: "jour_de_repos",
    label: "Jour de repos respecté",
    description: "Prendre le jour de repos programmé — il vaut autant qu'une séance.",
    points: WORKOUT_REST_POINTS,
    maxPerDay: 1,
    // S'entraîner un jour de repos annule le gain du repos (sans pénalité).
    trigger: (d) => (d.plannedRestDay && !d.plannedWorkoutDone ? 1 : 0),
  },
  {
    id: "hydratation",
    label: "Cible d'eau atteinte",
    description: "Boire assez d'eau sur la journée.",
    points: 15,
    maxPerDay: 1,
    trigger: (d) => (d.waterTargetMet ? 1 : 0),
  },
];

/* --------------------------- Badges ------------------------------- */
/* Constance et connaissance uniquement — jamais poids, mensuration   */
/* ou performance maximale.                                           */

export interface BadgeDefinition {
  id: string;
  label: string;
  description: string;
  kind: "constance" | "connaissance";
  earned: (state: GamificationState) => boolean;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: "premier_pas",
    label: "Premier pas",
    description: "Première action enregistrée dans SaneFit.",
    kind: "constance",
    earned: (s) => s.xpTotal > 0,
  },
  {
    id: "carnet_ouvert",
    label: "Carnet ouvert",
    description: "30 repas renseignés au total.",
    kind: "constance",
    earned: (s) => s.counters.mealsLogged >= 30,
  },
  {
    id: "maitre_recup",
    label: "Maître de la récup",
    description: "8 semaines de suite avec au moins un jour de repos respecté.",
    kind: "constance",
    earned: (s) => s.counters.restWeekChain >= 8,
  },
  {
    id: "rythme_trouve",
    label: "Rythme trouvé",
    description: "4 semaines réussies au total (pas forcément consécutives).",
    kind: "constance",
    earned: (s) => s.counters.weeksSucceeded >= 4,
  },
  {
    id: "nuits_reparatrices",
    label: "Nuits réparatrices",
    description: "14 nuits d'au moins 7 heures au total.",
    kind: "constance",
    earned: (s) => s.counters.sleepNights7h >= 14,
  },
  {
    id: "hydrate",
    label: "Bien hydraté",
    description: "20 jours avec la cible d'eau atteinte au total.",
    kind: "constance",
    earned: (s) => s.counters.hydrationDays >= 20,
  },
  {
    id: "retour_gagnant",
    label: "Retour gagnant",
    description: "Réussir la semaine qui suit une semaine manquée — revenir compte plus que ne jamais rater.",
    kind: "constance",
    earned: (s) => s.counters.comebackWeeks >= 1,
  },
  {
    id: "esprit_curieux",
    label: "Esprit curieux",
    description: "5 leçons du Dr Sane lues.",
    kind: "connaissance",
    earned: (s) => s.counters.lessonsRead >= 5,
  },
];

/* --------------------------- Niveaux ------------------------------ */
/* La progression débloque du savoir (leçons du Dr Sane), pas des     */
/* cosmétiques. Un niveau atteint ne se perd jamais.                  */

export interface LessonDefinition {
  id: string;
  title: string;
  summary: string;
}

export interface LevelDefinition {
  level: number;
  title: string;
  minXp: number;
  lessons: LessonDefinition[];
}

export const LEVELS: LevelDefinition[] = [
  {
    level: 1,
    title: "Départ",
    minXp: 0,
    lessons: [
      {
        id: "l1-repos",
        title: "Pourquoi le repos construit le muscle",
        summary:
          "La séance est le stimulus, la récupération est la construction : c'est au repos que les fibres se réparent et se renforcent. S'entraîner tous les jours sans pause freine la progression au lieu de l'accélérer.",
      },
      {
        id: "l1-points",
        title: "À quoi servent les points SaneFit",
        summary:
          "Ici, aucun point pour du poids perdu ou un déficit : on récompense les comportements qui te font du bien sur la durée. Un jour raté ne te fait rien perdre — il ne rapporte simplement rien.",
      },
    ],
  },
  {
    level: 2,
    title: "Fondations",
    minXp: 300,
    lessons: [
      {
        id: "l2-proteines",
        title: "Protéines : satiété et muscle",
        summary:
          "Les protéines rassasient plus que les autres macronutriments et protègent ta masse musculaire, surtout en période de perte de poids. Les répartir sur la journée vaut mieux qu'un seul repas chargé.",
      },
      {
        id: "l2-hydratation",
        title: "L'hydratation, carburant invisible",
        summary:
          "Une déshydratation légère suffit à dégrader la concentration, la force et la récupération. La soif arrive en retard : bois régulièrement, sans attendre de la ressentir.",
      },
    ],
  },
  {
    level: 3,
    title: "Rythme",
    minXp: 800,
    lessons: [
      {
        id: "l3-sommeil",
        title: "Sommeil : l'heure des hormones",
        summary:
          "C'est pendant le sommeil que se régulent l'hormone de croissance, le cortisol et les hormones de la faim. Dormir moins de 7 h augmente l'appétit et sabote la récupération — le lit fait partie du programme.",
      },
      {
        id: "l3-regularite",
        title: "La régularité bat l'intensité",
        summary:
          "Quatre jours actifs par semaine pendant un an transforment plus qu'un mois parfait suivi d'un abandon. C'est pour ça que ton score vise 4 jours sur 7, pas une chaîne sans faille.",
      },
    ],
  },
  {
    level: 4,
    title: "Lucidité",
    minXp: 1600,
    lessons: [
      {
        id: "l4-surentrainement",
        title: "Reconnaître le surentraînement",
        summary:
          "Fatigue qui persiste, sommeil dégradé, performances en baisse, irritabilité, blessures à répétition : ce sont les signaux d'un corps qui n'absorbe plus la charge. La réponse est le repos, pas une séance de plus.",
      },
      {
        id: "l4-plateaux",
        title: "Les plateaux sont normaux",
        summary:
          "Le corps s'adapte par paliers : stagner quelques semaines ne veut pas dire échouer. Réduire drastiquement les calories pour forcer le passage est le pire réflexe — la patience et la régularité, le meilleur.",
      },
    ],
  },
  {
    level: 5,
    title: "Maîtrise",
    minXp: 2800,
    lessons: [
      {
        id: "l5-deficit",
        title: "Les mythes du déficit extrême",
        summary:
          "Manger très en dessous de ses besoins fait surtout fondre le muscle et ralentit le métabolisme, préparant la reprise de poids. Un déficit modéré et des protéines suffisantes font mieux, plus durablement.",
      },
      {
        id: "l5-balance",
        title: "Ce que la balance ne dit pas",
        summary:
          "Eau, glycogène, digestion, muscle : le poids fluctue chaque jour pour des raisons qui n'ont rien à voir avec la graisse. C'est pour ça que SaneFit ne récompense jamais un chiffre sur la balance.",
      },
    ],
  },
  {
    level: 6,
    title: "Sagesse",
    minXp: 4500,
    lessons: [
      {
        id: "l6-relation",
        title: "Relation saine à la nourriture",
        summary:
          "Aucun aliment n'est un ennemi et aucun repas ne ruine une semaine. Les cycles restriction-craquage entretiennent le problème qu'ils prétendent régler ; la flexibilité est une compétence qui s'apprend.",
      },
      {
        id: "l6-aide",
        title: "Quand demander de l'aide",
        summary:
          "Peur intense de certains aliments, obsession du poids, sport vécu comme une punition, isolement : ces signaux méritent l'avis d'un professionnel de santé. Demander de l'aide est une décision forte, pas un échec.",
      },
    ],
  },
];
