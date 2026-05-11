import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, Plus, Music, MinusCircle } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../store/useAppStore";
import { Button } from "../components/ui/button";
import { Modal } from "../components/Modal";
import { Checkbox } from "../components/ui/checkbox";

export default function HinarioDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { hinarios, cifras, removeCifraFromHinario, addCifraToHinario } = useAppStore();

  const hinarioId = params.id as string;
  const hinario = hinarios.find(h => h.id === hinarioId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCifraIds, setSelectedCifraIds] = useState<Set<string>>(new Set());

  if (!hinario) {
    setLocation("/hinarios");
    return null;
  }

  const hinarioCifras = cifras.filter(c => hinario.cifraIds.includes(c.id));
  const availableCifras = cifras.filter(c => !hinario.cifraIds.includes(c.id));

  const handleRemove = (cifraId: string) => {
    removeCifraFromHinario(hinarioId, cifraId);
    toast.success("Cifra removida do hinário!");
  };

  const handleOpenAddModal = () => {
    setSelectedCifraIds(new Set());
    setShowAddModal(true);
  };

  const toggleCifraSelection = (id: string) => {
    const next = new Set(selectedCifraIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedCifraIds(next);
  };

  const handleAddSelected = () => {
    if (selectedCifraIds.size === 0) {
      setShowAddModal(false);
      return;
    }

    selectedCifraIds.forEach(id => {
      addCifraToHinario(hinarioId, id);
    });

    toast.success(`${selectedCifraIds.size} ${selectedCifraIds.size === 1 ? 'cifra adicionada' : 'cifras adicionadas'}!`);
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background">
      <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-sidebar/80 backdrop-blur shrink-0 safe-top">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/hinarios")} data-testid="button-hinario-back">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-semibold text-foreground truncate">{hinario.name}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleOpenAddModal} data-testid="button-hinario-add-cifras" className="shrink-0">
          <Plus size={18} className="mr-1" />
          <span className="hidden xs:inline">Adicionar</span>
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-8">
        <div className="max-w-4xl mx-auto">
          {hinarioCifras.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center flex flex-col items-center mt-8">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Music size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Hinário vazio</h3>
              <p className="text-muted-foreground mb-6">Adicione cifras ao seu hinário para ter acesso rápido a elas.</p>
              <Button onClick={handleOpenAddModal} data-testid="button-empty-add-cifras">
                <Plus size={18} className="mr-2" />
                Adicionar Cifras
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">{hinarioCifras.length} {hinarioCifras.length === 1 ? 'cifra' : 'cifras'}</p>
              {hinarioCifras.map(cifra => (
                <div
                  key={cifra.id}
                  className="bg-card hover:bg-card/80 border border-border rounded-xl p-4 flex items-center justify-between group transition-colors"
                  data-testid={`card-hinario-cifra-${cifra.id}`}
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

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => handleRemove(cifra.id)}
                    data-testid={`button-remove-cifra-${cifra.id}`}
                  >
                    <MinusCircle size={18} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Adicionar Cifras"
        onConfirm={handleAddSelected}
        confirmLabel={`Adicionar${selectedCifraIds.size > 0 ? ` (${selectedCifraIds.size})` : ''}`}
        cancelLabel="Cancelar"
      >
        <div className="max-h-[50vh] overflow-y-auto -mx-1 px-1 space-y-1">
          {availableCifras.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Todas as suas cifras já estão neste hinário.</p>
          ) : (
            availableCifras.map(cifra => (
              <div
                key={cifra.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => toggleCifraSelection(cifra.id)}
                data-testid={`select-cifra-${cifra.id}`}
              >
                <Checkbox
                  id={`checkbox-${cifra.id}`}
                  checked={selectedCifraIds.has(cifra.id)}
                  onCheckedChange={() => toggleCifraSelection(cifra.id)}
                  className="w-5 h-5 border-2 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`checkbox-${cifra.id}`}
                    className="font-medium text-foreground text-sm cursor-pointer line-clamp-1 block"
                  >
                    {cifra.title}
                  </label>
                  <p className="text-xs text-muted-foreground line-clamp-1">{cifra.artist || "Sem artista"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
