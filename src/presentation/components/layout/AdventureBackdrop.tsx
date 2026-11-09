// Fondo de la portada y del acceso: cielo nocturno con estrellas, un resplandor dorado y la silueta
// de colinas y un castillo lejano. Discreto a propósito: ambienta sin competir con el contenido.
import { StarField } from "@/presentation/components/layout/StarField";

export function AdventureBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0820] via-background to-[#120c2a]" />
      <StarField />
      <div className="absolute left-1/2 top-[30%] h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[110px]" />
      <div className="absolute left-1/2 top-[38%] h-[180px] w-[260px] -translate-x-1/2 rounded-full bg-soul-gold/10 blur-[80px]" />
      <svg className="absolute inset-x-0 bottom-0 h-40 w-full" viewBox="0 0 400 160" preserveAspectRatio="none">
        {/* Castillo lejano sobre la colina del fondo */}
        <g fill="#1d1640" opacity="0.9">
          <rect x="292" y="58" width="9" height="30" />
          <rect x="304" y="46" width="12" height="42" />
          <rect x="319" y="62" width="9" height="26" />
          <polygon points="304,46 310,34 316,46" />
          <polygon points="292,58 296.5,50 301,58" />
          <polygon points="319,62 323.5,54 328,62" />
        </g>
        <path d="M0 96 C 60 70, 120 74, 180 90 S 300 70, 400 84 L400 160 L0 160 Z" fill="#1d1640" opacity="0.9" />
        <path d="M0 122 C 80 100, 150 118, 220 112 S 340 98, 400 116 L400 160 L0 160 Z" fill="#150f30" />
        <path d="M0 142 C 90 130, 200 146, 280 138 S 360 132, 400 140 L400 160 L0 160 Z" fill="#0e0a22" />
      </svg>
    </div>
  );
}
