import { useState, useEffect, useRef } from "react";
import {
  User, Download, Upload, Share2, Save, Camera, Sun, Moon,
  AlertTriangle, Trash2, LogOut, Lock, Bell, Shield, Info,
  Eye, EyeOff, FileDown, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../store/useAppStore";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Modal } from "../components/Modal";
import { generateShareLink, downloadJson, decodeBackup } from "../utils/backup";

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0"
      style={{ backgroundColor: enabled ? '#1B98E0' : 'var(--color-muted)' }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        style={{ transform: enabled ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
      />
    </button>
  );
}

export default function Perfil() {
  const { profile, updateProfile, cifras, hinarios, importData, resetAllData } = useAppStore();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState(authUser);

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    } else if (!authLoading) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) setUser(session.user);
      });
    }
  }, [authUser, authLoading]);

  const [name, setName] = useState(profile.name);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPayload, setImportPayload] = useState<{ cifras: any[]; hinarios: any[]; profile?: any } | null>(null);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [deleteDataOpen, setDeleteDataOpen] = useState(false);
  const [deleteDataConfirmText, setDeleteDataConfirmText] = useState('');

  const [notifNews, setNotifNews] = useState(profile.notifNews ?? false);
  const [notifTips, setNotifTips] = useState(profile.notifTips ?? false);

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
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSaveProfile = () => {
    updateProfile({ name, photoUrl });
    toast.success("Perfil atualizado com sucesso!");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error("A imagem é muito grande. Use uma imagem de até 500 KB.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) setPhotoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDataImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.cifras) && Array.isArray(parsed.hinarios)) {
          setImportPayload({ cifras: parsed.cifras, hinarios: parsed.hinarios, profile: parsed.profile });
          setImportModalOpen(true);
        } else {
          toast.error("Arquivo inválido. Formato não reconhecido.");
        }
      } catch {
        toast.error("Erro ao ler o arquivo.");
      }
    };
    reader.readAsText(file);
    if (dataInputRef.current) dataInputRef.current.value = '';
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
    if (!link) {
      toast.error("Seu repertório é grande demais para um Link Mágico. Use a opção de backup em JSON.");
      return;
    }
    navigator.clipboard.writeText(link)
      .then(() => toast.success("Link copiado para a área de transferência!"))
      .catch(() => toast.error("Erro ao copiar link."));
  };

  const handleToggleTheme = () => {
    const newTheme = profile.theme === "dark" ? "light" : "dark";
    updateProfile({ theme: newTheme });
    toast.success(newTheme === "dark" ? "Tema escuro ativado" : "Tema claro ativado");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmNewPassword) return;
    if (newPassword !== confirmNewPassword) { toast.error("As senhas não coincidem"); return; }
    if (newPassword.length < 6) { toast.error("A senha deve ter ao menos 6 caracteres"); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha alterada com sucesso!");
      setChangePasswordOpen(false);
      setNewPassword(''); setConfirmNewPassword('');
    }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'EXCLUIR CONTA') return;
    setDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user')
      if (error) throw error
      resetAllData();
      await supabase.auth.signOut();
      toast.success("Conta excluída com sucesso.");
    } catch {
      toast.error('Erro ao excluir conta. Tente novamente.');
    }
    setDeletingAccount(false);
    setDeleteAccountOpen(false);
  };

  const handleExportData = () => {
    downloadJson(cifras, hinarios, profile);
    toast.success("Dados exportados com sucesso!");
  };

  const handleDeleteAllData = () => {
    resetAllData();
    toast.success("Todos os dados foram apagados.");
    setDeleteDataOpen(false);
    setDeleteDataConfirmText('');
  };

  const handleNotifNewsChange = (value: boolean) => {
    setNotifNews(value);
    updateProfile({ notifNews: value });
  };

  const handleNotifTipsChange = (value: boolean) => {
    setNotifTips(value);
    updateProfile({ notifTips: value });
  };

  const isLight = profile.theme === "light";
  const isDark = profile.theme === "dark";

  return (
    <div className="min-h-full overflow-y-auto pb-24 md:pb-8 px-4 md:px-8 max-w-2xl mx-auto flex flex-col">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-foreground">Perfil</h1>
        <p className="mt-1 text-muted-foreground">Gerencie sua conta e seus dados</p>
      </header>

      <div className="space-y-6 pb-24 md:pb-8">

        {/* === CONTA === */}
        {user && (
          <section className="rounded-xl p-6 bg-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Conta</h2>
            </div>
            <div className="space-y-4">
              {profile.name && (
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium text-foreground">{profile.name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setChangePasswordOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-background text-foreground transition-opacity hover:opacity-80"
                >
                  <Lock size={15} className="text-primary" />
                  Alterar senha
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-red-500/40 text-red-500 bg-background transition-opacity hover:opacity-80"
                >
                  <LogOut size={15} />
                  Sair
                </button>
              </div>
            </div>
          </section>
        )}

        {/* === INFORMAÇÕES PESSOAIS === */}
        <section className="rounded-xl p-6 bg-card border border-border">
          <div className="flex items-center gap-2 mb-5">
            <Camera size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Informações Pessoais</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-6">
            <div className="relative group">
              <div
                className="w-24 h-24 rounded-full border-2 border-border overflow-hidden flex items-center justify-center cursor-pointer relative bg-background"
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
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
            </div>
            <div className="flex-1 w-full space-y-2">
              <Label htmlFor="name" className="text-foreground">Seu Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-[48px] bg-background border-border text-foreground placeholder:text-muted-foreground"
                data-testid="input-profile-name"
              />
            </div>
          </div>
          <Button
            onClick={handleSaveProfile}
            className="w-full sm:w-auto font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-save-profile"
          >
            <Save size={16} className="mr-2" />
            Salvar Alterações
          </Button>
        </section>

        {/* === APARÊNCIA === */}
        <section className="rounded-xl p-6 bg-card border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Sun size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Aparência</h2>
          </div>
          <p className="text-sm mb-5 text-muted-foreground">Escolha o tema do aplicativo</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => !isLight && handleToggleTheme()}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                isLight ? "border-primary bg-primary/10" : "border-border bg-transparent"
              }`}
            >
              <Sun size={24} className={isLight ? "text-primary" : "text-muted-foreground"} />
              <span className={`text-sm font-medium ${isLight ? "text-primary" : "text-muted-foreground"}`}>Claro</span>
            </button>
            <button
              onClick={() => !isDark && handleToggleTheme()}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                isDark ? "border-primary bg-primary/10" : "border-border bg-transparent"
              }`}
            >
              <Moon size={24} className={isDark ? "text-primary" : "text-muted-foreground"} />
              <span className={`text-sm font-medium ${isDark ? "text-primary" : "text-muted-foreground"}`}>Escuro</span>
            </button>
          </div>
        </section>

        {/* === NOTIFICAÇÕES === */}
        <section className="rounded-xl p-6 bg-card border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Notificações</h2>
          </div>
          <p className="text-sm mb-5 text-muted-foreground">Escolha quais avisos deseja receber</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Novidades e atualizações do CifraPro</p>
                <p className="text-xs mt-0.5 text-muted-foreground">Fique por dentro das novas funcionalidades</p>
              </div>
              <Toggle enabled={notifNews} onChange={handleNotifNewsChange} />
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Dicas de uso</p>
                <p className="text-xs mt-0.5 text-muted-foreground">Sugestões para aproveitar melhor o app</p>
              </div>
              <Toggle enabled={notifTips} onChange={handleNotifTipsChange} />
            </div>
          </div>
        </section>

        {/* === BACKUP === */}
        <section className="rounded-xl p-6 bg-card border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Download size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Backup & Sincronização</h2>
          </div>
          <p className="text-sm mb-5 text-muted-foreground">
            O CifraPro salva seus dados neste dispositivo. Faça backups regularmente para não perder seu repertório.
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => downloadJson(cifras, hinarios, profile)}
                className="flex items-center h-14 px-4 rounded-xl border border-border bg-background transition-opacity hover:opacity-80"
                data-testid="button-backup-download"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 bg-primary/15">
                  <Download size={16} className="text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">Baixar Backup</div>
                  <div className="text-xs text-muted-foreground">Arquivo JSON</div>
                </div>
              </button>
              <button
                onClick={() => dataInputRef.current?.click()}
                className="flex items-center h-14 px-4 rounded-xl border border-border bg-background transition-opacity hover:opacity-80"
                data-testid="button-backup-upload"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 bg-primary/15">
                  <Upload size={16} className="text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">Importar Dados</div>
                  <div className="text-xs text-muted-foreground">De arquivo JSON</div>
                </div>
              </button>
              <input
                type="file"
                accept=".json"
                className="hidden"
                ref={dataInputRef}
                onChange={handleDataImport}
                data-testid="input-import-data"
              />
            </div>
            <button
              onClick={handleShare}
              className="flex items-center w-full h-14 px-4 rounded-xl border border-border bg-background transition-opacity hover:opacity-80"
              data-testid="button-backup-share"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 bg-primary/15">
                <Share2 size={16} className="text-primary" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-foreground">Gerar Link Mágico</div>
                <div className="text-xs text-muted-foreground">Compartilhe ou transfira para outro celular</div>
              </div>
            </button>
          </div>
        </section>

        {/* === PRIVACIDADE === */}
        <section className="rounded-xl p-6 bg-card border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Privacidade</h2>
          </div>
          <p className="text-sm mb-5 text-muted-foreground">
            Seus dados são armazenados com segurança e nunca compartilhados com terceiros.
          </p>
          <button
            onClick={handleExportData}
            className="flex items-center w-full h-14 px-4 rounded-xl border border-border bg-background transition-opacity hover:opacity-80"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 bg-primary/15">
              <FileDown size={16} className="text-primary" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-foreground">Exportar meus dados</div>
              <div className="text-xs text-muted-foreground">Todas as cifras e hinários em JSON</div>
            </div>
          </button>
        </section>

        {/* === SOBRE === */}
        <section className="rounded-xl p-6 bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Info size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Sobre</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Versão</span>
              <span className="text-sm font-medium text-foreground">1.0.0</span>
            </div>
            <div className="h-px bg-border" />
            <a href="/termos" className="flex items-center justify-between">
              <span className="text-sm text-foreground">Termos de uso</span>
              <ExternalLink size={14} className="text-muted-foreground" />
            </a>
            <div className="h-px bg-border" />
            <a href="/privacidade" className="flex items-center justify-between">
              <span className="text-sm text-foreground">Política de privacidade</span>
              <ExternalLink size={14} className="text-muted-foreground" />
            </a>
          </div>
        </section>

        {/* === ZONA DE PERIGO === */}
        <section className="rounded-xl p-6 bg-card border border-red-500/40">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-red-400" />
            <h2 className="text-lg font-semibold text-red-400">Zona de Perigo</h2>
          </div>
          <p className="text-sm mb-5 text-muted-foreground">Ações irreversíveis. Prossiga com cuidado.</p>
          <div className="space-y-3">
            <button
              onClick={() => setDeleteDataOpen(true)}
              className="flex items-center w-full h-14 px-4 rounded-xl border border-red-500/40 bg-background transition-opacity hover:opacity-80"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 bg-red-500/10">
                <Trash2 size={16} className="text-red-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-red-400">Apagar todos os dados</div>
                <div className="text-xs text-muted-foreground">Remove todas as cifras e hinários locais</div>
              </div>
            </button>
            {user && (
              <button
                onClick={() => setDeleteAccountOpen(true)}
                className="flex items-center w-full h-14 px-4 rounded-xl border border-red-500/40 bg-background transition-opacity hover:opacity-80"
                data-testid="button-reset-all"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 bg-red-500/10">
                  <User size={16} className="text-red-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-red-400">Excluir conta</div>
                  <div className="text-xs text-muted-foreground">Apaga permanentemente sua conta do servidor</div>
                </div>
              </button>
            )}
          </div>
        </section>

      </div>

      {/* === MODAL: Importar === */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => { setImportModalOpen(false); setImportPayload(null); }}
        title="Importar Dados"
        onConfirm={confirmImport}
        confirmLabel="Importar"
        cancelLabel="Cancelar"
      >
        <div className="space-y-4 pb-2">
          <p className="text-muted-foreground">
            Você está prestes a importar um backup. Isso adicionará novas cifras e hinários ao seu repertório atual.
          </p>
          {importPayload && (
            <div className="rounded-lg flex justify-around text-center p-4 bg-background">
              <div>
                <div className="text-2xl font-bold text-foreground">{importPayload.cifras?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Cifras</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{importPayload.hinarios?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Hinários</div>
              </div>
            </div>
          )}
          <p className="text-sm font-medium text-foreground">Deseja prosseguir com a importação?</p>
        </div>
      </Modal>

      {/* === MODAL: Alterar Senha === */}
      <Modal
        isOpen={changePasswordOpen}
        onClose={() => { setChangePasswordOpen(false); setNewPassword(''); setConfirmNewPassword(''); }}
        title="Alterar Senha"
        onConfirm={handleChangePassword}
        confirmLabel={changingPassword ? "Salvando..." : "Salvar"}
        cancelLabel="Cancelar"
      >
        <div className="space-y-4 pb-2">
          <div className="space-y-1.5">
            <Label className="text-foreground">Nova senha</Label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showNewPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 pr-10 bg-background border-border text-foreground"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground">Confirmar nova senha</Label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showConfirmPwd ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 pr-10 bg-background border-border text-foreground"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* === MODAL: Excluir Conta === */}
      <Modal
        isOpen={deleteAccountOpen}
        onClose={() => { setDeleteAccountOpen(false); setDeleteConfirmText(''); }}
        title="Excluir Conta"
        onConfirm={deleteConfirmText === 'EXCLUIR CONTA' ? handleDeleteAccount : undefined}
        confirmLabel={deletingAccount ? "Excluindo..." : "Excluir conta"}
        cancelLabel="Cancelar"
        confirmDestructive
      >
        <div className="space-y-4 pb-2">
          <p className="text-muted-foreground">
            Sua conta será <strong>permanentemente excluída</strong> do servidor — cifras, hinários e perfil serão removidos. Esta ação não pode ser desfeita.
          </p>
          <div className="space-y-1.5">
            <Label className="text-foreground">
              Digite <strong>EXCLUIR CONTA</strong> para confirmar
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="EXCLUIR CONTA"
              className="bg-background border-border text-foreground"
            />
          </div>
        </div>
      </Modal>

      {/* === MODAL: Excluir todos os dados === */}
      <Modal
        isOpen={deleteDataOpen}
        onClose={() => { setDeleteDataOpen(false); setDeleteDataConfirmText(''); }}
        title="Excluir todos os dados"
        onConfirm={deleteDataConfirmText === 'EXCLUIR' ? handleDeleteAllData : undefined}
        confirmLabel="Apagar tudo"
        cancelLabel="Cancelar"
        confirmDestructive
      >
        <div className="space-y-4 pb-2">
          <p className="text-muted-foreground">
            Todos os seus dados locais (cifras, hinários e configurações) serão permanentemente apagados.
          </p>
          <div className="space-y-1.5">
            <Label className="text-foreground">
              Digite <strong>EXCLUIR</strong> para confirmar
            </Label>
            <Input
              value={deleteDataConfirmText}
              onChange={(e) => setDeleteDataConfirmText(e.target.value)}
              placeholder="EXCLUIR"
              className="bg-background border-border text-foreground"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
