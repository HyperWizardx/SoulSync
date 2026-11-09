// "Tu siguiente paso" en Inicio: la misión recomendada de la zona con menos progreso,
// con acceso directo para empezarla, más los accesos a Tienda y Comunidad.
import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { Link } from "@tanstack/react-router";
import { ChevronRight, ShoppingBag, Users } from "lucide-react";
import { MISSIONS } from "@/domain/gamification/missionsData";
import { nextStepMission } from "@/domain/world/missionZones";
import { zoneInfo, type WorldZone } from "@/domain/world/world";

interface Props {
  zones: WorldZone[] | null;
  completedToday: ReadonlySet<string>;
  level: number;
}

export function NextStepCard({ zones, completedToday, level }: Props) {
  const next = zones ? nextStepMission(zones, MISSIONS, completedToday, level) : null;
  const zone = next ? zoneInfo(next.zone) : null;
  return (
    <div className="space-y-2">
      {next && zone ? (
        <Link
          to="/missions"
          search={{ mission: next.mission.id, from: next.zone }}
          className="flex items-center gap-3 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 transition-transform active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary" aria-hidden><GameIcon name={next.mission.icon} className="h-6 w-6" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wide text-primary">Tu siguiente paso</span>
            <span className="block truncate font-semibold text-foreground">{next.mission.title}</span>
            <span className="block text-xs text-muted-foreground"><GameIcon name={zone.icon} className="mr-1 h-3.5 w-3.5 align-[-2px]" />{zone.name} · +{next.mission.reward.xp} XP</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        </Link>
      ) : (
        <Link to="/world" className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wide text-primary">Tu siguiente paso</span>
            <span className="block text-sm text-foreground">Completaste lo de hoy. Mira cómo creció tu Mundo.</span>
          </span>
          <ChevronRight className="h-5 w-5 text-primary" aria-hidden />
        </Link>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Link to="/store" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-transform active:scale-95">
          <ShoppingBag className="h-4 w-4 text-soul-gold" aria-hidden /> Tienda
        </Link>
        <Link to="/community" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-transform active:scale-95">
          <Users className="h-4 w-4 text-soul-teal" aria-hidden /> Comunidad
        </Link>
      </div>
    </div>
  );
}
