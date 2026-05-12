import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Plus, Search, Trash2, Edit2, Music } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../store/useAppStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Modal } from "../components/Modal";

export default function Cifras() {
  const { cifras, deleteCifra } = useAppStore();
  const [search, setSearch] = useState("");
  const [cifraToDelete, setCifraToDelete] = useState<string | null>(null);

  const filteredCifras = useMemo(() => {
    if (!search.trim()) return cifras;
    const query = search.toLowerCase();
    return cifras.filter(
      c => c.title.toLowerCase().includes(query) || c.artist.toLowerCase().includes(query)
    );
  }, [cifras, search]);

  const handleDelete = () => {
    if (cifraToDelete) {
      deleteCifra(cifraToDelete);
      toast.success("Cifra excluída com sucesso!");
      setCifraToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Cifras</h1>
          <p className="text-muted-foreground mt-1">Seu repertório completo</p>
        </div>
        <Link href="/cifras/nova">
          <Button className="hidden sm:flex" data-testid="button-cifras-nova">
            <Plus size={18} className="mr-2" />
            Nova Cifra
          </Button>
        </Link>
      </header>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-muted-foreground" />
        </div>
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 bg-card border-border min-h-[48px]"
          data-testid="input-search-cifras"
        />
      </div>

      <div className="flex-1 overflow-y-auto pb-24 md:pb-4 space-y-3">
        {filteredCifras.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center flex flex-col items-center mt-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Music size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhuma cifra encontrada</h3>
            {search ? (
              <p className="text-muted-foreground mb-6">Tente buscar com outros termos.</p>
            ) : (
              <>
                <p className="text-muted-foreground mb-6">Você ainda não tem cifras no seu repertório.</p>
                <Link href="/cifras/nova">
                  <Button data-testid="button-empty-nova-cifra">
                    <Plus size={18} className="mr-2" />
                    Adicionar Cifra
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          filteredCifras.map(cifra => (
            <div
              key={cifra.id}
              className="bg-card hover:bg-card/80 border border-border rounded-xl p-4 flex items-center justify-between group transition-colors"
              data-testid={`card-cifra-${cifra.id}`}
            >
              <Link href={`/cifras/${cifra.id}`} className="flex-1 min-w-0 pr-3 block cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground line-clamp-1">{cifra.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{cifra.artist || <span className="italic opacity-60">Sem artista</span>}</p>
                  </div>
                  {cifra.key && (
                    <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium shrink-0">
                      {cifra.key}
                    </div>
                  )}
                </div>
              </Link>

              {/* Always visible on mobile, hover-reveal on desktop */}
              <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                <Link href={`/cifras/${cifra.id}/editar`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    data-testid={`button-edit-cifra-${cifra.id}`}
                  >
                    <Edit2 size={16} />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  onClick={() => setCifraToDelete(cifra.id)}
                  data-testid={`button-delete-cifra-${cifra.id}`}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-[64px] right-4 md:hidden z-30">
        <Link href="/cifras/nova">
          <Button size="icon" className="w-14 h-14 rounded-full shadow-lg shadow-primary/25" data-testid="fab-nova-cifra">
            <Plus size={24} />
          </Button>
        </Link>
      </div>

      <Modal
        isOpen={!!cifraToDelete}
        onClose={() => setCifraToDelete(null)}
        title="Excluir Cifra"
        onConfirm={handleDelete}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      >
        <p className="text-muted-foreground">Tem certeza que deseja excluir esta cifra? Esta ação não pode ser desfeita.</p>
      </Modal>
    </div>
  );
}
