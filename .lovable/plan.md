# Reorganización de SoulSync: DDD + Clean Architecture + SOLID

Objetivo: reorganizar el código sin cambiar el comportamiento visible de la app. Todo lo que el usuario ve (pantallas, misiones, IA, tienda, panel admin) sigue funcionando igual; cambia la organización interna para que sea defendible en la tesis.

## Capas y regla de dependencias

```text
Presentación  ──► Aplicación ──► Dominio
     │               ▲
     ▼               │
  Servicio  ─────────┘        Infraestructura ──► implementa puertos del Dominio
Transversal: usable por todas las capas (no depende de ninguna)
```

- **Dominio**: reglas puras del negocio (sin React, sin base de datos). Testeable al 100%.
- **Aplicación**: casos de uso que orquestan el dominio mediante interfaces (puertos).
- **Infraestructura**: implementaciones concretas (Lovable Cloud, repositorios, cámara/AR, almacenamiento local).
- **Servicio**: la frontera expuesta: server functions, herramientas MCP, rutas API.
- **Presentación**: rutas, componentes, hooks de UI.
- **Transversal**: utilidades compartidas (logging, errores, fechas, háptica, feedback, tipos comunes).

## Contextos delimitados (bounded contexts)

1. **identity** — sesión, perfil, avatar/arquetipo, roles (psicólogo/investigador).
2. **gamification** — misiones, XP, niveles, atributos, rachas, logros, tienda/objetos, efectos.
3. **wellbeing** — consentimiento, check-ins, escalas, features, modelo predictivo, explicabilidad, tendencia, timeline.
4. **world** — estado del Mundo y zonas.
5. **research** (admin) — lista de estudiantes, ficha, métricas poblacionales, exportación CSV.

## Estructura propuesta

```text
src/
  domain/<contexto>/        entidades, value objects, reglas, puertos (interfaces de repositorio)
  application/<contexto>/   casos de uso (CompleteMission, SaveCheckin, PredictWellbeing, ExportDataset...)
  infrastructure/
    persistence/supabase/   repositorios que implementan los puertos
    integrations/supabase/  (se mantiene en su ruta actual: archivos autogenerados)
    device/                 cámara, acelerómetro, almacenamiento local
  service/
    server-functions/       *.functions.ts delgados: validan entrada, inyectan repos, llaman caso de uso
    mcp/                    herramientas MCP
  presentation/
    components/ (missions, wellbeing, admin, avatars, layout, ui)
    hooks/
  shared/                   capa transversal: utils, errores, fechas, feedback, haptics
  routes/                   se mantiene (TanStack lo exige); cada ruta solo compone presentación
```

## Aplicación de SOLID

- **S**: dividir `progress.functions.ts` (30 KB) y `useUserStore.ts` en casos de uso y hooks por responsabilidad.
- **O**: el modelo predictivo ya usa la interfaz `WellbeingModel`; extender igual para efectos de objetos y logros (registro de estrategias).
- **L**: cualquier modelo/repositorio sustituible respeta el mismo contrato (p. ej. modelo entrenado futuro).
- **I**: puertos pequeños por contexto (`CheckinRepository`, `MissionRepository`, `RoleRepository`...).
- **D**: los casos de uso reciben repositorios por parámetro; solo la capa de Servicio conoce Lovable Cloud.

## Fases (cada una deja la app funcionando)

1. Crear capas `shared/` y `domain/` moviendo la lógica pura (wellbeing, achievements, items, archetype, metrics, world, aggregate) + tests.
2. Definir puertos e implementar repositorios en `infrastructure/`.
3. Extraer casos de uso a `application/` desde progress, wellbeing y admin functions.
4. Adelgazar server functions y MCP en `service/`.
5. Mover componentes y hooks a `presentation/`; dividir `useUserStore`.
6. Documentación: `ARCHITECTURE.md` (diagrama de capas, contextos, decisiones) y reglas en `AGENTS.md`; regla de lint que impida importaciones prohibidas entre capas (p. ej. dominio → infraestructura).

## Detalles técnicos

- Alias de importación: `@/domain`, `@/application`, `@/infrastructure`, `@/service`, `@/presentation`, `@/shared`.
- `src/routes/`, `src/router.tsx`, `src/start.ts`, `src/integrations/supabase/*` y `components/ui` (shadcn) permanecen en su sitio por exigencia del framework/autogeneración.
- Sin cambios en base de datos ni en la interfaz.
- Verificación al cerrar cada fase: typecheck limpio y las ~57 pruebas actuales en verde; se añaden pruebas de casos de uso con repositorios simulados.
