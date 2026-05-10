import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Upload, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../store/useAppStore";
import { CHROMATIC_SCALE } from "../utils/transpose";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

export default function CifraEditor() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { cifras, addCifra, updateCifra } = useAppStore();
  
  const isEdit = params.id && params.id !== "nova";
  const cifraToEdit = isEdit ? cifras.find(c => c.id === params.id) : null;

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [key, setKey] = useState("C");
  const [content, setContent] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEdit && cifraToEdit) {
      setTitle(cifraToEdit.title);
      setArtist(cifraToEdit.artist);
      setKey(cifraToEdit.key || "C");
      setContent(cifraToEdit.content);
    } else if (isEdit && !cifraToEdit) {
      // Trying to edit a non-existent cifra
      setLocation("/cifras");
    }
  }, [isEdit, cifraToEdit, setLocation]);

  const handleSave = () => {
    if (!title.trim() || !artist.trim()) {
      toast.error("Título e artista são obrigatórios!");
      return;
    }

    if (isEdit && cifraToEdit) {
      updateCifra(cifraToEdit.id, { title, artist, key, content });
      toast.success("Cifra atualizada com sucesso!");
      setLocation(`/cifras/${cifraToEdit.id}`);
    } else {
      addCifra({ title, artist, key, content });
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
        toast.success("Arquivo importado!");
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col">
      <header className="mb-6 flex items-center justify-between mt-4">
        <h1 className="text-2xl font-serif font-bold text-foreground">
          {isEdit ? "Editar Cifra" : "Nova Cifra"}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setLocation(isEdit ? `/cifras/${params.id}` : "/cifras")} data-testid="button-editor-cancelar">
            <X size={18} className="mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} data-testid="button-editor-salvar">
            <Save size={18} className="mr-2" />
            Salvar
          </Button>
        </div>
      </header>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Ex: Teu Amor Não Falha"
              className="bg-card min-h-[48px]"
              data-testid="input-editor-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist">Artista / Ministério</Label>
            <Input 
              id="artist" 
              value={artist} 
              onChange={(e) => setArtist(e.target.value)} 
              placeholder="Ex: Nivea Soares"
              className="bg-card min-h-[48px]"
              data-testid="input-editor-artist"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="key">Tom Original</Label>
            <Select value={key} onValueChange={setKey}>
              <SelectTrigger id="key" className="bg-card min-h-[48px]" data-testid="select-editor-key">
                <SelectValue placeholder="Selecione o tom" />
              </SelectTrigger>
              <SelectContent>
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
            <Button variant="outline" className="w-full min-h-[48px] border-dashed" onClick={triggerFileInput} data-testid="button-editor-import">
              <Upload size={18} className="mr-2" />
              Importar arquivo .txt
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 space-y-2">
        <Label htmlFor="content" className="flex items-center justify-between">
          <span>Conteúdo da Cifra</span>
          <span className="text-xs text-muted-foreground font-normal">Use formato de texto simples</span>
        </Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="[Intro] C  G  Am  F&#10;&#10;[Verso]&#10;C            G&#10;Nada vai me separar..."
          className="flex-1 resize-none bg-card font-mono text-sm leading-relaxed p-4 h-[300px] md:h-full"
          data-testid="textarea-editor-content"
        />
      </div>
    </div>
  );
}
