/* ------------------------------------------------------------------ */
/* Types partagés du module de garde-fous.                            */
/* ------------------------------------------------------------------ */

export type SafetyInterventionKind =
  | "mineur_deficit"
  | "plancher_imc"
  | "rythme_perte"
  | "rythme_prise"
  | "sans_repos"
  | "chute_apports"
  | "objectif_agressif";

/**
 * Une intervention du Dr Sane. Le ton est contractuel : on explique le
 * mécanisme physiologique, on ne juge jamais la personne. Une
 * intervention n'est pas un blocage — sauf pour les règles dures
 * (`plancher_imc`, `mineur_deficit`), où l'app refuse de générer la
 * recommandation dangereuse mais propose toujours une alternative.
 */
export interface SafetyIntervention {
  id: string;
  kind: SafetyInterventionKind;
  severity: "info" | "warning";
  title: string;
  /** Explication du mécanisme physiologique, à la première personne (Dr Sane). */
  message: string;
  /** Libellé du geste proposé (ex. nouvelle échéance), null si simple information. */
  proposalLabel: string | null;
}
