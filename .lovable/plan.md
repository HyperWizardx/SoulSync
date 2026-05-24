## Mejoras pensadas para el usuario

Cuatro frentes en equilibrio entre impacto visual y funcionalidad.

### 1. Onboarding y primera experiencia
- **Tour guiado** al primer login: 4 pasos con tooltips sobre Dashboard, Misiones, AR y Perfil. Se marca como visto en `profiles.onboarded` (nueva columna) para persistir entre dispositivos.
- **Bienvenida personalizada por arquetipo**: tras elegir clase, pantalla de bienvenida con frase temática (Guerrero: "Tu fuerza despierta…", Sanador: "La calma te guía…", etc.) y misión sugerida acorde.
- **Estado vacío mejorado** en Dashboard y Misiones: ilustraciones con CTA claro en lugar de texto plano.

### 2. Feedback y recompensas
- **Modal de subida de nivel** con animación (confeti + escala del avatar 3D + sonido opcional) en lugar del simple toast actual.
- **Sistema de logros/badges**: nueva tabla `achievements` (ej. "Primera racha de 7 días", "10 misiones AR", "Maestro de la respiración"). Notificación al desbloquear.
- **Animación de recompensa** al completar misión: +XP/+monedas flotando hacia el header con números animados.
- **Haptics** (`navigator.vibrate`) en interacciones clave en móvil.

### 3. Accesibilidad y usabilidad
- **Toggle tema claro/oscuro** en Perfil, persistido en `localStorage` y `prefers-color-scheme` por defecto.
- **Tamaño de texto** ajustable (Normal / Grande / Muy grande) aplicado vía CSS root variable.
- **Mejor contraste**: revisar `text-muted-foreground` sobre fondos translúcidos y asegurar AA.
- **aria-labels** en todos los botones-ícono (BottomNav, cerrar modales, X en AR).
- **Tap targets** mínimos de 44px en navegación móvil.
- **Focus visible** consistente en links y botones.

### 4. Personalización y progreso
- **Gráfico de evolución semanal** en Perfil: línea con XP ganado los últimos 7 días (usando Recharts ya disponible) leyendo de `mission_completions`.
- **Meta diaria** configurable (ej. 3 misiones/día) con barra de progreso en Dashboard y check al cumplirla.
- **Racha visible y motivadora**: tarjeta destacada con próxima recompensa por mantener la racha (a los 3/7/14/30 días).
- **Resumen del día** al abrir la app: "Hoy completaste X misiones, +Y XP".

### 5. Misiones — pulir y ampliar
**Pulir las 8 existentes:**
- Instrucciones más claras al iniciar (modal previo con objetivo + recompensa esperada).
- Transiciones suaves entre pasos (Quiz, Journal).
- Botón "Pausar" en Breathing y Timer.
- Feedback visual al completar (animación, no solo toast).

**Añadir 3 nuevas misiones:**
- **Meditación guiada** (5 min con audio TTS de instrucciones).
- **Reto diario aleatorio**: una micro-misión rotativa cada día (ej. "Sonríe a un desconocido", "Escribe 1 cosa nueva sobre ti").
- **Caminata consciente AR**: contador de pasos (usa `DeviceMotion`) + avatar que crece a medida que caminas.

### Cambios técnicos

**Base de datos** (nueva migración):
- `profiles.onboarded` (boolean), `profiles.daily_goal` (int, default 3), `profiles.theme` (text), `profiles.text_size` (text).
- Tabla `achievements`: `id`, `user_id`, `code`, `unlocked_at`. RLS por usuario.
- Función `check_achievements()` que se llama desde `completeMissionServer` para detectar y otorgar logros.

**Server functions** (`progress.functions.ts`):
- `updateSettings({ theme, textSize, dailyGoal, onboarded })`.
- `getWeeklyStats()` agrupa XP por día últimos 7 días.
- `completeMissionServer` extendido: devuelve `unlockedAchievements[]`.

**Frontend nuevo:**
- `src/components/OnboardingTour.tsx`
- `src/components/LevelUpModal.tsx` (con confetti via `canvas-confetti`)
- `src/components/AchievementToast.tsx`
- `src/components/FloatingReward.tsx`
- `src/components/WeeklyChart.tsx`
- `src/components/DailyGoalCard.tsx`
- `src/lib/achievements.ts` (catálogo de logros)
- `src/lib/haptics.ts`
- `src/hooks/useTheme.ts`, `src/hooks/useTextSize.ts`
- `src/components/missions/MeditationMission.tsx`
- `src/components/missions/DailyChallengeMission.tsx`
- `src/components/missions/ARWalkMission.tsx`

**Modificaciones:**
- `__root.tsx`: aplica tema y tamaño de texto, monta tour.
- `dashboard.tsx`: meta diaria, resumen del día, racha mejorada.
- `profile.tsx`: toggle tema, tamaño texto, gráfico semanal, lista logros.
- `missions.tsx`: instrucciones previas, nuevas misiones.
- `useUserStore.ts`: integra settings y achievements.
- `BottomNav.tsx` y modales AR: aria-labels.

**Dependencia nueva:** `canvas-confetti` (ligera, ~5kb).

### Orden de implementación
1. Migración DB (onboarded, daily_goal, theme, text_size, achievements).
2. Server functions + catálogo de logros.
3. Onboarding tour + bienvenida por arquetipo.
4. Modal level-up con confetti + achievement toasts + floating rewards.
5. Tema/tamaño texto + aria-labels + tap targets.
6. Meta diaria + gráfico semanal + racha.
7. Pulido misiones existentes + 3 nuevas misiones.

¿Apruebas el plan o quieres recortar/priorizar algún bloque?