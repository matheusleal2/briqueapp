-- ============================================================
-- BRIQUE SAAS - DATABASE MIGRATION
-- Run this in Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- 1. COMPANIES (run first - other tables depend on it)
CREATE TABLE IF NOT EXISTS public.companies (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome            TEXT NOT NULL,
  logo            TEXT,
  moeda           TEXT DEFAULT 'BRL',
  limite_estoque_critico INTEGER DEFAULT 5,
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  empresa_id      UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  nome            TEXT NOT NULL DEFAULT '',
  sobrenome       TEXT NOT NULL DEFAULT '',
  foto_perfil     TEXT,
  role            TEXT DEFAULT 'vendedor' CHECK (role IN ('admin', 'gerente', 'vendedor')),
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id      UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  descricao       TEXT,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id      UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  descricao       TEXT,
  sku             TEXT NOT NULL,
  categoria_id    UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  foto_principal  TEXT,
  preco_custo     NUMERIC(12,2) DEFAULT 0 CHECK (preco_custo >= 0),
  preco_venda     NUMERIC(12,2) DEFAULT 0 CHECK (preco_venda >= 0),
  margem_lucro    NUMERIC(6,2) DEFAULT 0,
  unidade_medida  TEXT DEFAULT 'unidade',
  estoque_minimo  INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, sku)
);

-- 5. PRODUCT PHOTOS
CREATE TABLE IF NOT EXISTS public.product_photos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id      UUID REFERENCES public.products(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STOCK (one row per product)
CREATE TABLE IF NOT EXISTS public.stock (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id            UUID REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
  quantidade            INTEGER DEFAULT 0,
  ultima_movimentacao   TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STOCK MOVEMENTS (audit log)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id      UUID REFERENCES public.products(id) ON DELETE CASCADE,
  tipo            TEXT CHECK (tipo IN ('entrada', 'saida')),
  quantidade      INTEGER NOT NULL,
  motivo          TEXT,
  responsavel_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SALES
CREATE TABLE IF NOT EXISTS public.sales (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id      UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  vendedor_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_venda      TIMESTAMPTZ DEFAULT NOW(),
  total_venda     NUMERIC(12,2) DEFAULT 0,
  total_custo     NUMERIC(12,2) DEFAULT 0,
  lucro_gerado    NUMERIC(12,2) DEFAULT 0,
  margem          NUMERIC(6,2) DEFAULT 0,
  observacoes     TEXT,
  status          TEXT DEFAULT 'concluida' CHECK (status IN ('concluida', 'cancelada')),
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SALE ITEMS
CREATE TABLE IF NOT EXISTS public.sale_items (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id              UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  produto_id            UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantidade            INTEGER NOT NULL,
  preco_unitario        NUMERIC(12,2) NOT NULL,
  preco_custo_unitario  NUMERIC(12,2) NOT NULL,
  desconto              NUMERIC(5,2) DEFAULT 0,
  subtotal              NUMERIC(12,2) NOT NULL,
  lucro_item            NUMERIC(12,2) NOT NULL
);

-- 10. PRICE HISTORY
CREATE TABLE IF NOT EXISTS public.price_history (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id            UUID REFERENCES public.products(id) ON DELETE CASCADE,
  preco_custo_anterior  NUMERIC(12,2),
  preco_custo_novo      NUMERIC(12,2),
  preco_venda_anterior  NUMERIC(12,2),
  preco_venda_novo      NUMERIC(12,2),
  alterado_por          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em             TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES (performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_empresa ON public.products(empresa_id);
CREATE INDEX IF NOT EXISTS idx_stock_produto ON public.stock(produto_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_produto ON public.stock_movements(produto_id);
CREATE INDEX IF NOT EXISTS idx_sales_empresa ON public.sales(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sales_data ON public.sales(data_venda DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_venda ON public.sale_items(venda_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_photos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history    ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's empresa_id
CREATE OR REPLACE FUNCTION public.get_my_empresa_id()
RETURNS UUID AS $$
  SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Profiles: users can read/update their own
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (id = auth.uid());

-- Companies: users can access their company
CREATE POLICY "companies_member" ON public.companies FOR ALL USING (id = public.get_my_empresa_id());

-- Categories: scoped to company
CREATE POLICY "categories_company" ON public.categories FOR ALL USING (empresa_id = public.get_my_empresa_id());

-- Products: scoped to company
CREATE POLICY "products_company" ON public.products FOR ALL USING (empresa_id = public.get_my_empresa_id());

-- Product photos: via product
CREATE POLICY "photos_company" ON public.product_photos FOR ALL USING (
  produto_id IN (SELECT id FROM public.products WHERE empresa_id = public.get_my_empresa_id())
);

-- Stock: via product
CREATE POLICY "stock_company" ON public.stock FOR ALL USING (
  produto_id IN (SELECT id FROM public.products WHERE empresa_id = public.get_my_empresa_id())
);

-- Stock movements: via product
CREATE POLICY "stock_movements_company" ON public.stock_movements FOR ALL USING (
  produto_id IN (SELECT id FROM public.products WHERE empresa_id = public.get_my_empresa_id())
);

-- Sales: scoped to company
CREATE POLICY "sales_company" ON public.sales FOR ALL USING (empresa_id = public.get_my_empresa_id());

-- Sale items: via sale
CREATE POLICY "sale_items_company" ON public.sale_items FOR ALL USING (
  venda_id IN (SELECT id FROM public.sales WHERE empresa_id = public.get_my_empresa_id())
);

-- Price history: via product
CREATE POLICY "price_history_company" ON public.price_history FOR ALL USING (
  produto_id IN (SELECT id FROM public.products WHERE empresa_id = public.get_my_empresa_id())
);

-- ============================================================
-- TRIGGER: auto-create profile + company on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_company_id UUID;
  empresa_name TEXT;
BEGIN
  -- Get empresa name from user metadata
  empresa_name := COALESCE(NEW.raw_user_meta_data->>'empresa', 'Minha Empresa');

  -- Create company
  INSERT INTO public.companies (nome)
  VALUES (empresa_name)
  RETURNING id INTO new_company_id;

  -- Create profile
  INSERT INTO public.profiles (id, empresa_id, nome, sobrenome, role)
  VALUES (
    NEW.id,
    new_company_id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'sobrenome', ''),
    'admin'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE BUCKET (run separately if not using SQL)
-- ============================================================
-- In Supabase Dashboard > Storage > New Bucket:
-- Name: product-photos
-- Public: YES
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload
CREATE POLICY "upload_photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-photos' AND auth.role() = 'authenticated');

CREATE POLICY "read_photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-photos');
