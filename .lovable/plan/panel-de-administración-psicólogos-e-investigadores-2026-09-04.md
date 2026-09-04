# Panel de Administración (Psicólogos e Investigadores)

Un área privada, separada de la app del estudiante, para que los psicólogos de la Universidad hagan seguimiento individual y el equipo de tesis analice el grupo y exporte datos.

## Roles

Dos roles independientes, guardados en una tabla propia de roles (nunca en el perfil del usuario):

- **Psicólogo**: ve la lista de estudiantes con nombre y correo, y entra a la ficha individual.
- **Investigador**: ve las métricas globales del grupo y descarga los datos en CSV.

Un mismo usuario puede tener los dos roles. Las cuentas de administrador se asignan directamente en la base de datos (ustedes me dicen los correos y los dejo cargados, o se los agrego cuando quieran).

## Pantallas

### 1. `/admin` — Lista de estudiantes (psicólogo)
Tabla con: nombre, correo, código de participante, nivel de riesgo actual (Bajo / Moderado / Alto / Insuficiente), tendencia, cobertura de datos, racha, misiones últimos 7 días, último check-in y estado de consentimiento.
- Todos los estudiantes aparecen. Los que no aceptaron el consentimiento se muestran con una etiqueta "Sin consentimiento" y sin métricas ni señales de la IA.
- Filtros por riesgo, consentimiento y actividad; orden por riesgo o por última actividad.
- Tarjetas de resumen arriba: total, consentidos, en riesgo alto, activos hoy.

### 2. `/admin/estudiante/$id` — Ficha individual (psicólogo)
- Cabecera con datos del estudiante, nivel, racha, arquetipo y estado de consentimiento.
- Gráfico de la serie de check-ins (ánimo, estrés, energía, social, sueño) de los últimos 30 días.
- Señal de la IA: nivel de riesgo, tendencia, cobertura y los factores explicativos que la IA usó, con su peso.
- Historial de predicciones guardadas (evolución del riesgo en el tiempo).
- Misiones: completadas y omitidas, por categoría, con adherencia frente a la meta diaria.
- Timeline unificado de eventos.
- Escalas respondidas y estado del Mundo.
- Aviso permanente: es una señal exploratoria, no un diagnóstico.

### 3. `/admin/metricas` — Métricas globales (investigador)
- Distribución de riesgo y de tendencia en la población.
- Adherencia media a la meta diaria, tasa de omisión por categoría, promedio de check-ins por usuario.
- Evolución semanal del índice de bienestar del grupo.
- Cobertura de datos y participación (cuántos con datos suficientes para inferencia).
- Todo agregado y seudonimizado en esta pantalla.

### 4. Exportación CSV (investigador)
Descargas por dataset, con código de participante en lugar de nombre/correo: check-ins, eventos de tareas, misiones completadas, predicciones y escalas. Solo se incluyen los estudiantes con consentimiento vigente.

## Acceso y privacidad

- El panel vive bajo el área protegida; si un usuario sin rol entra, se le redirige a su dashboard.
- Toda la lectura de datos ajenos se hace en el servidor, verificando el rol en cada petición: la protección no depende de la pantalla.
- Los estudiantes no ven nada nuevo ni pierden acceso a nada.
- El correo y el nombre solo aparecen para el rol psicólogo; los CSV y las métricas globales van seudonimizados.
- No se exporta texto libre escrito por el estudiante (diario, notas).

## Detalles técnicos

- Migración: `app_role` enum (`psicologo`, `investigador`), tabla `user_roles` con GRANT + RLS, y función `has_role(_user_id, _role)` en SECURITY DEFINER. Vista/columna `participant_code` derivada de forma estable del `user_id`.
- Nuevas RLS de lectura para los roles admin sobre `profiles`, `wellbeing_checkins`, `wellbeing_predictions`, `wellbeing_scales`, `task_events`, `mission_completions`, `timeline_events`, `research_consent`, `world_state`, `user_stats` y `user_attributes`, usando `has_role(auth.uid(), 'psicologo')` / `'investigador'`.
- Nuevo `src/lib/admin.functions.ts` con server functions protegidas por `requireSupabaseAuth`; cada handler valida el rol con `context.supabase.rpc('has_role', ...)` antes de leer. El correo se obtiene con el cliente admin cargado dentro del handler (`await import('@/integrations/supabase/client.server')`), solo tras confirmar rol psicólogo.
- Rutas nuevas bajo `src/routes/_authenticated/admin/*` (o equivalente al gate actual), con `errorComponent` y `notFoundComponent`, y `head()` propio en cada una.
- Reutiliza `src/lib/wellbeing/` (features, baseline, tendencia, métricas) para recalcular señales por usuario; no se duplica la lógica del modelo.
- Enlace al panel visible en Perfil solo si el usuario tiene algún rol admin.
- CSV generado en servidor a partir de las mismas consultas, descargado desde el navegador.
- Pruebas unitarias para la agregación de métricas de la población y la seudonimización.
