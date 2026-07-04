export default function Termos() {
  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-6 text-foreground">
        <a href="/" className="text-sm text-primary underline">← Voltar</a>

        <h1 className="text-2xl font-bold">Termos de Uso — CifraPro</h1>

        <div className="rounded-xl p-4 text-sm bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
          <strong>Fase de teste fechado.</strong> O CifraPro está em fase de testes
          com um grupo restrito de usuários convidados. Não há cobrança de nenhum
          valor nesta fase. Estes Termos serão revisados e formalizados antes de
          qualquer abertura pública de cadastro ou cobrança de assinatura.
        </div>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-semibold text-foreground">1. Sobre este teste</h2>
          <p>
            Você está usando uma versão de testes (beta fechado) do CifraPro,
            disponibilizada por convite pessoal do desenvolvedor. O acesso pode
            ser suspenso, os dados podem ser reiniciados, e funcionalidades podem
            mudar sem aviso prévio durante esta fase.
          </p>

          <h2 className="text-base font-semibold text-foreground">2. Uso adequado</h2>
          <p>
            Você concorda em usar o CifraPro apenas para fins pessoais de
            organização de cifras e hinários, e em não compartilhar suas
            credenciais de acesso com terceiros.
          </p>

          <h2 className="text-base font-semibold text-foreground">3. Seus dados nesta fase</h2>
          <p>
            Consulte nossa{" "}
            <a href="/privacidade" className="text-primary underline">
              Política de Privacidade
            </a>{" "}
            para saber como tratamos as informações que você cadastra.
          </p>

          <h2 className="text-base font-semibold text-foreground">4. Encerramento do teste</h2>
          <p>
            Ao final da fase de testes, você será avisado com antecedência caso
            o serviço venha a ser descontinuado, se tornar pago, ou exigir novo
            aceite de termos atualizados.
          </p>

          <h2 className="text-base font-semibold text-foreground">5. Contato</h2>
          <p>
            Dúvidas sobre estes Termos podem ser enviadas diretamente ao
            desenvolvedor responsável pelo CifraPro.
          </p>
        </section>

        <p className="text-xs text-muted-foreground pt-6 border-t border-border">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  )
}
