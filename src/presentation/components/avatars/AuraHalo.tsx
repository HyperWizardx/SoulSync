/** Halo animado alrededor del avatar: su intensidad refleja el nivel de aura (0–4). */
import type { ReactNode } from "react";
import type { AuraState } from "@/domain/gamification/aura";

interface Props {
  aura: AuraState | null | undefined;
  color: string;
  children: ReactNode;
  showLabel?: boolean;
}

export function AuraHalo({ aura, color, children, showLabel = true }: Props) {
  const level = aura?.level ?? 0;
  const i = aura?.intensity ?? 0;
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {level > 0 && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-full blur-2xl animate-pulse"
              style={{ background: color, opacity: 0.15 + i * 0.45, animationDuration: `${3.5 - i * 1.5}s` }}
            />
            {level >= 2 && (
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-3 rounded-full border-2 border-dashed animate-spin"
                style={{ borderColor: color, opacity: 0.25 + i * 0.4, animationDuration: `${22 - level * 3}s` }}
              />
            )}
            {level >= 4 && (
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-5 rounded-full border animate-ping"
                style={{ borderColor: color, opacity: 0.35, animationDuration: "3s" }}
              />
            )}
          </>
        )}
        <div className="relative">{children}</div>
      </div>
      {showLabel && aura && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Aura {aura.name}</span> · {aura.message}
        </p>
      )}
    </div>
  );
}
