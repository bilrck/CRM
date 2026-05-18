import Link from "next/link";
import { Shield, ArrowLeft, Mail, Lock, Eye, Trash2, Download, AlertCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Rastreia AI CRM",
  description: "Saiba como a Rastreia AI coleta, usa e protege seus dados pessoais em conformidade com a LGPD (Lei 13.709/2018).",
};

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar à página inicial</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Shield className="text-white" size={16} />
            </div>
            <span className="font-semibold text-gray-800">Rastreia AI</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6 text-sm">
            <Shield size={16} />
            Em conformidade com a LGPD — Lei 13.709/2018
          </div>
          <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
            Transparência total sobre como coletamos, usamos e protegemos seus dados pessoais.
          </p>
          <p className="text-emerald-200 text-sm mt-4">
            Última atualização: 18 de maio de 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Quick Nav */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-10 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Navegação Rápida</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {["Quem Somos", "Dados Coletados", "Finalidade", "Base Legal", "Seus Direitos", "Cookies", "Segurança", "Contato"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="text-emerald-600 hover:text-emerald-700 hover:underline">
                → {item}
              </a>
            ))}
          </div>
        </div>

        <div className="prose prose-gray max-w-none space-y-10">

          {/* 1 */}
          <section id="quem-somos" className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
              Quem Somos (Controlador de Dados)
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              A <strong>Rastreia AI</strong> é a controladora dos seus dados pessoais, responsável pelas decisões sobre o tratamento dos dados coletados por meio da plataforma CRM.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
              <p><strong>Razão Social:</strong> [Sua Empresa Ltda.] — <em className="text-red-500">personalizar antes de publicar</em></p>
              <p><strong>CNPJ:</strong> XX.XXX.XXX/0001-XX</p>
              <p><strong>Endereço:</strong> [Endereço completo]</p>
              <p><strong>E-mail:</strong> privacidade@rastreia.ai</p>
            </div>
          </section>

          {/* 2 */}
          <section id="dados-coletados" className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
              Dados Pessoais Coletados
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">2.1 Dados de cadastro</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                  <li>Nome completo</li>
                  <li>Endereço de e-mail</li>
                  <li>Senha (armazenada em formato criptografado — nunca em texto puro)</li>
                  <li>Função/cargo (gestor ou cliente)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">2.2 Dados de uso da plataforma</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                  <li>Registros de acesso (IP, data/hora, navegador)</li>
                  <li>Ações realizadas na plataforma (logs de sistema)</li>
                  <li>Dados de leads e clientes inseridos pelo usuário</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">2.3 Dados de integrações</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                  <li>Tokens de acesso a plataformas externas (Meta Ads, WhatsApp Business) — armazenados de forma segura</li>
                  <li>Dados de leads provenientes de formulários do Meta Lead Ads</li>
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                <strong>Não coletamos:</strong> dados sensíveis (saúde, biometria, origem racial, convicção religiosa, etc.) conforme Art. 11 da LGPD.
              </div>
            </div>
          </section>

          {/* 3 */}
          <section id="finalidade" className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
              Finalidade do Tratamento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                { title: "Prestação do serviço CRM", desc: "Gerenciamento de leads, funis de vendas, relatórios e integrações." },
                { title: "Autenticação e segurança", desc: "Controle de acesso, sessões seguras e prevenção de fraudes." },
                { title: "Comunicações transacionais", desc: "E-mails de confirmação, recuperação de senha e alertas do sistema." },
                { title: "Melhoria do produto", desc: "Análise de uso anonimizada para aprimorar funcionalidades." },
                { title: "Conformidade legal", desc: "Cumprimento de obrigações legais e resposta a autoridades competentes." },
                { title: "Suporte ao cliente", desc: "Atendimento de dúvidas e resolução de problemas técnicos." },
              ].map((item) => (
                <div key={item.title} className="bg-gray-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 mb-1">{item.title}</p>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 4 */}
          <section id="base-legal" className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-sm font-bold">4</span>
              Base Legal (Art. 7º, LGPD)
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3 items-start bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <Shield className="text-emerald-600 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-semibold text-gray-800">Consentimento (Art. 7º, I)</p>
                  <p className="text-gray-600">Para uso de cookies analíticos e comunicações de marketing, mediante aceite explícito no cadastro.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start bg-blue-50 border border-blue-100 rounded-xl p-4">
                <Lock className="text-blue-600 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-semibold text-gray-800">Execução de contrato (Art. 7º, V)</p>
                  <p className="text-gray-600">Para dados necessários à prestação do serviço contratado pelo usuário.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start bg-purple-50 border border-purple-100 rounded-xl p-4">
                <AlertCircle className="text-purple-600 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-semibold text-gray-800">Legítimo interesse (Art. 7º, IX)</p>
                  <p className="text-gray-600">Para prevenção a fraudes, segurança da plataforma e melhoria do produto.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 5 */}
          <section id="seus-direitos" className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center text-sm font-bold">5</span>
              Seus Direitos (Art. 18, LGPD)
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Como titular de dados, você possui os seguintes direitos, que podem ser exercidos diretamente na plataforma ou por e-mail:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Eye, title: "Acesso", desc: "Confirmar se tratamos seus dados e acessar os dados que mantemos sobre você.", color: "text-blue-600 bg-blue-50" },
                { icon: Download, title: "Portabilidade", desc: "Exportar todos os seus dados em formato JSON a qualquer momento.", color: "text-emerald-600 bg-emerald-50" },
                { icon: Trash2, title: "Exclusão", desc: "Solicitar a exclusão dos seus dados. Processamos em até 30 dias.", color: "text-red-600 bg-red-50" },
                { icon: AlertCircle, title: "Correção", desc: "Corrigir dados incompletos, inexatos ou desatualizados.", color: "text-purple-600 bg-purple-50" },
                { icon: Lock, title: "Revogação", desc: "Revogar o consentimento a qualquer momento, sem prejuízo dos serviços essenciais.", color: "text-amber-600 bg-amber-50" },
                { icon: Shield, title: "Informação", desc: "Ser informado sobre as entidades com as quais compartilhamos seus dados.", color: "text-gray-600 bg-gray-50" },
              ].map((right) => (
                <div key={right.title} className={`rounded-xl p-4 ${right.color.split(" ")[1]} border border-opacity-20`}>
                  <div className="flex items-center gap-2 mb-2">
                    <right.icon size={18} className={right.color.split(" ")[0]} />
                    <p className="font-semibold text-gray-800 text-sm">{right.title}</p>
                  </div>
                  <p className="text-gray-600 text-sm">{right.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm">
              <p className="text-emerald-800 font-medium">💡 Como exercer seus direitos:</p>
              <p className="text-emerald-700 mt-1">Acesse <strong>Configurações → Meus Dados</strong> na plataforma ou envie e-mail para <strong>privacidade@rastreia.ai</strong>. Respondemos em até 15 dias úteis.</p>
            </div>
          </section>

          {/* 6 */}
          <section id="cookies" className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center text-sm font-bold">6</span>
              Cookies e Tecnologias de Rastreamento
            </h2>
            <div className="space-y-3 text-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border border-gray-200 font-semibold text-gray-700">Tipo</th>
                      <th className="text-left p-3 border border-gray-200 font-semibold text-gray-700">Finalidade</th>
                      <th className="text-left p-3 border border-gray-200 font-semibold text-gray-700">Obrigatório</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr>
                      <td className="p-3 border border-gray-200 font-medium">Sessão (token)</td>
                      <td className="p-3 border border-gray-200">Autenticação segura do usuário</td>
                      <td className="p-3 border border-gray-200 text-emerald-600 font-medium">Sim</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border border-gray-200 font-medium">Preferências</td>
                      <td className="p-3 border border-gray-200">Tema, idioma e configurações do usuário</td>
                      <td className="p-3 border border-gray-200 text-emerald-600 font-medium">Sim</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200 font-medium">Analíticos</td>
                      <td className="p-3 border border-gray-200">Melhoria do produto (anonimizados)</td>
                      <td className="p-3 border border-gray-200 text-amber-600 font-medium">Opcional</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-gray-500">Você pode gerenciar suas preferências de cookies a qualquer momento pelo banner exibido na plataforma.</p>
            </div>
          </section>

          {/* 7 */}
          <section id="segurança" className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-sm font-bold">7</span>
              Segurança dos Dados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                "Senhas criptografadas com bcrypt (fator 10)",
                "Sessões via cookie httpOnly + Secure em produção",
                "Cabeçalhos de segurança via Helmet.js",
                "Comunicação HTTPS obrigatória",
                "Tokens JWT com expiração em 7 dias",
                "Acesso a dados restrito por autenticação",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-gray-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          {/* 8 */}
          <section id="compartilhamento" className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-100 text-red-700 rounded-lg flex items-center justify-center text-sm font-bold">8</span>
              Compartilhamento de Dados
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              <strong>Não vendemos seus dados pessoais.</strong> Compartilhamos apenas quando necessário para prestação do serviço:
            </p>
            <ul className="list-disc list-inside text-gray-600 text-sm space-y-2">
              <li><strong>Meta (Facebook):</strong> apenas com seu token de acesso, para sincronizar leads dos seus formulários</li>
              <li><strong>Serviços de e-mail:</strong> para envio de notificações transacionais</li>
              <li><strong>Autoridades públicas:</strong> quando exigido por lei ou ordem judicial</li>
            </ul>
          </section>

          {/* 9 */}
          <section id="retenção" className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center text-sm font-bold">9</span>
              Retenção e Exclusão
            </h2>
            <div className="text-sm text-gray-600 space-y-3">
              <p>Mantemos seus dados pelo período necessário à prestação do serviço. Após o encerramento da conta:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Dados de acesso e logs: excluídos em até 90 dias</li>
                <li>Dados de leads e vendas: excluídos em até 30 dias após solicitação</li>
                <li>Dados fiscais (quando aplicável): retidos por 5 anos conforme legislação tributária</li>
              </ul>
            </div>
          </section>

          {/* 10 */}
          <section id="contato" className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Mail size={24} />
              Encarregado (DPO) e Contato
            </h2>
            <p className="text-emerald-100 text-sm mb-4">
              Nomeamos um Encarregado de Proteção de Dados (DPO) conforme Art. 41 da LGPD, responsável por receber comunicações sobre o tratamento de dados pessoais.
            </p>
            <div className="bg-white/10 rounded-xl p-4 text-sm space-y-2">
              <p><strong>DPO:</strong> [Nome do Responsável] — <em className="text-emerald-200">personalizar</em></p>
              <p><strong>E-mail:</strong> privacidade@rastreia.ai</p>
              <p><strong>Resposta:</strong> em até 15 dias úteis</p>
              <p><strong>ANPD:</strong> Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados — <a href="https://www.gov.br/anpd" className="underline" target="_blank" rel="noopener noreferrer">gov.br/anpd</a></p>
            </div>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-between items-center pt-8 border-t border-gray-200">
          <Link href="/termos" className="text-emerald-600 hover:text-emerald-700 font-medium text-sm hover:underline">
            → Ver Termos de Uso
          </Link>
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Voltar à página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
