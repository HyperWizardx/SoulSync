# Reglas del proyecto

- Code is layered per ARCHITECTURE.md (domain/application/infrastructure/service/presentation/shared); keep dependencies pointing inward — why: Clean Architecture is the thesis' structural requirement.
- `domain/` must not import React, `@/integrations/*`, `infrastructure/`, `service/` or `presentation/` — why: domain stays pure and unit-testable (enforced by ESLint).
- Use cases receive ports via a deps object; Supabase adapters live in `infrastructure/persistence/supabase` and are composed in server functions — why: dependency inversion, tests use in-memory fakes.
- Server functions only authenticate, validate with zod and delegate — why: single responsibility.
- Files carry brief Spanish comments explaining their purpose — why: thesis documentation.
- Access to other users' data is checked server-side via `has_role`; names/emails only for the psychologist role — why: privacy of pilot participants.

- Research admin operations use an injected `AdminRepository` and clock; privileged identity reads are supplied lazily by authenticated service handlers and reached only after psychologist authorization — why: preserves privacy and makes use cases testable without cloud dependencies.
- Keep `useUserStore` as a compatibility facade over presentation hooks for progress queries, profile/settings, missions and inventory; retain query keys and immediate profile cache updates — why: separates responsibilities without breaking consumers or onboarding navigation.

- Shared mission reward and attribute contracts live in domain/gamification/rewards and are re-exported by the presentation facade — why: domain consumers must not import presentation types.
- Passive check-in signals are optional model features excluded from coverage when missing — why: users without that data must not get a weaker signal.
- The admin what-if simulator calls the active model through `application/research/simulate.ts` and never persists — why: explainability must match real inference exactly.
- The active wellbeing model is `domain/wellbeing/decision.ts`, which wraps the logistic baseline with personal baseline, protective factors, academic calendar, safety rules, confidence and hysteresis; callers pass previous levels and exam period as `DecisionContext` — why: decision rules stay pure, testable and identical for students, admins and the simulator.
- Admin dashboard series are computed by the pure `domain/research/dashboard.ts` from consented data only — why: charts for both roles share one tested aggregation and never leak non-consented data.
