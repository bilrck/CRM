# Rastreia.ai CRM - SaaS Premium

Este é um sistema de CRM e Automação SaaS completo, construído com foco em alta performance, escalabilidade e inteligência artificial.

## 🚀 Tecnologias
- **Frontend**: Next.js 15+, TailwindCSS, Radix UI, Sonner, Lucide Icons.
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL.
- **Integrações**: Meta API (WhatsApp/Facebook), Google Gemini, OpenAI, Evolution API.

## 📁 Estrutura do Projeto
- `/frontend`: Aplicação Next.js com interface administrativa e autenticação.
- `/backend`: API RESTful com autenticação JWT e integração com banco de dados.
- `/backend/prisma`: Definições do banco de dados e migrações.

## ⚙️ Configuração
O projeto é altamente configurável via arquivos `.env`.

### Backend (`/backend/.env`)
Principais seções:
1. **Server**: Portas e URLs base.
2. **Database**: String de conexão PostgreSQL.
3. **SMTP**: Configurações de servidor de email para recuperação de senha.
4. **Master Admin**: Chave secreta para operações críticas e geração de licenças.
5. **Integrations**: Chaves da Meta e Evolution API.
6. **AI**: Configurações globais para o Assistente inteligente.

## 🤖 Inteligência Artificial
O sistema possui um assistente de IA integrado que:
- Tem acesso exclusivo aos dados do usuário (Leads, Conexões, Métricas).
- Suporta múltiplos provedores (Google Gemini, OpenAI).
- Pode ser configurado individualmente por cada usuário.

## 🔑 Sistema de Licenciamento
O SaaS opera sob um modelo de chaves de licença:
- **Trial**: Novos usuários recebem 10 dias de teste grátis por padrão.
- **Planos**: Gestor, Cliente e Personalizado.
- **Ativação**: Usuários podem ativar/renovar o sistema inserindo chaves geradas pelo administrador master.

## 🛡️ Segurança e LGPD
- Proteção de cabeçalhos via **Helmet**.
- Isolamento total de dados entre usuários/workspaces.
- Endpoints de exportação e exclusão de dados (Direito ao Esquecimento).

---
Desenvolvido com foco em excelência e produtividade.
