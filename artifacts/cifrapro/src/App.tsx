import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";

import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Cifras from "./pages/Cifras";
import CifraEditor from "./pages/CifraEditor";
import CifraDetail from "./pages/CifraDetail";
import Hinarios from "./pages/Hinarios";
import HinarioDetail from "./pages/HinarioDetail";
import Busca from "./pages/Busca";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();

function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AppRouter() {
  return (
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
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRouter />
        </WouterRouter>
        <Toaster theme="dark" position="top-center" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
