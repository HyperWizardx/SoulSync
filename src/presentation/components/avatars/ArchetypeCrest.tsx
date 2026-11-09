// Escudo heráldico del arquetipo con el nivel: acceso al Perfil desde los encabezados.
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { getArchetypeStyle, withAlpha } from "@/domain/identity/archetype";

export function ArchetypeCrest({ archetype, level, size = 48 }: { archetype: number | null; level: number; size?: number }) {
  const style = getArchetypeStyle(archetype);
  return (
    <Link
      to="/profile"
      aria-label={`Ver perfil: ${style.name}, nivel ${level}`}
      className="relative flex shrink-0 items-center justify-center rounded-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ width: size, height: size, filter: `drop-shadow(0 0 8px ${withAlpha(style.glow, 0.45)})` }}
    >
      <Shield aria-hidden className="absolute inset-0" width={size} height={size} strokeWidth={1.75} style={{ color: style.accent, fill: withAlpha(style.accent, 0.15) }} />
      <GameIcon name={style.icon} className="relative -mt-1" style={{ width: size * 0.42, height: size * 0.42, color: style.accent }} />
      <span aria-hidden className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
        {level}
      </span>
    </Link>
  );
}
