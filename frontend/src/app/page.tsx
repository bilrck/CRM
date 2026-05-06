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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center">
              <MessageSquare className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl text-gray-900">WhatsApp CRM</h1>
              <p className="text-xs text-gray-600">Rastreamento & Vendas</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/register">Cadastre-se</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <Badge className="mb-6 bg-emerald-100 text-emerald-700 px-4 py-2">
          <Zap size={14} className="mr-2" />
          Plataforma Completa de CRM
        </Badge>
        <h2 className="text-5xl md:text-6xl text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
          Transforme Leads em Vendas com o CRM Mais Completo
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Gerencie anúncios, rastreie links, controle finanças e converta mais com WhatsApp. 
          Tudo em uma única plataforma intuitiva e poderosa.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={onRegister} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8">
            Começar Agora Grátis
            <ArrowRight className="ml-2" size={20} />
          </Button>
          <Button onClick={onLogin} size="lg" variant="outline" className="text-lg px-8">
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
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mb-3">
                  <Icon className="text-emerald-600" size={24} />
                </div>
                <div className="text-3xl text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 px-4 py-2">
            Funcionalidades
          </Badge>
          <h3 className="text-4xl text-gray-900 mb-4">
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
              <Card key={index} className="hover:shadow-xl transition-all hover:-translate-y-1 border-2 hover:border-emerald-500">
                <CardHeader>
                  <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={feature.color} size={28} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-emerald-700 text-emerald-100 px-4 py-2 border-emerald-600">
                Por que escolher?
              </Badge>
              <h3 className="text-4xl mb-6">
                Especializado em Vendas por WhatsApp
              </h3>
              <p className="text-emerald-100 text-lg mb-8">
                Desenvolvido especificamente para empresas que vendem por WhatsApp e anúncios. 
                Não é apenas um CRM genérico, é uma solução completa para seu negócio digital.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <div className="text-lg mb-1">Rastreamento Inteligente</div>
                    <div className="text-emerald-200">Saiba de onde vem cada lead e quanto custa cada conversão</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <div className="text-lg mb-1">Automação Poderosa</div>
                    <div className="text-emerald-200">Integre com suas campanhas e importe leads automaticamente</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <div className="text-lg mb-1">Controle Financeiro Total</div>
                    <div className="text-emerald-200">Acompanhe investimento em anúncios vs. retorno em vendas</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="text-emerald-400 mx-auto mb-3" size={40} />
                  <div className="text-3xl text-white mb-2">+180%</div>
                  <div className="text-emerald-200">Aumento em Conversões</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <Clock className="text-emerald-400 mx-auto mb-3" size={40} />
                  <div className="text-3xl text-white mb-2">-70%</div>
                  <div className="text-emerald-200">Tempo de Resposta</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <Target className="text-emerald-400 mx-auto mb-3" size={40} />
                  <div className="text-3xl text-white mb-2">+250%</div>
                  <div className="text-emerald-200">ROI Médio</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <Shield className="text-emerald-400 mx-auto mb-3" size={40} />
                  <div className="text-3xl text-white mb-2">100%</div>
                  <div className="text-emerald-200">Seguro e Confiável</div>
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
          <h3 className="text-4xl text-gray-900 mb-4">
            Mais de 1.000 empresas confiam em nós
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-amber-400 fill-amber-400" size={18} />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 px-4 py-2">
              Planos
            </Badge>
            <h3 className="text-4xl text-gray-900 mb-4">
              Escolha o plano ideal para seu negócio
            </h3>
            <p className="text-xl text-gray-600">
              Todos os planos com 14 dias grátis. Sem compromisso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`${plan.highlighted ? 'border-4 border-emerald-500 shadow-2xl scale-105' : 'border-2'}`}
              >
                <CardHeader>
                  {plan.highlighted && (
                    <Badge className="mb-2 bg-emerald-600 text-white w-fit">
                      Mais Popular
                    </Badge>
                  )}
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-gray-600">{plan.period}</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={18} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={onRegister}
                    className={`w-full ${plan.highlighted ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
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
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Card className="bg-gradient-to-br from-emerald-600 to-emerald-800 border-0 text-white">
          <CardContent className="py-16 text-center">
            <h3 className="text-4xl mb-4">
              Pronto para Transformar suas Vendas?
            </h3>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de empresas que já aumentaram suas vendas com nosso CRM especializado
            </p>
            <Button onClick={onRegister} size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8">
              Começar Grátis Agora
              <ArrowRight className="ml-2" size={20} />
            </Button>
            <p className="text-emerald-100 text-sm mt-4">
              Teste grátis por 14 dias · Sem cartão de crédito · Suporte incluído
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="text-white" size={24} />
                </div>
                <span className="text-white text-lg">WhatsApp CRM</span>
              </div>
              <p className="text-sm text-gray-400">
                O CRM mais completo para vendas por WhatsApp e gerenciamento de anúncios.
              </p>
            </div>
            <div>
              <h4 className="text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-400">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-emerald-400">Integrações</a></li>
                <li><a href="#" className="hover:text-emerald-400">Preços</a></li>
                <li><a href="#" className="hover:text-emerald-400">Atualizações</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-400">Sobre</a></li>
                <li><a href="#" className="hover:text-emerald-400">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-400">Carreiras</a></li>
                <li><a href="#" className="hover:text-emerald-400">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-400">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-emerald-400">Documentação</a></li>
                <li><a href="#" className="hover:text-emerald-400">Status</a></li>
                <li><a href="#" className="hover:text-emerald-400">API</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 WhatsApp CRM. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}