# 📦 Guia de Atualização de Versões — MeteoPulse Pro EMA

Instruções passo a passo para gerar novas versões da aplicação, enviar para o Docker Hub e atualizar o cluster Docker Swarm em produção.

---

## 🚀 Passo a Passo Rápido

### 1. Acessar a pasta do projeto no servidor
```bash
cd /home/eder/sites/ema_ai
```

### 2. Atualizar o código-fonte local
Puxe as alterações mais recentes enviadas ao repositório Git:
```bash
git pull
```

---

### 3. Construir a nova imagem Docker
Gere a imagem de produção especificando a nova tag de versão (ex: `1.0.2`):
```bash
docker build -t ederbatera/ema:1.0.2 .
```

> **Dica**: Incremente o número da versão para cada nova entrega (ex: `1.0.2`, `1.0.3`, `1.1.0`), facilitando auditoria e rollback rápido.

---

### 4. Enviar a imagem para o Docker Hub
Faça o upload da imagem compilada para o repositório público/privado:
```bash
docker push ederbatera/ema:1.0.2
```

*(Caso não esteja autenticado no terminal, execute `docker login` previamente).*

---

### 5. Atualizar a variável de versão (`APP_VERSION`)

Como a stack está parametrizada com `${APP_VERSION}`, basta **alterar apenas a variável de ambiente** no arquivo `/.env`:

```env
# No arquivo /home/eder/sites/ema_ai/.env:
APP_VERSION=1.0.2
VITE_APP_VERSION=1.0.2
```

> **Como funciona**: A stack lê automaticamente `${APP_VERSION}`:
> 1. Puxa a imagem correspondente no Swarm: `image: ederbatera/ema:${APP_VERSION}` (ou seja, `ederbatera/ema:1.0.2`).
> 2. Passa a variável para o container em execução, que exibe automaticamente no **rodapé da página web**: `Versão: v1.0.2 (ederbatera/ema:1.0.2)`.
> 
> *Nota: Você não precisa editar o `docker-stack.yml`, apenas o `.env`!*

---

### 6. Aplicar a atualização no Docker Swarm

Reaplique a stack no Swarm carregando as variáveis do `.env`:
```bash
docker stack deploy -c docker-stack.yml ema
```

*(Ou via export das variáveis se seu shell não ler o `.env` automaticamente)*:
```bash
export $(grep -v '^#' .env | xargs) && docker stack deploy -c docker-stack.yml ema
```

#### Alternativa — Atualização Direta do Serviço (Rolling Update)
Se preferir aplicar imediatamente no serviço ativo sem reimplantar a stack inteira:
```bash
docker service update --image ederbatera/ema:1.0.2 --env-add APP_VERSION=1.0.2 ema_ema_app
```

---

## 🔍 7. Monitoramento e Validação pós-deploy

### Verificar o status das réplicas e o progresso do rollout:
```bash
docker service ps ema_ema_app
```

### Acompanhar logs em tempo real das instâncias ativas:
```bash
docker service logs -f ema_ema_app
```

### Testar a resposta da API localmente:
```bash
curl -I http://localhost:9062/api/health
```

---

## 🛡️ Dicas de Operação e Rollback

### Reversão Instantânea (Rollback)
Se houver qualquer imprevisto com a nova versão, retorne imediatamente para a versão anterior:
```bash
docker service rollback ema_ema_app
```

### Limpeza de Imagens Antigas
Para liberar espaço em disco no servidor após múltiplos deploys:
```bash
docker image prune -f
```

---

## 🏷️ Criando a Release no GitHub (v1.0.0)

Criar uma Release no GitHub associa a versão do código à imagem Docker correspondente gerando histórico oficial de versões (tags).

### Método 1: Pelo Terminal via Git (Mais Rápido)

```bash
# 1. Garanta que todas as alterações locais estão adicionadas:
git add .
git commit -m "feat: release oficial v1.0.0"
git push origin main

# 2. Crie uma tag Git anotada com a versão 1.0.0:
git tag -a v1.0.0 -m "Release v1.0.0: Versão inicial de produção"

# 3. Envie a tag para o GitHub:
git push origin v1.0.0
```

> **Com o GitHub CLI (`gh`) instalado (Opcional)**:
> ```bash
> gh release create v1.0.0 --title "v1.0.0" --notes "Release oficial v1.0.0"
> ```

---

### Método 2: Pela Interface Web do GitHub

1. Acesse o seu repositório no navegador: `https://github.com/ederbatera/ema`
2. No menu à direita, clique em **Releases** (ou acesse diretamente `https://github.com/ederbatera/ema/releases`).
3. Clique no botão **"Draft a new release"**.
4. Clique em **"Choose a tag"**:
   - Digite `v1.0.0`
   - Clique em **"Create new tag: v1.0.0 on publish"**.
5. No campo **Release title**, preencha com:
   `v1.0.0` (ou `v1.0.0 - Versão Oficial`)
6. No campo de descrição (**Describe this release**), adicione as notas de versão:
   ```markdown
   ## O que há na v1.0.0:
   - 🌦️ **Monitoramento & Telemetria em Tempo Real**: Coleta de dados contínua de estações meteorológicas.
   - 🕒 **Fuso Horário Oficial**: Respeito rigoroso ao horário de Brasília (UTC-03:00).
   - 🐳 **Deploy Docker Swarm**: Orquestração com rolling update e zero downtime.
   - 🏷️ **Controle de Versão**: Variável `APP_VERSION` dinâmica no rodapé e stack.
   - 📦 **Imagem Docker**: `ederbatera/ema:1.0.0`
   ```
7. Clique no botão verde **"Publish release"**. Pronto! A tag e a release oficial estarão publicadas.

