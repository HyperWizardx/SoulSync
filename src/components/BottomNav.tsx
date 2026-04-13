import { Link } from "@tanstack/react-router";
import { Home, Globe, Swords, Brain, User } from "lucide-react";

const navItems = [
  { to: "/dashboard" as const, icon: Home, label: "Inicio" },
  { to: "/world" as const, icon: Globe, label: "Mundo" },
  { to: "/missions" as const, icon: Swords, label: "Misiones" },
  { to: "/ai" as const, icon: Brain, label: "IA" },
  { to: "/profile" as const, icon: User, label: "Perfil" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-[430px] items-center justify-around py-2">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground transition-colors"
            activeProps={{ className: "flex flex-col items-center gap-0.5 px-3 py-1 text-primary transition-colors" }}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
