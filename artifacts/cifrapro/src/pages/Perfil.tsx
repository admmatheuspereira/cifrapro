import { useState, useEffect, useRef } from "react";
import { User, Download, Upload, Share2, Save, Camera, Sun, Moon, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../store/useAppStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Modal } from "../components/Modal";
import { generateShareLink, downloadJson, decodeBackup } from "../utils/backup";

export default function Perfil() {
  const { profile, updateProfile, cifras, hinarios, importData, resetAllData } = useAppStore();

  const [name, setName] = useState(profile.name);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPayload, setImportPayload] = useState<{ cifras: any[]; hinarios: any[]; profile?: any } | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataInputRef = useRef<HTMLInputElement>(null);

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
          setImportPayload({ cifras: parsed.cifras, hinarios: parsed.hinarios, profile: parsed.profile });
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
      importData(importPayload.cifras, importPayload.hinarios, importPayload.profile);
      toast.success("Dados importados com sucesso!");
      setImportModalOpen(false);
      setImportPayload(null);
    }
  };

  const handleShare = () => {
    const link = generateShareLink(cifras, hinarios, profile);
    navigator.clipboard.writeText(link)
      .then(() => toast.success("Link copiado para a área de transferência!"))
      .catch(() => toast.error("Erro ao copiar link."));
  };

  const handleToggleTheme = () => {
    const newTheme = profile.theme === "dark" ? "light" : "dark";
    updateProfile({ theme: newTheme });
    toast.success(newTheme === "dark" ? "Tema escuro ativado" : "Tema claro ativado");
  };

  const handleResetAll = () => {
    resetAllData();
    toast.success("Todos os dados foram apagados.");
    setResetModalOpen(false);
  };

  return (
    <div className="min-h-full overflow-y-auto pb-24 md:pb-8 px-4 md:px-8 max-w-2xl mx-auto flex flex-col">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie sua conta e seus dados</p>
      </header>

      <div className="space-y-6 pb-24 md:pb-8">
        {/* Personal Info */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-5">Informações Pessoais</h2>

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

        {/* Appearance */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-1">Aparência</h2>
          <p className="text-muted-foreground text-sm mb-5">Escolha o tema do aplicativo</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => profile.theme !== "light" && handleToggleTheme()}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                profile.theme === "light"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-border/80 hover:bg-muted/50"
              }`}
            >
              <Sun size={24} className={profile.theme === "light" ? "text-primary" : "text-muted-foreground"} />
              <span className={`text-sm font-medium ${profile.theme === "light" ? "text-primary" : "text-muted-foreground"}`}>
                Claro
              </span>
            </button>

            <button
              onClick={() => profile.theme !== "dark" && handleToggleTheme()}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                profile.theme === "dark"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-border/80 hover:bg-muted/50"
              }`}
            >
              <Moon size={24} className={profile.theme === "dark" ? "text-primary" : "text-muted-foreground"} />
              <span className={`text-sm font-medium ${profile.theme === "dark" ? "text-primary" : "text-muted-foreground"}`}>
                Escuro
              </span>
            </button>
          </div>
        </section>

        {/* Backup */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-1">Backup & Sincronização</h2>
          <p className="text-muted-foreground text-sm mb-5">
            O CifraPro salva seus dados apenas neste dispositivo. Faça backups regularmente para não perder seu repertório.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="outline" className="w-full h-14 justify-start px-4" onClick={() => downloadJson(cifras, hinarios, profile)} data-testid="button-backup-download">
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

            <Button variant="outline" className="w-full h-14 justify-start px-4" onClick={handleShare} data-testid="button-backup-share">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 shrink-0">
                <Share2 size={16} />
              </div>
              <div className="text-left">
                <div className="font-medium">Gerar Link Mágico</div>
                <div className="text-xs text-muted-foreground font-normal">Compartilhe ou transfira para outro celular</div>
              </div>
            </Button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-card border-2 border-destructive/40 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">Zona de Perigo</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-5">
            Ações irreversíveis. Prossiga com cuidado.
          </p>

          <Button
            variant="outline"
            className="w-full h-14 justify-start px-4 border-destructive/50 hover:bg-destructive/10 hover:border-destructive text-destructive"
            onClick={() => setResetModalOpen(true)}
            data-testid="button-reset-all"
          >
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center mr-3 shrink-0">
              <Trash2 size={16} className="text-destructive" />
            </div>
            <div className="text-left">
              <div className="font-medium">Restaurar Aplicativo</div>
              <div className="text-xs text-destructive/70 font-normal">Remove todas as cifras, hinários e perfil</div>
            </div>
          </Button>
        </section>
      </div>

      {/* Import Modal */}
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

      {/* Reset Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Restaurar Aplicativo"
        onConfirm={handleResetAll}
        confirmLabel="Apagar tudo"
        cancelLabel="Cancelar"
        confirmDestructive
      >
        <div className="space-y-3">
          <p className="text-muted-foreground">
            Esta ação vai apagar <strong className="text-foreground">permanentemente</strong> todas as suas cifras, hinários e dados de perfil.
          </p>
          <p className="text-sm font-medium text-destructive">
            Esta ação não pode ser desfeita. Faça um backup antes de continuar.
          </p>
        </div>
      </Modal>
    </div>
  );
}
