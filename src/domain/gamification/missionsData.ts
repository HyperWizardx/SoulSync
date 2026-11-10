import type { MissionReward, TaskCategoryName } from "@/domain/gamification/rewards";

export type MissionType =
  | "breathing"
  | "journal"
  | "timer"
  | "gratitude"
  | "quiz"
  | "ar-aura"
  | "ar-energy"
  | "ar-focus"
  | "meditation"
  | "daily-challenge"
  | "ar-walk"
  | "social"
  | "steps";


export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  desc: string;
  icon: string; // ícono de game-icons.net (ver GameIcon)
  rarity: "Común" | "Raro" | "Épica" | "Legendaria";
  reward: MissionReward;
  durationSec?: number;
  requiredLevel?: number;
  isAR?: boolean;
  /** Categoría propia cuando no coincide con la de su tipo (p. ej. un temporizador de autocuidado). */
  category?: TaskCategoryName;
  /** Ruta guiada a la que pertenece y su paso (1 = primero): se desbloquea al cumplir el anterior. */
  path?: { id: PathId; step: number };
  /** Misión exclusiva de un arquetipo (0 Caballero, 1 Bárbaro, 2 Pícaro, 3 Mago). */
  archetype?: number;
  /** Pasos a marcar (misiones de tipo "steps"). */
  steps?: readonly string[];
  /** De dónde sale la recomendación (p. ej. una guía de la OMS), para mostrarla en la misión. */
  source?: string;
}

export type PathId = "dwm";

export const MISSIONS: Mission[] = [
  { id: "breath-4", type: "breathing", title: "Respiración guiada", desc: "4 ciclos de respiración consciente", icon: "meditation", rarity: "Común", reward: { xp: 50, coins: 15, stats: { bienestar: 4, energia: 3 }, attributes: { mindfulness: 3, resiliencia: 1 } } },
  { id: "journal-1", type: "journal", title: "Diario emocional", desc: "Escribe cómo te sientes hoy", icon: "notebook", rarity: "Común", reward: { xp: 40, coins: 10, stats: { claridad: 5, bienestar: 2 }, attributes: { autoconocimiento: 4, empatia: 2 } } },
  { id: "walk-30", type: "timer", title: "Pausa activa", desc: "Levántate y camina 3 minutos: cada movimiento cuenta", icon: "walk", rarity: "Raro", durationSec: 180, source: "OMS: reducir el tiempo sentado", reward: { xp: 70, coins: 25, stats: { energia: 6, bienestar: 4 }, attributes: { mindfulness: 2, resiliencia: 2 } } },
  { id: "gratitude-3", type: "gratitude", title: "3 Gratitudes", desc: "Anota tres cosas que agradeces hoy", icon: "sparkles", rarity: "Raro", reward: { xp: 60, coins: 20, gems: 1, stats: { bienestar: 6, claridad: 2 }, attributes: { empatia: 3, autoconocimiento: 2 } } },
  { id: "quiz-mind", type: "quiz", title: "Quiz de atención plena", desc: "3 preguntas para entrenar tu presencia", icon: "brain", rarity: "Épica", reward: { xp: 90, coins: 30, gems: 2, stats: { claridad: 7 }, attributes: { autoconocimiento: 4, creatividad: 2 } } },
  { id: "deep-breath", type: "breathing", title: "Respiración profunda", desc: "8 ciclos lentos para soltar la tensión acumulada", icon: "lungs", rarity: "Legendaria", requiredLevel: 5, reward: { xp: 150, coins: 60, gems: 3, stats: { bienestar: 10, energia: 5, claridad: 4 }, attributes: { mindfulness: 6, resiliencia: 4 } } },
  { id: "ar-aura", type: "ar-aura", title: "Aura serena", desc: "Respira al ritmo del avatar en tu cámara", icon: "aura", rarity: "Raro", isAR: true, reward: { xp: 80, coins: 20, stats: { bienestar: 7, energia: 3 }, attributes: { mindfulness: 4 } } },
  { id: "ar-energy", type: "ar-energy", title: "Captura de energía", desc: "Toca al avatar 10 veces para cargarlo", icon: "lightning-helix", rarity: "Épica", isAR: true, reward: { xp: 100, coins: 35, gems: 1, stats: { energia: 8 }, attributes: { creatividad: 3 } } },
  { id: "ar-focus", type: "ar-focus", title: "Enfoque consciente", desc: "Mantén al avatar centrado 30 segundos", icon: "archery-target", rarity: "Legendaria", isAR: true, reward: { xp: 130, coins: 40, gems: 2, stats: { claridad: 9, bienestar: 3 }, attributes: { mindfulness: 5, autoconocimiento: 3 } } },
  { id: "meditation-2m", type: "meditation", title: "Meditación guiada", desc: "2 minutos con voz guía y respiración", icon: "meditation", rarity: "Épica", durationSec: 120, reward: { xp: 110, coins: 35, gems: 1, stats: { bienestar: 8, claridad: 6 }, attributes: { mindfulness: 5, autoconocimiento: 3 } } },
  { id: "daily-challenge", type: "daily-challenge", title: "Reto del día", desc: "Una micro-misión sorpresa cada día", icon: "present", rarity: "Raro", reward: { xp: 65, coins: 20, stats: { bienestar: 4, energia: 2 }, attributes: { creatividad: 3, conexionSocial: 2 } } },
  { id: "ar-walk", type: "ar-walk", title: "Sendero consciente", desc: "Camina 30 pasos y tu héroe crece contigo", icon: "boot-prints", rarity: "Épica", isAR: true, reward: { xp: 120, coins: 40, gems: 1, stats: { energia: 8, bienestar: 4 }, attributes: { mindfulness: 4, resiliencia: 3 } } },

  // ——— Autocuidado ———
  { id: "breath-box", type: "breathing", title: "Respiración cuadrada", desc: "6 ciclos 4-4-4-4 para bajar revoluciones", icon: "cube", rarity: "Raro", reward: { xp: 65, coins: 20, stats: { bienestar: 5, claridad: 3 }, attributes: { mindfulness: 4 } } },
  { id: "breath-night", type: "breathing", title: "Respiración para dormir", desc: "Ciclos largos antes de descansar", icon: "moon", rarity: "Raro", reward: { xp: 70, coins: 22, stats: { bienestar: 6, energia: 2 }, attributes: { mindfulness: 3, resiliencia: 2 } } },
  { id: "hydrate", type: "timer", category: "autocuidado", title: "Pausa de hidratación", desc: "20 segundos: bebe agua con calma", icon: "water-drop", rarity: "Común", durationSec: 20, reward: { xp: 30, coins: 10, stats: { energia: 3, bienestar: 2 }, attributes: { resiliencia: 1 } } },
  { id: "screen-break", type: "timer", category: "autocuidado", title: "Descanso de pantalla", desc: "45 s mirando lejos, relaja la vista", icon: "semi-closed-eye", rarity: "Común", durationSec: 45, reward: { xp: 40, coins: 12, stats: { energia: 4, claridad: 2 }, attributes: { mindfulness: 2 } } },
  { id: "meditation-5m", type: "meditation", title: "Meditación profunda", desc: "5 minutos de silencio guiado", icon: "lotus", rarity: "Legendaria", durationSec: 300, requiredLevel: 4, reward: { xp: 180, coins: 65, gems: 3, stats: { bienestar: 12, claridad: 8 }, attributes: { mindfulness: 7, autoconocimiento: 4 } } },
  { id: "body-scan", type: "meditation", title: "Escaneo corporal", desc: "90 s recorriendo tu cuerpo con atención", icon: "heart-organ", rarity: "Épica", durationSec: 90, reward: { xp: 95, coins: 30, stats: { bienestar: 7, claridad: 4 }, attributes: { mindfulness: 4, autoconocimiento: 2 } } },
  { id: "self-care-ritual", type: "timer", category: "autocuidado", title: "Ritual de autocuidado", desc: "60 s para algo que te cuide (té, ducha, música)", icon: "bathtub", rarity: "Raro", durationSec: 60, reward: { xp: 70, coins: 25, stats: { bienestar: 6 }, attributes: { autoconocimiento: 2, resiliencia: 2 } } },

  // ——— Reflexión ———
  { id: "journal-worry", type: "journal", title: "Descarga de preocupaciones", desc: "Escribe lo que te pesa y suéltalo", icon: "raining", rarity: "Raro", reward: { xp: 65, coins: 20, stats: { claridad: 6, bienestar: 3 }, attributes: { autoconocimiento: 4, resiliencia: 2 } } },
  { id: "journal-win", type: "journal", title: "Victoria del día", desc: "Registra un logro, por pequeño que sea", icon: "medal", rarity: "Común", reward: { xp: 45, coins: 15, stats: { bienestar: 4, claridad: 3 }, attributes: { autoconocimiento: 3 } } },
  { id: "journal-future", type: "journal", title: "Carta a tu yo futuro", desc: "Escríbete un mensaje para dentro de un mes", icon: "envelope", rarity: "Épica", requiredLevel: 3, reward: { xp: 100, coins: 32, gems: 1, stats: { claridad: 8, bienestar: 3 }, attributes: { autoconocimiento: 5, creatividad: 3 } } },
  { id: "gratitude-people", type: "gratitude", title: "Gratitud por personas", desc: "Tres personas que te sumaron esta semana", icon: "hearts", rarity: "Raro", reward: { xp: 65, coins: 22, stats: { bienestar: 6 }, attributes: { empatia: 4, conexionSocial: 2 } } },
  { id: "gratitude-self", type: "gratitude", title: "Gratitud contigo", desc: "Tres cosas que agradeces de ti", icon: "star-swirl", rarity: "Épica", reward: { xp: 90, coins: 28, gems: 1, stats: { bienestar: 7, claridad: 3 }, attributes: { autoconocimiento: 4, resiliencia: 2 } } },
  { id: "reframe", type: "journal", title: "Reencuadre cognitivo", desc: "Toma un pensamiento negativo y reescríbelo", icon: "cycle", rarity: "Épica", requiredLevel: 3, reward: { xp: 105, coins: 34, gems: 1, stats: { claridad: 8, bienestar: 4 }, attributes: { resiliencia: 5, autoconocimiento: 3 } } },

  // ——— Cognitivo ———
  { id: "quiz-emotions", type: "quiz", title: "Quiz de emociones", desc: "Reconoce y nombra lo que sientes", icon: "drama-masks", rarity: "Raro", reward: { xp: 70, coins: 24, stats: { claridad: 6 }, attributes: { autoconocimiento: 3, empatia: 2 } } },
  { id: "quiz-stress", type: "quiz", title: "Quiz de manejo del estrés", desc: "Estrategias que sí funcionan", icon: "puzzle", rarity: "Épica", reward: { xp: 95, coins: 30, gems: 1, stats: { claridad: 7, bienestar: 2 }, attributes: { resiliencia: 4, autoconocimiento: 2 } } },
  { id: "quiz-sleep", type: "quiz", title: "Quiz de higiene del sueño", desc: "Aprende a descansar mejor", icon: "night-sleep", rarity: "Raro", reward: { xp: 75, coins: 25, stats: { claridad: 5, energia: 3 }, attributes: { autoconocimiento: 3 } } },
  { id: "focus-sprint", type: "timer", category: "cognitivo", title: "Sprint de foco", desc: "2 minutos de atención plena en una sola tarea", icon: "sands-of-time", rarity: "Épica", durationSec: 120, reward: { xp: 100, coins: 30, stats: { claridad: 8, energia: 2 }, attributes: { mindfulness: 4, creatividad: 2 } } },

  // ——— Social ———
  { id: "social-message", type: "social", title: "Mensaje que conecta", desc: "Escribe a alguien que hace tiempo no ves", icon: "chat-bubble", rarity: "Raro", reward: { xp: 70, coins: 24, stats: { bienestar: 5, claridad: 2 }, attributes: { conexionSocial: 5, empatia: 3 } } },
  { id: "social-thanks", type: "social", title: "Agradece en voz alta", desc: "Dile gracias a alguien y anota cómo te sentiste", icon: "prayer", rarity: "Raro", reward: { xp: 75, coins: 25, stats: { bienestar: 6 }, attributes: { empatia: 4, conexionSocial: 4 } } },
  { id: "social-ask-help", type: "social", title: "Pedir apoyo", desc: "Comparte con alguien algo que te cuesta", icon: "shaking-hands", rarity: "Épica", requiredLevel: 3, reward: { xp: 110, coins: 36, gems: 1, stats: { bienestar: 8, claridad: 4 }, attributes: { conexionSocial: 6, resiliencia: 3 } } },
  { id: "social-listen", type: "social", title: "Escucha activa", desc: "Escucha a alguien sin interrumpir y registra la experiencia", icon: "sound-waves", rarity: "Épica", reward: { xp: 95, coins: 30, stats: { bienestar: 5, claridad: 3 }, attributes: { empatia: 6, conexionSocial: 3 } } },

  // ——— Movimiento ———
  { id: "stretch-60", type: "timer", title: "Estiramiento consciente", desc: "60 segundos soltando cuello y hombros", icon: "acrobatic", rarity: "Común", durationSec: 60, reward: { xp: 50, coins: 18, stats: { energia: 5, bienestar: 3 }, attributes: { resiliencia: 2 } } },
  { id: "dance-45", type: "timer", title: "Baila una canción", desc: "45 s de movimiento libre con tu música", icon: "musical-notes", rarity: "Raro", durationSec: 45, reward: { xp: 70, coins: 24, stats: { energia: 7, bienestar: 4 }, attributes: { creatividad: 3 } } },
  { id: "posture-check", type: "timer", title: "Chequeo de postura", desc: "30 s para reajustar tu cuerpo al estudiar", icon: "wooden-chair", rarity: "Común", durationSec: 30, reward: { xp: 35, coins: 12, stats: { energia: 3, claridad: 2 }, attributes: { mindfulness: 2 } } },
  { id: "sunlight", type: "timer", title: "Dosis de luz natural", desc: "90 s al aire libre o junto a la ventana", icon: "sun", rarity: "Raro", durationSec: 90, reward: { xp: 75, coins: 26, stats: { energia: 6, bienestar: 5 }, attributes: { resiliencia: 2, mindfulness: 2 } } },

  // ——— AR ———
  { id: "ar-gratitude", type: "ar-focus", title: "Altar de gratitud", desc: "Mantén al avatar centrado mientras agradeces", icon: "candle-light", rarity: "Épica", isAR: true, reward: { xp: 110, coins: 34, gems: 1, stats: { bienestar: 7, claridad: 4 }, attributes: { mindfulness: 4, empatia: 2 } } },
  { id: "ar-calm-aura", type: "ar-aura", title: "Aura de calma nocturna", desc: "Respira lento con tu avatar antes de dormir", icon: "galaxy", rarity: "Épica", isAR: true, reward: { xp: 105, coins: 32, gems: 1, stats: { bienestar: 8 }, attributes: { mindfulness: 5 } } },
  { id: "ar-power", type: "ar-energy", title: "Chispa de ánimo", desc: "Recarga a tu avatar cuando la energía baje", icon: "battery-pack", rarity: "Raro", isAR: true, reward: { xp: 85, coins: 28, stats: { energia: 7, bienestar: 2 }, attributes: { resiliencia: 3 } } },
  // ——— Generales basadas en recomendaciones de la OMS ———
  { id: "strength-hero", type: "steps", category: "movimiento", title: "Fuerza de héroe", desc: "Rutina corta de fuerza sin equipo", icon: "muscle-up", rarity: "Raro", source: "OMS: fortalecer los músculos 2 o más días por semana",
    steps: ["10 sentadillas lentas", "8 flexiones (en el suelo o contra la pared)", "20 segundos de plancha", "Repite la serie una vez más"],
    reward: { xp: 80, coins: 26, stats: { energia: 7, bienestar: 3 }, attributes: { resiliencia: 4 } } },
  { id: "hero-plate", type: "steps", category: "autocuidado", title: "Plato del aventurero", desc: "Arma una comida que te dé energía de verdad", icon: "fruit-bowl", rarity: "Común", source: "OMS: al menos 5 porciones de frutas y verduras al día",
    steps: ["Incluye una fruta", "Suma una porción de verduras", "Elige agua en vez de una bebida azucarada", "Come sin pantallas, despacio"],
    reward: { xp: 50, coins: 18, stats: { energia: 4, bienestar: 3 }, attributes: { mindfulness: 2 } } },
  { id: "green-walk", type: "steps", category: "movimiento", title: "Paseo verde", desc: "10 minutos entre árboles o plantas", icon: "oak-leaf", rarity: "Raro", durationSec: 720, source: "OMS: los espacios verdes favorecen la salud mental",
    steps: ["Sal a un lugar con árboles o plantas", "Camina 10 minutos a buen ritmo", "Nota 3 sonidos de la naturaleza", "Respira hondo tres veces antes de volver"],
    reward: { xp: 75, coins: 24, stats: { bienestar: 5, energia: 4 }, attributes: { mindfulness: 3 } } },
  { id: "digital-detox", type: "steps", category: "autocuidado", title: "Desconexión digital", desc: "30 minutos sin redes para ti", icon: "phone", rarity: "Raro", durationSec: 1800,
    steps: ["Silencia las notificaciones", "Deja el móvil en otra habitación", "Haz algo sin pantalla durante 30 minutos", "Vuelve y nota cómo te sientes"],
    reward: { xp: 70, coins: 22, stats: { claridad: 6 }, attributes: { mindfulness: 3, autoconocimiento: 1 } } },
  { id: "rest-ritual", type: "steps", category: "autocuidado", title: "Ritual de descanso", desc: "Prepara una noche de buen sueño", icon: "night-sleep", rarity: "Raro",
    steps: ["Elige una hora fija para dormir", "Aparta las pantallas 30 minutos antes", "Baja las luces de tu cuarto", "Haz 4 respiraciones lentas en la cama"],
    reward: { xp: 70, coins: 22, stats: { energia: 5, bienestar: 3 }, attributes: { mindfulness: 2, resiliencia: 2 } } },
  { id: "kind-act", type: "social", title: "Acto de bondad", desc: "Haz algo amable por alguien y cuéntalo", icon: "heart-plus", rarity: "Raro", source: "OMS: ser amable, de la guía Hacer lo que importa",
    reward: { xp: 75, coins: 25, stats: { bienestar: 6 }, attributes: { empatia: 4, conexionSocial: 2 } } },
  { id: "problem-steps", type: "journal", title: "Divide el problema", desc: "Parte un problema en pasos pequeños", icon: "stairs", rarity: "Épica", source: "OMS: manejo de problemas (Problem Management Plus)",
    reward: { xp: 100, coins: 32, gems: 1, stats: { claridad: 7, resiliencia: 3 }, attributes: { autoconocimiento: 3, resiliencia: 3 } } },
  { id: "quiz-move", type: "quiz", title: "Quiz del movimiento", desc: "Lo que recomienda la OMS para moverte", icon: "run", rarity: "Raro", source: "Directrices de actividad física de la OMS (2020)",
    reward: { xp: 70, coins: 24, stats: { claridad: 4, energia: 2 }, attributes: { autoconocimiento: 2 } } },

  // ——— Exclusivas por arquetipo ———
  // Caballero: fuerza y resiliencia
  { id: "knight-stance", type: "steps", category: "movimiento", archetype: 0, title: "Guardia firme", desc: "Equilibrio y postura de caballero", icon: "shield", rarity: "Raro", source: "OMS: actividades de equilibrio y fuerza",
    steps: ["30 segundos en un pie (cada lado)", "15 elevaciones de talones", "Abre el pecho y estira los brazos 20 segundos", "Termina de pie, espalda recta, tres respiraciones"],
    reward: { xp: 80, coins: 26, stats: { energia: 5, resiliencia: 4 }, attributes: { resiliencia: 4 } } },
  { id: "knight-march", type: "timer", category: "movimiento", archetype: 0, title: "Marcha del caballero", desc: "5 minutos a paso rápido, como en campaña", icon: "boot-prints", rarity: "Raro", durationSec: 300, source: "OMS: 150 minutos de actividad moderada a la semana",
    reward: { xp: 85, coins: 28, stats: { energia: 7 }, attributes: { resiliencia: 3 } } },
  { id: "knight-armor", type: "steps", category: "autocuidado", archetype: 0, title: "Cuidar la armadura", desc: "Prepárate hoy para el día de mañana", icon: "breastplate", rarity: "Común",
    steps: ["Deja lista la ropa de mañana", "Organiza tu mochila", "Anota lo más importante del día siguiente", "Date una ducha tranquila"],
    reward: { xp: 55, coins: 18, stats: { claridad: 4, bienestar: 2 }, attributes: { resiliencia: 2 } } },
  // Bárbaro: coraje y energía
  { id: "barbarian-roar", type: "timer", category: "movimiento", archetype: 1, title: "Grito de batalla", desc: "60 segundos de energía: salta o trota en tu sitio", icon: "shouting", rarity: "Raro", durationSec: 60, source: "OMS: la actividad vigorosa cuenta doble",
    reward: { xp: 70, coins: 24, stats: { energia: 8 }, attributes: { resiliencia: 2 } } },
  { id: "barbarian-feast", type: "social", archetype: 1, title: "Banquete del clan", desc: "Comparte una comida sin pantallas con alguien", icon: "meal", rarity: "Raro", source: "OMS: la conexión social protege la salud",
    reward: { xp: 80, coins: 26, stats: { bienestar: 5 }, attributes: { conexionSocial: 5 } } },
  { id: "barbarian-courage", type: "social", archetype: 1, title: "Desafío de valor", desc: "Da un paso social que te cueste un poco", icon: "battle-axe", rarity: "Épica",
    reward: { xp: 100, coins: 32, gems: 1, stats: { resiliencia: 6 }, attributes: { conexionSocial: 4, resiliencia: 3 } } },
  // Pícaro: curiosidad y aventura
  { id: "rogue-explore", type: "steps", category: "movimiento", archetype: 2, title: "Explorador de rincones", desc: "Descubre un lugar nuevo cerca de ti", icon: "treasure-map", rarity: "Raro", durationSec: 900,
    steps: ["Camina 10 minutos hacia un rincón que no conozcas", "Encuentra 3 detalles que nunca habías visto", "Toma nota mental del más curioso", "Vuelve por un camino distinto"],
    reward: { xp: 80, coins: 26, stats: { energia: 5, claridad: 3 }, attributes: { creatividad: 4 } } },
  { id: "rogue-riddles", type: "quiz", archetype: 2, title: "Acertijos del gremio", desc: "Tres acertijos para mentes ágiles", icon: "puzzle", rarity: "Raro",
    reward: { xp: 75, coins: 25, stats: { claridad: 6 }, attributes: { creatividad: 4 } } },
  { id: "rogue-curiosity", type: "journal", category: "cognitivo", archetype: 2, title: "Mapa de curiosidades", desc: "Elige algo que te intrigue y explóralo", icon: "spyglass", rarity: "Raro",
    reward: { xp: 75, coins: 24, stats: { claridad: 5 }, attributes: { creatividad: 4, autoconocimiento: 1 } } },
  // Mago: reflexión y conocimiento
  { id: "mage-grimoire", type: "journal", archetype: 3, title: "Grimorio de aprendizajes", desc: "Anota lo que aprendiste esta semana", icon: "spell-book", rarity: "Raro",
    reward: { xp: 75, coins: 24, stats: { claridad: 6 }, attributes: { autoconocimiento: 4 } } },
  { id: "mage-focus", type: "timer", category: "cognitivo", archetype: 3, title: "Hechizo de concentración", desc: "5 minutos en una sola tarea, sin distracciones", icon: "crystal-ball", rarity: "Épica", durationSec: 300,
    reward: { xp: 95, coins: 30, gems: 1, stats: { claridad: 8 }, attributes: { mindfulness: 3, autoconocimiento: 2 } } },
  { id: "mage-advice", type: "journal", archetype: 3, title: "Consejo del sabio", desc: "Escribe el consejo que darías a quien empieza", icon: "wizard-staff", rarity: "Raro",
    reward: { xp: 80, coins: 26, stats: { claridad: 4, bienestar: 3 }, attributes: { empatia: 3, autoconocimiento: 2 } } },

  // ——— Ruta "Hacer lo que importa" (guía de la OMS para tiempos de estrés, 2020) ———
  { id: "dwm-1", type: "timer", category: "autocuidado", path: { id: "dwm", step: 1 }, title: "Anclarse", desc: "Siente tus pies en el suelo, nota 5 cosas que ves y 3 que oyes", icon: "anchor", rarity: "Raro", durationSec: 60, reward: { xp: 70, coins: 22, stats: { bienestar: 5, claridad: 3 }, attributes: { mindfulness: 4 } } },
  { id: "dwm-2", type: "journal", category: "reflexion", path: { id: "dwm", step: 2 }, title: "Desengancharse", desc: "Nombra un pensamiento difícil sin pelear con él", icon: "fishing-hook", rarity: "Raro", reward: { xp: 75, coins: 24, stats: { claridad: 6 }, attributes: { autoconocimiento: 4 } } },
  { id: "dwm-3", type: "journal", category: "reflexion", path: { id: "dwm", step: 3 }, title: "Actuar según tus valores", desc: "Elige un valor y una acción pequeña para hoy", icon: "compass", rarity: "Épica", reward: { xp: 90, coins: 28, gems: 1, stats: { claridad: 5, bienestar: 3 }, attributes: { autoconocimiento: 5 } } },
  { id: "dwm-4", type: "journal", category: "reflexion", path: { id: "dwm", step: 4 }, title: "Ser amable", desc: "Háblate como le hablarías a un buen amigo", icon: "heart-plus", rarity: "Épica", reward: { xp: 90, coins: 28, gems: 1, stats: { bienestar: 6 }, attributes: { empatia: 5 } } },
  { id: "dwm-5", type: "meditation", category: "autocuidado", path: { id: "dwm", step: 5 }, title: "Hacer espacio", desc: "Deja estar una emoción difícil mientras respiras", icon: "lotus", rarity: "Legendaria", durationSec: 120, reward: { xp: 120, coins: 40, gems: 2, stats: { bienestar: 6, resiliencia: 5 }, attributes: { mindfulness: 5, resiliencia: 3 } } },
  { id: "ar-walk-60", type: "ar-walk", title: "Ruta larga", desc: "60 pasos conscientes junto a tu héroe", icon: "walking-boot", rarity: "Legendaria", isAR: true, requiredLevel: 6, reward: { xp: 170, coins: 60, gems: 2, stats: { energia: 11, bienestar: 6 }, attributes: { mindfulness: 5, resiliencia: 4 } } },
];

export const MISSION_CATEGORY: Record<MissionType, TaskCategoryName> = {
  breathing: "autocuidado", journal: "reflexion", timer: "movimiento", gratitude: "reflexion", quiz: "cognitivo", meditation: "autocuidado", "daily-challenge": "autocuidado", "ar-aura": "ar", "ar-energy": "ar", "ar-focus": "ar", "ar-walk": "movimiento", social: "social", steps: "autocuidado",
};


const MISSIONS_BY_ID: Record<string, Mission> = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));

export function getMissionById(id: string): Mission | undefined { return MISSIONS_BY_ID[id]; }

export function primaryStatOf(mission: Mission | undefined): keyof NonNullable<MissionReward["stats"]> | null {
  const stats = mission?.reward.stats;
  if (!stats) return null;
  const entries = Object.entries(stats) as [keyof NonNullable<MissionReward["stats"]>, number][];
  if (entries.length === 0) return null;
  return entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0][0];
}

/** Categoría temática de la misión: la propia si la declara, si no la de su tipo. */
export function baseCategory(mission: Pick<Mission, "type" | "category">): TaskCategoryName {
  return mission.category ?? MISSION_CATEGORY[mission.type];
}

/** Categoría con la que se registra una misión completada (las AR cuentan como "ar"). */
export function missionCategory(mission: Pick<Mission, "type" | "isAR" | "category">): TaskCategoryName {
  return mission.isAR ? "ar" : baseCategory(mission);
}

type AttributeKey = keyof NonNullable<MissionReward["attributes"]>;

/**
 * Categoría de misión que más hace crecer cada atributo, calculada con el catálogo real
 * (suma de puntos que otorgan sus misiones). Así Perfil explica cómo subirlo sin listas fijas.
 */
export function attributeSourceCategory(attribute: AttributeKey, missions: readonly Mission[] = MISSIONS): TaskCategoryName | null {
  const totals: Partial<Record<TaskCategoryName, number>> = {};
  for (const m of missions) {
    const points = m.reward.attributes?.[attribute] ?? 0;
    if (points > 0) {
      const c = missionCategory(m);
      totals[c] = (totals[c] ?? 0) + points;
    }
  }
  const best = (Object.entries(totals) as [TaskCategoryName, number][]).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : null;
}

/** Preguntas guía de las misiones de escritura (diario y sociales); sin entrada, se usa el Diario emocional. */
export const WRITING_PROMPTS: Record<string, readonly string[]> = {
  "kind-act": ["¿Qué hiciste por alguien hoy? ¿Cómo reaccionó y cómo te sentiste tú?"],
  "problem-steps": ["Elige un problema que te preocupa. Divídelo en 3 pasos pequeños y escribe cuál harás primero y cuándo."],
  "barbarian-feast": ["¿Con quién compartiste la comida? ¿De qué hablaron y qué te llevas de ese rato?"],
  "barbarian-courage": ["¿Qué paso social diste hoy (saludar a alguien nuevo, preguntar en clase, proponer un plan)? ¿Cómo te fue?"],
  "rogue-curiosity": ["Escribe 3 cosas que te den curiosidad. Elige una, investígala 10 minutos y anota lo más sorprendente."],
  "mage-grimoire": ["Escribe 3 cosas que aprendiste esta semana, dentro o fuera de clase, y para qué te pueden servir."],
  "mage-advice": ["¿Qué consejo le darías a alguien que empieza la universidad? Escríbelo como si fuera para ti hace un año."],
  "dwm-2": ["Escribe un pensamiento difícil que te ronda. Ahora reescríbelo empezando por \"Estoy notando el pensamiento de que…\". ¿Se siente distinto?"],
  "dwm-3": ["¿Qué tipo de persona quieres ser esta semana? Elige un valor (amable, valiente, constante…) y escribe una acción pequeña para hoy que vaya con él."],
  "dwm-4": ["Piensa en algo que hoy te cuesta. Escríbete como le hablarías a un buen amigo que pasa por lo mismo."],
  "journal-worry": ["¿Qué te está pesando hoy? Escríbelo sin filtros y déjalo aquí.", "Si esa preocupación fuera una mochila, ¿qué sacarías primero?"],
  "journal-win": ["¿Qué victoria, por pequeña que sea, lograste hoy?", "¿Qué hiciste hoy de lo que te sientas orgulloso u orgullosa?"],
  "journal-future": ["Escríbele a tu yo de dentro de un mes: ¿qué quieres recordarle?", "¿Qué esperas haber conquistado cuando leas esta carta?"],
  reframe: ["Escribe un pensamiento que te pese y luego reescríbelo de forma más amable y realista.", "¿Qué le dirías a un buen amigo que tuviera ese mismo pensamiento?"],
  "social-message": ["¿A quién le escribiste y qué le dijiste? ¿Cómo te sentiste al hacerlo?"],
  "social-thanks": ["¿A quién le diste las gracias y cómo reaccionó? ¿Qué sentiste tú?"],
  "social-ask-help": ["¿Con quién compartiste lo que te cuesta? ¿Cómo te sentiste después?"],
  "social-listen": ["¿A quién escuchaste hoy sin interrumpir? ¿Qué descubriste en esa conversación?"],
};

/** Indicación de las variantes de gratitud. */
export const GRATITUDE_HINTS: Record<string, string> = {
  "gratitude-people": "Escribe tres personas que te sumaron esta semana y por qué.",
  "gratitude-self": "Escribe tres cosas que agradeces de ti: tus fuerzas, tus logros, tu forma de ser.",
};

/** Rutas guiadas: nombre, fuente y pasos en orden. */
export const PATHS: Record<PathId, { name: string; source: string; sourceUrl: string }> = {
  dwm: {
    name: "Hacer lo que importa",
    source: "Guía de la OMS \"Doing What Matters in Times of Stress\" (2020)",
    sourceUrl: "https://www.who.int/publications/i/item/9789240003927",
  },
};

export const pathMissions = (id: PathId): Mission[] =>
  MISSIONS.filter((m) => m.path?.id === id).sort((a, b) => (a.path?.step ?? 0) - (b.path?.step ?? 0));

/** Paso de ruta bloqueado: falta cumplir alguna vez el paso anterior. Devuelve el que falta, o null. */
export function pathBlocker(mission: Pick<Mission, "path">, done: ReadonlySet<string>): Mission | null {
  if (!mission.path || mission.path.step <= 1) return null;
  const prev = MISSIONS.find((m) => m.path?.id === mission.path!.id && m.path.step === mission.path!.step - 1);
  return prev && !done.has(prev.id) ? prev : null;
}

/** Misiones que ve un estudiante: las generales y las exclusivas de su arquetipo. */
export function visibleMissions(archetype: number | null | undefined, missions: readonly Mission[] = MISSIONS): Mission[] {
  return missions.filter((m) => m.archetype === undefined || m.archetype === archetype);
}

/** Minutos aproximados que toma una misión (para que el estudiante elija según su tiempo). */
export function estimateMinutes(m: Pick<Mission, "type" | "durationSec" | "steps">): number {
  if (m.durationSec) return Math.max(1, Math.round(m.durationSec / 60));
  switch (m.type) {
    case "breathing": return 2;
    case "journal": case "social": return 3;
    case "gratitude": case "quiz": return 2;
    case "steps": return Math.max(2, (m.steps?.length ?? 3) * 2);
    case "daily-challenge": return 2;
    default: return 2; // AR
  }
}

/** Frases guía de las meditaciones con contenido propio (se muestran a lo largo del tiempo). */
export const MEDITATION_GUIDES: Record<string, readonly string[]> = {
  "body-scan": ["Lleva la atención a tus pies.", "Sube despacio por piernas y caderas.", "Nota tu espalda y tu abdomen.", "Suelta los hombros, los brazos y las manos.", "Relaja el cuello, la mandíbula y la frente.", "Siente todo tu cuerpo a la vez."],
  "dwm-5": ["Nota dónde sientes la emoción difícil en tu cuerpo.", "Obsérvala con curiosidad: forma, tamaño, temperatura.", "Respira hacia ese lugar, despacio.", "No tienes que echarla: hazle espacio.", "Dile en silencio: \"puedes quedarte\".", "Vuelve poco a poco a lo que te rodea."],
  "meditation-5m": ["Siéntate con comodidad y cierra los ojos.", "Escucha los sonidos a tu alrededor.", "Siente tu respiración sin cambiarla.", "Si llega un pensamiento, déjalo pasar como una nube.", "Vuelve a la respiración las veces que haga falta.", "Agradece este momento contigo."],
};
