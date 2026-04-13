import { createFileRoute } from "@tanstack/react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/community")({
  component: CommunityPage,
});

const volunteers = [
  { name: "Ana M.", role: "Psicóloga", dist: "0.5 km", emoji: "👩‍⚕️", online: true },
  { name: "Carlos R.", role: "Coach", dist: "1.2 km", emoji: "🧑‍🏫", online: true },
  { name: "Marta L.", role: "Voluntaria", dist: "2.0 km", emoji: "🤝", online: false },
  { name: "Pedro G.", role: "Mentor", dist: "3.5 km", emoji: "🧙", online: true },
];

function CommunityPage() {
  return (
    <MobileLayout>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-cinzel font-bold text-foreground">Comunidad</h1>
        <p className="mt-1 text-sm text-muted-foreground">Conexiones cerca de ti</p>

        {/* Map placeholder */}
        <button
          onClick={() => toast("Mapa interactivo próximamente", { icon: "🗺️" })}
          className="mt-6 flex h-48 w-full items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-soul-teal/5 transition-all hover:border-primary/50 hover:shadow-lg active:scale-[0.98]"
        >
          <div className="flex flex-col items-center text-muted-foreground">
            <MapPin className="h-8 w-8 text-primary animate-float" />
            <p className="mt-2 text-sm">Mapa de voluntarios</p>
            <p className="text-xs">4 personas cerca</p>
          </div>
        </button>

        {/* Volunteer List */}
        <div className="mt-6">
          <h2 className="font-cinzel font-semibold text-foreground">Personas Cercanas</h2>
          <div className="mt-3 space-y-3">
            {volunteers.map((v) => (
              <div key={v.name} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                <div className="relative">
                  <span className="text-3xl">{v.emoji}</span>
                  {v.online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-soul-teal animate-pulse" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.role} • {v.dist}</p>
                </div>
                <button
                  onClick={() => {
                    if (!v.online) {
                      toast.error(`${v.name} no está disponible`, { icon: "😴" });
                    } else {
                      toast.success(`Conectando con ${v.name}...`, { icon: "💬" });
                    }
                  }}
                  className={`rounded-lg p-2 transition-all active:scale-90 ${
                    v.online ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
