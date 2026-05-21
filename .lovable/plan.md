
# SoulSync — De prototipo a app real

Convertimos el prototipo en una app real con cuentas de usuario, progreso persistente en la base de datos y un nuevo tipo de misión AR que usa la cámara del móvil con un mini avatar 3D superpuesto.

---

## 1. Autenticación (Google + Email/contraseña)

- Página `/auth` con dos pestañas: **Iniciar sesión** y **Crear cuenta** (email + contraseña).
- Botón "Continuar con Google" en ambas, usando el broker de Google gestionado por Lovable Cloud.
- Email se registra sin confirmación automática (el usuario debe verificar su correo) — comportamiento por defecto seguro.
- Layout protegido `_authenticated` para todas las pantallas internas (dashboard, mundo, misiones, IA, perfil, store, etc.). Si no hay sesión → redirige a `/auth`.
- Botón "Cerrar sesión" en Perfil.
- Splash `/` decide: si hay sesión → `/dashboard`; si no → `/auth`.

## 2. Base de datos

Tablas nuevas en Lovable Cloud:

- **profiles** — datos públicos del jugador (nombre, avatar, arquetipo, nivel, XP, monedas, gemas, racha, última misión). Una fila por usuario, creada automáticamente al registrarse mediante trigger sobre `auth.users`.
- **user_stats** — bienestar, resiliencia, energía, claridad.
- **user_attributes** — los 6 atributos RPG.
- **mission_completions** — historial: id misión, título, fecha, XP ganada. Permite calcular "completadas hoy" y rachas desde el servidor.
- **inventory** — items comprados en la tienda.

Reglas de acceso (RLS): cada usuario solo puede leer y escribir sus propias filas.

## 3. Misiones persistidas

- El catálogo de misiones sigue definido en código (rápido de iterar). Lo que se guarda en BD es **lo que el usuario hace**.
- Al completar una misión:
  1. Se inserta en `mission_completions`.
  2. Se actualiza `profiles` (XP, nivel, monedas, gemas, racha).
  3. Se actualizan `user_stats` y `user_attributes` con los incrementos de la recompensa, con clamp 0–100.
- Todo esto pasa en un **server function** con `requireSupabaseAuth` para que las reglas se apliquen en el servidor y no se puedan trampear desde el cliente.
- El hook `useUserStore` se reescribe para leer/escribir desde la BD vía TanStack Query (cache + invalidación). Sigue exponiendo la misma API (`completeMission`, `addCoins`, etc.) para no romper los componentes de misión existentes.
- **Migración del progreso local**: en el primer login, si hay datos en `localStorage` (`soulsync_user`), se suben una sola vez al perfil del usuario y se limpia el almacenamiento local. Después la fuente de verdad es la BD.

## 4. Misiones AR (cámara + mini avatar 3D)

Nuevo tipo de misión `ar`. Flujo:

1. Usuario abre la misión AR (ej. "Encuentra tu calma").
2. Se pide permiso de cámara y se muestra el stream en pantalla completa.
3. Encima se renderiza un **mini avatar 3D** (modelo `.glb` genérico estilo mascota/chibi) usando `@google/model-viewer` con fondo transparente. El avatar flota, gira suavemente y reacciona al progreso.
4. La misión tiene un objetivo simple: mantener la cámara enfocada N segundos / completar una mini-interacción (tap al avatar X veces, respirar siguiendo al avatar, etc.).
5. Al terminar → mismas recompensas que cualquier otra misión, guardadas en BD.

**Prototipos AR incluidos (3):**
- 🌬️ *Aura serena* — respirar 4 ciclos mientras el avatar pulsa al ritmo (10 XP/ciclo, +bienestar).
- ✨ *Captura de energía* — tocar al avatar 10 veces en pantalla, se "carga" con cada tap (+energía, monedas).
- 🎯 *Enfoque consciente* — mantener al avatar centrado en cámara 30 s sin moverlo del encuadre (+claridad, gema).

Sección dedicada **"Misiones AR"** dentro de `/missions` (pestaña extra) para destacarlas.

## 5. Mini avatar reutilizable

- Componente `<MiniAvatar3D />` basado en `model-viewer` (web component, sin dependencias pesadas de React Three).
- Se descarga un `.glb` libre de derechos y se guarda en `public/models/avatar.glb`.
- También se usa en el **Dashboard** y en el **Perfil** como pequeño preview animado (no solo en AR), dando coherencia visual.

---

## Detalles técnicos

- **Backend**: TanStack `createServerFn` con middleware `requireSupabaseAuth`. Sin Edge Functions.
- **Cliente Supabase**: navegador para auth/session listener; server functions para todas las lecturas/escrituras de progreso.
- **Estado**: TanStack Query como cache; `useUserStore` se reimplementa encima.
- **AR**: `@google/model-viewer` (un solo paquete) + `getUserMedia` para la cámara. Sin WebXR, sin geolocalización → compatible con la mayoría de móviles modernos.
- **Rutas nuevas**: `/auth`, `/_authenticated/*` (mueve dashboard, world, missions, ai, profile, store, alert, community, create-avatar bajo este layout).
- **Componentes nuevos**: `MiniAvatar3D`, `ARMission` (host de cámara + avatar), `AuraMission`, `EnergyTapMission`, `FocusMission`.
- **Sin nuevos secretos**: Google OAuth usa el broker gestionado, no requiere API keys del usuario.

## Lo que NO cambia

- Diseño visual (paleta, tipografías, StarField, BottomNav).
- Misiones existentes (respiración, diario, timer, gratitud, quiz) — siguen funcionando, ahora con persistencia real.
- Estructura de pantallas y navegación inferior.
