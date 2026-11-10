/** Reglas compartidas de los casos de uso del panel: permisos por rol y consentimiento vigente. */
import { CONSENT_VERSION } from '@/domain/wellbeing/types';
import type { AdminDeps, AdminRole, ConsentRow } from '@/domain/research/ports';

export async function requireRole(deps: AdminDeps, userId: string, role: AdminRole) {
  const access = await deps.repository.readAccess(userId);
  if (!access[role]) throw new Error('Acceso restringido: no tienes permisos de administración para esta vista.');
}

/** Requiere cualquiera de los roles indicados. */
export async function requireAnyRole(deps: AdminDeps, userId: string, roles: AdminRole[]) {
  const access = await deps.repository.readAccess(userId);
  if (!roles.some((r) => access[r])) throw new Error('Acceso restringido: no tienes permisos de administración para esta vista.');
}

export function consentState(row: { consent_version: string; revoked_at: string | null } | undefined) {
  if (!row) return "ninguno" as const;
  if (row.revoked_at) return "revocado" as const;
  return row.consent_version === CONSENT_VERSION ? ("vigente" as const) : ("desactualizado" as const);
}

/** Estudiantes cuyo consentimiento más reciente está vigente (filas ordenadas de más nueva a más vieja). */
export function consentedUserIds(consents: readonly ConsentRow[]): Set<string> {
  const latest = new Map<string, ConsentRow>();
  for (const c of consents) if (!latest.has(c.user_id)) latest.set(c.user_id, c);
  return new Set([...latest.values()].filter((c) => consentState(c) === "vigente").map((c) => c.user_id));
}

export const todayISO = (deps: AdminDeps) => deps.now().toISOString().slice(0, 10);
export const daysAgoISO = (deps: AdminDeps, n: number) => new Date(deps.now().getTime() - n * 86_400_000).toISOString().slice(0, 10);
