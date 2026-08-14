// Ilustraciones de avatar "medieval-fantasy" amigables, en reemplazo de los
// emojis genéricos. Mantiene el mismo orden/índice (0-5) que ya se guarda
// en la base de datos (profiles.avatar) para no romper datos existentes.
import { useId } from "react";

export interface AvatarMeta {
  id: number;
  name: string;
  title: string;
  ring: string; // color tailwind-friendly para anillos/glow (coincide con el acento del personaje)
}

export const AVATAR_META: AvatarMeta[] = [
  { id: 0, name: "Mago", title: "Sabiduría arcana", ring: "#8B5CF6" },
  { id: 1, name: "Elfa", title: "Guardiana del bosque", ring: "#2DD4BF" },
  { id: 2, name: "Dragón", title: "Corazón valiente", ring: "#22C55E" },
  { id: 3, name: "Zorro", title: "Explorador astuto", ring: "#F0883E" },
  { id: 4, name: "Estrella", title: "Luz guía", ring: "#F5C451" },
  { id: 5, name: "Búho", title: "Sabio consejero", ring: "#A6825A" },
];

function Face({ skin = "#FBD9B5" }: { skin?: string }) {
  return (
    <>
      <circle cx="50" cy="58" r="20" fill={skin} />
      <circle cx="42.5" cy="57" r="2.6" fill="#2b2140" />
      <circle cx="57.5" cy="57" r="2.6" fill="#2b2140" />
      <circle cx="43.3" cy="56" r="0.8" fill="#fff" />
      <circle cx="58.3" cy="56" r="0.8" fill="#fff" />
      <circle cx="37" cy="63" r="3.6" fill="#F79E9E" opacity="0.55" />
      <circle cx="63" cy="63" r="3.6" fill="#F79E9E" opacity="0.55" />
      <path d="M44 67 Q50 71 56 67" stroke="#7a4b2c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  );
}

function Mago({ gid }: { gid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6D28D9" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${gid})`} stroke="#4c1d95" strokeWidth="2" />
      <path d="M28 92 Q50 74 72 92 L72 100 L28 100 Z" fill="#5B21B6" />
      <circle cx="50" cy="86" r="3" fill="#F5C451" />
      <Face />
      <path d="M50 6 C42 26,20 34,18 46 C30 40,70 40,82 46 C80 34,58 26,50 6 Z" fill="#6D28D9" stroke="#4c1d95" strokeWidth="1.5" />
      <path d="M20 45 Q50 34 80 45 L80 50 Q50 41 20 50 Z" fill="#F5C451" />
      <circle cx="50" cy="9" r="4" fill="#F5C451" />
    </>
  );
}

function Elfa({ gid }: { gid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#0f9488" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${gid})`} stroke="#0d6b62" strokeWidth="2" />
      <path d="M28 92 Q50 76 72 92 L72 100 L28 100 Z" fill="#0f9488" />
      <path d="M28 52 Q26 26 50 24 Q74 26 72 52 Q72 40 50 38 Q28 40 28 52 Z" fill="#0b5b52" />
      <path d="M27 54 L18 48 L27 46 Z" fill="#FBD9B5" />
      <path d="M73 54 L82 48 L73 46 Z" fill="#FBD9B5" />
      <Face />
      <path d="M31 49 Q50 42 69 49" stroke="#F5C451" strokeWidth="2.4" fill="none" />
      <circle cx="50" cy="47" r="2.6" fill="#5eead4" stroke="#0f9488" strokeWidth="0.8" />
    </>
  );
}

function Dragon({ gid }: { gid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#15803d" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${gid})`} stroke="#14532d" strokeWidth="2" />
      <path d="M28 92 Q50 78 72 92 L72 100 L28 100 Z" fill="#166534" />
      <circle cx="68" cy="20" r="3" fill="#fef3c7" opacity="0.9" />
      <circle cx="74" cy="14" r="2" fill="#fef3c7" opacity="0.7" />
      <path d="M31 45 L22 32 L35 39 Z" fill="#15803d" />
      <path d="M69 45 L78 32 L65 39 Z" fill="#15803d" />
      <path d="M41 38 Q40 29 45 26 Q43 34 44 40 Z" fill="#FDE68A" />
      <path d="M59 38 Q60 29 55 26 Q57 34 56 40 Z" fill="#FDE68A" />
      <ellipse cx="50" cy="60" rx="21" ry="21" fill="#4ADE80" />
      <ellipse cx="50" cy="70" rx="12" ry="8" fill="#DCFCE7" />
      <circle cx="46" cy="69" r="0.9" fill="#14532d" />
      <circle cx="54" cy="69" r="0.9" fill="#14532d" />
      <circle cx="42" cy="56" r="3" fill="#0f2f1a" />
      <circle cx="58" cy="56" r="3" fill="#0f2f1a" />
      <circle cx="43" cy="55" r="0.9" fill="#fff" />
      <circle cx="59" cy="55" r="0.9" fill="#fff" />
      <path d="M45 74 Q50 77 55 74" stroke="#14532d" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  );
}

function Zorro({ gid }: { gid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${gid})`} stroke="#9a3412" strokeWidth="2" />
      <path d="M28 92 Q50 76 72 92 L72 100 L28 100 Z" fill="#7c3f23" />
      <path d="M27 48 Q29 22 50 20 Q71 22 73 48 Q62 38 50 38 Q38 38 27 48 Z" fill="#8a5a35" stroke="#6b4423" strokeWidth="1.2" />
      <circle cx="50" cy="30" r="2" fill="#e7c99a" />
      <path d="M33 35 L28 19 L43 30 Z" fill="#EA8A3B" />
      <path d="M33 35 L30 23 L40 30 Z" fill="#FCE3C2" />
      <path d="M67 35 L72 19 L57 30 Z" fill="#EA8A3B" />
      <path d="M67 35 L70 23 L60 30 Z" fill="#FCE3C2" />
      <circle cx="50" cy="59" r="20" fill="#F3A860" />
      <path d="M50 62 Q38 60 36 68 Q44 74 50 70 Q56 74 64 68 Q62 60 50 62 Z" fill="#FCE3C2" />
      <circle cx="42.5" cy="57" r="2.6" fill="#2b1a10" />
      <circle cx="57.5" cy="57" r="2.6" fill="#2b1a10" />
      <circle cx="43.3" cy="56" r="0.8" fill="#fff" />
      <circle cx="58.3" cy="56" r="0.8" fill="#fff" />
      <path d="M49 65 L51 65 L50 67 Z" fill="#5c3a20" />
      <path d="M44 69 Q50 72 56 69" stroke="#5c3a20" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  );
}

function Estrella({ gid }: { gid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${gid})`} stroke="#92400e" strokeWidth="2" />
      <ellipse cx="50" cy="24" rx="12" ry="4" fill="none" stroke="#fff7cc" strokeWidth="2" opacity="0.85" />
      <path d="M22 30 L24 34 L28 36 L24 38 L22 42 L20 38 L16 36 L20 34 Z" fill="#fff7cc" opacity="0.9" />
      <path d="M78 62 L79.5 65 L82 66 L79.5 67 L78 70 L76.5 67 L74 66 L76.5 65 Z" fill="#fff7cc" opacity="0.9" />
      <path
        d="M50 30 C54 42,58 44,70 46 C59 50,56 54,58 66 C50 59,50 59,42 66 C44 54,41 50,30 46 C42 44,46 42,50 30 Z"
        fill="#FDE047" stroke="#CA8A04" strokeWidth="1.5" strokeLinejoin="round"
      />
      <circle cx="45" cy="52" r="2.6" fill="#7c4a03" />
      <circle cx="55" cy="52" r="2.6" fill="#7c4a03" />
      <circle cx="45.8" cy="51" r="0.8" fill="#fff" />
      <circle cx="55.8" cy="51" r="0.8" fill="#fff" />
      <circle cx="40" cy="56" r="2.6" fill="#F79E9E" opacity="0.6" />
      <circle cx="60" cy="56" r="2.6" fill="#F79E9E" opacity="0.6" />
      <path d="M46 58 Q50 61 54 58" stroke="#7c4a03" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  );
}

function Buho({ gid }: { gid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#d6c6a8" />
          <stop offset="100%" stopColor="#78502e" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${gid})`} stroke="#5b3a1f" strokeWidth="2" />
      <path d="M28 92 Q50 78 72 92 L72 100 L28 100 Z" fill="#5b3a1f" />
      <path d="M38 32 L34 20 L44 30 Z" fill="#8a5a35" />
      <path d="M62 32 L66 20 L56 30 Z" fill="#8a5a35" />
      <ellipse cx="50" cy="60" rx="22" ry="21" fill="#B08658" />
      <circle cx="42" cy="56" r="10.5" fill="#F3E8D4" />
      <circle cx="58" cy="56" r="10.5" fill="#F3E8D4" />
      <circle cx="42" cy="56" r="4.4" fill="#4b2e18" />
      <circle cx="58" cy="56" r="4.4" fill="#4b2e18" />
      <circle cx="43" cy="54.5" r="1.2" fill="#fff" />
      <circle cx="59" cy="54.5" r="1.2" fill="#fff" />
      <path d="M47 63 L53 63 L50 69 Z" fill="#F5A93F" />
      <path d="M50 20 L74 30 L50 40 L26 30 Z" fill="#4c1d95" />
      <rect x="47" y="30" width="6" height="8" fill="#4c1d95" />
      <circle cx="50" cy="40" r="2" fill="#F5C451" />
      <line x1="74" y1="30" x2="76" y2="40" stroke="#F5C451" strokeWidth="1.4" />
      <circle cx="76" cy="41" r="1.6" fill="#F5C451" />
    </>
  );
}

const RENDERERS = [Mago, Elfa, Dragon, Zorro, Estrella, Buho];

interface AvatarIconProps {
  index: number;
  size?: number;
  selected?: boolean;
  glow?: boolean;
  className?: string;
}

/** Ilustración de avatar (badge circular) para un índice 0-5. */
export function AvatarIcon({ index, size = 64, selected = false, glow = false, className = "" }: AvatarIconProps) {
  const gid = useId();
  const safeIndex = ((index % RENDERERS.length) + RENDERERS.length) % RENDERERS.length;
  const Renderer = RENDERERS[safeIndex] ?? Mago;
  const meta = AVATAR_META[safeIndex];

  return (
    <div
      className={`relative shrink-0 rounded-full transition-transform duration-300 ${selected ? "scale-105" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse"
          style={{ background: meta.ring }}
        />
      )}
      <svg viewBox="0 0 100 100" width={size} height={size} className="relative">
        <Renderer gid={`avatar-${safeIndex}-${gid}`} />
      </svg>
    </div>
  );
}
