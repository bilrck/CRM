import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso | Rastreia AI CRM",
  description: "Termos e condições de uso da plataforma Rastreia AI.",
};

export default function TermosUso() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar à página inicial</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="text-white" size={16} />
            </div>
            <span className="font-semibold text-gray-800">Rastreia AI</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Regras e diretrizes para utilização da nossa plataforma CRM.
          </p>
          <p className="text-slate-400 text-sm mt-4">
            Última atualização: 18 de maio de 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-slate max-w-none space-y-8">
          
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-sm text-blue-800 mb-8">
            <p className="flex items-center gap-2 font-semibold mb-2">
              <AlertTriangle size={18} />
              Atenção
            </p>
            <p>
              Ao acessar e usar o Rastreia AI, você concorda legalmente com estes termos. Se não concordar, não utilize o serviço.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-gray-600">
              Estes Termos de Uso regulam o acesso e utilização da plataforma Rastreia AI, disponibilizada por [Sua Empresa Ltda.], CNPJ XX.XXX.XXX/0001-XX. Ao se cadastrar, você declara ser maior de 18 anos e ter capacidade legal para aceitar estas condições.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descrição do Serviço</h2>
            <p className="text-gray-600 mb-3">
              O Rastreia AI é um Software as a Service (SaaS) focado em Customer Relationship Management (CRM), oferecendo:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Gestão de leads em formato Kanban;</li>
              <li>Integração com plataformas de anúncios (Meta Ads);</li>
              <li>Relatórios financeiros e de vendas;</li>
              <li>Ferramentas de rastreamento de links e UTMs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cadastro e Segurança</h2>
            <p className="text-gray-600">
              O usuário é o único responsável pela veracidade dos dados informados no cadastro e pela guarda e sigilo de sua senha de acesso. A conta é pessoal e intransferível. Qualquer atividade realizada sob a sua conta será de sua exclusiva responsabilidade.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Planos, Pagamentos e Cancelamento</h2>
            <div className="space-y-3 text-gray-600">
              <p><strong>4.1.</strong> Oferecemos planos gratuitos (trial de 14 dias) e pagos. Os valores e características estão disponíveis na página de Preços.</p>
              <p><strong>4.2.</strong> O faturamento é recorrente (mensal ou anual, conforme escolhido).</p>
              <p><strong>4.3.</strong> O cancelamento de planos pagos pode ser solicitado a qualquer momento diretamente pelo painel do usuário.</p>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4 mb-2">
                <p className="font-semibold text-blue-900 mb-2"><strong>4.4. Direito de Arrependimento e Reembolso (Regra de 10 dias):</strong></p>
                <ul className="list-disc list-inside text-blue-800 space-y-2 text-sm">
                  <li>Se a solicitação de cancelamento for realizada em até <strong>10 (dez) dias corridos</strong> contados a partir da data de ativação ou renovação da assinatura, o acesso à plataforma será <strong>interrompido imediatamente</strong> e o valor correspondente será <strong>reembolsado automaticamente</strong> de forma integral na mesma forma de pagamento original.</li>
                  <li>Se a solicitação for realizada <strong>após o prazo de 10 (dez) dias corridos</strong>, a recorrência da assinatura será devidamente cancelada (evitando novas cobranças), mas o acesso completo à plataforma continuará <strong>ativo e liberado até o final do período do plano vigente</strong> (fim do ciclo de faturamento), não sendo devido qualquer reembolso ou estorno do valor pago.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Uso Aceitável e Proibições</h2>
            <p className="text-gray-600 mb-3">O usuário compromete-se a NÃO utilizar a plataforma para:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Prática de SPAM ou envio de mensagens não solicitadas em massa;</li>
              <li>Violar direitos autorais ou intelectuais de terceiros;</li>
              <li>Tratar dados pessoais de terceiros (seus leads) sem base legal adequada conforme a LGPD;</li>
              <li>Tentar invadir, hackear ou prejudicar a infraestrutura da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propriedade Intelectual</h2>
            <p className="text-gray-600">
              Todos os direitos de propriedade intelectual sobre a plataforma (código, layout, marca, banco de dados) são de titularidade exclusiva da Rastreia AI. A assinatura não concede ao usuário qualquer direito sobre o software em si, apenas uma licença limitada, revogável e não exclusiva de uso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Responsabilidade pelos Dados (LGPD)</h2>
            <p className="text-gray-600">
              O usuário atua como <strong>Controlador</strong> dos dados pessoais dos seus próprios leads inseridos no CRM. A Rastreia AI atua apenas como <strong>Operadora</strong> desses dados, processando-os estritamente conforme as instruções do usuário. O usuário declara possuir o consentimento ou outra base legal válida para processar os dados dos seus leads na nossa plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-gray-600">
              Garantimos o melhor esforço para manter a plataforma online (SLA de 99%). Contudo, não nos responsabilizamos por perdas de lucros, dados ou vendas decorrentes de instabilidades sistêmicas ou falhas de integrações de terceiros (ex: bloqueios na API do WhatsApp ou Facebook).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modificações nos Termos</h2>
            <p className="text-gray-600">
              Podemos alterar estes termos a qualquer momento. Modificações substanciais serão comunicadas via e-mail ou aviso no painel. O uso contínuo após as mudanças caracteriza aceitação.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Foro e Legislação</h2>
            <p className="text-gray-600">
              Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro da comarca da sede da empresa [Sua Cidade/Estado] para dirimir quaisquer controvérsias.
            </p>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-between items-center pt-8 border-t border-gray-200">
          <Link href="/privacidade" className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline flex items-center gap-2">
            <CheckCircle size={16} />
            Ver Política de Privacidade
          </Link>
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Voltar à página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
