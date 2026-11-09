// Ícono de contenido del juego (misiones, logros, objetos, arquetipos, zonas) de game-icons.net.
// Usa currentColor: se tiñe con el color del texto (dorado, color del arquetipo, etc.).
import { GAME_ICONS, GAME_ICON_SIZE } from "@/presentation/components/icons/gameIconData";

interface Props {
  name: string;
  className?: string;
  title?: string; // si se pasa, el ícono se anuncia a lectores de pantalla
  style?: React.CSSProperties;
}

export function GameIcon({ name, className = "h-5 w-5", title, style }: Props) {
  const body = GAME_ICONS[name] ?? GAME_ICONS.sparkles ?? "";
  return (
    <svg
      viewBox={`0 0 ${GAME_ICON_SIZE} ${GAME_ICON_SIZE}`}
      className={`inline-block shrink-0 ${className}`}
      style={style}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
