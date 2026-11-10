/**
 * Vectores de hábitos y ánimo de las últimas 2 semanas para los perfiles del grupo — Dominio.
 * Solo estudiantes con consentimiento vigente y al menos 5 check-ins (señal suficiente).
 */
import type { ProfileVector } from './clustering';
import type { StudentSnapshot } from './ports';

const DAY = 86_400_000;
const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

export function buildProfileVectors(
  data: { checkins: StudentSnapshot['checkins']; missions: readonly { user_id: string; completed_date: string }[] },
  consented: ReadonlySet<string>,
  today: string,
  minCheckins = 5,
): ProfileVector[] {
  const within14 = (d: string) => { const diff = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${d.slice(0, 10)}T00:00:00Z`)) / DAY; return diff >= 0 && diff < 14; };
  const byUser = new Map<string, StudentSnapshot['checkins']>();
  for (const c of data.checkins) {
    if (!consented.has(c.user_id) || !within14(c.checkin_date)) continue;
    byUser.set(c.user_id, [...(byUser.get(c.user_id) ?? []), c]);
  }
  const missions = new Map<string, number>();
  for (const m of data.missions) if (consented.has(m.user_id) && within14(m.completed_date)) missions.set(m.user_id, (missions.get(m.user_id) ?? 0) + 1);

  const vectors: ProfileVector[] = [];
  for (const [user, list] of byUser) {
    if (list.length < minCheckins) continue;
    const sleep = list.map((c) => c.sleep_hours).filter((h): h is number => h !== null && Number.isFinite(Number(h))).map(Number);
    const hours = list.map((c) => c.checkin_local_hour).filter((h): h is number => typeof h === 'number');
    vectors.push({
      mood: mean(list.map((c) => c.mood)),
      stress: mean(list.map((c) => c.stress)),
      energy: mean(list.map((c) => c.energy)),
      social: mean(list.map((c) => c.social)),
      sleep: mean(sleep),
      regularity: new Set(list.map((c) => c.checkin_date)).size / 14,
      missions: (missions.get(user) ?? 0) / 2,
      lateNights: hours.length ? hours.filter((h) => h >= 23 || h < 5).length / hours.length : null,
    });
  }
  return vectors;
}
