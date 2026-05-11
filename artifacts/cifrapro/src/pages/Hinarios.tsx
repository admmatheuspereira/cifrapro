import { useState } from "react";
import { Link } from "wouter";
import { Plus, BookOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../store/useAppStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Modal } from "../components/Modal";

export default function Hinarios() {
  const { hinarios, addHinario, deleteHinario } = useAppStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHinarioName, setNewHinarioName] = useState("");
  const [hinarioToDelete, setHinarioToDelete] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newHinarioName.trim()) {
      toast.error("O nome do hinário é obrigatório!");
      return;
    }

    addHinario(newHinarioName);
    toast.success("Hinário criado com sucesso!");
    setNewHinarioName("");
    setShowCreateModal(false);
  };

  const handleDelete = () => {
    if (hinarioToDelete) {
      deleteHinario(hinarioToDelete);
      toast.success("Hinário excluído com sucesso!");
      setHinarioToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Hinários</h1>
          <p className="text-muted-foreground mt-1">Suas coleções de cifras</p>
        </div>
        <Button className="hidden sm:flex" onClick={() => setShowCreateModal(true)} data-testid="button-hinarios-novo">
          <Plus size={18} className="mr-2" />
          Novo Hinário
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 md:pb-4 space-y-3">
        {hinarios.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center flex flex-col items-center mt-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <BookOpen size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhum hinário ainda</h3>
            <p className="text-muted-foreground mb-6">Crie listas para organizar seu repertório por evento, banda ou tema.</p>
            <Button onClick={() => setShowCreateModal(true)} data-testid="button-empty-novo-hinario">
              <Plus size={18} className="mr-2" />
              Criar Hinário
            </Button>
          </div>
        ) : (
          hinarios.map(hinario => (
            <div
              key={hinario.id}
              className="bg-card hover:bg-card/80 border border-border rounded-xl p-4 flex items-center justify-between group transition-colors"
              data-testid={`card-hinario-${hinario.id}`}
            >
              <Link href={`/hinarios/${hinario.id}`} className="flex-1 min-w-0 pr-3 block cursor-pointer">
                <div className="flex items-center gap-3">
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

              {/* Always visible on mobile, hover-reveal on desktop */}
              <div className="flex items-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  onClick={() => setHinarioToDelete(hinario.id)}
                  data-testid={`button-delete-hinario-${hinario.id}`}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-[64px] right-4 md:hidden z-30">
        <Button
          size="icon"
          className="w-14 h-14 rounded-full shadow-lg shadow-primary/25"
          onClick={() => setShowCreateModal(true)}
          data-testid="fab-novo-hinario"
        >
          <Plus size={24} />
        </Button>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setNewHinarioName(""); }}
        title="Novo Hinário"
        onConfirm={handleCreate}
        confirmLabel="Criar"
        cancelLabel="Cancelar"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Dê um nome para sua nova coleção de cifras.</p>
          <Input
            autoFocus
            placeholder="Ex: Culto de Domingo"
            value={newHinarioName}
            onChange={(e) => setNewHinarioName(e.target.value)}
            className="min-h-[48px]"
            data-testid="input-new-hinario"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!hinarioToDelete}
        onClose={() => setHinarioToDelete(null)}
        title="Excluir Hinário"
        onConfirm={handleDelete}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      >
        <p className="text-muted-foreground">Tem certeza que deseja excluir este hinário? As cifras dentro dele não serão excluídas.</p>
      </Modal>
    </div>
  );
}
