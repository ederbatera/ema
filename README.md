# EMA - Estação Meteorológica de Agudos

**Este projeto está em desenvolvimento**, portanto podendo conter bugs.
**Seja um contribuidor deste projeto**

## Tecnologias utilizadas:
- Backend: [**_NODE.JS_**](https://github.com/nodejs/node).
- Frontend:  [**_React+Vite_**](https://github.com/vitejs/vite-plugin-react).
- Banco de Dados:  [**_MariaDB_**](https://mariadb.org/).
- Hardwares:  [**C**](https://pt.wikipedia.org/wiki/C_(linguagem_de_programa%C3%A7%C3%A3o)) e [**Arduino**](https://www.arduino.cc/).

## Frameworks:
- [**_Redis_**](https://redis.io/)
- [**_tailwindcss_**](https://tailwindcss.com/)
- [**_chadcn_**](https://ui.shadcn.com/)

**NOTA**: Página atual encontra-se disponível em [**_EMA - Estação Meteorológica de Agudos/Sp_**](https://agudos.net).



## Features

- Informações em tempo real sobre as condições do tempo ✅
- Máximas e Mínimas de Temperatura, Umidade, Pressão do dia ✅
- Velocidade, direção e horário da Rajada de vento do dia ✅
- Umidade absoluta do ar, Sensação Térmica e Ponto de Orvalho ✅
- Gráficos de Temperatura, Umidade, Pressão Atmosférica e Chuvas quando ocorrer. ✅
- Relatório de Chuvas do dia, semana e mês ✅
- Consulta dados meteorológicos de outros dias ✅ 🆕
- Consulta Dados históricos > 09/2019 ✅
- Consulta Métricas mensais > 09/2019  ✅
- Consulta Métricas de chuvas mensais > 09/2019 ✅
- Consulta Métricas do ano Atual ✅

## Instalação e Deploy (Linux Debian/Ubuntu - Development)


Instalando as dependências e startando o projeto Node e React.


```bash
cd ../frontend
npm install
npm run build
cd /build
node index.js

```

Acesse à pagina através da url [**http://localhost:5173**](http://localhost:5173).