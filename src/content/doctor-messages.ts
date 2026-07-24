import type { ScreenId } from "@/types";

/* ================================================================== */
/* BANQUE DE MESSAGES DU DR SANE — CONTENU ÉDITORIAL                  */
/*                                                                    */
/* Ce fichier ne contient AUCUNE logique : les conditions de          */
/* déclenchement vivent dans lib/doctor-interventions/situations.ts.  */
/* Réécrivez librement les textes ici sans toucher au code.           */
/*                                                                    */
/* Ton contractuel du Dr Sane : bienveillant, direct, factuel.        */
/*   - jamais de compliment vide : chaque félicitation s'appuie sur   */
/*     un fait mesuré ;                                               */
/*   - jamais de culpabilisation : un écart se recadre à l'échelle    */
/*     de la semaine, on ne dramatise pas la journée.                 */
/*                                                                    */
/* Les {variables} sont interpolées par le moteur ; la liste des      */
/* variables disponibles est indiquée au-dessus de chaque message.    */
/* ================================================================== */

export type DoctorTone = "felicitation" | "information" | "alerte";

export type DoctorSituationId =
  | "palier_poids"
  | "semaine_reguliere"
  | "cap_serie"
  | "seance_terminee"
  | "hydratation_atteinte"
  | "briefing_matin"
  | "donnees_manquantes"
  | "repos_a_prevoir"
  | "pesee_hebdo"
  | "bilan_soir"
  | "ecart_calorique_veille"
  | "hydratation_en_retard"
  | "fibres_basses_soir"
  | "inactivite"
  | "sommeil_court";

export interface DoctorMessageDef {
  tone: DoctorTone;
  message: string;
  /** Libellé du bouton d'action, absent si le message se suffit. */
  ctaLabel?: string;
  /** Écran ouvert par le bouton d'action. */
  ctaScreen?: ScreenId;
}

export const DOCTOR_MESSAGES: Record<DoctorSituationId, DoctorMessageDef> = {
  /* ---------------------- Félicitations ---------------------------- */

  // {progressionPct} : part du chemin parcouru vers l'objectif de poids.
  palier_poids: {
    tone: "felicitation",
    message:
      "Tu as parcouru {progressionPct} % du chemin vers ton objectif de poids. C'est le résultat de tes dernières semaines de régularité, pas d'une seule journée.",
    ctaLabel: "Voir ma progression",
    ctaScreen: "profile",
  },

  // {joursActifs} : jours actifs sur les 7 derniers.
  semaine_reguliere: {
    tone: "felicitation",
    message:
      "{joursActifs} jours actifs cette semaine : objectif de régularité atteint. C'est cette constance qui transforme ta condition physique, bien plus que des séances héroïques isolées.",
  },

  // {jours} : longueur de la série de suivi.
  cap_serie: {
    tone: "felicitation",
    message:
      "{jours} jours de suivi sans interruption. Tenir un journal double statistiquement les chances d'atteindre son objectif — continue comme ça.",
  },

  seance_terminee: {
    tone: "felicitation",
    message:
      "Séance terminée. Ton corps entre en phase de construction : des protéines dans les deux heures et de l'eau feront le reste.",
    ctaLabel: "Voir mes repas",
    ctaScreen: "nutrition",
  },

  hydratation_atteinte: {
    tone: "felicitation",
    message:
      "Objectif d'hydratation atteint. Ta récupération et ta concentration en profitent directement — rien d'autre à faire aujourd'hui.",
  },

  /* ----------------------- Informations ---------------------------- */

  // {prenom}, {kcal}, {proteines}, {seance} : cibles du jour.
  briefing_matin: {
    tone: "information",
    message:
      "Bonjour {prenom}. Au programme : {kcal} kcal, {proteines} g de protéines et ta séance {seance}. Une chose à la fois — commence par un vrai petit-déjeuner.",
    ctaLabel: "Voir ma séance",
    ctaScreen: "workout",
  },

  donnees_manquantes: {
    tone: "information",
    message:
      "Aucun repas enregistré aujourd'hui. Sans données, je ne peux rien te dire d'utile. Deux repas notés suffisent pour que je puisse t'aider.",
    ctaLabel: "Renseigner un repas",
    ctaScreen: "nutrition",
  },

  // {jours} : jours d'entraînement consécutifs.
  repos_a_prevoir: {
    tone: "information",
    message:
      "{jours} jours d'entraînement consécutifs. Le muscle se construit pendant le repos, pas pendant l'effort — programme une journée off cette semaine. Elle rapporte autant de points qu'une séance.",
    ctaLabel: "Voir mon programme",
    ctaScreen: "workout",
  },

  pesee_hebdo: {
    tone: "information",
    message:
      "Pas de pesée depuis une semaine. Une seule mesure, toujours le même jour au réveil : c'est la tendance qui m'intéresse, pas le chiffre du jour.",
    ctaLabel: "Mettre à jour mon poids",
    ctaScreen: "profile",
  },

  bilan_soir: {
    tone: "information",
    message:
      "Journée dans les clous : calories, repas et hydratation au rendez-vous. La suite se joue cette nuit — vise tes heures de sommeil.",
  },

  /* ---------------------- Alertes douces --------------------------- */

  // {ecartKcal} : dépassement d'hier ; {ecartSemainePct} : le même écart
  // rapporté à l'apport d'une semaine complète.
  ecart_calorique_veille: {
    tone: "alerte",
    message:
      "Tu as dépassé ta cible d'hier d'environ {ecartKcal} kcal. Rapporté à la semaine, c'est {ecartSemainePct} % — aucune journée isolée ne définit ta progression. Reprends simplement ton rythme aujourd'hui.",
  },

  // {heure} : heure courante ; {litres} : volume bu.
  hydratation_en_retard: {
    tone: "alerte",
    message:
      "{heure} h et {litres} L au compteur. Rattraper toute ton eau le soir ne fonctionne pas — un grand verre maintenant, puis un par heure.",
    ctaLabel: "Ajouter un verre",
    ctaScreen: "home",
  },

  // {fibresManquantes} : grammes de fibres restant à couvrir.
  fibres_basses_soir: {
    tone: "alerte",
    message:
      "Il te manque {fibresManquantes} g de fibres aujourd'hui. Tes macros sont bonnes ; ajoute des légumes ou des légumineuses au dîner et le compte y est.",
    ctaLabel: "Idées de repas",
    ctaScreen: "nutrition",
  },

  // {jours} : jours écoulés depuis la dernière séance.
  inactivite: {
    tone: "alerte",
    message:
      "{jours} jours sans séance. Rien d'alarmant : une semaine se juge à sa fin, pas à son milieu. Une séance courte aujourd'hui suffit à relancer la dynamique.",
    ctaLabel: "Lancer ma séance",
    ctaScreen: "workout",
  },

  sommeil_court: {
    tone: "alerte",
    message:
      "Tu dors moins de 6 heures par nuit. C'est aujourd'hui le principal frein à ta progression — plus que l'entraînement ou l'assiette. Trente minutes de plus changeraient tes résultats.",
  },
};
