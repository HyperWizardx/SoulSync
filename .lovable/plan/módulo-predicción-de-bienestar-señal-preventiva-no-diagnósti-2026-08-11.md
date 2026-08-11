# Módulo "Predicción de bienestar" (señal preventiva, no diagnóstico)

Objetivo: añadir a SoulSync un módulo de detección temprana exploratoria, explicable y ML-ready, sin tocar gamificación, misiones, avatar ni navegación existentes.

## 1. Estado actual (verificado)

- Datos reales disponibles hoy: `profiles` (nivel, xp, racha, meta diaria, last_mission_date), `user_stats` (bienestar, resiliencia, energía, claridad), `user_attributes`, `mission_completions` (con fecha), `achievements`, `inventory`.
- No existe hoy ninguna tabla de check-ins emocionales ni de escalas validadas. El mood de la pantalla IA es solo estado local.
- `src/routes/ai.tsx` es 100% mock (biométricas y log de IA inventados). Se reemplaza su contenido por el módulo real; lo simulado se retira o se marca explícitamente como demo.
- Backend: server functions TanStack + Supabase con RLS por `auth.uid()`. No se añaden servicios nuevos.

## 2. Arquitectura

```text
check-ins + telemetría de misiones + stats
        │
        ▼
features.ts        extracción + normalización (featureVersion)
        │
        ▼
inference.ts       interfaz WellbeingModel { predict(features) }
        │  └─ baselineLogistic.ts  (prototipo transparente, modelVersion "baseline-logistic-v1")
        ▼
explain.ts         contribuciones por feature → top factores
        │
        ▼
wellbeing.functions.ts  (server fn autenticada) → persiste en wellbeing_predictions
        │
        ▼
UI: /insights (pantalla) + card compacta en dashboard
```

Separación estricta: cálculo puro y testeable en `src/lib/wellbeing/*` (sin Supabase, sin React); acceso a datos y persistencia solo en la server function.

Sustituir el baseline por un modelo entrenado será cambiar una implementación de `WellbeingModel` y subir `modelVersion`; features y UI no cambian.

## 3. Datos nuevos (migración)

- `wellbeing_checkins`: `user_id`, `mood` (1–5), `stress` (1–5), `sleep_hours` (numérico, opcional), `energy` (1–5), `social` (1–5), `note` opcional (texto libre corto, opcional y desactivable), `created_at`, `checkin_date`. RLS: solo el dueño lee/escribe. Único por usuario y día.
- `wellbeing_scales`: resultados de escalas validadas solo si el investigador las habilita: `scale_code`, `raw_score`, `answered_at`. Se deja la tabla creada pero sin ítems clínicos precargados (no se inventan instrumentos ni puntos de corte).
- `wellbeing_predictions`: `user_id`, `model_version`, `feature_version`, `score` (0–1), `risk_level` (`bajo|moderado|alto`), `features` (jsonb agregado, solo agregados numéricos), `explanation` (jsonb: factores y peso), `generated_at`, `consent_version`.
- `research_consent`: `user_id`, `consent_version`, `accepted_at`, `revoked_at`, `wearables_opt_in` (bool). Sin consentimiento activo no se calcula ni se guarda ninguna predicción.
- Todas con GRANT a `authenticated` + `service_role`, RLS por `auth.uid()`, sin acceso `anon`. No se guardan textos libres dentro de `features` ni de `explanation`.

## 4. Baseline (prototipo, etiquetado como tal)

Score logístico con pesos fijados por criterio, no entrenados:

`z = b0 + Σ wi · xi`, `score = 1/(1+e^-z)`

Features (`featureVersion: "fv1"`), todas normalizadas a 0–1 y con flag de disponibilidad:
- `moodTrend7`: media móvil 7 días de mood y su pendiente vs 7 días previos.
- `stressLevel7`: media de estrés autorreportado.
- `sleepDeficit`: solo si hay horas de sueño reportadas o wearable.
- `engagementDrop`: caída de misiones completadas 7d vs 14d previos.
- `missionAdherence`: cumplimiento de meta diaria.
- `socialInteraction`: autorreporte de conexión social.
- `streakBreak`: ruptura de racha reciente.
- `scaleScore`: normalizado, solo si existe registro real en `wellbeing_scales`.

Reglas de integridad:
- Cada feature ausente se marca `available:false` y se excluye del score con renormalización de pesos; se reporta `coverage`.
- Si `coverage < 0.5` o hay menos de 3 check-ins en 14 días → estado `insuficiente`, sin nivel de riesgo.
- Umbrales: `<0.35` Bajo, `0.35–0.65` Moderado, `>0.65` Alto. Documentados como heurísticos y calibrables.

Explicación: contribución = `wi · xi` normalizada; se devuelven los 3 factores principales al alza y a la baja con texto no clínico.

## 5. Flujo de predicción

1. Usuario acepta consentimiento informado (pantalla dedicada, versionada, revocable con borrado de predicciones).
2. Check-in diario breve (mood, estrés, sueño opcional, energía, social) desde dashboard o `/insights`.
3. Server fn `computeWellbeingPrediction` autenticada: lee 30 días de check-ins + telemetría → extrae features → infiere → explica → guarda fila en `wellbeing_predictions`.
4. `/insights` muestra: nivel, probabilidad con lenguaje probabilístico, factores contribuyentes, tendencia histórica (Recharts, ya instalado), recomendaciones de autocuidado no clínicas ligadas a misiones existentes, y aviso permanente: señal preventiva, no diagnóstico.
5. Riesgo Alto: banner de seguridad con recomendación de contactar bienestar universitario / apoyo profesional y línea de ayuda que el usuario/tesista configure (no se inventan números). Sin tratamiento ni indicación clínica.

## 6. Archivos

Nuevos:
- `src/lib/wellbeing/types.ts`, `features.ts`, `baselineLogistic.ts`, `inference.ts`, `explain.ts`, `copy.ts` (textos y disclaimers), `index.ts`
- `src/lib/wellbeing/__tests__/features.test.ts`, `baselineLogistic.test.ts`
- `src/lib/wellbeing.functions.ts` (server fns: consentimiento, check-in, predicción, histórico)
- `src/components/wellbeing/CheckinCard.tsx`, `RiskGauge.tsx`, `FactorList.tsx`, `SafetyBanner.tsx`, `ConsentDialog.tsx`, `InsightsCard.tsx`
- `src/routes/insights.tsx`
- `src/routes/consent.tsx` (información del estudio y consentimiento)

Modificados:
- `src/routes/ai.tsx`: sustituye los datos biométricos falsos por el módulo real; wearables quedan como sección "no conectado".
- `src/routes/dashboard.tsx`: añade check-in del día + `InsightsCard`.
- `src/components/BottomNav.tsx`: la entrada IA apunta al módulo predictivo.
- `src/hooks/useUserStore.ts`: sin cambios de lógica de juego; solo expone estado de consentimiento si hace falta.
- `package.json`: añadir `vitest` (dev) si no existe runner.

## 7. Pruebas

- Normalización de cada feature: límites, valores fuera de rango, nulos.
- Renormalización de pesos con features ausentes; `coverage` correcto.
- Casos límite: 0 check-ins, 1 check-in, datos constantes, caída brusca de engagement, todo óptimo, todo adverso.
- Monotonía: aumentar estrés o bajar mood nunca reduce el score.
- Umbrales exactos en las fronteras 0.35 y 0.65.
- Explicación: suma de contribuciones consistente y determinismo (mismo input → mismo output).
- Estado `insuficiente` no produce `risk_level`.

## 8. Riesgos y limitaciones (a documentar en la app y en la tesis)

- Sin dataset etiquetado no hay validación clínica: pesos por criterio, no aprendidos; sin sensibilidad/especificidad conocidas.
- Riesgo de falsos positivos/negativos; el módulo no sustituye evaluación profesional.
- Autorreporte sesgado y muestra pequeña (30–50) no generalizable.
- Datos sensibles: minimización, consentimiento versionado, revocación con borrado, sin PII en logs.
- Wearables: solo si el usuario los conecta; hoy queda como interfaz preparada, no simulada.

## 9. Seguridad

- Nada de secretos en el repo; todo cálculo sensible en server functions con `requireSupabaseAuth`.
- Sin `console.log` de check-ins, notas ni features.
- RLS por usuario en todas las tablas nuevas, sin acceso `anon`.

¿Apruebas este plan o quieres ajustar umbrales, features o el alcance de las escalas validadas?
