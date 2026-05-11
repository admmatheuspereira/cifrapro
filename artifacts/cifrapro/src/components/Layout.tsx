import { Link, useLocation } from "wouter";
import { Home, Music, BookOpen, Search, User } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../store/useAppStore";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/cifras", label: "Cifras", icon: Music },
  { href: "/hinarios", label: "Hinários", icon: BookOpen },
  { href: "/busca", label: "Busca", icon: Search },
  { href: "/perfil", label: "Perfil", icon: User },
];

const NAV_HEIGHT = 56; // px — reduced from 80

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { profile } = useAppStore();

  useEffect(() => {
    const root = document.documentElement;
    if (profile.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [profile.theme]);

  return (
    <div className="flex h-[100dvh] w-full flex-col md:flex-row overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[220px] flex-col border-r border-border bg-sidebar h-full shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-serif font-bold text-primary">CifraPro</h1>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                  data-testid={`nav-desktop-${item.label.toLowerCase()}`}
                >
                  <Icon size={18} className={isActive ? "text-sidebar-primary" : "text-muted-foreground"} />
                  <span className="text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area — leaves room for mobile nav */}
      <main
        className="flex-1 relative overflow-y-auto overflow-x-hidden md:pb-0"
        style={{ paddingBottom: `${NAV_HEIGHT}px` }}
      >
        {children}
      </main>

      {/* Mobile Bottom Bar — compact */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar/95 backdrop-blur border-t border-border flex items-center justify-around z-50"
        style={{ height: `${NAV_HEIGHT}px` }}
      >
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 cursor-pointer transition-colors"
                data-testid={`nav-mobile-${item.label.toLowerCase()}`}
              >
                <motion.div
                  animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                >
                  <Icon size={20} className={isActive ? "text-primary" : "text-muted-foreground"} />
                </motion.div>
                <span className={`text-[9px] leading-tight ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
