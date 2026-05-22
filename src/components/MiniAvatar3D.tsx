import { useEffect, useRef } from "react";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          "camera-controls"?: boolean | string;
          "auto-rotate"?: boolean | string;
          "disable-zoom"?: boolean | string;
          "shadow-intensity"?: string | number;
          "exposure"?: string | number;
          ar?: boolean | string;
          "rotation-per-second"?: string;
          "camera-orbit"?: string;
          "field-of-view"?: string;
          "interaction-prompt"?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface Props {
  size?: number;
  rotate?: boolean;
  glowColor?: string;
  className?: string;
  /** Scale pulse 1 = idle, >1 = energized */
  scale?: number;
}

export function MiniAvatar3D({
  size = 180,
  rotate = true,
  glowColor = "hsl(var(--primary))",
  className = "",
  scale = 1,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.transform = `scale(${scale})`;
    }
  }, [scale]);

  return (
    <div
      ref={ref}
      className={`relative transition-transform duration-300 ease-out ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse"
        style={{ background: glowColor }}
      />
      {/* @ts-expect-error - web component */}
      <model-viewer
        src="/models/avatar.glb"
        alt="Avatar 3D"
        auto-rotate={rotate ? "" : undefined}
        rotation-per-second="20deg"
        camera-controls=""
        disable-zoom=""
        interaction-prompt="none"
        shadow-intensity="1"
        exposure="1.1"
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
          // @ts-expect-error css var
          "--poster-color": "transparent",
        }}
      />
    </div>
  );
}
