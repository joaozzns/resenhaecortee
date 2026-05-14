# Resenha e Corte

Site institucional + sistema de agendamento online para a barbearia **Resenha e Corte** — Itabira, MG (Rua Esmeralda, 511).

> **Status:** v1 completa — site institucional, autenticação, sistema de agendamento (com anti double-booking), área do cliente e painel admin. Pronto para deploy.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (config CSS-first via `@theme`) + **shadcn/ui** (primitivos sob demanda) + **Framer Motion**
- **Supabase** (Postgres + Auth + Storage) com Row Level Security
- **React Hook Form** + **Zod** para formulários
- **date-fns** + **react-day-picker** para datas
- **lucide-react** (ícones) · **sonner** (toasts)
- **Resend** (opcional) para e-mails transacionais

## Pré-requisitos

- Node.js 20+ (testado com 25)
- npm 10+
- Conta Supabase (a partir da Fase 2)
- Conta Vercel (para deploy)

## Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.local.example .env.local
# (preencha .env.local com os valores do seu Supabase a partir da Fase 2)

# 3. Subir o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health) — retorna o status do app e quais variáveis de ambiente estão configuradas.

## Variáveis de ambiente

Veja [`.env.local.example`](./.env.local.example). Resumo:

| Variável | Quando preencher | Visibilidade |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Sempre | Público |
| `NEXT_PUBLIC_SUPABASE_URL` | Fase 2 | Público |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Fase 2 | Público |
| `SUPABASE_SERVICE_ROLE_KEY` | Fase 2 | **Server-only** |
| `RESEND_API_KEY` | Opcional | Server-only |
| `NEXT_PUBLIC_LOYALTY_ENABLED` | Fase 6 | Público |

## Estrutura

```
src/
  app/
    (marketing)/      # Home, /servicos, /equipe, /contato
    (auth)/           # /entrar, /cadastrar, /recuperar-senha
    agendar/          # Fluxo de agendamento (4 passos)
    minha-conta/      # Área do cliente (protegida)
    admin/            # Painel admin (protegida por role)
    api/
      health/         # GET /api/health
  components/
    ui/               # Primitivos (Button, etc.)
    marketing/        # Hero, ServiceCard, Footer, ...
    booking/          # Stepper, TimeSlotPicker, ...
    account/          # Sidebar, AppointmentCard, ...
    auth/             # AuthForm, UserMenu, ProtectedRoute
    admin/            # AdminCalendar, dashboards, ...
  lib/
    supabase/         # client.ts, server.ts, middleware.ts
    booking/          # Lógica de disponibilidade
    auth/             # getCurrentUser, requireAuth, requireRole
    loyalty/          # Cálculo de pontos
    utils.ts          # cn(), formatBRL(), formatDuration()
    site.ts           # Constantes da marca
supabase/
  migrations/         # SQL versionado (criado na Fase 2)
scripts/
  seed.ts             # Seed de serviços, barbeiros e horários (Fase 2)
```

## Design system

Tokens definidos em [`src/app/globals.css`](./src/app/globals.css). Não substituir cores sem revisar contraste AA.

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#0E0E0E` | Fundo principal |
| `--surface` | `#161616` | Cards |
| `--surface-2` | `#1C1C1C` | Hovers, áreas alternadas |
| `--foreground` | `#F5F1EA` | Texto principal |
| `--muted` | `#8A8378` | Texto secundário |
| `--accent` | `#C9A36A` | CTAs, detalhes, hover |
| `--accent-hover` | `#B8924F` | Hover do dourado |
| `--border` | `#262626` | Bordas |
| `--success` | `#7BA05B` | Confirmações |
| `--danger` | `#B5482F` | Erros, cancelamentos |

Tipografia: **Playfair Display** (h1/h2) + **Inter** (corpo) — carregadas via `next/font` em [`src/app/layout.tsx`](./src/app/layout.tsx).

## Configurar Supabase

### 1. Criar o projeto

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e crie um novo projeto.
2. Copie de **Project Settings → API**:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` *(server-only — nunca expor!)*
3. Cole em `.env.local`.

### 2. Aplicar o schema (uma vez)

Abra o **SQL Editor** do Supabase ([atalho](https://supabase.com/dashboard/project/_/sql/new)) e cole o conteúdo de [`supabase/setup.sql`](./supabase/setup.sql). Clique em **Run**.

O arquivo é **idempotente** — pode rodar várias vezes sem quebrar. Ele cria:
- 9 tabelas com seus índices, checks e foreign keys
- Trigger `handle_new_user()` que cria automaticamente um `profile` para todo signup
- Funções `is_admin()` / `is_staff()` (SECURITY DEFINER) para evitar recursão de RLS
- Políticas Row Level Security em todas as 9 tabelas

> **Alternativa via CLI:** se você usa o [Supabase CLI](https://supabase.com/docs/guides/cli):
> ```bash
> supabase login
> supabase link --project-ref <seu-ref>
> supabase db push   # aplica supabase/migrations/*
> ```

### 3. Validar

```bash
npm run supabase:ping
```

Esperado: as 9 tabelas listadas com `0 linha(s)` e `✓ Tudo no lugar.`

### 4. Rodar o seed

```bash
npm run seed
```

Popula 6 serviços (Corte R$ 60, Barba R$ 40, Combo R$ 90, Pezinho R$ 25, Sobrancelha R$ 20, Pigmentação R$ 80), 3 barbeiros (Henrique, Rafael, Léo) e os horários Ter–Sáb. Idempotente: rodar de novo só atualiza valores.

### 5. Definir um usuário admin (depois do primeiro signup)

Após criar sua primeira conta no app (Fase 4), promova ela manualmente:

```sql
update public.profiles set role = 'admin' where id = (
  select id from auth.users where email = 'seu@email.com'
);
```

## Deploy na Vercel

1. **Push para um repositório Git** (GitHub/GitLab/Bitbucket).
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. Em **Environment Variables**, cole todos os valores de [`.env.local`](./.env.local.example):
   - `NEXT_PUBLIC_SITE_URL` → URL final do projeto (ex.: `https://resenhaecorte.com.br`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(server-only)*
   - `BOOKING_MIN_LEAD_HOURS` (padrão `1`)
   - `BOOKING_MAX_LEAD_DAYS` (padrão `60`)
   - `NEXT_PUBLIC_LOYALTY_ENABLED` (`true`/`false`)
   - `RESEND_API_KEY` (opcional)
4. Clique em **Deploy**. O build roda `next build` automaticamente.
5. **Após o primeiro deploy**: vá em [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration) e:
   - **Site URL**: `https://seu-dominio.com`
   - **Redirect URLs**: adicione `https://seu-dominio.com/auth/callback`
6. Para login social do Google: [Supabase → Auth → Providers → Google](https://supabase.com/dashboard/project/_/auth/providers) → ative e configure OAuth Client ID/Secret no [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

## Administração

### Promover usuário a admin

Após o primeiro signup pelo site, promova a conta executando no SQL Editor:

```sql
update public.profiles set role = 'admin'
 where id = (select id from auth.users where email = 'seu@email.com');
```

Logue novamente — o `<UserMenu>` no header passa a mostrar "Painel da equipe" e `/admin` fica acessível.

### Roles disponíveis

| Role | Acesso |
|---|---|
| `client` | Padrão. Vê só os próprios agendamentos. |
| `barber` | Acesso ao painel `/admin`, criar bloqueios, ver clientes/agendamentos. |
| `admin` | Tudo acima + CRUD de serviços/barbeiros, promover/rebaixar roles. |

## Rotas

### Públicas
- `/` — Home
- `/servicos`, `/equipe`, `/contato`
- `/agendar` — fluxo de agendamento (4 passos, deep-link via query params)
- `/agendar/cancelar?token=...` — cancelamento por link de e-mail
- `/entrar`, `/cadastrar`, `/recuperar-senha`
- `/api/health` — diagnóstico
- `/api/availability` — slots livres (GET)
- `/api/appointments` — criar agendamento (POST)
- `/auth/callback` — OAuth + magic link
- `/sitemap.xml`, `/robots.txt`

### Protegidas (`role >= client`)
- `/minha-conta` — overview
- `/minha-conta/agendamentos`, `/perfil`, `/favoritos`, `/fidelidade` (gated)

### Admin (`role >= barber`)
- `/admin` — dashboard
- `/admin/agendamentos`, `/clientes`, `/clientes/[id]`, `/servicos`, `/barbeiros`, `/bloqueios`, `/fidelidade` (gated)

## Scripts úteis

```bash
npm run dev               # Servidor de desenvolvimento
npm run build && npm start  # Build + servidor de produção local
npm run typecheck         # TypeScript --noEmit
npm run lint              # ESLint
npm run seed              # Re-popula serviços/barbeiros/horários
npm run supabase:ping     # Testa conexão e mostra contagens por tabela
```

## Convenções

- Commits semânticos (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)
- Componentes em PascalCase, arquivos de utilitários em kebab-case
- Server Components por padrão; `"use client"` só quando necessário
- Validação **server-side** obrigatória em todos os route handlers
