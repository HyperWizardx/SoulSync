import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthedShell } from "@/components/AuthedShell";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";

import appCss from "../styles.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground font-cinzel">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Página no encontrada
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Este camino no existe en tu mundo emocional.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver al inicio
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
    scripts: [
      {
        type: "module",
        src: "https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js",
      },
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
        <Outlet />
        <AuthedShell />
        <Toaster position="top-center" richColors closeButton />
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
