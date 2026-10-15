# ==============================================================================
# ESTÁGIO 1: BUILD DA APLICAÇÃO (Frontend Vite + Backend Express em bundle CJS)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências do sistema necessárias para compilação nativa se houver e suporte a OpenSSL
RUN apk add --no-cache libc6-compat openssl

# Copia manifestos de dependências e esquema Prisma
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instala dependências completas para build
RUN npm install --legacy-peer-deps

# Gera o cliente Prisma ORM 5.22.0 local (sem baixar versões externas)
RUN ./node_modules/.bin/prisma generate

# Copia todo o código-fonte da aplicação
COPY . .

# Compila o frontend React (dist/ SPA) e o backend Express (dist/server.cjs)
RUN npm run build

# Remove dependências de desenvolvimento mantendo apenas produção e cliente Prisma gerado
RUN npm prune --omit=dev

# ==============================================================================
# ESTÁGIO 2: IMAGEM FINAL DE PRODUÇÃO (Leve, Segura e Otimizada)
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Adiciona wget, curl, libc6-compat e openssl para suporte ao runtime nativo do Prisma
RUN apk add --no-cache curl wget libc6-compat openssl

# Copia manifestos e esquema Prisma
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Copia os módulos de produção e o cliente Prisma pré-gerado do estágio builder
COPY --from=builder /app/node_modules ./node_modules

# Copia os artefatos compilados do estágio de build
COPY --from=builder /app/dist ./dist

# Garante a existência do diretório de cache local e define permissões para o usuário 'node'
RUN mkdir -p /app/data && chown -R node:node /app

# Executa sob usuário sem privilégios de root para conformidade de segurança
USER node

# Porta de escuta da aplicação
EXPOSE 3000

# Verificação de integridade nativa do container (Healthcheck)
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

# Comando de inicialização do servidor de produção
CMD ["node", "dist/server.cjs"]
