/**
 * Preguntas de cada quiz — capa de Dominio (contenido).
 * Cada misión de tipo quiz tiene su propio banco; nada se repite entre quizzes.
 * Las de movimiento siguen las Directrices de actividad física de la OMS (2020) y las de estrés
 * la guía de la OMS "Hacer lo que importa en tiempos de estrés" (2020).
 */
export interface QuizQuestion {
  q: string;
  options: readonly string[];
  correct: number;
  explain: string;
}

export const QUIZZES: Record<string, readonly QuizQuestion[]> = {
  "quiz-mind": [
    { q: "La atención plena consiste sobre todo en…", options: ["Vaciar la mente", "Notar lo que pasa ahora, sin juzgarlo", "Pensar solo en cosas positivas"], correct: 1, explain: "No se trata de dejar la mente en blanco, sino de darte cuenta de lo que ocurre con curiosidad." },
    { q: "Si te distraes mientras practicas, lo mejor es…", options: ["Rendirte, no es lo tuyo", "Notar la distracción y volver con amabilidad", "Regañarte para concentrarte"], correct: 1, explain: "Distraerse es normal: cada vez que vuelves, entrenas tu atención." },
    { q: "¿Cuál es un buen ancla para volver al presente?", options: ["Tu respiración", "Revisar el móvil", "Planear toda la semana"], correct: 0, explain: "La respiración siempre está contigo y te trae al aquí y ahora." },
  ],
  "quiz-emotions": [
    { q: "Ponerle nombre a una emoción (\"siento ansiedad\")…", options: ["La vuelve más intensa", "Suele ayudar a regularla", "No sirve para nada"], correct: 1, explain: "Nombrar lo que sientes ayuda a tomar distancia y a decidir qué hacer." },
    { q: "¿Cuál de estas es una emoción y no un pensamiento?", options: ["\"Nadie me entiende\"", "Tristeza", "\"Voy a fallar\""], correct: 1, explain: "Las frases son pensamientos; la tristeza es la emoción que pueden traer." },
    { q: "Las emociones difíciles…", options: ["Hay que eliminarlas cuanto antes", "Son señales que informan y, con el tiempo, pasan", "Significan que algo anda mal contigo"], correct: 1, explain: "Todas las emociones cumplen una función; hacerles espacio ayuda a que pasen." },
  ],
  "quiz-stress": [
    { q: "Según la guía de la OMS, una forma útil de manejar el estrés es…", options: ["Anclarte: notar lo que sientes y volver a lo que haces", "Ignorar lo que sientes", "Quedarte en la cama todo el día"], correct: 0, explain: "Anclarse es la primera habilidad de \"Hacer lo que importa\"." },
    { q: "Cuando un pensamiento te \"engancha\", ayuda…", options: ["Discutir con él sin parar", "Nombrarlo: \"estoy notando el pensamiento de que…\"", "Hacer como que no existe"], correct: 1, explain: "Nombrarlo te desengancha y te devuelve el control de lo que haces." },
    { q: "¿Qué hábito protege frente al estrés?", options: ["Dormir poco para estudiar más", "Mantener contacto con personas de confianza", "Aislarte hasta que pase"], correct: 1, explain: "El apoyo social es uno de los mejores amortiguadores del estrés." },
  ],
  "quiz-sleep": [
    { q: "¿Qué ayuda más a dormir bien?", options: ["Horarios regulares para dormir y despertar", "Café por la tarde", "Usar el móvil en la cama"], correct: 0, explain: "La regularidad ordena tu reloj interno." },
    { q: "La luz de las pantallas antes de dormir…", options: ["Ayuda a relajarse", "Puede retrasar el sueño", "No tiene ningún efecto"], correct: 1, explain: "Apartar las pantallas un rato antes de dormir facilita conciliar el sueño." },
    { q: "Si no te duermes en unos 20 minutos…", options: ["Quedarte dando vueltas", "Levantarte, hacer algo tranquilo con luz baja y volver con sueño", "Revisar redes hasta cansarte"], correct: 1, explain: "Así tu cama sigue asociada a dormir, no a dar vueltas." },
  ],
  "quiz-move": [
    { q: "¿Cuánta actividad moderada recomienda la OMS a los adultos por semana?", options: ["30 minutos", "Entre 150 y 300 minutos", "1000 minutos"], correct: 1, explain: "O entre 75 y 150 minutos de actividad vigorosa." },
    { q: "Para la OMS, 1 minuto de actividad vigorosa equivale a…", options: ["2 minutos de actividad moderada", "10 minutos moderados", "Nada"], correct: 0, explain: "Por eso en tu meta semanal la actividad vigorosa cuenta doble." },
    { q: "Además del ejercicio aeróbico, la OMS recomienda fortalecer los músculos…", options: ["Una vez al año", "2 o más días por semana", "Nunca"], correct: 1, explain: "Sentadillas, flexiones o cargar peso cuentan." },
    { q: "Sobre pasar mucho tiempo sentado, la OMS dice que…", options: ["No importa", "Conviene reducirlo: todo movimiento cuenta", "Es mejor que caminar"], correct: 1, explain: "Levantarte y moverte unos minutos ya suma." },
  ],
  "rogue-riddles": [
    { q: "Cuanto más le quitas, más grande se hace. ¿Qué es?", options: ["Un hoyo", "Una sombra", "Un río"], correct: 0, explain: "Cada palada lo agranda." },
    { q: "Tiene teclas pero no abre puertas. ¿Qué es?", options: ["Un piano", "Un cofre", "Un mapa"], correct: 0, explain: "Sus teclas hacen música, no abren cerraduras." },
    { q: "Se rompe con solo decir su nombre. ¿Qué es?", options: ["El silencio", "Un espejo", "Una promesa"], correct: 0, explain: "Al nombrarlo, deja de existir." },
  ],
};

/** Preguntas de una misión de quiz (por defecto, las de atención plena). */
export const quizFor = (missionId: string): readonly QuizQuestion[] => QUIZZES[missionId] ?? QUIZZES["quiz-mind"];
