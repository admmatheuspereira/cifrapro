import { Link } from "wouter";
import { Plus, Music, BookOpen } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { Button } from "../components/ui/button";

export default function Home() {
  const { profile, cifras, hinarios } = useAppStore();
  
  const recentCifras = [...cifras]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  const displayName = profile.name || "Músico";

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-serif font-bold text-foreground">Olá, {displayName}</h1>
        <p className="text-muted-foreground mt-1">Pronto para tocar?</p>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-sm font-medium">Cifras</span>
            <Music size={18} className="text-primary" />
          </div>
          <span className="text-3xl font-bold">{cifras.length}</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-sm font-medium">Hinários</span>
            <BookOpen size={18} className="text-primary" />
          </div>
          <span className="text-3xl font-bold">{hinarios.length}</span>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Cifras Recentes</h2>
          <Link href="/cifras">
            <span className="text-primary text-sm font-medium cursor-pointer" data-testid="link-ver-todas">Ver todas</span>
          </Link>
        </div>

        {recentCifras.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Music size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhuma cifra ainda</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">Adicione sua primeira cifra para começar a construir seu repertório.</p>
            <Link href="/cifras/nova">
              <Button data-testid="button-home-nova-cifra">
                <Plus size={18} className="mr-2" />
                Adicionar Cifra
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCifras.map(cifra => (
              <Link key={cifra.id} href={`/cifras/${cifra.id}`}>
                <div className="bg-card hover:bg-card/80 border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors" data-testid={`card-recent-cifra-${cifra.id}`}>
                  <div>
                    <h3 className="font-medium text-foreground line-clamp-1">{cifra.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{cifra.artist}</p>
                  </div>
                  {cifra.key && (
                    <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium shrink-0 ml-3">
                      {cifra.key}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-[96px] right-4 md:hidden">
        <Link href="/cifras/nova">
          <Button size="icon" className="w-14 h-14 rounded-full shadow-lg" data-testid="fab-nova-cifra">
            <Plus size={24} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
