// Esqueletos de carga con la forma de cada pantalla, para que el usuario vea la estructura
// mientras llegan sus datos en lugar de valores por defecto o una pantalla vacía.
const Block = ({ className }: { className: string }) => <div className={`animate-pulse rounded-2xl bg-card ${className}`} />;

export function PageSkeleton({ variant }: { variant: "dashboard" | "missions" | "profile" }) {
  return (
    <div className="px-4 pt-6" role="status" aria-busy="true" aria-label="Cargando">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Block className="h-3 w-28 rounded-md" />
          <Block className="h-6 w-40 rounded-md" />
        </div>
        <Block className="h-12 w-12 rounded-full" />
      </div>
      {variant === "dashboard" && (
        <>
          <Block className="mt-6 h-60" />
          <Block className="mt-4 h-24" />
          <Block className="mt-4 h-20" />
          <Block className="mt-6 h-40" />
        </>
      )}
      {variant === "missions" && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">{[0, 1, 2].map((i) => <Block key={i} className="h-12 rounded-xl" />)}</div>
          <Block className="mt-5 h-11 rounded-xl" />
          <div className="mt-4 space-y-3">{[0, 1, 2, 3].map((i) => <Block key={i} className="h-24 rounded-xl" />)}</div>
        </>
      )}
      {variant === "profile" && (
        <>
          <Block className="mt-4 h-72" />
          <Block className="mt-4 h-32" />
          <div className="mt-4 grid grid-cols-3 gap-2">{[0, 1, 2, 3, 4, 5].map((i) => <Block key={i} className="h-20 rounded-xl" />)}</div>
        </>
      )}
      <span className="sr-only">Cargando tu información…</span>
    </div>
  );
}
