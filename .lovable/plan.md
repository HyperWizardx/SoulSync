# Dashboard real + Zonas funcionales

## 1. Check-in solo en IA

- Quitar la tarjeta de check-in del Dashboard (hoy se renderiza dentro del bloque "Tu estado integral").
- El Dashboard conserva únicamente un resumen de la señal: si falta el check-in de hoy, muestra un aviso con enlace directo a Predicción de bienestar.
- El check-in editable sigue existiendo solo en el apartado IA.

## 2. Métricas del Dashboard derivadas de actividad real

- Las cuatro métricas (Bienestar, Resiliencia, Energía, Claridad) se recalculan a partir de datos reales del usuario en vez de quedarse en los valores iniciales:
  - misiones completadas por categoría en los últimos 7 y 30 días,
  - racha actual y cumplimiento de meta diaria,
  - check-ins recientes (ánimo, estrés, energía, social, sueño).
- Cada métrica muestra debajo una línea corta de origen ("7 misiones esta semana", "3 check-ins registrados") para que el número sea trazable.
- Cuando no hay actividad suficiente, la métrica se muestra como "Sin datos aún" con enlace a Misiones, en lugar de un porcentaje inventado.
- El bloque "Tu Mundo Emocional" deja de decir "Valle de la Calma" fijo: mostrará la estación y zona activa reales.

## 3. Zonas funcionales en Mundo

- Cada zona pasa a ser un elemento pulsable que abre una vista de detalle (hoja inferior):
  - progreso real de la zona y qué actividad lo hace subir,
  - lista de misiones recomendadas de la temática de esa zona,
  - botón para iniciar una misión, que lleva a Misiones con esa misión abierta.
- Zonas bloqueadas: al tocarlas se explica el nivel requerido y cuánto falta para alcanzarlo.
- Se define la relación zona → categorías de misión:
  - Valle de la Calma → autocuidado
  - Bosque Interior → reflexión
  - Mar de Emociones → social
  - Montaña de Fuerza → movimiento y AR
- Completar una misión desde una zona actualiza su progreso al volver, usando la misma fuente de datos que ya alimenta el mundo.

## Detalles técnicos

- `src/components/wellbeing/IntegratedStatus.tsx`: eliminar `CheckinCard`; añadir aviso enlazado a `/ai`.
- Nuevo `src/lib/wellbeing/metrics.ts`: función pura `deriveUserMetrics(missionHistory, checkins, streak, dailyGoal)` que devuelve valor + cobertura por métrica; pruebas unitarias en `metrics.test.ts` (casos: sin datos, solo misiones, solo check-ins, combinado).
- Dashboard consume estas métricas derivadas (misma fuente que `useWellbeing` + `useUserStore`), sin cambiar la escritura de `user_stats`.
- `src/lib/wellbeing/world.ts`: extender `ZONE_CATALOG` con `categories` y `missionIds`; sin cambios en el cálculo de vitalidad/armonía.
- `src/routes/world.tsx`: zonas como botones + `Sheet` de detalle con misiones de esa categoría desde `missionsData.ts`; navegación a `/missions` con `search: { mission: id }`.
- `src/routes/missions.tsx`: leer `search.mission` y abrir esa misión automáticamente.
- Sin migraciones de base de datos: todo se deriva de las tablas existentes.
