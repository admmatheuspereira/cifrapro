import { Link, useLocation } from "wouter";
import { Home, Music, BookOpen, Search, User } from "lucide-react";
import { ReactNode } from "react";
import { motion } from "framer-motion";

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

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-[100dvh] w-full flex-col md:flex-row overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[220px] flex-col border-r border-border bg-sidebar h-full shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-serif font-bold text-primary">CifraPro</h1>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors cursor-pointer min-h-[48px] ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                  data-testid={`nav-desktop-${item.label.toLowerCase()}`}
                >
                  <Icon size={20} className={isActive ? "text-sidebar-primary" : "text-muted-foreground"} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden md:pb-0 pb-[80px]">
        {children}
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-sidebar border-t border-border flex items-center justify-around px-2 z-50 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className="flex flex-col items-center justify-center w-full h-full min-h-[48px] px-2 py-1 cursor-pointer transition-colors"
                data-testid={`nav-mobile-${item.label.toLowerCase()}`}
              >
                <motion.div
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Icon size={24} className={isActive ? "text-primary" : "text-muted-foreground"} />
                </motion.div>
                <span className={`text-[10px] mt-1 ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
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
