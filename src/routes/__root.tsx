import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/components/AuthProvider";
import { ScanlineOverlay } from "@/components/ScanlineOverlay";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-xs text-primary tracking-[0.3em] mb-4">[ ERR_404 ]</div>
        <h1 className="text-7xl font-mono font-bold text-primary text-glow-lime">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Sector not found</h2>
        <p className="mt-2 text-sm text-muted-foreground font-mono">
          The requested coordinate does not exist in the NEXUS mainframe.
        </p>
        <a
          href="/"
          className="inline-flex mt-6 items-center justify-center rounded-sm bg-primary px-5 py-2 text-sm font-mono uppercase tracking-wider text-primary-foreground hover:glow-lime transition-all"
        >
          Return to base
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NEXUS — AI Resume Intelligence" },
      { name: "description", content: "NEXUS is an AI-driven semantic resume screening engine. Score candidates against any job description in seconds." },
      { name: "author", content: "NEXUS" },
      { property: "og:title", content: "NEXUS — AI Resume Intelligence" },
      { property: "og:description", content: "Semantic resume screening powered by AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <ScanlineOverlay />
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
