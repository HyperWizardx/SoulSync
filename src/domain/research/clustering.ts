/**
 * Perfiles del grupo — capa de Dominio (pura).
 * k-means propio (inicio k-means++ con semilla, varios reinicios) sobre hábitos y ánimo de las
 * últimas 2 semanas, estandarizados. El número de perfiles se elige por silueta y cada perfil
 * debe tener al menos 3 estudiantes (nadie queda identificable). Cada perfil se describe con
 * sus rasgos más marcados y un taller sugerido para Bienestar Universitario.
 */
import { seededRandom } from "@/domain/wellbeing/recommender";

export interface ProfileDimension { key: ProfileKey; label: string; high: string; low: string }
export type ProfileKey = "mood" | "stress" | "energy" | "social" | "sleep" | "regularity" | "missions" | "lateNights";
export type ProfileVector = Record<ProfileKey, number | null>;

export const PROFILE_DIMENSIONS: readonly ProfileDimension[] = [
  { key: "mood", label: "Ánimo", high: "ánimo alto", low: "ánimo bajo" },
  { key: "stress", label: "Estrés", high: "estrés alto", low: "estrés bajo" },
  { key: "energy", label: "Energía", high: "mucha energía", low: "poca energía" },
  { key: "social", label: "Conexión social", high: "muy conectados", low: "poca conexión social" },
  { key: "sleep", label: "Sueño (h)", high: "duermen bien", low: "duermen poco" },
  { key: "regularity", label: "Constancia", high: "registran casi a diario", low: "registran poco" },
  { key: "missions", label: "Misiones/semana", high: "muy activos en misiones", low: "pocas misiones" },
  { key: "lateNights", label: "Check-ins de madrugada", high: "trasnochan", low: "horarios regulares" },
];

/** Rasgo "de cuidado" de cada dimensión → taller sugerido. */
const WORKSHOPS: { key: ProfileKey; side: "high" | "low"; workshop: string }[] = [
  { key: "mood", side: "low", workshop: "Acompañamiento cercano y activación conductual" },
  { key: "stress", side: "high", workshop: "Manejo del estrés con la guía OMS «Hacer lo que importa»" },
  { key: "sleep", side: "low", workshop: "Higiene del sueño y descanso" },
  { key: "lateNights", side: "high", workshop: "Rutinas nocturnas y desconexión digital" },
  { key: "social", side: "low", workshop: "Espacios de encuentro y gremios" },
  { key: "regularity", side: "low", workshop: "Metas pequeñas y recordatorios amables" },
  { key: "missions", side: "low", workshop: "Metas pequeñas y recordatorios amables" },
  { key: "energy", side: "low", workshop: "Actividad física (meta OMS de 150 min) y pausas activas" },
];

export const MIN_PROFILE_SIZE = 3;
export const MIN_PROFILE_STUDENTS = 9;
const TRAIT_Z = 0.5;

const dist2 = (a: readonly number[], b: readonly number[]) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

/** k-means con inicio k-means++ y reinicios; devuelve la mejor partición (menor inercia). */
export function kmeans(points: readonly number[][], k: number, seed: string, restarts = 8, maxIter = 100) {
  const rand = seededRandom(seed);
  let best: { centroids: number[][]; assignment: number[]; inertia: number } | null = null;
  for (let r = 0; r < restarts; r++) {
    const centroids: number[][] = [points[Math.floor(rand() * points.length)].slice()];
    while (centroids.length < k) {
      const d = points.map((p) => Math.min(...centroids.map((c) => dist2(p, c))));
      const total = d.reduce((a, b) => a + b, 0);
      let target = rand() * total;
      let idx = 0;
      while (idx < d.length - 1 && target > d[idx]) { target -= d[idx]; idx++; }
      centroids.push(points[total === 0 ? Math.floor(rand() * points.length) : idx].slice());
    }
    let assignment = new Array<number>(points.length).fill(-1);
    for (let it = 0; it < maxIter; it++) {
      const next = points.map((p) => { let bi = 0; let bd = Infinity; centroids.forEach((c, i) => { const v = dist2(p, c); if (v < bd) { bd = v; bi = i; } }); return bi; });
      const changed = next.some((v, i) => v !== assignment[i]);
      assignment = next;
      for (let c = 0; c < k; c++) {
        const members = points.filter((_, i) => assignment[i] === c);
        if (members.length) centroids[c] = members[0].map((_, j) => members.reduce((s, m) => s + m[j], 0) / members.length);
      }
      if (!changed) break;
    }
    const inertia = points.reduce((s, p, i) => s + dist2(p, centroids[assignment[i]]), 0);
    if (!best || inertia < best.inertia) best = { centroids: centroids.map((c) => c.slice()), assignment, inertia };
  }
  return best!;
}

/** Silueta media: qué tan separado está cada punto de los otros perfiles (−1 a 1). */
export function silhouette(points: readonly number[][], assignment: readonly number[]): number {
  const clusters = [...new Set(assignment)];
  if (clusters.length < 2) return 0;
  let total = 0;
  points.forEach((p, i) => {
    const meanTo = (c: number) => {
      const others = points.filter((_, j) => assignment[j] === c && j !== i);
      return others.length ? others.reduce((s, q) => s + Math.sqrt(dist2(p, q)), 0) / others.length : 0;
    };
    const a = meanTo(assignment[i]);
    const b = Math.min(...clusters.filter((c) => c !== assignment[i]).map(meanTo));
    const own = assignment.filter((c) => c === assignment[i]).length;
    total += own <= 1 ? 0 : (b - a) / Math.max(a, b, 1e-12);
  });
  return total / points.length;
}

export interface GroupProfile {
  id: number;
  size: number;
  share: number;
  title: string;
  traits: string[];
  workshop: string | null;
  /** Promedio real de cada dimensión en el perfil. */
  means: Record<ProfileKey, number>;
}

export interface ProfilesReport { students: number; k: number; silhouette: number; profiles: GroupProfile[] }

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Perfiles del grupo, o null si no hay estudiantes suficientes para agrupar sin identificar. */
export function buildProfiles(vectors: readonly ProfileVector[], seed = "perfiles", kRange: readonly number[] = [2, 3, 4]): ProfilesReport | null {
  if (vectors.length < MIN_PROFILE_STUDENTS) return null;
  const keys = PROFILE_DIMENSIONS.map((d) => d.key);
  // Imputación por la media del grupo y estandarización (z).
  const means = {} as Record<ProfileKey, number>;
  const sds = {} as Record<ProfileKey, number>;
  for (const k of keys) {
    const vals = vectors.map((v) => v[k]).filter((x): x is number => x !== null && Number.isFinite(x));
    means[k] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const variance = vals.length ? vals.reduce((s, x) => s + (x - means[k]) ** 2, 0) / vals.length : 0;
    sds[k] = Math.sqrt(variance);
  }
  const rawRows = vectors.map((v) => keys.map((k) => (v[k] ?? means[k])));
  const points = rawRows.map((row) => row.map((x, j) => (sds[keys[j]] > 0 ? (x - means[keys[j]]) / sds[keys[j]] : 0)));

  let chosen: { k: number; s: number; assignment: number[]; centroids: number[][] } | null = null;
  for (const k of kRange) {
    if (k * MIN_PROFILE_SIZE > points.length) continue;
    const fit = kmeans(points, k, `${seed}-${k}`);
    const sizes = Array.from({ length: k }, (_, c) => fit.assignment.filter((a) => a === c).length);
    if (sizes.some((n) => n < MIN_PROFILE_SIZE)) continue;
    const s = silhouette(points, fit.assignment);
    if (!chosen || s > chosen.s + 1e-9) chosen = { k, s, assignment: fit.assignment, centroids: fit.centroids };
  }
  if (!chosen) return null;

  const profiles = chosen.centroids.map((centroid, id): GroupProfile => {
    const members = rawRows.filter((_, i) => chosen!.assignment[i] === id);
    const traits = PROFILE_DIMENSIONS
      .map((d, j) => ({ d, z: centroid[j] }))
      .filter((t) => Math.abs(t.z) >= TRAIT_Z)
      .sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    const care = traits.find((t) => WORKSHOPS.some((w) => w.key === t.d.key && (w.side === "high" ? t.z > 0 : t.z < 0)));
    const workshop = care ? WORKSHOPS.find((w) => w.key === care.d.key && (w.side === "high" ? care.z > 0 : care.z < 0))!.workshop : null;
    const words = traits.map((t) => (t.z > 0 ? t.d.high : t.d.low));
    return {
      id,
      size: members.length,
      share: Number((members.length / rawRows.length).toFixed(3)),
      title: words.length ? capitalize(words.slice(0, 2).join(" y ")) : "Perfil promedio",
      traits: words.slice(0, 4),
      workshop: workshop ?? (words.length ? "Mentores para otros gremios: compartir lo que les funciona" : null),
      means: Object.fromEntries(keys.map((k, j) => [k, Number((members.reduce((s, m) => s + m[j], 0) / members.length).toFixed(2))])) as Record<ProfileKey, number>,
    };
  }).sort((a, b) => b.size - a.size);

  return { students: rawRows.length, k: chosen.k, silhouette: Number(chosen.s.toFixed(3)), profiles };
}
