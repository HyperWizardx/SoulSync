# Reglas del proyecto

- Code is layered per ARCHITECTURE.md (domain/application/infrastructure/service/presentation/shared); keep dependencies pointing inward — why: Clean Architecture is the thesis' structural requirement.
- `domain/` must not import React, `@/integrations/*`, `infrastructure/`, `service/` or `presentation/` — why: domain stays pure and unit-testable (enforced by ESLint).
- Use cases receive ports via a deps object; Supabase adapters live in `infrastructure/persistence/supabase` and are composed in server functions — why: dependency inversion, tests use in-memory fakes.
- Server functions only authenticate, validate with zod and delegate — why: single responsibility.
- Files carry brief Spanish comments explaining their purpose — why: thesis documentation.
- Access to other users' data is checked server-side via `has_role`; names/emails only for the psychologist role — why: privacy of pilot participants.

- Research admin operations use an injected `AdminRepository` and clock; privileged identity reads are supplied lazily by authenticated service handlers and reached only after psychologist authorization — why: preserves privacy and makes use cases testable without cloud dependencies.
