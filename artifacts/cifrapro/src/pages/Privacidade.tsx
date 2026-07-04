export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-6 text-foreground">
        <a href="/" className="text-sm text-primary underline">← Voltar</a>

        <h1 className="text-2xl font-bold">Política de Privacidade — CifraPro</h1>

        <div className="rounded-xl p-4 text-sm bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
          <strong>Fase de teste fechado.</strong> Esta política descreve como
          tratamos dados durante a fase de testes com usuários convidados.
          Uma versão completa e formalizada será publicada antes da abertura
          pública do CifraPro.
        </div>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-semibold text-foreground">1. Quais dados coletamos</h2>
          <p>
            Coletamos o e-mail usado no cadastro, as cifras e hinários que você
            cria dentro do aplicativo, e informações técnicas básicas de acesso
            (como data de login), necessárias para o funcionamento do serviço.
          </p>

          <h2 className="text-base font-semibold text-foreground">2. Para que usamos esses dados</h2>
          <p>
            Usamos seus dados exclusivamente para autenticar seu acesso, salvar
            e exibir suas cifras e hinários, e para comunicação sobre o
            andamento do teste. Não vendemos nem compartilhamos seus dados com
            terceiros para fins comerciais.
          </p>

          <h2 className="text-base font-semibold text-foreground">3. Onde seus dados ficam armazenados</h2>
          <p>
            Seus dados são armazenados de forma segura na infraestrutura do
            Supabase, com controle de acesso restrito a cada usuário
            individualmente (Row Level Security).
          </p>

          <h2 className="text-base font-semibold text-foreground">4. Exclusão de dados</h2>
          <p>
            Você pode solicitar a exclusão da sua conta a qualquer momento pela
            tela de Perfil. Os dados são desativados imediatamente e removidos
            de forma definitiva após um período de carência de 30 dias.
          </p>

          <h2 className="text-base font-semibold text-foreground">5. Seus direitos</h2>
          <p>
            Você pode solicitar, a qualquer momento, acesso, correção ou
            exclusão dos seus dados pessoais entrando em contato diretamente
            com o desenvolvedor responsável pelo CifraPro.
          </p>

          <h2 className="text-base font-semibold text-foreground">6. Menores de idade</h2>
          <p>
            Esta fase de teste é destinada a um grupo restrito de convidados
            selecionados pessoalmente pelo desenvolvedor. O cadastro público
            geral, incluindo eventuais salvaguardas específicas para menores de
            idade, será tratado antes da abertura ao público em geral.
          </p>
        </section>

        <p className="text-xs text-muted-foreground pt-6 border-t border-border">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  )
}
