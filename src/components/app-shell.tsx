import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Bell,
  Home,
  Package,
  ScanLine,
  Bot,
  BarChart3,
  AlarmClock,
  Sparkles,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth, signOut } from "@/lib/auth-store";

const nav: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/reminders", label: "Reminders", icon: AlarmClock },
  { to: "/assistant", label: "AI Chef", icon: Bot },
  { to: "/stats", label: "Stats", icon: BarChart3 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const user = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen text-foreground">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="size-8 rounded-lg bg-gradient-to-br from-grocery via-meds to-beauty grid place-items-center">
              <Sparkles className="size-4 text-white/90" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground hidden sm:inline">
              SmartShelf <span className="text-muted-foreground">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const active = pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/reminders" className="relative p-2 rounded-full hover:bg-white/5">
              <Bell className="size-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger ring-2 ring-background" />
            </Link>
            
            {user ? (
              <div className="relative group">
                <button className="size-9 rounded-full bg-gradient-to-tr from-meds/60 to-beauty/60 border border-white/10 overflow-hidden grid place-items-center cursor-pointer">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} className="size-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold">{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </button>
                
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-card border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto">
                  <div className="p-3 border-b border-white/5">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <LogOut className="size-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="size-9 rounded-full bg-gradient-to-tr from-meds/60 to-beauty/60 border border-white/10" />
            )}
          </div>
        </div>
      </nav>

      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="pt-24 pb-28 md:pb-12 px-4 sm:px-6 max-w-7xl mx-auto"
      >
        {children}
      </motion.main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-background/90 backdrop-blur-xl">
        <div className="grid grid-cols-5 px-2 py-2">
          {nav.slice(0, 5).map((n) => {
            const active = pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center gap-0.5 py-1 rounded-lg ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" />
                <span className="text-[10px] font-medium">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 mb-8">
      <div className="min-w-0">
        <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-foreground truncate">
          {title}
        </h1>
        {subtitle && <p className="text-muted-foreground mt-1 text-sm sm:text-base">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
