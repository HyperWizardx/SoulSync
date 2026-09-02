# Perfil real, logros ampliados y objetos con efecto

Objetivo: que /profile deje de mostrar datos decorativos y quede conectado al progreso real, ampliar el catálogo de logros con recompensas, y que los objetos de la tienda (mayoría consumibles) afecten misiones y Mundo al usarse.

## 1. Perfil conectado a datos reales

- **Trofeos**: el botón actual solo muestra un toast. Se convierte en una sección "Trofeos" con: nivel, XP total acumulado, racha actual y mejor racha, misiones totales, misiones AR, días activos y check-ins registrados; todo calculado en el servidor a partir de `mission_completions`, `profiles` y `wellbeing_checkins`.
- **Atributos**: cada atributo muestra, además del valor, su trazabilidad real: cuántas misiones de la categoría que lo alimenta se completaron (últimos 30 días), variación respecto a la semana anterior, y qué misiones lo suben (enlace directo a /missions filtrado por categoría).
- **Inventario**: nueva tarjeta con los objetos comprados, su estado (activo / disponible / usado) y botón para usarlos o equiparlos.

## 2. Logros ampliados (de 11 a ~34) con recompensas

Nuevas familias, todas evaluadas con datos reales ya existentes:

- Constancia: rachas 3/7/14/30/60.
- Volumen: 1/10/25/50/100/250 misiones.
- Categorías: 10 misiones de movimiento, reflexión, autocuidado, social y cognitivo (cada una su logro), más "Equilibrio" (al menos 5 de cada categoría).
- AR: 1/5/15/30 misiones AR.
- Nivel: 5/10/20/30.
- Bienestar: 7/30 check-ins, primera predicción generada, 7 días seguidos cumpliendo la meta diaria.
- Mundo: desbloquear 2, 4 y todas las zonas.
- Tienda: primera compra, 5 objetos, primer objeto usado.

Cada logro tiene rareza (común / raro / épico / legendario) y recompensa en XP + monedas + gemas según rareza, otorgada por el servidor al desbloquearse (idempotente: solo la primera vez). En la UI: filtros (todos / desbloqueados / pendientes), barra de progreso por logro ("7/10 misiones sociales"), rareza con color y animación de confetti + toast celebratorio con la recompensa recibida.

## 3. Tienda con efecto real (mayoría consumibles)

El catálogo se reorganiza en consumibles (mayoría) y unos pocos permanentes:

Consumibles (se compran, se acumulan, se usan y se gastan):
- Poción de Calma: +2 misiones con bonus de mindfulness y reduce el efecto de estrés en el Mundo por 24 h.
- Elixir de Energía: x1.5 XP en las siguientes 3 misiones.
- Escudo Emocional: protege la racha si un día no completas misiones (se consume automáticamente).
- Tónico de Enfoque: duplica monedas de las siguientes 2 misiones.
- Semilla de Vitalidad: +10 vitalidad inmediata en el Mundo.
- Incienso de Armonía: +10 armonía en el Mundo por 24 h.

Permanentes (equipables, máximo 2 a la vez):
- Corona de Empatía: +8 empatía mientras esté equipada.
- Aura Dorada: cambia el aura del avatar y +5 % XP permanente.
- Orbe de Sabiduría: +8 autoconocimiento equipado.

Efectos aplicados en el servidor al completar misión (multiplicadores de XP/monedas, bonus de atributos) y al recalcular el Mundo (vitalidad/armonía). Cada uso queda registrado en el timeline unificado, para que la IA predictiva y el Mundo reflejen la acción.

## Detalles técnicos

- **Migración**: `inventory` gana `quantity`, `kind` (consumible/permanente), `equipped`; nueva tabla `item_effects` (user_id, item_key, effect, magnitude, uses_left, expires_at) con RLS por `auth.uid()` y GRANT a `authenticated`/`service_role`. Nueva tabla `achievement_rewards` no es necesaria: la recompensa se calcula desde el catálogo y se marca en `achievements`.
- **Catálogo compartido**: `src/lib/items.ts` (definición de objetos, efectos, precios) y `src/lib/achievements.ts` ampliado con rareza, recompensa y función de progreso.
- **Servidor**: `src/lib/progress.functions.ts` — nuevas fns `getProfileSummary`, `useItem`, `toggleEquip`; `completeMissionServer` consulta efectos activos antes de aplicar XP/monedas/atributos y consume usos; evaluación de logros extendida con las nuevas reglas y otorgamiento de recompensas.
- **Mundo**: `src/lib/wellbeing/world.ts` suma los bonus de vitalidad/armonía activos al recomputar el estado.
- **UI**: `src/routes/profile.tsx` (trofeos, atributos con trazabilidad, inventario, logros con filtros y progreso), `src/routes/store.tsx` (cantidades, consumibles vs permanentes, botón usar/equipar).
- **Pruebas**: unitarias para el cálculo de progreso de logros y para la aplicación de efectos de objetos.
