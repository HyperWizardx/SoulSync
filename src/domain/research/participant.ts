/**
 * Ficha opcional del participante — capa de Dominio (pura).
 * Edad, género y semestre por tramos, todos opcionales y con "Prefiero no decir". Solo se usan,
 * agrupados y seudonimizados, para la auditoría de equidad de los modelos.
 */
import { UNDISCLOSED, type EquityAttribute } from "@/domain/research/equity";

export const AGE_BANDS: Record<string, string> = { "16-19": "16 a 19 años", "20-24": "20 a 24 años", "25+": "25 años o más", [UNDISCLOSED]: "Prefiero no decir" };
export const GENDERS: Record<string, string> = { mujer: "Mujer", hombre: "Hombre", no_binario: "No binario", otro: "Otro", [UNDISCLOSED]: "Prefiero no decir" };
export const SEMESTER_BANDS: Record<string, string> = { "1-3": "1.º a 3.º semestre", "4-6": "4.º a 6.º semestre", "7+": "7.º semestre o más", [UNDISCLOSED]: "Prefiero no decir" };
export const ARCHETYPE_GROUPS: Record<string, string> = { "0": "Caballero", "1": "Bárbaro", "2": "Pícaro", "3": "Mago" };

export interface ParticipantProfile { ageBand: string; gender: string; semesterBand: string }

export const isValidParticipantProfile = (p: ParticipantProfile) =>
  p.ageBand in AGE_BANDS && p.gender in GENDERS && p.semesterBand in SEMESTER_BANDS;

/** Subgrupos que revisa la auditoría de equidad. */
export const EQUITY_ATTRIBUTES: readonly EquityAttribute[] = [
  { key: "archetype", label: "Arquetipo", values: ARCHETYPE_GROUPS },
  { key: "gender", label: "Género", values: GENDERS },
  { key: "ageBand", label: "Edad", values: AGE_BANDS },
  { key: "semesterBand", label: "Semestre", values: SEMESTER_BANDS },
];

/** Grupo de un estudiante para la auditoría (sin datos opcionales si no los compartió). */
export function equityGroup(archetype: number | null, profile: ParticipantProfile | null): Record<string, string | undefined> {
  return {
    archetype: archetype === null ? undefined : String(archetype),
    gender: profile?.gender,
    ageBand: profile?.ageBand,
    semesterBand: profile?.semesterBand,
  };
}
