import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Kanban, 
  Users, 
  Link2, 
  Wallet, 
  BarChart3, 
  MessageSquare, 
  Plug,
  TrendingUp,
  Target,
  Zap,
  Shield,
  CheckCircle2,
  ArrowRight,
  Star,
  Globe,
  Clock,
  DollarSign,
  MousePointerClick
} from "lucide-react";
import Link from "next/link";

interface HomeProps {
  onLogin: () => void;
  onRegister: () => void;
}

export default function Home({ onLogin, onRegister }: HomeProps) {
  const features = [
    {
      icon: Kanban,
      title: "Sistema Kanban Visual",
      description: "Gerencie seus leads visualmente com drag-and-drop intuitivo. Organize por estágios e acompanhe o progresso em tempo real.",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: Link2,
      title: "Rastreamento de Links",
      description: "Crie links encurtados para WhatsApp e websites. Monitore cliques, conversões e origem do tráfego com análises detalhadas.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    },
    {
      icon: Wallet,
      title: "Gestão Financeira Completa",
      description: "Controle receitas, despesas e margem de lucro. Visualize fluxo de caixa e tenha insights financeiros precisos.",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      icon: BarChart3,
      title: "Relatórios Avançados",
      description: "Dashboards interativos com métricas de vendas, performance de campanhas e análise de ROI em tempo real.",
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    },
    {
      icon: MessageSquare,
      title: "Central de Conversas",
      description: "Centralize todas as conversas do WhatsApp em um só lugar. Responda rápido e nunca perca uma oportunidade.",
      color: "text-cyan-600",
      bgColor: "bg-cyan-100"
    },
    {
      icon: Plug,
      title: "Integrações Poderosas",
      description: "Conecte com Meta Ads, Google Ads, WhatsApp Business API e outras plataformas. Sincronização automática de leads.",
      color: "text-pink-600",
      bgColor: "bg-pink-100"
    },
    {
      icon: Users,
      title: "Gestão de Leads Inteligente",
      description: "Cadastre, qualifique e segmente leads automaticamente. Atribua vendedores e acompanhe todo o histórico.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    },
    {
      icon: Target,
      title: "Funis de Vendas Personalizados",
      description: "Crie funis customizados para cada produto ou campanha. Otimize seu processo comercial e aumente conversões.",
      color: "text-red-600",
      bgColor: "bg-red-100"
    }
  ];

  const stats = [
    { value: "10k+", label: "Leads Gerenciados", icon: Users },
    { value: "95%", label: "Taxa de Satisfação", icon: Star },
    { value: "24/7", label: "Suporte Disponível", icon: Clock },
    { value: "R$ 2.5M+", label: "Em Vendas Rastreadas", icon: DollarSign }
  ];

  const testimonials = [
    {
      name: "Maria Santos",
      role: "CEO - Empresa Digital",
      content: "O CRM transformou nossa operação de vendas. Aumentamos em 180% as conversões apenas no primeiro mês!",
      rating: 5
    },
    {
      name: "Carlos Mendes",
      role: "Gerente Comercial",
      content: "Finalmente conseguimos ter controle total dos nossos leads. O sistema Kanban é intuitivo e muito eficiente.",
      rating: 5
    },
    {
      name: "Ana Paula",
      role: "Diretora de Marketing",
      content: "Os relatórios são incríveis! Agora sabemos exatamente qual campanha traz mais retorno e podemos otimizar investimentos.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "R$ 97",
      period: "/mês",
      description: "Ideal para começar",
      features: [
        "Até 500 leads/mês",
        "2 usuários",
        "Rastreamento de links",
        "Relatórios básicos",
        "Suporte por email"
      ],
      highlighted: false
    },
    {
      name: "Professional",
      price: "R$ 297",
      period: "/mês",
      description: "Mais popular",
      features: [
        "Leads ilimitados",
        "10 usuários",
        "Todas as integrações",
        "Relatórios avançados",
        "Suporte prioritário",
        "WhatsApp Business API",
        "Funis personalizados"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Personalizado",
      period: "",
      description: "Para grandes times",
      features: [
        "Tudo do Professional",
        "Usuários ilimitados",
        "API dedicada",
        "Gerente de conta",
        "Customizações",
        "SLA garantido"
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <MessageSquare className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl text-gray-900 font-bold">WhatsApp CRM</h1>
              <p className="text-xs text-gray-600">Rastreamento & Vendas</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/register">Cadastre-se</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <Badge className="mb-6 bg-blue-100 text-blue-700 px-4 py-2 border-blue-200">
          <Zap size={14} className="mr-2" />
          Plataforma Completa de CRM
        </Badge>
        <h2 className="text-5xl md:text-6xl text-gray-900 mb-6 max-w-4xl mx-auto leading-tight font-black">
          Transforme Leads em Vendas com o CRM Mais Completo
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-medium">
          Gerencie anúncios, rastreie links, controle finanças e converta mais com WhatsApp. 
          Tudo em uma única plataforma intuitiva e poderosa.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={onRegister} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 rounded-2xl shadow-xl shadow-blue-200 transition-all hover:scale-105">
            Começar Agora Grátis
            <ArrowRight className="ml-2" size={20} />
          </Button>
          <Button onClick={onLogin} size="lg" variant="outline" className="text-lg px-8 rounded-2xl border-2">
            Ver Demo
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          ✓ Sem cartão de crédito · ✓ 14 dias grátis · ✓ Cancele quando quiser
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="text-blue-600" size={24} />
                </div>
                <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 px-4 py-2 border-indigo-200">
            Funcionalidades
          </Badge>
          <h3 className="text-4xl font-black text-gray-900 mb-4">
            Tudo que você precisa em um só lugar
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Recursos poderosos para gerenciar todo o ciclo de vendas, do primeiro contato ao fechamento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-2xl transition-all hover:-translate-y-2 border-2 hover:border-blue-500 rounded-3xl overflow-hidden group">
                <CardHeader>
                  <div className={`w-14 h-14 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform`}>
                    <Icon className={feature.color} size={28} />
                  </div>
                  <CardTitle className="text-lg font-bold">{feature.title}</CardTitle>
                  <CardDescription className="text-sm font-medium text-gray-500">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white py-24 rounded-[3rem] mx-4 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-blue-700 text-blue-100 px-4 py-2 border-blue-600">
                Por que escolher?
              </Badge>
              <h3 className="text-4xl font-black mb-6">
                Especializado em Vendas por WhatsApp
              </h3>
              <p className="text-blue-100 text-lg mb-8 font-medium">
                Desenvolvido especificamente para empresas que vendem por WhatsApp e anúncios. 
                Não é apenas um CRM genérico, é uma solução completa para seu negócio digital.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <CheckCircle2 className="text-blue-400 flex-shrink-0" size={24} />
                  </div>
                  <div>
                    <div className="text-xl font-bold mb-1 text-white">Rastreamento Inteligente</div>
                    <div className="text-blue-200/80 font-medium">Saiba de onde vem cada lead e quanto custa cada conversão</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <CheckCircle2 className="text-blue-400 flex-shrink-0" size={24} />
                  </div>
                  <div>
                    <div className="text-xl font-bold mb-1 text-white">Automação Poderosa</div>
                    <div className="text-blue-200/80 font-medium">Integre com suas campanhas e importe leads automaticamente</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <CheckCircle2 className="text-blue-400 flex-shrink-0" size={24} />
                  </div>
                  <div>
                    <div className="text-xl font-bold mb-1 text-white">Controle Financeiro Total</div>
                    <div className="text-blue-200/80 font-medium">Acompanhe investimento em anúncios vs. retorno em vendas</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default rounded-3xl">
                <CardContent className="pt-8 text-center">
                  <TrendingUp className="text-blue-400 mx-auto mb-4" size={48} />
                  <div className="text-4xl font-black text-white mb-2">+180%</div>
                  <div className="text-blue-200 font-bold uppercase tracking-wider text-[10px]">Aumento em Conversões</div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default rounded-3xl">
                <CardContent className="pt-8 text-center">
                  <Clock className="text-blue-400 mx-auto mb-4" size={48} />
                  <div className="text-4xl font-black text-white mb-2">-70%</div>
                  <div className="text-blue-200 font-bold uppercase tracking-wider text-[10px]">Tempo de Resposta</div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default rounded-3xl">
                <CardContent className="pt-8 text-center">
                  <Target className="text-blue-400 mx-auto mb-4" size={48} />
                  <div className="text-4xl font-black text-white mb-2">+250%</div>
                  <div className="text-blue-200 font-bold uppercase tracking-wider text-[10px]">ROI Médio</div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default rounded-3xl">
                <CardContent className="pt-8 text-center">
                  <Shield className="text-blue-400 mx-auto mb-4" size={48} />
                  <div className="text-4xl font-black text-white mb-2">100%</div>
                  <div className="text-blue-200 font-bold uppercase tracking-wider text-[10px]">Seguro e Confiável</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-100 text-purple-700 px-4 py-2">
            Depoimentos
          </Badge>
          <h3 className="text-4xl font-black text-gray-900 mb-4">
            Mais de 1.000 empresas confiam em nós
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 rounded-3xl hover:border-blue-200 transition-colors">
              <CardContent className="pt-8">
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-amber-400 fill-amber-400" size={18} />
                  ))}
                </div>
                <p className="text-gray-700 mb-8 italic font-medium leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3 border-t pt-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-gray-900 font-black">{testimonial.name}</div>
                    <div className="text-sm text-gray-500 font-medium">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-blue-100 text-blue-700 px-4 py-2 border-blue-200">
              Planos
            </Badge>
            <h3 className="text-4xl font-black text-gray-900 mb-4">
              Escolha o plano ideal para seu negócio
            </h3>
            <p className="text-xl text-gray-600 font-medium">
              Todos os planos com 14 dias grátis. Sem compromisso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`${plan.highlighted ? 'border-4 border-blue-500 shadow-2xl scale-105 z-10' : 'border-2'} rounded-[2.5rem] bg-white transition-transform hover:scale-[1.02]`}
              >
                <CardHeader className="p-8">
                  {plan.highlighted && (
                    <Badge className="mb-4 bg-blue-600 text-white w-fit px-4 py-1">
                      Mais Popular
                    </Badge>
                  )}
                  <CardTitle className="text-2xl font-black mb-2">{plan.name}</CardTitle>
                  <CardDescription className="font-medium">{plan.description}</CardDescription>
                  <div className="pt-6">
                    <span className="text-5xl font-black text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-gray-500 font-bold ml-1">{plan.period}</span>}
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="text-blue-600 flex-shrink-0" size={20} />
                        <span className="text-gray-700 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={onRegister}
                    className={`w-full py-7 text-lg font-black rounded-2xl transition-all ${plan.highlighted ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100' : ''}`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 border-0 text-white rounded-[3rem] shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full translate-y-32 -translate-x-32 blur-3xl" />
          
          <CardContent className="py-20 text-center relative z-10">
            <h3 className="text-5xl font-black mb-6">
              Pronto para Transformar suas Vendas?
            </h3>
            <p className="text-xl text-blue-50 mb-10 max-w-2xl mx-auto font-medium">
              Junte-se a milhares de empresas que já aumentaram suas vendas com nosso CRM especializado
            </p>
            <Button onClick={onRegister} size="lg" className="bg-white text-blue-700 hover:bg-blue-50 text-xl px-12 py-8 rounded-2xl font-black shadow-2xl transition-all hover:scale-105">
              Começar Grátis Agora
              <ArrowRight className="ml-2" size={24} />
            </Button>
            <p className="text-blue-100/70 text-sm mt-8 font-bold">
              Teste grátis por 14 dias · Sem cartão de crédito · Suporte incluído
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <MessageSquare className="text-white" size={28} />
                </div>
                <span className="text-white text-2xl font-black tracking-tight">WhatsApp CRM</span>
              </div>
              <p className="text-base text-gray-400 mb-6 leading-relaxed max-w-sm">
                O CRM mais completo para vendas por WhatsApp e gerenciamento de anúncios. Aumente sua conversão com inteligência.
              </p>
              <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-xs text-blue-200 border border-white/10 backdrop-blur-sm">
                <Shield size={14} className="text-blue-400" />
                Protegido por Criptografia de Ponta a Ponta
              </div>
            </div>
            <div>
              <h4 className="text-white font-black mb-6 uppercase tracking-widest text-xs">Produto</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Integrações</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Atualizações</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black mb-6 uppercase tracking-widest text-xs">Suporte</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black mb-6 uppercase tracking-widest text-xs">Legal</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link href="/privacidade" className="hover:text-blue-400 transition-colors flex items-center gap-2">Política de Privacidade</Link></li>
                <li><Link href="/termos" className="hover:text-blue-400 transition-colors">Termos de Uso</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-12 text-center text-sm font-medium text-gray-500">
            <p>&copy; 2026 Rastreia AI CRM. Todos os direitos reservados. Orgulhosamente feito para empreendedores.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}