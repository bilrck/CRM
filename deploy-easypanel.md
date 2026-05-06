# 🚀 Guia de Deploy - Easypanel

Para subir o projeto no **Easypanel** (`wyg5eh.easypanel.host`), siga os passos abaixo para o Backend e o Frontend.

## 1. Configuração do Backend (API)
- **Service Type**: App
- **Source**: GitHub (aponte para a pasta `/backend`)
- **Build Method**: Dockerfile
- **Ports**: Mapeie a porta `3001` para HTTP.
- **Environment Variables**:
    - `PORT`: `3001`
    - `NODE_ENV`: `production`
    - `DATABASE_URL`: (Sua URL do Postgres)
    - `JWT_SECRET`: (Uma string aleatória longa)
    - `FRONTEND_URL`: `https://seu-frontend.com`
    - `API_URL`: `https://sua-api.com`
    - `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`: (Suas chaves da Meta)
    - `AI_DEFAULT_PROVIDER`, `AI_TEMPERATURE`, etc.

## 2. Configuração do Frontend (App)
- **Service Type**: App
- **Source**: GitHub (aponte para a pasta `/frontend`)
- **Build Method**: Dockerfile
- **Build Args** (Importante!):
    - `NEXT_PUBLIC_API_URL`: `https://sua-api.com` (A URL que você configurou no backend)
- **Ports**: Mapeie a porta `3000` para HTTP.
- **Environment Variables**:
    - `NEXT_PUBLIC_API_URL`: `https://sua-api.com`

---

## 📝 Notas Importantes:
1. **Prisma**: O Dockerfile do backend já executa `npx prisma generate`. No entanto, na primeira vez, você pode precisar rodar `npm run prisma:deploy` no console do Easypanel para criar as tabelas no banco de dados.
2. **Domínios**: Configure os domínios (SSL) no Easypanel antes de finalizar as variáveis de ambiente, para garantir que as URLs `https` coincidam.
3. **CORS**: Se o frontend não conseguir falar com a API, verifique se a `FRONTEND_URL` no backend está exatamente igual ao domínio do seu frontend.
