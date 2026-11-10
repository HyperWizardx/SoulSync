// Interruptor de preferencia (Perfil → Ajustes): etiqueta, ayuda y switch accesible de 44 px.
export function PrefSwitch({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg bg-secondary px-3 py-2 text-left min-h-[44px]"
    >
      <span>
        <span className="block text-sm text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`} aria-hidden>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}
