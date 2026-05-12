import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { Search, Music, BookOpen } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { Input } from "../components/ui/input";

export default function Busca() {
  const { cifras, hinarios } = useAppStore();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return { cifras: [], hinarios: [] };
    
    const q = debouncedQuery.toLowerCase();
    
    const matchedCifras = cifras.filter(
      c => c.title.toLowerCase().includes(q) || c.artist.toLowerCase().includes(q)
    );
    
    const matchedHinarios = hinarios.filter(
      h => h.name.toLowerCase().includes(q)
    );
    
    return {
      cifras: matchedCifras,
      hinarios: matchedHinarios
    };
  }, [debouncedQuery, cifras, hinarios]);

  const hasResults = results.cifras.length > 0 || results.hinarios.length > 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col">
      <header className="mb-6 mt-4">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Busca Global</h1>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-muted-foreground" />
          </div>
          <Input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-14 bg-card border-border text-lg rounded-xl"
            data-testid="input-global-search"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 md:pb-4 space-y-8">
        {!debouncedQuery ? (
          <div className="text-center mt-12">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground">Digite algo para buscar em todo o seu acervo.</p>
          </div>
        ) : !hasResults ? (
          <div className="text-center mt-12">
            <p className="text-muted-foreground">Nenhum resultado encontrado para "{debouncedQuery}".</p>
          </div>
        ) : (
          <>
            {results.cifras.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center text-muted-foreground">
                  <Music size={18} className="mr-2" />
                  Cifras
                </h2>
                <div className="space-y-3">
                  {results.cifras.map(cifra => (
                    <Link key={cifra.id} href={`/cifras/${cifra.id}`}>
                      <div className="bg-card hover:bg-card/80 border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors" data-testid={`search-result-cifra-${cifra.id}`}>
                        <div className="flex-1 min-w-0">
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
              </section>
            )}

            {results.hinarios.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center text-muted-foreground">
                  <BookOpen size={18} className="mr-2" />
                  Hinários
                </h2>
                <div className="space-y-3">
                  {results.hinarios.map(hinario => (
                    <Link key={hinario.id} href={`/hinarios/${hinario.id}`}>
                      <div className="bg-card hover:bg-card/80 border border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors" data-testid={`search-result-hinario-${hinario.id}`}>
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                          <BookOpen size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground line-clamp-1">{hinario.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {hinario.cifraIds.length} {hinario.cifraIds.length === 1 ? 'cifra' : 'cifras'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
