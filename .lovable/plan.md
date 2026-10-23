# Aura del avatar, paisajes sonoros, variables pasivas y simulador "¿y si...?"

## 1. Aura del avatar según el autocuidado (2B)
- Regla pura nueva en dominio (`domain/gamification/aura.ts`): calcula un nivel de aura 0–4 a partir de los últimos 7 días: días con check-in, misiones de autocuidado/reflexión/movimiento completadas y racha.
- Niveles: Apagada, Chispa, Brillo, Radiante, Luminosa (nombre + intensidad + color del arquetipo).
- El avatar del Dashboard y el mini avatar 3D del Perfil muestran un halo animado cuya intensidad depende del nivel; texto corto debajo ("Tu aura brilla: 4 días cuidándote").
- Al subir de nivel de aura se registra un hito en la Historia unificada.
- Nunca se "castiga": si baja, solo se atenúa, sin mensajes negativos.

## 2. Paisajes sonoros en respiración y enfoque (2C)
- Generador de sonido en el propio navegador (sin descargar archivos): ruido blanco, ruido rosa, lluvia, olas y tonos binaurales (alfa 10 Hz / theta 6 Hz, con aviso de usar audífonos).
- Control compacto (selector + volumen + apagar) dentro de las misiones de Respiración, Meditación y Temporizador/Pomodoro.
- Se detiene al terminar o salir de la misión; la elección se recuerda en los ajustes del usuario.

## 3a. Variables pasivas (con consentimiento)
- Al guardar el check-in se registran, solo si hay consentimiento vigente: hora local del check-in y segundos que tardó en responderlo.
- Nuevos indicadores en el modelo (versión de variables fv4):
  - `lateCheckin`: proporción de check-ins entre 00:00 y 05:00 (trasnocho).
  - `scheduleIrregularity`: variación de la hora de check-in en 14 días.
  - `responseLatency`: latencia inusual frente a la propia línea base del estudiante.
- Pesos baseline pequeños y documentados; aparecen en la explicación de la IA y en la exportación CSV. Si faltan datos, se marcan "no disponibles" (no afectan la cobertura de forma injusta).
- La ficha del consentimiento menciona explícitamente estas variables.

## 3b. Simulador "¿y si...?" en /admin/metricas
- Panel nuevo (rol investigación y psicología): deslizadores para ánimo, estrés, energía, social, sueño, adherencia, omisiones, autocuidado, trasnocho, etc.
- Ejecuta el mismo modelo real en el navegador y muestra en vivo: puntaje, nivel de riesgo, cobertura y aporte de cada factor (barras riesgo/protector).
- Botones de escenarios predefinidos (semana de parciales, estudiante estable, aislamiento) y "Cargar desde participante" (usa los indicadores seudonimizados del participante elegido).
- No guarda nada; leyenda clara de que es exploratorio y no diagnóstico.

## Pruebas
- Aura: niveles por número de días/misiones; nunca supera 4; sin datos = 0.
- Variables pasivas: check-ins de madrugada, irregularidad, latencia y ausencia de datos.
- Simulador: mismo resultado que la inferencia real para iguales indicadores.

## Detalles técnicos
- Migración: columnas `checkin_local_hour smallint`, `response_seconds int` en `wellbeing_checkins` (nulas, RLS existente).
- `FeatureKey` + `BASELINE_WEIGHTS` ampliados; `FEATURE_VERSION = "fv4"`; actualizar `DATASET_COLUMNS` de checkins.
- `CheckinCard` mide el tiempo desde que se abre hasta enviar y envía `localHour`; zod valida rangos en `saveCheckin`.
- Simulador: función pura `simulate(features)` en `application/research` que construye un `FeatureSet` y llama a `activeModel.predict`.
- Audio: hook `useSoundscape` en presentación con Web Audio API (buffers de ruido + osciladores estéreo para binaurales).
- Actualizar `ARCHITECTURE.md` y `AGENTS.md`.
