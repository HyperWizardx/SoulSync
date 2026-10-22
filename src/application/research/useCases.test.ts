/** Pruebas del panel con puertos simulados: permisos y privacidad sin depender de la nube. */
import { describe, expect, it, vi } from 'vitest';
import { CONSENT_VERSION } from '@/domain/wellbeing/types';
import { participantCode } from '@/domain/research/aggregate';
import type { AdminAccess, AdminDeps, AdminRepository, StudentSnapshot } from '@/domain/research/ports';
import { exportDatasetUseCase, getAdminAccessUseCase, getPopulationMetricsUseCase, getStudentDetailUseCase, listStudentsUseCase } from './useCases';

const uid = '11111111-2222-3333-4444-555555555555';
const snapshot: StudentSnapshot = {
  profiles: [{ user_id: uid, name: 'Nombre privado', level: 2, streak: 4, archetype: 1, daily_goal: 3, last_mission_date: '2026-10-21' }],
  consents: [{ user_id: uid, consent_version: CONSENT_VERSION, revoked_at: null }],
  checkins: [], missions: [], tasks: [], emails: new Map([[uid, 'privado@example.com']]),
};
function setup(access: AdminAccess = { psicologo: true, investigador: true, isAdmin: true }) {
  const repository: AdminRepository = {
    readAccess: vi.fn(async () => access),
    loadStudents: vi.fn(async () => snapshot),
    loadDetail: vi.fn(async () => ({ checkins: [], predictions: [], missions: [], tasks: [{ status: 'completed', category: 'social' }, { status: 'skipped', category: 'social' }], timeline: [], scales: [], world: null, stats: null, attributes: null })),
    loadConsents: vi.fn(async () => snapshot.consents),
    loadDataset: vi.fn(async () => [{ user_id: uid, checkin_date: '2026-10-21', mood: 4, stress: 2, energy: 3, social: 4, sleep_hours: 8 }]),
  };
  const deps: AdminDeps = { repository, now: () => new Date('2026-10-21T12:00:00Z') };
  return { deps, repository };
}
describe('Permisos del panel', () => {
  it('devuelve los dos roles independientes', async () => {
    const { deps } = setup({ psicologo: false, investigador: true, isAdmin: true });
    expect(await getAdminAccessUseCase(deps, uid)).toEqual({ psicologo: false, investigador: true, isAdmin: true });
  });
  it('un investigador no obtiene la lista identificada', async () => {
    const { deps, repository } = setup({ psicologo: false, investigador: true, isAdmin: true });
    await expect(listStudentsUseCase(deps, uid)).rejects.toThrow('Acceso restringido');
    expect(repository.loadStudents).not.toHaveBeenCalled();
  });
  it('un investigador no obtiene la ficha individual', async () => {
    const { deps, repository } = setup({ psicologo: false, investigador: true, isAdmin: true });
    await expect(getStudentDetailUseCase(deps, uid, uid)).rejects.toThrow('Acceso restringido');
    expect(repository.loadDetail).not.toHaveBeenCalled();
  });
  it('un psicólogo sin rol investigador no obtiene métricas globales', async () => {
    const { deps, repository } = setup({ psicologo: true, investigador: false, isAdmin: true });
    await expect(getPopulationMetricsUseCase(deps, uid)).rejects.toThrow('Acceso restringido');
    expect(repository.loadStudents).not.toHaveBeenCalled();
  });
  it('un psicólogo sin rol investigador no exporta datos', async () => {
    const { deps, repository } = setup({ psicologo: true, investigador: false, isAdmin: true });
    await expect(exportDatasetUseCase(deps, uid, 'checkins')).rejects.toThrow('Acceso restringido');
    expect(repository.loadConsents).not.toHaveBeenCalled();
  });
});
describe('Lectura por puertos', () => {
  it('el psicólogo obtiene identidad y solicita correos solo tras verificar su rol', async () => {
    const { deps, repository } = setup();
    const rows = await listStudentsUseCase(deps, uid);
    expect(rows[0]?.name).toBe('Nombre privado');
    expect(rows[0]?.email).toBe('privado@example.com');
    expect(repository.loadStudents).toHaveBeenCalledWith(true, '2026-10-08', '2026-10-08T12:00:00.000Z');
    expect(vi.mocked(repository.readAccess).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(repository.loadStudents).mock.invocationCallOrder[0] ?? 0);
  });
  it('las métricas de investigación sustituyen nombre y correo por seudónimo', async () => {
    const { deps, repository } = setup();
    const result = await getPopulationMetricsUseCase(deps, uid);
    expect(result.rows[0]?.name).toBe(participantCode(uid));
    expect(result.rows[0]?.email).toBeNull();
    expect(result.metrics.total).toBe(1);
    expect(vi.mocked(repository.loadStudents).mock.calls[0]?.[0]).toBe(false);
  });
  it('la ficha agrupa misiones completadas y omitidas por categoría', async () => {
    const { deps } = setup();
    const detail = await getStudentDetailUseCase(deps, uid, uid);
    expect(detail.tasksByCategory).toEqual([{ category: 'social', completed: 1, skipped: 1 }]);
    expect(detail.row.userId).toBe(uid);
    expect(detail.insufficientReason).not.toBeNull();
  });
  it('un estudiante sin consentimiento no genera señales', async () => {
    const { deps, repository } = setup();
    vi.mocked(repository.loadStudents).mockResolvedValue({ ...snapshot, consents: [] });
    const detail = await getStudentDetailUseCase(deps, uid, uid);
    expect(detail.row.consent).toBe('ninguno');
    expect(detail.row.riskLevel).toBeNull();
    expect(detail.explanation).toEqual([]);
  });
});
describe('Exportación consentida', () => {
  it('solo consulta ids cuyo último consentimiento sigue vigente', async () => {
    const { deps, repository } = setup();
    vi.mocked(repository.loadConsents).mockResolvedValue([
      { user_id: 'revocado', consent_version: CONSENT_VERSION, revoked_at: '2026-10-21' },
      { user_id: 'revocado', consent_version: CONSENT_VERSION, revoked_at: null },
      { user_id: 'antiguo', consent_version: 'otra-version', revoked_at: null },
      ...snapshot.consents,
    ]);
    const result = await exportDatasetUseCase(deps, uid, 'checkins');
    expect(repository.loadDataset).toHaveBeenCalledWith('checkins', [uid]);
    expect(result.rows).toBe(1);
    expect(result.filename).toBe('soulsync_checkins.csv');
    expect(result.csv.split('\n')[1]).toBe(`${participantCode(uid)},2026-10-21,4,2,3,4,8`);
    expect(result.csv).not.toContain(uid);
    expect(result.csv).not.toContain('privado@example.com');
  });
  it('sin consentimiento no consulta ningún dataset', async () => {
    const { deps, repository } = setup();
    vi.mocked(repository.loadConsents).mockResolvedValue([]);
    expect(await exportDatasetUseCase(deps, uid, 'checkins')).toEqual({ filename: 'soulsync_checkins.csv', csv: '', rows: 0 });
    expect(repository.loadDataset).not.toHaveBeenCalled();
  });
  it('el resumen omite participantes sin consentimiento y sus identificadores directos', async () => {
    const { deps, repository } = setup();
    vi.mocked(repository.loadStudents).mockResolvedValue({ ...snapshot, profiles: [...snapshot.profiles, { ...snapshot.profiles[0], user_id: 'otro', name: 'No autorizado', level: 1, streak: 0, archetype: null, daily_goal: 3, last_mission_date: null }] });
    const result = await exportDatasetUseCase(deps, uid, 'resumen');
    expect(result.rows).toBe(1);
    expect(result.csv).toContain(`${participantCode(uid)},2,4,insuficiente`);
    expect(result.csv).not.toContain('No autorizado');
    expect(result.csv).not.toContain('Nombre privado');
  });
});
