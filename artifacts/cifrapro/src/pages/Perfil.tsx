import { useState, useEffect, useRef } from "react";
import {
  User, Download, Upload, Share2, Save, Camera, Sun, Moon,
  AlertTriangle, Trash2, LogOut, Lock, Bell, Shield, Info,
  Eye, EyeOff, FileDown, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../store/useAppStore";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Modal } from "../components/Modal";
import { generateShareLink, downloadJson, decodeBackup } from "../utils/backup";

const CARD = { backgroundColor: '#13293D', border: '1px solid #1E3A50' }
const DANGER_CARD = { backgroundColor: '#13293D', border: '1px solid rgba(239,68,68,0.4)' }
const INPUT_STYLE = { backgroundColor: '#0C1B27', borderColor: '#1E3A50', color: '#E9F0F1' }

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0"
      style={{ backgroundColor: enabled ? '#1B98E0' : '#1E3A50' }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        style={{ transform: enabled ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
      />
    </button>
  )
}

export default function Perfil() {
  const { profile, updateProfile, cifras, hinarios, importData, resetAllData } = useAppStore();
  const { user } = useAuth();

  const [name, setName] = useState(profile.name);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPayload, setImportPayload] = useState<{ cifras: any[]; hinarios: any[]; profile?: any } | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Change password modal
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account modal
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Delete all data modal
  const [deleteDataOpen, setDeleteDataOpen] = useState(false);
  const [deleteDataConfirmText, setDeleteDataConfirmText] = useState('');

  // Notifications — initialized from profile (Supabase)
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
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) setPhotoUrl(result);
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

  const handleResetAll = () => {
    resetAllData();
    toast.success("Todos os dados foram apagados.");
    setResetModalOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmNewPassword) return;
    if (newPassword !== confirmNewPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A senha deve ter ao menos 6 caracteres");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha alterada com sucesso!");
      setChangePasswordOpen(false);
      setNewPassword('');
      setConfirmNewPassword('');
    }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'EXCLUIR') return;
    setDeletingAccount(true);
    resetAllData();
    await supabase.auth.signOut();
    toast.success("Conta encerrada. Seus dados locais foram removidos.");
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

  return (
    <div className="min-h-full overflow-y-auto pb-24 md:pb-8 px-4 md:px-8 max-w-2xl mx-auto flex flex-col">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-bold" style={{ color: '#E9F0F1' }}>Perfil</h1>
        <p className="mt-1" style={{ color: '#8FA3B1' }}>Gerencie sua conta e seus dados</p>
      </header>

      <div className="space-y-6 pb-24 md:pb-8">

        {/* === CONTA === */}
        {user && (
          <section className="rounded-xl p-6" style={CARD}>
            <div className="flex items-center gap-2 mb-4">
              <User size={18} style={{ color: '#1B98E0' }} />
              <h2 className="text-lg font-semibold" style={{ color: '#E9F0F1' }}>Conta</h2>
            </div>

            <div className="space-y-4">
              {profile.name && (
                <div>
                  <p className="text-sm" style={{ color: '#8FA3B1' }}>Nome</p>
                  <p className="font-medium" style={{ color: '#E9F0F1' }}>{profile.name}</p>
                </div>
              )}
              <div>
                <p className="text-sm" style={{ color: '#8FA3B1' }}>Email</p>
                <p className="font-medium" style={{ color: '#E9F0F1' }}>{user.email}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setChangePasswordOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80"
                  style={{ borderColor: '#1E3A50', color: '#E9F0F1', backgroundColor: '#0C1B27' }}
                >
                  <Lock size={15} style={{ color: '#1B98E0' }} />
                  Alterar senha
                </button>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80"
                  style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444', backgroundColor: '#0C1B27' }}
                >
                  <LogOut size={15} />
                  Sair
                </button>
              </div>
            </div>
          </section>
        )}

        {/* === INFORMAÇÕES PESSOAIS === */}
        <section className="rounded-xl p-6" style={CARD}>
          <div className="flex items-center gap-2 mb-5">
            <Camera size={18} style={{ color: '#1B98E0' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#E9F0F1' }}>Informações Pessoais</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-6">
            <div className="relative group">
              <div
                className="w-24 h-24 rounded-full border-2 overflow-hidden flex items-center justify-center cursor-pointer relative"
                style={{ backgroundColor: '#0C1B27', borderColor: '#1E3A50' }}
                onClick={() => fileInputRef.current?.click()}
                data-testid="avatar-profile"
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} style={{ color: '#8FA3B1' }} />
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
              <Label htmlFor="name" style={{ color: '#E9F0F1' }}>Seu Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-[48px]"
                style={INPUT_STYLE}
                data-testid="input-profile-name"
              />
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            className="w-full sm:w-auto font-semibold"
            style={{ backgroundColor: '#1B98E0', color: '#fff' }}
            data-testid="button-save-profile"
          >
            <Save size={16} className="mr-2" />
            Salvar Alterações
          </Button>
        </section>

        {/* === APARÊNCIA === */}
        <section className="rounded-xl p-6" style={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <Sun size={18} style={{ color: '#1B98E0' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#E9F0F1' }}>Aparência</h2>
          </div>
          <p className="text-sm mb-5" style={{ color: '#8FA3B1' }}>Escolha o tema do aplicativo</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => profile.theme !== "light" && handleToggleTheme()}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
              style={{
                borderColor: profile.theme === "light" ? '#1B98E0' : '#1E3A50',
                backgroundColor: profile.theme === "light" ? 'rgba(27,152,224,0.1)' : 'transparent',
              }}
            >
              <Sun size={24} style={{ color: profile.theme === "light" ? '#1B98E0' : '#8FA3B1' }} />
              <span className="text-sm font-medium" style={{ color: profile.theme === "light" ? '#1B98E0' : '#8FA3B1' }}>
                Claro
              </span>
            </button>

            <button
              onClick={() => profile.theme !== "dark" && handleToggleTheme()}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
              style={{
                borderColor: profile.theme === "dark" ? '#1B98E0' : '#1E3A50',
                backgroundColor: profile.theme === "dark" ? 'rgba(27,152,224,0.1)' : 'transparent',
              }}
            >
              <Moon size={24} style={{ color: profile.theme === "dark" ? '#1B98E0' : '#8FA3B1' }} />
              <span className="text-sm font-medium" style={{ color: profile.theme === "dark" ? '#1B98E0' : '#8FA3B1' }}>
                Escuro
              </span>
            </button>
          </div>
        </section>

        {/* === NOTIFICAÇÕES === */}
        <section className="rounded-xl p-6" style={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <Bell size={18} style={{ color: '#1B98E0' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#E9F0F1' }}>Notificações</h2>
          </div>
          <p className="text-sm mb-5" style={{ color: '#8FA3B1' }}>Escolha quais avisos deseja receber</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: '#E9F0F1' }}>Novidades e atualizações do CifraPro</p>
                <p className="text-xs mt-0.5" style={{ color: '#8FA3B1' }}>Fique por dentro das novas funcionalidades</p>
              </div>
              <ToggleSwitch enabled={notifNews} onChange={handleNotifNewsChange} />
            </div>

            <div className="h-px" style={{ backgroundColor: '#1E3A50' }} />

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: '#E9F0F1' }}>Dicas de uso</p>
                <p className="text-xs mt-0.5" style={{ color: '#8FA3B1' }}>Sugestões para aproveitar melhor o app</p>
              </div>
              <ToggleSwitch enabled={notifTips} onChange={handleNotifTipsChange} />
            </div>
          </div>
        </section>

        {/* === BACKUP === */}
        <section className="rounded-xl p-6" style={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <Download size={18} style={{ color: '#1B98E0' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#E9F0F1' }}>Backup & Sincronização</h2>
          </div>
          <p className="text-sm mb-5" style={{ color: '#8FA3B1' }}>
            O CifraPro salva seus dados neste dispositivo. Faça backups regularmente para não perder seu repertório.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => downloadJson(cifras, hinarios, profile)}
                className="flex items-center h-14 px-4 rounded-xl border transition-opacity hover:opacity-80"
                style={{ borderColor: '#1E3A50', backgroundColor: '#0C1B27' }}
                data-testid="button-backup-download"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0" style={{ backgroundColor: 'rgba(27,152,224,0.15)' }}>
                  <Download size={16} style={{ color: '#1B98E0' }} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium" style={{ color: '#E9F0F1' }}>Baixar Backup</div>
                  <div className="text-xs" style={{ color: '#8FA3B1' }}>Arquivo JSON</div>
                </div>
              </button>

              <button
                onClick={() => dataInputRef.current?.click()}
                className="flex items-center h-14 px-4 rounded-xl border transition-opacity hover:opacity-80"
                style={{ borderColor: '#1E3A50', backgroundColor: '#0C1B27' }}
                data-testid="button-backup-upload"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0" style={{ backgroundColor: 'rgba(27,152,224,0.15)' }}>
                  <Upload size={16} style={{ color: '#1B98E0' }} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium" style={{ color: '#E9F0F1' }}>Importar Dados</div>
                  <div className="text-xs" style={{ color: '#8FA3B1' }}>De arquivo JSON</div>
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
              className="flex items-center w-full h-14 px-4 rounded-xl border transition-opacity hover:opacity-80"
              style={{ borderColor: '#1E3A50', backgroundColor: '#0C1B27' }}
              data-testid="button-backup-share"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0" style={{ backgroundColor: 'rgba(27,152,224,0.15)' }}>
                <Share2 size={16} style={{ color: '#1B98E0' }} />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium" style={{ color: '#E9F0F1' }}>Gerar Link Mágico</div>
                <div className="text-xs" style={{ color: '#8FA3B1' }}>Compartilhe ou transfira para outro celular</div>
              </div>
            </button>
          </div>
        </section>

        {/* === PRIVACIDADE === */}
        <section className="rounded-xl p-6" style={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} style={{ color: '#1B98E0' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#E9F0F1' }}>Privacidade</h2>
          </div>
          <p className="text-sm mb-5" style={{ color: '#8FA3B1' }}>
            Seus dados são armazenados com segurança e nunca compartilhados com terceiros.
          </p>

          <button
            onClick={handleExportData}
            className="flex items-center w-full h-14 px-4 rounded-xl border transition-opacity hover:opacity-80"
            style={{ borderColor: '#1E3A50', backgroundColor: '#0C1B27' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0" style={{ backgroundColor: 'rgba(27,152,224,0.15)' }}>
              <FileDown size={16} style={{ color: '#1B98E0' }} />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium" style={{ color: '#E9F0F1' }}>Exportar meus dados</div>
              <div className="text-xs" style={{ color: '#8FA3B1' }}>Todas as cifras e hinários em JSON</div>
            </div>
          </button>
        </section>

        {/* === SOBRE === */}
        <section className="rounded-xl p-6" style={CARD}>
          <div className="flex items-center gap-2 mb-4">
            <Info size={18} style={{ color: '#1B98E0' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#E9F0F1' }}>Sobre</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#8FA3B1' }}>Versão</span>
              <span className="text-sm font-medium" style={{ color: '#E9F0F1' }}>1.0.0</span>
            </div>

            <div className="h-px" style={{ backgroundColor: '#1E3A50' }} />

            <a
              href="/termos"
              className="flex items-center justify-between group"
            >
              <span className="text-sm" style={{ color: '#E9F0F1' }}>Termos de uso</span>
              <ExternalLink size={14} style={{ color: '#8FA3B1' }} />
            </a>

            <div className="h-px" style={{ backgroundColor: '#1E3A50' }} />

            <a
              href="/privacidade"
              className="flex items-center justify-between group"
            >
              <span className="text-sm" style={{ color: '#E9F0F1' }}>Política de privacidade</span>
              <ExternalLink size={14} style={{ color: '#8FA3B1' }} />
            </a>
          </div>
        </section>

        {/* === ZONA DE PERIGO === */}
        <section className="rounded-xl p-6" style={DANGER_CARD}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-red-400" />
            <h2 className="text-lg font-semibold text-red-400">Zona de Perigo</h2>
          </div>
          <p className="text-sm mb-5" style={{ color: '#8FA3B1' }}>
            Ações irreversíveis. Prossiga com cuidado.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setDeleteDataOpen(true)}
              className="flex items-center w-full h-14 px-4 rounded-xl border transition-opacity hover:opacity-80"
              style={{ borderColor: 'rgba(239,68,68,0.4)', backgroundColor: '#0C1B27' }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                <Trash2 size={16} className="text-red-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-red-400">Excluir todos os dados</div>
                <div className="text-xs" style={{ color: '#8FA3B1' }}>Remove cifras, hinários e perfil</div>
              </div>
            </button>

            {user && (
              <button
                onClick={() => setDeleteAccountOpen(true)}
                className="flex items-center w-full h-14 px-4 rounded-xl border transition-opacity hover:opacity-80"
                style={{ borderColor: 'rgba(239,68,68,0.4)', backgroundColor: '#0C1B27' }}
                data-testid="button-reset-all"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                  <User size={16} className="text-red-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-red-400">Excluir conta</div>
                  <div className="text-xs" style={{ color: '#8FA3B1' }}>Encerra sua sessão e apaga dados locais</div>
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
          <p style={{ color: '#8FA3B1' }}>
            Você está prestes a importar um backup. Isso adicionará novas cifras e hinários ao seu repertório atual.
          </p>
          {importPayload && (
            <div className="rounded-lg flex justify-around text-center p-4" style={{ backgroundColor: '#0C1B27' }}>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#E9F0F1' }}>{importPayload.cifras?.length || 0}</div>
                <div className="text-xs" style={{ color: '#8FA3B1' }}>Cifras</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#E9F0F1' }}>{importPayload.hinarios?.length || 0}</div>
                <div className="text-xs" style={{ color: '#8FA3B1' }}>Hinários</div>
              </div>
            </div>
          )}
          <p className="text-sm font-medium" style={{ color: '#E9F0F1' }}>Deseja prosseguir com a importação?</p>
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
            <Label style={{ color: '#E9F0F1' }}>Nova senha</Label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8FA3B1' }} />
              <Input
                type={showNewPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 pr-10"
                style={INPUT_STYLE}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#8FA3B1' }}
              >
                {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label style={{ color: '#E9F0F1' }}>Confirmar nova senha</Label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8FA3B1' }} />
              <Input
                type={showConfirmPwd ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 pr-10"
                style={INPUT_STYLE}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#8FA3B1' }}
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
          <p style={{ color: '#8FA3B1' }}>
            Esta ação encerrará sua sessão e apagará todos os dados locais. Esta ação não pode ser desfeita.
          </p>
          <div className="space-y-1.5">
            <Label style={{ color: '#E9F0F1' }}>
              Digite <strong>EXCLUIR CONTA</strong> para confirmar
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="EXCLUIR CONTA"
              style={INPUT_STYLE}
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
        <div className="space-y-3 pb-2">
          <p style={{ color: '#8FA3B1' }}>
            Esta ação vai apagar <strong style={{ color: '#E9F0F1' }}>permanentemente</strong> todas as suas cifras, hinários e dados de perfil.
          </p>
          <p className="text-sm font-medium text-red-400">
            Esta ação não pode ser desfeita. Faça um backup antes de continuar.
          </p>
          <div className="space-y-1.5">
            <Label style={{ color: '#E9F0F1' }}>
              Digite <strong>EXCLUIR</strong> para confirmar
            </Label>
            <Input
              value={deleteDataConfirmText}
              onChange={(e) => setDeleteDataConfirmText(e.target.value)}
              placeholder="EXCLUIR"
              style={INPUT_STYLE}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
