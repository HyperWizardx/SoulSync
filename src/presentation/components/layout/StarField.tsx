// Fondo de estrellas titilantes. Se genera solo en el navegador: con Math.random en el
// render, el servidor y el cliente dibujaban posiciones distintas (aviso de hidratación).
import { useEffect, useState } from "react";

interface Star { id: number; left: string; top: string; size: number; delay: string }

export function StarField() {
  const [stars, setStars] = useState<Star[]>([]);
  useEffect(() => {
    setStars(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: `${Math.random() * 5}s`,
    })));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-foreground animate-star-twinkle"
          style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: star.delay }}
        />
      ))}
    </div>
  );
}
