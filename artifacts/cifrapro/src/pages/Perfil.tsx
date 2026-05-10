import { useState, useEffect, useRef } from "react";
import { User, Download, Upload, Share2, Save, Camera } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAppStore } from "../store/useAppStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Modal } from "../components/Modal";
import { generateShareLink, downloadJson, decodeBackup } from "../utils/backup";

export default function Perfil() {
  const { profile, updateProfile, cifras, hinarios, importData } = useAppStore();
  const [location, setLocation] = useLocation();
  
  const [name, setName] = useState(profile.name);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);
  
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPayload, setImportPayload] = useState<{cifras: any[], hinarios: any[]} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataInputRef = useRef<HTMLInputElement>(null);

  // Check URL for shared data
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const dataParam = searchParams.get('data');
    
    if (dataParam) {
      const decoded = decodeBackup(dataParam);
      if (decoded) {
        setImportPayload(decoded);
        setImportModalOpen(true);
      } else {
        toast.error("Link de compartilhamento inválido ou corrompido.");
      }
      
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleSaveProfile = () => {
    updateProfile({ name, photoUrl });
    toast.success("Perfil atualizado com sucesso!");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhotoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDataImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        if (Array.isArray(parsed.cifras) && Array.isArray(parsed.hinarios)) {
          setImportPayload({ cifras: parsed.cifras, hinarios: parsed.hinarios });
          setImportModalOpen(true);
        } else {
          toast.error("Arquivo inválido. Formato não reconhecido.");
        }
      } catch (err) {
        toast.error("Erro ao ler o arquivo.");
      }
    };
    reader.readAsText(file);
    
    if (dataInputRef.current) {
      dataInputRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (importPayload) {
      importData(importPayload.cifras, importPayload.hinarios);
      toast.success("Dados importados com sucesso!");
      setImportModalOpen(false);
      setImportPayload(null);
    }
  };

  const handleShare = () => {
    const link = generateShareLink(cifras, hinarios);
    navigator.clipboard.writeText(link)
      .then(() => toast.success("Link copiado para a área de transferência!"))
      .catch(() => toast.error("Erro ao copiar link."));
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto h-full flex flex-col">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-serif font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie sua conta e seus dados</p>
      </header>

      <div className="space-y-8 pb-24 md:pb-4">
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Informações Pessoais</h2>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-6">
            <div className="relative group">
              <div 
                className="w-24 h-24 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center cursor-pointer relative"
                onClick={() => fileInputRef.current?.click()}
                data-testid="avatar-profile"
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload}
              />
            </div>
            
            <div className="flex-1 w-full space-y-2">
              <Label htmlFor="name">Seu Nome</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ex: João Silva"
                className="bg-background min-h-[48px]"
                data-testid="input-profile-name"
              />
            </div>
          </div>
          
          <Button onClick={handleSaveProfile} className="w-full sm:w-auto" data-testid="button-save-profile">
            <Save size={18} className="mr-2" />
            Salvar Alterações
          </Button>
        </section>

        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Backup & Sincronização</h2>
          <p className="text-muted-foreground text-sm mb-6">
            O CifraPro salva seus dados apenas neste dispositivo. Faça backups regularmente para não perder seu repertório.
          </p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" className="w-full h-14 justify-start px-4" onClick={() => downloadJson(cifras, hinarios)} data-testid="button-backup-download">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 shrink-0">
                  <Download size={16} />
                </div>
                <div className="text-left">
                  <div className="font-medium">Baixar Backup</div>
                  <div className="text-xs text-muted-foreground font-normal">Arquivo JSON</div>
                </div>
              </Button>
              
              <Button variant="outline" className="w-full h-14 justify-start px-4" onClick={() => dataInputRef.current?.click()} data-testid="button-backup-upload">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 shrink-0">
                  <Upload size={16} />
                </div>
                <div className="text-left">
                  <div className="font-medium">Importar Dados</div>
                  <div className="text-xs text-muted-foreground font-normal">De arquivo JSON</div>
                </div>
              </Button>
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                ref={dataInputRef} 
                onChange={handleDataImport}
                data-testid="input-import-data"
              />
            </div>

            <Button variant="secondary" className="w-full h-14 justify-start px-4" onClick={handleShare} data-testid="button-backup-share">
              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center mr-3 shrink-0">
                <Share2 size={16} />
              </div>
              <div className="text-left">
                <div className="font-medium text-foreground">Gerar Link Mágico</div>
                <div className="text-xs text-muted-foreground font-normal">Compartilhe ou transfira para outro celular</div>
              </div>
            </Button>
          </div>
        </section>
      </div>

      <Modal
        isOpen={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setImportPayload(null);
        }}
        title="Importar Dados"
        onConfirm={confirmImport}
        confirmLabel="Importar"
        cancelLabel="Cancelar"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Você está prestes a importar um backup. Isso adicionará novas cifras e hinários ao seu repertório atual.
          </p>
          {importPayload && (
            <div className="bg-muted p-4 rounded-lg flex justify-around text-center">
              <div>
                <div className="text-2xl font-bold">{importPayload.cifras?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Cifras</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{importPayload.hinarios?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Hinários</div>
              </div>
            </div>
          )}
          <p className="text-sm font-medium">Deseja prosseguir com a importação?</p>
        </div>
      </Modal>
    </div>
  );
}
