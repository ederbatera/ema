# 🌦️ MeteoPulse Pro EMA — Estação Meteorológica Automática

Sistema full-stack de alta precisão para monitoramento, telemetria em tempo real, climatologia histórica e previsão numérica do tempo para Estações Meteorológicas Automáticas (EMA).

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Estrutura de Arquivos](#-estrutura-de-arquivos)
- [Variáveis de Ambiente (.env)](#-variáveis-de-ambiente-env)
- [Execução Rápida com Docker Compose](#-execução-rápida-com-docker-compose)
- [Implantação em Produção com Docker Swarm](#-implantação-em-produção-com-docker-swarm)
  - [1. Inicializar o Cluster Swarm](#1-inicializar-o-cluster-swarm)
  - [2. Construir a Imagem Docker](#2-construir-a-imagem-docker)
  - [3. Publicar em um Registry (Opcional / Multi-Node)](#3-publicar-em-um-registry-opcional--multi-node)
  - [4. Realizar o Deploy do Stack](#4-realizar-o-deploy-do-stack)
  - [5. Verificar o Status dos Serviços](#5-verificar-o-status-dos-serviços)
  - [6. Monitorar Logs em Tempo Real](#6-monitorar-logs-em-tempo-real)
  - [7. Escalonamento Horizontal de Réplicas](#7-escalonamento-horizontal-de-réplicas)
  - [8. Atualização Contínua sem Downtime (Rolling Update)](#8-atualização-contínua-sem-downtime-rolling-update)
  - [9. Encerrar o Stack](#9-encerrar-o-stack)
- [Endpoints de Integridade e Diagnóstico](#-endpoints-de-integridade-e-diagnóstico)
- [Solução de Problemas](#-solução-de-problemas)

---

## 🌟 Visão Geral

O **MeteoPulse Pro EMA** oferece uma plataforma completa para meteorologistas, operadores de campo e pesquisadores:

* **Telemetria ao Vivo**: Leitura contínua de temperatura, umidade relativa, ponto de orvalho, sensação térmica, pressão atmosférica, velocidade e rajadas de vento com rosa dos ventos vetorial, índice UV e precipitação pluviométrica.
* **Série Climatológica Contínua (`dados_historicos`)**: Consolidação mensal e anual com recálculo automático diretamente a partir dos registros brutos da estação, permitindo consultas instantâneas e sem dependência de arquivos em disco.
* **Previsão Numérica do Tempo Multi-Provedor**: Integração nativa com a **Google Maps Platform Weather API** (MetNet AI) e fallback automático de alta resolução via **Open-Meteo** (ECMWF/GFS).
* **Alertas Oficiais em Tempo Real**: Monitoramento de avisos meteorológicos da Defesa Civil e INMET para o estado de São Paulo e território nacional.
* **Controle de Acesso Baseado em Funções (RBAC)**: Autenticação via JWT com níveis de permissão (`ADMIN`, `OPERATOR`, `VIEWER`), cadastro de operadores e trilha de auditoria (`usuarios_logs`).
* **Cache Distribuído de Alto Desempenho**: Suporte a Redis com expurgo automático orientado a eventos (invalidação em tempo real a cada novo pulso da estação).

---

## 🏗️ Arquitetura do Sistema

* **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, animações via Motion.
* **Backend**: Node.js 20, Express REST API empacotado em bundle CommonJS auto-suficiente via `esbuild`.
* **Banco de Dados & ORM**: MariaDB / MySQL acessado via Prisma ORM 5.22.
  * Banco de Telemetria: Configurado via `.env` (tabelas de leituras como `EMA_1_2026`).
  * Banco de Gestão: `usuarios` (tabelas `usuarios`, `usuarios_logs` e `dados_historicos`).
* **Camada de Cache**: Redis 7 com persistência AOF/RDB e fallback transparente em memória.
* **Containerização**: Multi-stage build com `node:20-alpine`, usuário seguro não-root (`USER node`) e healthchecks nativos.

---

## 📁 Estrutura de Arquivos

```text
├── Dockerfile                  # Multi-stage build para imagem de produção enxuta
├── .dockerignore               # Filtros de exclusão para o contexto do Docker
├── docker-compose.yml          # Ambiente para desenvolvimento e testes locais
├── docker-stack.yml            # Manifesto de produção para orquestração em Docker Swarm
├── .env                        # Arquivo de configuração de ambiente ativo
├── .env.example                # Documentação e template de todas as variáveis
├── package.json                # Dependências e scripts de build
├── server.ts                   # Ponto de entrada do backend Express
├── prisma/
│   └── schema.prisma           # Esquema Prisma para modelagem das leituras EMA
├── server/                     # Controladores, rotas e serviços backend
│   ├── db.ts                   # Conexão e pooling de conexões MariaDB/MySQL
│   ├── userService.ts          # Autenticação, RBAC e trilha de auditoria
│   ├── historicalService.ts   # Gestão e recálculo da tabela dados_historicos
│   ├── weatherApi.ts           # Integração com Google Weather e Open-Meteo
│   └── inmetAlertsApi.ts       # Integração com alertas INMET
└── src/                        # Código-fonte da interface de usuário React
```

---

## ⚙️ Variáveis de Ambiente (.env)

O arquivo `/.env` é a **fonte única da verdade** da aplicação. Configure os seguintes parâmetros antes de subir o sistema:

| Variável | Descrição | Exemplo / Padrão |
|---|---|---|
| `APP_VERSION` | Versão da imagem Docker e aplicação | `1.0.0` |
| `DATABASE_URL` | String de conexão MySQL/MariaDB | `mysql://usuario:senha@localhost:3306/nome_do_banco?connect_timeout=20` |
| `DB_HOST` | Host do banco de dados | `localhost` (ou nome do container `mariadb`) |
| `DB_PORT` | Porta de conexão do banco | `3306` |
| `DB_USER` | Usuário de autenticação | `usuario` |
| `DB_PASSWORD` | Senha de autenticação | `sua_senha_segura` |
| `DB_NAME` | Nome do banco da estação EMA | `nome_do_banco` |
| `DB_TABLE_READINGS` | Tabela das leituras de telemetria | `EMA_1_2026` |
| `DB_SSL` | Conexão segura SSL | `false` |
| `DB_USERS_NAME` | Banco de autenticação e histórico | `usuarios` |
| `DB_TABLE_USERS` | Tabela de operadores e usuários | `usuarios` |
| `DB_TABLE_USERS_LOGS` | Tabela de trilha de auditoria | `usuarios_logs` |
| `DB_TABLE_HISTORICAL` | Tabela de consolidação histórica | `dados_historicos` |
| `WEATHER_API_PROVIDER`| Provedor de previsão padrão | `open-meteo` (ou `google`) |
| `WEATHER_API_KEY` | Chave da Google Weather API (se provider=google) | `SUA_CHAVE_API_GOOGLE` |
| `WEATHER_API_URL` | Endpoint da Google Weather API | `https://weather.googleapis.com/v1/forecast/days:lookup` |
| `OPEN_METEO_API_URL` | Endpoint da Open-Meteo API | `https://api.open-meteo.com/v1/forecast` |
| `WEATHER_CACHE_TTL_SECONDS` | Tempo de cache da previsão | `3600` (1 hora) |
| `STATION_NAME` | Identificação formal da estação | `Estação Meteorológica Automática — EMA Agudos` |
| `STATION_CODE` | Código WMO / INMET | `#BR-EMA01 • INMET / WMO` |
| `STATION_LATITUDE` | Latitude decimal | `-22.467009` |
| `STATION_LONGITUDE` | Longitude decimal | `-48.973334` |
| `STATION_ALTITUDE` | Altitude da estação em metros | `618` |
| `INMET_ALERTS_API_URL`| Endpoint de alertas meteorológicos | `https://radarmeteorologico.com.br/api/v1/alertas` |
| `INMET_ALERTS_UF` | UF padrão para alertas | `SP` |
| `INMET_ALERTS_CACHE_TTL` | Tempo de cache dos alertas | `600` (10 minutos) |
| `JWT_SECRET` | Chave de assinatura dos tokens JWT | `sua-chave-secreta-jwt-aqui` |
| `REDIS_HOST` | Host do serviço Redis | `redis` (em container) ou `127.0.0.1` |
| `REDIS_PORT` | Porta de escuta do Redis | `6379` |
| `REDIS_URL` | URL de conexão Redis | `redis://redis:6379` |

---

## 🚀 Execução Rápida com Docker Compose

Para testar ou validar localmente em um único nó antes de ativar o cluster Swarm:

```bash
# 1. Clone ou acesse o diretório do projeto
cd /caminho/do/projeto

# 2. Certifique-se de que o arquivo .env está preenchido
cp .env.example .env

# 3. Construa e suba os containers em segundo plano
docker compose up -d --build

# 4. Acompanhe os logs da aplicação
docker compose logs -f app

# 5. Acesse no navegador
# http://localhost:3000
```

---

## 🐳 Implantação em Produção com Docker Swarm

O **Docker Swarm** permite executar a aplicação em modo cluster com tolerância a falhas, balanceamento de carga automático via *routing mesh* (rede overlay), reinício automático de containers e atualizações com zero downtime.

### 1. Inicializar o Cluster Swarm

Se o nó principal ainda não estiver em modo Swarm, execute:

```bash
# Se o servidor possuir mais de uma interface de rede, especifique o IP da interface externa:
docker swarm init --advertise-addr <SEU_IP_DO_SERVIDOR>

# Ou caso seja um nó único:
docker swarm init
```

Para verificar se o Swarm está ativo:
```bash
docker info | grep Swarm
```

---

### 2. Construir a Imagem Docker

Compile a imagem de produção contendo os artefatos otimizados:

```bash
docker build -t ederbatera/ema:1.0.0 .
```

---

### 3. Publicar no Docker Hub / Registry

Envie a imagem construída para o Docker Hub:

```bash
docker push ederbatera/ema:1.0.0
```

---

### 4. Realizar o Deploy do Stack

Com o arquivo `docker-stack.yml` configurado (verifique as credenciais do MariaDB e a rede externa `traefik_public`):

```bash
docker stack deploy -c docker-stack.yml ema
```

O comando criará/atualizará:
* O serviço principal `ema_ema_app` (2 réplicas balanceadas na porta externa 9062 -> 3000).
* A conexão com a rede overlay `traefik_public`.
* O volume persistente de dados `ema_ema_data`.

---

### 5. Verificar o Status dos Serviços

Confira se todos os serviços estão em execução e saudáveis:

```bash
# Lista os serviços da stack
docker stack services ema

# Lista as réplicas ativas e os nós onde estão rodando
docker service ps ema_ema_app
```

A saída esperada deve mostrar `2/2` réplicas em execução (`Running`) e saudáveis.

---

### 6. Monitorar Logs em Tempo Real

Para inspecionar as mensagens de telemetria, conexões com o MariaDB e requisições:

```bash
# Acompanhar logs agregados de todas as réplicas do app:
docker service logs -f ema_ema_app
```

---

### 7. Escalonamento Horizontal de Réplicas

Aumente ou reduza dinamicamente o número de réplicas sem interrupção de serviço:

```bash
# Aumentar para 4 instâncias em alta disponibilidade:
docker service scale ema_ema_app=4

# Reduzir novamente para 2 instâncias:
docker service scale ema_ema_app=2
```

---

### 8. Atualização de Novas Versões (Passo a Passo)

Para o guia detalhado, consulte também o arquivo **[UPDATE.md](./UPDATE.md)**.

Sempre que realizar melhorias no código e precisar publicar uma nova versão:

```bash
# 1. Acessar o diretório do projeto no servidor
cd /home/eder/sites/ema_ai

# 2. Atualizar o repositório com o código mais recente
git pull

# 3. Gerar a nova imagem com a versão desejada (ex: 1.0.2)
docker build -t ederbatera/ema:1.0.2 .

# 4. Enviar a imagem para o Docker Hub
docker push ederbatera/ema:1.0.2

# 5. Atualizar apenas a variável no arquivo .env:
# Altere para a versão correspondente:
# APP_VERSION=1.0.2
# VITE_APP_VERSION=1.0.2

# 6. Reaplicar a stack no Docker Swarm:
docker stack deploy -c docker-stack.yml ema
# A stack puxará ederbatera/ema:1.0.2 e exibirá v1.0.2 automaticamente no rodapé da página!
```

> **Atualização Direta alternativa**: Se preferir atualizar o serviço imediatamente via CLI:
> ```bash
> docker service update --image ederbatera/ema:1.0.2 --env-add APP_VERSION=1.0.2 ema_ema_app
> ```

O Docker Swarm aplicará a política configurada no `docker-stack.yml`:
* Atualiza **1 container por vez** (`parallelism: 1`).
* Aguarda 10 segundos entre cada atualização (`delay: 10s`).
* Inicia o novo container primeiro e aguarda o healthcheck aprovar antes de desligar o antigo (`order: start-first`).
* Caso a nova versão apresente falha no healthcheck, o Swarm reverte automaticamente para a versão estável anterior (`failure_action: rollback`).

---

### 9. Encerrar o Stack

Para remover todos os serviços e containers do stack:

```bash
docker stack rm ema
```

*(Os dados persistentes nos volumes `redis_data` e `app_data` serão preservados).*

---

## 🔍 Endpoints de Integridade e Diagnóstico

O sistema expõe rotas HTTP dedicadas para checagens de saúde e testes de diagnóstico:

* `GET /api/health`  
  Retorna `{"status": "ok"}` com timestamp e versão dos módulos para o Healthcheck do Docker.
* `GET /api/config`  
  Retorna o estado sanitizado de todas as conexões e variáveis de ambiente ativas.
* `POST /api/config/test-db`  
  Dispara uma consulta de heartbeat diretamente no MariaDB/MySQL para testar latência e conectividade.
* `POST /api/config/test-weather`  
  Testa a conexão e resposta da API de previsão meteorológica configurada.
* `POST /api/config/test-alerts`  
  Testa a consulta de avisos meteorológicos ativos junto ao INMET.
* `GET /api/config/api-monitor`  
  Exibe métricas de latência, taxa de erro e auditoria de chamadas das APIs externas.

---

## 🛠️ Solução de Problemas

### 1. "Não foi possível conectar ao banco de dados MariaDB (Porta 3306)"
* Verifique se o servidor de banco de dados permite conexões a partir do IP ou rede overlay onde o Swarm está rodando.
* No servidor MySQL/MariaDB, certifique-se de que o usuário possui privilégios de acesso:  
  `GRANT ALL PRIVILEGES ON nome_do_banco.* TO 'usuario'@'%' IDENTIFIED BY 'sua_senha';`  
  `FLUSH PRIVILEGES;`
* Teste a rota `/api/config/test-db` pelo painel de gerenciamento para ver a mensagem de erro detalhada.

### 2. "A porta já está em uso"
* Caso já exista outro serviço rodando na porta 9062, altere a porta publicada no `docker-stack.yml` na seção `ports`:
  ```yaml
  ports:
    - 9063:3000
  ```

### 3. "Containers ficam em estado de reinício contínuo"
* Verifique os logs de erro com:
  ```bash
  docker service logs --tail 50 ema_ema_app
  ```
* Garanta que o arquivo `.env` contenha um valor válido para `JWT_SECRET` e `DATABASE_URL`.

---

## 📄 Licença & Créditos

Desenvolvido para monitoramento meteorológico de precisão da **Estação Meteorológica Automática — EMA Agudos**.  
Padronização de dados segundo normas técnicas da **OMM (Organização Meteorológica Mundial)** e **INMET**.
