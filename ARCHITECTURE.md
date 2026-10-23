# Arquitectura de SoulSync

SoulSync sigue **Clean Architecture** con **Diseño Guiado por el Dominio (DDD)** y principios **SOLID**.

## Capas (`src/`)

| Capa | Carpeta | Responsabilidad | Puede depender de |
|---|---|---|---|
| Dominio | `domain/` | Reglas puras: entidades, modelo predictivo, logros, objetos, puertos | `shared/` |
| Aplicación | `application/` | Casos de uso que orquestan el dominio vía puertos | `domain/`, `shared/` |
| Infraestructura | `infrastructure/` | Adaptadores de Lovable Cloud que implementan puertos | `domain/`, `application/` (tipos), `shared/` |
| Servicio | `service/` | Server functions y herramientas MCP: autentican, validan y delegan | todas menos `presentation/` |
| Presentación | `presentation/`, `routes/`, `components/ui/` | Pantallas, componentes y hooks de React | `service/`, `domain/` (tipos y reglas puras), `shared/` |
| Transversal | `shared/`, `lib/utils.ts` | Utilidades: feedback, háptica, clases CSS | nada |

```text
Presentación ─► Servicio ─► Aplicación ─► Dominio ◄─ Infraestructura
                    └──────── compone ───────────────────┘
```

## Contextos delimitados (`domain/<contexto>`)

- `identity` — arquetipos/avatar, perfil, roles.
- `gamification` — misiones, logros, objetos y efectos.
- `wellbeing` — consentimiento, features, baseline logístico, explicabilidad, tendencia, puertos.
- `world` — estado del Mundo y zonas.
- `research` — agregación poblacional, seudonimización y CSV del panel admin.

## SOLID en el código

- **S**: cada server function solo valida y delega; cada caso de uso hace una acción (`application/wellbeing/useCases.ts`).
- **O**: `WellbeingModel` permite añadir un modelo entrenado sin modificar la UI (`domain/wellbeing/inference.ts`).
- **L**: cualquier adaptador que cumpla un puerto es intercambiable (los tests usan dobles en memoria).
- **I**: puertos pequeños (`ConsentRepository`, `WellbeingEventRepository`, `WellbeingReader`).
- **D**: los casos de uso reciben dependencias; la composición ocurre en `buildWellbeingDeps`.

## Ubicaciones fijas por el framework

`routes/`, `router.tsx`, `start.ts`, `integrations/` (autogenerado) y `components/ui/` (shadcn) no se mueven.

## Pruebas

`bunx vitest run` — dominio (reglas, modelo, métricas, objetos, agregación) y aplicación (casos de uso con repositorios simulados).

## Gamificación (progreso, misiones, tienda)

- Dominio: `domain/gamification/progression.ts` (XP por nivel, racha y escudo, atributos 0–100, efectos activos).
- Aplicación: `application/gamification/completeMission.ts` (cálculo puro del resultado de una misión).
- Infraestructura: `infrastructure/persistence/supabase/gamificationRepository.ts` (contexto y entrega de logros, consumo de usos).
- Servicio: `progress.functions.ts` (perfil/ajustes/estadísticas), `missions.functions.ts` (completar misión), `store.functions.ts` (comprar/usar/equipar).

## Investigación (panel de administración)

- Dominio: `domain/research/ports.ts` define roles, contratos de lectura y campos permitidos para exportación; `aggregate.ts` mantiene agregación y CSV puros.
- Aplicación: `application/research/useCases.ts` comprueba roles por petición y orquesta listados, ficha, métricas y exportación mediante un repositorio inyectado y un reloj sustituible.
- Infraestructura: `infrastructure/persistence/supabase/adminRepository.ts` implementa las consultas y su mapeo; el cliente para leer correos se entrega como función diferida desde el servicio.
- Servicio: `admin.functions.ts` autentica, valida entradas con Zod y compone las dependencias. Conserva los nombres y payloads públicos utilizados por las pantallas.
- Pruebas: `application/research/useCases.test.ts` usa un repositorio simulado para comprobar roles independientes, identidad solo para psicología y exportación del último consentimiento vigente.

## Estado del usuario en Presentación

- `presentation/hooks/useUserStore.ts` es una fachada compatible: conserva sus exportaciones y compone los hooks especializados sin cambiar las pantallas consumidoras.
- `hooks/user/userState.ts` define el modelo visible y traduce el contrato de progreso; no consulta la nube ni calcula recompensas de negocio.
- `useProgressQueries.ts` concentra lectura, consultas de resumen/semana y migración local heredada, siempre condicionadas a la sesión.
- `useProfileActions.ts`, `useMissionActions.ts` y `useInventoryActions.ts` separan identidad/ajustes, misiones y objetos. Conservan las claves de consultas y la actualización inmediata del perfil antes de navegar.
- Las reglas de recompensas y permisos permanecen en las capas interiores; los hooks solo coordinan llamadas, caché y avisos visuales.
- `userState.test.ts` comprueba la traducción de datos reales y la actualización del perfil sin alterar el progreso original.

Los contratos compartidos de recompensas y atributos se definen en `domain/gamification/rewards.ts`; presentación los reexporta para conservar compatibilidad sin dependencias hacia fuera del dominio.
