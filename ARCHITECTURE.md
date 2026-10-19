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
