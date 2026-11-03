# IA con mejor criterio + paneles con gráficos por rol

## 1. IA con mejor criterio de decisión
Hoy el modelo pondera señales con pesos fijos y umbrales fijos (0,35 / 0,65). Se mejora así:

- **Línea base personal**: compara a cada estudiante consigo mismo (promedio y variación de sus últimos 14–28 días), no solo con valores absolutos. Un ánimo de 5 es normal para unos y una caída para otros.
- **Persistencia antes de alertar**: el nivel Alto solo se emite si la señal se sostiene 2+ días (histéresis); bajar de nivel requiere mejoría sostenida. Evita alarmas por un mal día.
- **Reglas de seguridad prioritarias**: combinaciones críticas (estrés muy alto + sueño muy bajo + aislamiento, o escala con puntaje severo) elevan la revisión a Alto aunque el promedio sea menor, siempre con texto no diagnóstico.
- **Confianza de la señal**: alta/media/baja según cantidad de datos, cobertura y estabilidad; si es baja se muestra "señal preliminar".
- **Contexto académico**: semanas de parciales marcadas por el equipo atenúan picos de estrés transitorios.
- **Factores protectores**: misiones de autocuidado, check-ins constantes y actividad social restan riesgo y se explican.
- Nueva versión del modelo (`v4`), con pruebas por cada regla.

## 2. Mejor uso para el estudiante (pantalla IA)
- Tarjeta clara: nivel, confianza, "qué cambió desde ayer" y los 3 factores principales.
- **Recomendaciones accionables**: 2–3 misiones sugeridas según los factores (p. ej. sueño bajo → misión de rutina nocturna), con botón para iniciarlas.
- Mini gráfico de 14 días de ánimo/estrés/sueño.
- Recordatorio amable si faltan check-ins para tener señal.
- En nivel Alto: recursos de apoyo de Bienestar Universitario visibles.

## 3. Panel del Psicólogo (orientado a seguimiento clínico-preventivo)
- Resumen: participantes en Alto/Moderado/Bajo, alertas nuevas de la semana, sin check-in hace 3+ días.
- **Cola de atención priorizada** (con nombre): riesgo, tendencia, confianza, último contacto.
- Gráficos: distribución de riesgo en el tiempo, ánimo/estrés promedio semanal, factores más frecuentes.
- Ficha individual con gráficos: evolución de ánimo/estrés/sueño, historial de riesgo, misiones completadas vs omitidas, factores explicados.
- Marcar "seguimiento realizado" con nota breve.

## 4. Panel del Investigador (orientado a la tesis, seudonimizado)
- Métricas del piloto: participantes, consentimientos, adherencia diaria, retención por semana.
- Gráficos: check-ins por día, cobertura de datos, distribución de puntajes, uso por categoría de misión, relación misiones ↔ ánimo.
- Calidad del modelo: versión activa, cuántas señales por nivel de confianza, cambios de nivel.
- Simulador y exportación CSV existentes, integrados en el panel.

## Detalles técnicos
- Gráficos con `recharts` (se reinstala) y componentes ligeros propios.
- Dominio: `domain/wellbeing/` añade `personalBaseline.ts`, `safetyRules.ts`, `confidence.ts`, `recommendations.ts`, `protective.ts`; nuevo modelo `baselineLogistic` v4 con histéresis usando la predicción previa.
- Aplicación: nuevos casos de uso en `application/research/` (`getPsychologistDashboard`, `getResearchDashboard`, `markFollowUp`) con `requireRole`; identidad solo para psicólogo.
- Base de datos: tabla `follow_ups` (psicólogo, estudiante, nota, fecha) y `academic_calendar` (semanas de parciales), con RLS vía `has_role`.
- Rutas: `/admin` muestra el panel según el rol; `/admin/estudiante/$id` con gráficos; `/admin/metricas` para investigación.
- Pruebas unitarias para cada regla nueva y para permisos por rol.
