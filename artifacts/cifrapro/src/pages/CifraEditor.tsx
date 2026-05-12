import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Upload, Save, X, Eye, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../store/useAppStore";
import { CHROMATIC_SCALE } from "../utils/transpose";
import { detectKey } from "../utils/detectKey";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

export default function CifraEditor() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { cifras, hinarios, addCifra, updateCifra, addCifraToHinario } = useAppStore();

  const isEdit = params.id && params.id !== "nova";
  const cifraToEdit = isEdit ? cifras.find(c => c.id === params.id) : null;

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [key, setKey] = useState("C");
  const [content, setContent] = useState("");
  const [selectedHinarioIds, setSelectedHinarioIds] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [keyAutoDetected, setKeyAutoDetected] = useState(false);
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEdit && cifraToEdit) {
      setTitle(cifraToEdit.title);
      setArtist(cifraToEdit.artist);
      setKey(cifraToEdit.key || "C");
      setContent(cifraToEdit.content);
      const preSelected = hinarios
        .filter(h => h.cifraIds.includes(cifraToEdit.id))
        .map(h => h.id);
      setSelectedHinarioIds(preSelected);
    } else if (isEdit && !cifraToEdit) {
      setLocation("/cifras");
    }
  }, [isEdit, cifraToEdit, setLocation]);

  useEffect(() => {
    if (manuallyEdited) return;
    if (!content.trim()) return;

    const timer = setTimeout(() => {
      const detected = detectKey(content);
      if (detected) {
        setKey(detected);
        setKeyAutoDetected(true);
      } else {
        setKeyAutoDetected(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [content, manuallyEdited]);

  const doSave = () => {
    if (!title.trim()) {
      toast.error("O título é obrigatório!");
      return;
    }

    if (isEdit && cifraToEdit) {
      updateCifra(cifraToEdit.id, { title, artist, key, content });
      hinarios.forEach(h => {
        const isSelected = selectedHinarioIds.includes(h.id);
        const isAlreadyIn = h.cifraIds.includes(cifraToEdit.id);
        if (isSelected && !isAlreadyIn) {
          addCifraToHinario(h.id, cifraToEdit.id);
        }
      });
      toast.success("Cifra atualizada com sucesso!");
      setLocation(`/cifras/${cifraToEdit.id}`);
    } else {
      addCifra({ title, artist, key, content });
      if (selectedHinarioIds.length > 0) {
        const latestCifras = useAppStore.getState().cifras;
        const newCifra = latestCifras[0];
        if (newCifra) {
          selectedHinarioIds.forEach(hinarioId => {
            addCifraToHinario(hinarioId, newCifra.id);
          });
        }
      }
      toast.success("Cifra criada com sucesso!");
      setLocation("/cifras");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
        setManuallyEdited(false);
        setKeyAutoDetected(false);
        toast.success("Arquivo importado!");
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleHinario = (id: string) => {
    setSelectedHinarioIds(prev =>
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );
  };

  const cancelTarget = isEdit ? `/cifras/${params.id}` : "/cifras";

  return (
    <div className="min-h-full overflow-y-auto pb-24 md:pb-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col">
      {/* Header */}
      <header className="mb-6 mt-4 flex flex-col xs:flex-row gap-3 xs:items-center xs:justify-between">
        <h1 className="text-2xl font-serif font-bold text-foreground">
          {isEdit ? "Editar Cifra" : "Nova Cifra"}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setLocation(cancelTarget)} data-testid="button-editor-cancelar">
            <X size={16} className="mr-1.5" />
            Cancelar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} data-testid="button-editor-preview">
            <Eye size={16} className="mr-1.5" />
            Prévia
          </Button>
          <Button size="sm" onClick={doSave} data-testid="button-editor-salvar">
            <Save size={16} className="mr-1.5" />
            Salvar
          </Button>
        </div>
      </header>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-card min-h-[48px]"
              data-testid="input-editor-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist">
              Artista / Ministério
              <span className="text-xs text-muted-foreground font-normal ml-2">(opcional)</span>
            </Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="bg-card min-h-[48px]"
              data-testid="input-editor-artist"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="key" className="flex items-center gap-2 flex-wrap">
              Tom Original
              {keyAutoDetected && !manuallyEdited && (
                <span className="text-xs text-muted-foreground italic font-normal">
                  🎵 Detectado automaticamente
                </span>
              )}
            </Label>
            <Select
              value={key}
              onValueChange={(val) => {
                setKey(val);
                setManuallyEdited(true);
                setKeyAutoDetected(false);
              }}
            >
              <SelectTrigger id="key" className="bg-card min-h-[48px]" data-testid="select-editor-key">
                <SelectValue placeholder="Selecione o tom" />
              </SelectTrigger>
              <SelectContent className="max-h-[240px] overflow-y-auto">
                {CHROMATIC_SCALE.map((note) => (
                  <SelectItem key={note} value={note} data-testid={`select-option-${note}`}>
                    {note}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex flex-col justify-end">
            <Label className="md:invisible">Importar</Label>
            <input
              type="file"
              accept=".txt"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              data-testid="input-file-import"
            />
            <Button variant="outline" className="w-full min-h-[48px] border-dashed" onClick={() => fileInputRef.current?.click()} data-testid="button-editor-import">
              <Upload size={18} className="mr-2" />
              Importar arquivo .txt
            </Button>
          </div>
        </div>

        {hinarios.length > 0 && (
          <div className="space-y-2">
            <Label>Adicionar ao Hinário</Label>
            <div className="bg-card border border-border rounded-lg p-3 space-y-1 max-h-[160px] overflow-y-auto">
              {hinarios.map((h) => (
                <div key={h.id} className="flex items-center gap-3 py-1.5 px-1 rounded-md hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={`hinario-${h.id}`}
                    checked={selectedHinarioIds.includes(h.id)}
                    onCheckedChange={() => toggleHinario(h.id)}
                  />
                  <label
                    htmlFor={`hinario-${h.id}`}
                    className="text-sm cursor-pointer select-none flex-1"
                  >
                    {h.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 space-y-2">
        <Label htmlFor="content" className="flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <span>Conteúdo da Cifra</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setIsContentExpanded(true)}
              title="Expandir editor"
              data-testid="button-expand-content"
            >
              <Maximize2 size={14} />
            </Button>
          </div>
          <span className="text-xs text-muted-foreground font-normal">Use formato de texto simples</span>
        </Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 resize-none bg-card font-mono text-sm leading-relaxed p-4 h-[300px] md:h-full"
          data-testid="textarea-editor-content"
        />
      </div>

      {/* Fullscreen Content Editor */}
      {isContentExpanded && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Conteúdo da Cifra</span>
              <span className="text-xs text-muted-foreground">Use formato de texto simples</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsContentExpanded(false)}
              title="Fechar tela cheia"
              data-testid="button-collapse-content"
            >
              <Minimize2 size={16} />
            </Button>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 resize-none bg-background font-mono text-sm leading-relaxed p-4 border-0 rounded-none focus-visible:ring-0"
            autoFocus
            data-testid="textarea-editor-content-expanded"
          />
        </div>
      )}

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Prévia da Cifra</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-1">
              {title || <span className="text-muted-foreground italic text-lg">Sem título</span>}
            </h2>
            {artist && <p className="text-muted-foreground mb-1">{artist}</p>}
            <p className="text-sm text-primary mb-4 font-medium">Tom: {key}</p>
            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap bg-muted/40 rounded-lg p-4 border border-border">
              {content || <span className="text-muted-foreground italic">Nenhum conteúdo ainda...</span>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
