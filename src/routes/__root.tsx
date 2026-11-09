import { GameIcon } from "@/presentation/components/icons/GameIcon";
import { OfflineBanner } from "@/presentation/components/layout/OfflineBanner";
import { MotionProvider } from "@/presentation/components/motion/MotionProvider";
import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthedShell } from "@/presentation/components/layout/AuthedShell";
import { AuthSessionProvider } from "@/presentation/components/layout/AuthSessionProvider";

import appCss from "../styles.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <GameIcon name="treasure-map" className="mx-auto h-20 w-20 text-soul-gold" />
        <h1 className="mt-4 font-cinzel text-5xl font-bold text-foreground">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          Este sendero no aparece en tu mapa
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Puede que el enlace esté roto o que la página se haya movido. Vuelve al campamento y sigue tu aventura.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver a Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SoulSync — RPG de Salud Mental" },
      { name: "description", content: "Tu aventura de bienestar emocional comienza aquí. Gamifica tu salud mental con IA predictiva y misiones AR." },
      { property: "og:title", content: "SoulSync — RPG de Salud Mental" },
      { property: "og:description", content: "Tu aventura de bienestar emocional comienza aquí. Gamifica tu salud mental con IA predictiva y misiones AR." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "SoulSync — RPG de Salud Mental" },
      { name: "twitter:description", content: "Tu aventura de bienestar emocional comienza aquí. Gamifica tu salud mental con IA predictiva y misiones AR." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },

      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Nunito:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        <MotionProvider>
          <Outlet />
          <AuthedShell />
          <OfflineBanner />
          <Toaster position="top-center" richColors closeButton visibleToasts={1} />
        </MotionProvider>
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
