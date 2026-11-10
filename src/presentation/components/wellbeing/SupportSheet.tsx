// Protocolo de apoyo (inspirado en LIVE LIFE de la OMS): un botón "Pide ayuda" siempre a mano,
// un aviso automático cuando la brújula o el pergamino lo sugieren, y una hoja con a quién acudir.
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LifeBuoy, Phone } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SUPPORT_CONTACTS, SUPPORT_COPY } from "@/domain/wellbeing/support";

function SupportContent() {
  return (
    <div className="space-y-3 pb-6">
      {SUPPORT_CONTACTS.map((c) => (
        <div key={c.id} className="rounded-xl border border-border bg-card p-3">
          <p className="text-sm font-semibold text-foreground">{c.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{c.detail}</p>
          {c.href && (
            <a href={c.href} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-destructive/15 px-4 text-sm font-semibold text-destructive">
              <Phone className="h-4 w-4" aria-hidden /> {c.actionLabel}
            </a>
          )}
        </div>
      ))}
      <Link to="/missions" search={{ mission: "breath-4" }} className="flex min-h-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/5 text-sm font-semibold text-primary">
        Respira conmigo 3 minutos
      </Link>
      <p className="text-center text-xs text-muted-foreground">{SUPPORT_COPY.disclaimer}</p>
    </div>
  );
}

/** Hoja con los contactos de apoyo. */
export function SupportSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 font-cinzel"><LifeBuoy className="h-5 w-5 text-destructive" aria-hidden /> {SUPPORT_COPY.title}</SheetTitle>
          <SheetDescription>{SUPPORT_COPY.body}</SheetDescription>
        </SheetHeader>
        <div className="mt-4"><SupportContent /></div>
      </SheetContent>
    </Sheet>
  );
}

/** Botón redondo "Pide ayuda" para las cabeceras (siempre visible). */
export function SupportButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Pide ayuda"
        className="flex h-11 items-center gap-1.5 rounded-full border border-destructive/40 px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
      >
        <LifeBuoy className="h-4 w-4" aria-hidden /> Ayuda
      </button>
      <SupportSheet open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Aviso amable cuando la brújula o el pergamino sugieren pedir apoyo. */
export function SupportBanner() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-left"
      >
        <LifeBuoy className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
        <span>
          <span className="block text-sm font-semibold text-foreground">{SUPPORT_COPY.bannerTitle}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{SUPPORT_COPY.bannerBody}</span>
          <span className="mt-1 block text-xs font-semibold text-destructive">Ver a quién acudir →</span>
        </span>
      </button>
      <SupportSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
