# Campus Virtual — Front-end

Front-end do **Campus Virtual**, ambiente acadêmico integrado da Universidade Federal de Goiás (UFG) — Instituto de Informática. Aplicação **Next.js (App Router) + TypeScript + Tailwind CSS**, responsiva e acessível, que consome a API REST do back-end (Spring Boot).

Desenvolvido conforme a *Definição Arquitetural do Campus Virtual* e a elicitação de requisitos da equipe **Cavaleiros dos Requisitos**.

## Stack

| Item | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 (tokens de tema via CSS variables) |
| Autenticação | JWT (Bearer) no cabeçalho `Authorization` |
| Comunicação | REST/JSON com a API do back-end |

## Pré-requisitos

- Node.js 20+ e npm
- Back-end do Campus Virtual em execução (por padrão em `http://localhost:8080`).
  Documentação da API (Swagger UI): http://localhost:8080/swagger-ui/index.html

## Configuração

Crie um arquivo `.env.local` a partir do exemplo:

```bash
cp .env.example .env.local
```

| Variável | Descrição | Padrão |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública da API REST do back-end | `http://localhost:8080` |

## Scripts

```bash
npm install        # instala dependências
npm run dev        # ambiente de desenvolvimento (http://localhost:3000)
npm run build      # build de produção
npm run start      # serve o build de produção
npm run lint       # análise estática (ESLint)
```

## Documentação da API consumida

Este front-end **consome o contrato OpenAPI/Swagger** exposto pelo back-end. A
documentação interativa fica em **http://localhost:8080/swagger-ui/index.html**
e o contrato JSON em `/api-docs`. Os tipos TypeScript em
[`src/lib/api/types.ts`](src/lib/api/types.ts) espelham os DTOs do contrato, e
as funções de acesso ficam organizadas por módulo em
[`src/lib/api/endpoints.ts`](src/lib/api/endpoints.ts). Comentários no código
referenciam os requisitos (RF/RNF) e os endpoints correspondentes.

## Estrutura

```
src/
├── app/
│   ├── (auth)/            # login, cadastro, recuperar/redefinir senha
│   ├── (app)/             # área autenticada (layout protegido + shell)
│   │   ├── painel/        # dashboard por papel
│   │   ├── perfil/        # perfil e preferências (RF06/RF08/RF09/RF19)
│   │   ├── disciplinas/   # hub de disciplinas (abas por papel) + notas
│   │   ├── notas/         # notas e frequência do aluno (RF11)
│   │   ├── contestacoes/  # contestações (RF12/RF32)
│   │   ├── provas-substitutivas/
│   │   ├── recomendacoes/ # (RF14)
│   │   ├── mensagens/     # mensagens privadas (RF15/RF27)
│   │   ├── gestao/        # dashboards, alertas, relatórios, apoio, histórico
│   │   ├── usuarios/      # gestão de usuários (RF05/RF33)
│   │   └── auditoria/     # trilha de auditoria (RNF01)
│   ├── globals.css        # design system (temas, contraste, fonte, motion)
│   └── layout.tsx         # provedores globais + skip link
├── components/            # UI acessível, modais, seções de disciplina
├── context/               # Auth, Preferences (tema/fonte/som), Toast
└── lib/
    ├── api/               # cliente REST, tipos, endpoints
    ├── navigation.ts      # navegação por papel
    └── format.ts          # formatação e rótulos pt-BR
```

## Acessibilidade (WCAG 2.1 AA / WAI-ARIA)

Requisitos atendidos no front-end:

- **RF08/RNF14** — ajuste de fonte de 100% a 400% sem quebra de layout.
- **RF09/RNF20** — tema claro/escuro; o tema claro não usa branco puro.
- **RNF12/RNF18** — marcos ARIA, navegação por teclado, foco visível, botões/ícones com rótulo textual.
- **RNF13** — contraste mínimo 4,5:1; status com ícone + texto (não só cor).
- **RNF15** — respeita `prefers-reduced-motion` (sem animações "gatilho").
- **RNF16** — exportação de relatórios em PDF semântico (impressão).
- **RNF19** — mensagens de erro com ícone de alerta + texto descritivo.
- **RNF09** — layout responsivo com paridade desktop/mobile.

## Cobertura de requisitos

Identidade e acesso (RF01–RF09, RF33), disciplinas e matrículas (RF07, RF20),
atividades/provas/notas (RF10, RF21, RF24), frequência (RF11, RF25),
contestações (RF12, RF32, RF34), comunicação (RF15, RF16, RF27), materiais
(RF13, RF22, RF23), provas substitutivas (RF17, RF26), gestão/analytics
(RF28–RF31, RF35) e recomendações (RF14).

> Conforme o escopo da POC, **notificações em tempo real (RF18/RF19/RNF04)**
> não fazem parte desta entrega — apenas a preferência de som é configurável.
