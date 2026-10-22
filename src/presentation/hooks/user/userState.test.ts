/** Regresiones de datos de presentación y del perfil antes de navegar entre pantallas. */
import { describe, expect, it } from 'vitest';
import type { ProgressPayload } from '@/service/server-functions/progress.functions';
import { mergeProfile, toUserData } from './userState';

const progress: ProgressPayload = {
  profile: { user_id: 'usuario', name: 'Jorge', avatar: 2, archetype: 3, level: 4, xp: 120, coins: 220, gems: 9, streak: 6, last_mission_date: '2026-10-21', onboarded: true, daily_goal: 5, theme: 'light', text_size: 'large' },
  stats: { bienestar: 61, resiliencia: 62, energia: 63, claridad: 64 },
  attributes: { resiliencia: 41, empatia: 42, mindfulness: 43, autoconocimiento: 44, conexion_social: 75, creatividad: 46 },
  history: [{ id: 'registro', mission_id: 'respirar', title: 'Respiración', xp_earned: 35, is_ar: false, completed_at: '2026-10-21T12:00:00Z', completed_date: '2026-10-21' }],
  inventory: ['Escudo'], items: [{ id: 'objeto', item_key: 'escudo', item_name: 'Escudo', quantity: 2, kind: 'consumable', equipped: false }],
  effects: [{ id: 'efecto', item_key: 'escudo', effect: 'streak_shield', magnitude: 1, uses_left: 1, expires_at: null }], achievements: ['primera_mision'],
};
describe('Traducción del progreso', () => {
  it('mantiene los valores reales de progreso y preferencias', () => {
    const user = toUserData(progress);
    expect([user.name, user.avatar, user.archetype, user.level, user.xp, user.coins, user.gems, user.streak]).toEqual(['Jorge', 2, 3, 4, 120, 220, 9, 6]);
    expect(user.settings).toEqual({ theme: 'light', textSize: 'large', dailyGoal: 5, onboarded: true });
    expect(user.stats).toEqual({ bienestar: 61, resiliencia: 62, energia: 63, claridad: 64 });
  });
  it('traduce conexión social sin perder el valor persistido', () => {
    expect(toUserData(progress).attributes.conexionSocial).toBe(75);
  });
  it('mantiene historia, inventario, efectos y logros', () => {
    const user = toUserData(progress);
    expect(user.missionHistory).toEqual([{ id: 'respirar', title: 'Respiración', xp: 35, date: new Date('2026-10-21T12:00:00Z').toDateString() }]);
    expect(user.completedMissions).toEqual(['Respiración']);
    expect(user.items[0]?.quantity).toBe(2);
    expect(user.effects[0]?.uses_left).toBe(1);
    expect(user.achievements).toEqual(['primera_mision']);
  });
  it('sin progreso conserva el estado inicial de la pantalla', () => {
    const user = toUserData(undefined);
    expect(user.name).toBe('Héroe');
    expect(user.archetype).toBeNull();
    expect(user.missionHistory).toEqual([]);
    expect(user.settings.onboarded).toBe(false);
  });
});
describe('Actualización inmediata del perfil', () => {
  it('actualiza nombre y arquetipo sin modificar XP ni el objeto original', () => {
    const updated = mergeProfile(progress, { name: 'Nuevo', archetype: 1 });
    expect(updated?.profile.name).toBe('Nuevo');
    expect(updated?.profile.archetype).toBe(1);
    expect(updated?.profile.xp).toBe(120);
    expect(updated?.history).toBe(progress.history);
    expect(progress.profile.name).toBe('Jorge');
    expect(progress.profile.archetype).toBe(3);
  });
  it('no crea un progreso ficticio si no existe una lectura previa', () => {
    expect(mergeProfile(undefined, { name: 'Nuevo' })).toBeUndefined();
  });
});