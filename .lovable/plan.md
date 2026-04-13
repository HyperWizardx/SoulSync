

## SoulSync — Prototipo Mobile App

Prototipo interactivo mobile-first basado en el wireframe, con navegación real entre pantallas y el diseño visual oscuro/cósmico de la marca.

### Diseño Visual
- Tema oscuro con paleta: bg `#080b18`, accent `#7c5cfc`, teal `#00e5c8`, gold `#f5c842`
- Tipografías: Cinzel (headings/logo) + Nunito (body)
- Efectos: gradientes radiales, estrellas, glows, orbs animados
- Layout mobile-first (max-width ~430px centrado)

### Pantallas a implementar (10 rutas)

1. **Splash/Bienvenida** (`/`) — Logo animado con orb, CTA "Comenzar Aventura", trust badges
2. **Crear Avatar** (`/create-avatar`) — Selección de avatar, nombre, arquetipo con progress steps
3. **Dashboard** (`/dashboard`) — Avatar del mundo, stats grid (4 métricas), misiones activas, alerta IA
4. **Mi Mundo** (`/world`) — Mapa del mundo emocional con zonas, timeline de emociones
5. **Misiones** (`/missions`) — Tabs (Activas/Completadas/Bloqueadas), quest cards con progreso
6. **IA Predictiva** (`/ai`) — Mood ring, señales biométricas (4 cards), registro de IA
7. **Perfil RPG** (`/profile`) — Avatar con nivel, 6 atributos, biométricos en vivo, logros
8. **Comunidad** (`/community`) — Mapa de voluntarios cercanos, lista de conexiones
9. **Tienda** (`/store`) — Balance monedas/gemas, grid de items con rareza
10. **Alerta IA** (`/alert`) — Bottom sheet con intervención proactiva

### Navegación
- Bottom navigation bar persistente en pantallas 3-9 (Inicio, Mundo, Misiones, IA, Perfil)
- Flujo onboarding: Splash → Crear Avatar → Dashboard
- Layout compartido con bottom nav para las pantallas principales

### Interactividad del prototipo
- Navegación funcional entre todas las pantallas
- Selección de avatar y arquetipo en onboarding
- Tabs funcionales en Misiones
- Barras de progreso y animaciones CSS (orb spinning, cursor blink)
- Responsive mobile-first

