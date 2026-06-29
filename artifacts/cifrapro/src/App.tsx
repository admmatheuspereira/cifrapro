import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";

import { Layout } from "./components/Layout";
import { useAppStore } from "./store/useAppStore";
import { AuthProvider, useAuth } from "./lib/auth";
import Home from "./pages/Home";
import Cifras from "./pages/Cifras";
import CifraEditor from "./pages/CifraEditor";
import CifraDetail from "./pages/CifraDetail";
import Hinarios from "./pages/Hinarios";
import HinarioDetail from "./pages/HinarioDetail";
import Busca from "./pages/Busca";
import Perfil from "./pages/Perfil";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();

function isFullHeightRoute(location: string) {
  return (
    (location.startsWith("/cifras/") && !location.endsWith("/editar") && location !== "/cifras/nova") ||
    (location.startsWith("/hinarios/") && location !== "/hinarios")
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const full = isFullHeightRoute(location);

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={location}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        className={full ? "h-full" : "min-h-full"}
        style={{ position: full ? undefined : "absolute", inset: full ? undefined : 0 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0C1B27' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#1B98E0', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!user) return <Redirect to="/auth" />;
  return <Component />;
}

function AppRouter() {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading && location !== '/auth' && location !== '/reset-password') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0C1B27' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#1B98E0', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth">
        {user ? <Redirect to="/" /> : <Auth />}
      </Route>

      <Route path="/reset-password">
        <ResetPassword />
      </Route>

      <Route>
        {!user && !loading ? (
          <Redirect to="/auth" />
        ) : (
          <Layout>
            <PageTransition>
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/cifras" component={Cifras} />
                <Route path="/cifras/nova" component={CifraEditor} />
                <Route path="/cifras/:id" component={CifraDetail} />
                <Route path="/cifras/:id/editar" component={CifraEditor} />
                <Route path="/hinarios" component={Hinarios} />
                <Route path="/hinarios/:id" component={HinarioDetail} />
                <Route path="/busca" component={Busca} />
                <Route path="/perfil" component={Perfil} />
                <Route component={NotFound} />
              </Switch>
            </PageTransition>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function ThemedToaster() {
  const { profile } = useAppStore();
  return (
    <Toaster
      theme={profile.theme ?? "dark"}
      position="top-center"
      richColors
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </WouterRouter>
        <ThemedToaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
