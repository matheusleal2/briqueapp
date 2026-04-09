# Brique — Gestão de Estoque e Vendas 🧱

Sistema SaaS completo para distribuidores de tijolos, blocos de concreto e materiais de construção.

## 🚀 Funcionalidades

- **Autenticação** — Login, cadastro, recuperação de senha via Supabase Auth
- **Produtos** — Cadastro com fotos, SKU, preços e cálculo automático de margem
- **Estoque** — Controle de entradas/saídas com histórico de movimentações
- **Vendas** — Carrinho dinâmico com desconto por item e cálculo de lucro em tempo real
- **Dashboard** — KPIs, gráficos de vendas e lucro dos últimos 14 dias
- **Relatórios** — Análise por período (7d/30d/90d/1ano), gráficos, categorias, exportação CSV
- **Histórico de Lucro** — Agrupamento por dia, semana ou mês com tabela detalhada
- **Configurações** — Perfil do usuário e dados da empresa

## ⚡ Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Banco de Dados | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| CSS | Tailwind CSS + CSS custom |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |

## 🔧 Setup

### 1. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Acesse **SQL Editor** e execute o arquivo `supabase-migration.sql`
3. O trigger automático cria empresa e perfil para cada novo usuário

### 2. Variáveis de Ambiente

Edite o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

Encontre esses valores em: **Supabase Dashboard → Settings → API**

### 3. Instalar e Rodar

```bash
npm install
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura

```
src/
  app/
    (auth)/          ← Login, Cadastro, Esqueci Senha
    (dashboard)/     ← Dashboard, Produtos, Estoque, Vendas, Relatórios, Configurações
  components/
    layout/          ← Sidebar (desktop + mobile), Header
    products/        ← ProductFormPage (create/edit)
  lib/
    supabase/        ← client.ts, server.ts
    utils.ts         ← formatadores, calcMargin
    validations.ts   ← Zod schemas
  types/
    index.ts         ← Interfaces TypeScript
  middleware.ts      ← Proteção de rotas
```

## 🗄️ Banco de Dados

10 tabelas: `companies`, `profiles`, `categories`, `products`, `product_photos`, `stock`, `stock_movements`, `sales`, `sale_items`, `price_history`

Todas com **Row Level Security** — dados isolados por empresa.
