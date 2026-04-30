import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CommandSidebar } from "@/components/CommandSidebar";
import { useAuth } from "@/components/AuthProvider";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="font-mono text-xs tracking-[0.3em] text-primary terminal-pulse">
          ESTABLISHING_LINK...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-40" aria-hidden />
      <CommandSidebar />
      <main className="ml-16 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
