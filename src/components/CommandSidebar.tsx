import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Upload, LogOut, Cpu, Settings, Clock, FileText, HelpCircle, Compass, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";

export function CommandSidebar() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/dashboard", icon: LayoutGrid, label: "Grid" },
    { to: "/dashboard/analyze", icon: Upload, label: "Scan" },
  ] as const;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-16 border-r border-border bg-sidebar flex flex-col items-center py-5 z-30">
      <Link to="/dashboard" className="w-9 h-9 rounded-sm bg-primary glow-lime grid place-items-center mb-8">
        <Cpu className="w-4 h-4 text-primary-foreground" />
      </Link>

      <nav className="flex flex-col gap-2 flex-1">
        {items.map((item) => {
          const active = path === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              className={`w-10 h-10 grid place-items-center rounded-sm border transition-all relative group ${
                active
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {active && (
                <span className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[2px] h-5 bg-primary glow-lime" />
              )}
              <span className="absolute left-full ml-3 px-2 py-1 text-[10px] font-mono uppercase tracking-wider bg-popover border border-border rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-10 h-10 rounded-full bg-[oklch(0.6_0.2_300)] border border-white/10 grid place-items-center font-mono text-xs text-white hover:brightness-110 transition-all outline-none cursor-pointer shadow-lg">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            sideOffset={16}
            className="w-64 bg-[#121212] border-white/5 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden"
          >
            <div className="space-y-0.5">
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground/90 hover:bg-white/10 focus:bg-white/10 rounded-lg cursor-pointer transition-colors outline-none">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 font-medium">Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground/90 hover:bg-white/10 focus:bg-white/10 rounded-lg cursor-pointer transition-colors outline-none">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 font-medium">Tasks</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground/90 hover:bg-white/10 focus:bg-white/10 rounded-lg cursor-pointer transition-colors outline-none">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 font-medium">Files</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="flex items-center justify-between px-3 py-2.5 text-sm text-foreground/90 hover:bg-white/10 focus:bg-white/10 rounded-lg cursor-pointer transition-colors group outline-none">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Help</span>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/5 my-1.5" />

              <Link to="/dashboard/billing">
                <DropdownMenuItem className="flex items-center justify-between px-3 py-2.5 text-sm text-foreground/90 hover:bg-white/10 focus:bg-white/10 rounded-lg cursor-pointer transition-colors group outline-none">
                  <div className="flex items-center gap-3">
                    <Compass className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Upgrade plan</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </DropdownMenuItem>
              </Link>

              <DropdownMenuItem 
                onClick={async () => {
                  await signOut();
                  toast.success("Disconnected");
                  navigate({ to: "/" });
                }}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground/90 hover:bg-white/10 focus:bg-white/10 rounded-lg cursor-pointer transition-colors outline-none"
              >
                <LogOut className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 font-medium">Sign Out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
