// Pruebas del laboratorio de modelos: permisos, entrenamiento con datos sintéticos y registro.
import { describe, expect, it, vi } from 'vitest';
import { CONSENT_VERSION } from '@/domain/wellbeing/types';
import type { AdminAccess, AdminDeps, AdminRepository, TrainingSnapshot } from '@/domain/research/ports';
import { getModelLabUseCase, historiesFrom, trainCompassUseCase } from './modelLab';

const day = (offset: number) => new Date(Date.parse('2026-06-01T12:00:00Z') + offset * 86_400_000).toISOString().slice(0, 10);

/** 12 estudiantes con 5 pergaminos cada uno; el bienestar bajo depende del sueño. */
function snapshot(): TrainingSnapshot {
  const snap: TrainingSnapshot = { profiles: [], consents: [], checkins: [], missions: [], tasks: [], scales: [], participants: [] };
  for (let i = 0; i < 12; i++) {
    const id = `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
    snap.profiles.push({ user_id: id, archetype: i % 4, daily_goal: 1 });
    snap.consents.push({ user_id: id, consent_version: CONSENT_VERSION, revoked_at: null });
    if (i < 6) snap.participants.push({ user_id: id, age_band: '20-24', gender: i % 2 ? 'mujer' : 'hombre', semester_band: '4-6' });
    for (let p = 0; p < 5; p++) {
      const poor = (i + p) % 3 === 0;
      for (let d = 0; d < 14; d++) {
        const date = day(p * 14 + d);
        snap.checkins.push({ user_id: id, checkin_date: date, mood: 3, stress: 3, energy: 3, social: 3, sleep_hours: poor ? 4.5 : 8 });
        if (d % 2 === 0) snap.missions.push({ user_id: id, completed_date: date });
      }
      snap.scales.push({ user_id: id, scale_code: 'WHO5', raw_score: poor ? 8 : 18, max_score: 25, answered_at: `${day(p * 14 + 13)}T20:00:00Z` });
    }
  }
  // Un estudiante sin consentimiento vigente no entra al entrenamiento.
  snap.profiles.push({ user_id: 'sin-consentimiento', archetype: 0, daily_goal: 1 });
  return snap;
}

function setup(access: AdminAccess, snap: TrainingSnapshot) {
  const repository = {
    readAccess: vi.fn(async () => access),
    loadTrainingSnapshot: vi.fn(async () => snap),
    loadCompassVersions: vi.fn(async () => []),
    saveCompass: vi.fn(async () => {}),
    activateCompass: vi.fn(async () => {}),
  } as unknown as AdminRepository;
  const deps: AdminDeps = { repository, now: () => new Date('2026-11-10T15:00:00Z') };
  return { deps, repository };
}

const researcher = { psicologo: false, investigador: true, isAdmin: true };

describe('laboratorio de modelos', () => {
  it('solo el rol de investigación entrena o ve el laboratorio', async () => {
    const { deps, repository } = setup({ psicologo: true, investigador: false, isAdmin: true }, snapshot());
    await expect(trainCompassUseCase(deps, 'p')).rejects.toThrow(/Acceso restringido/);
    await expect(getModelLabUseCase(deps, 'p')).rejects.toThrow(/Acceso restringido/);
    expect(repository.loadTrainingSnapshot).not.toHaveBeenCalled();
  });

  it('solo usa estudiantes con consentimiento vigente y les asigna su subgrupo', () => {
    const histories = historiesFrom(snapshot());
    expect(histories).toHaveLength(12);
    expect(histories[1].group).toEqual({ archetype: '1', gender: 'mujer', ageBand: '20-24', semesterBand: '4-6' });
    expect(histories[11].group.gender).toBeUndefined();
  });

  it('entrena, compara, audita y registra la brújula inactiva', async () => {
    const { deps, repository } = setup(researcher, snapshot());
    const report = await trainCompassUseCase(deps, 'r');
    expect(report.n).toBe(60);
    expect(report.version).toBe('brujula-map-20261110-1500');
    expect(report.cv?.trained.logLoss).toBeLessThan(report.cv!.expert.logLoss);
    expect(report.equity?.trained.attributes.find((a) => a.key === 'archetype')?.evaluable).toBe(true);
    expect(repository.saveCompass).toHaveBeenCalledWith(expect.objectContaining({ version: report.version, metrics: report }));
  });

  it('sin datos no registra nada y explica por qué', async () => {
    const empty: TrainingSnapshot = { profiles: [], consents: [], checkins: [], missions: [], tasks: [], scales: [], participants: [] };
    const { deps, repository } = setup(researcher, empty);
    const report = await trainCompassUseCase(deps, 'r');
    expect(report.version).toBeNull();
    expect(report.gate.ready).toBe(false);
    expect(repository.saveCompass).not.toHaveBeenCalled();
  });

  it('el laboratorio resume datos, pronóstico y versión activa', async () => {
    const { deps } = setup(researcher, snapshot());
    const lab = await getModelLabUseCase(deps, 'r');
    expect(lab.active).toBe('decision-v4');
    expect(lab.activeParams).toBeNull();
    expect(lab.dataset).toEqual({ samples: 60, positives: 20, students: 12, withProfile: 6 });
    expect(lab.forecast.students).toBe(0); // los registros sintéticos son de hace más de 90 días
  });
});
