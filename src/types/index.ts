export type UserRole = 'admin' | 'gerente' | 'vendedor'
export type ProductStatus = 'ativo' | 'inativo'
export type StockMovementType = 'entrada' | 'saida'
export type UnitMeasure = 'unidade' | 'm²' | 'dúzia' | 'cento' | 'kg' | 'm³' | 'pç'

export interface Company {
  id: string
  nome: string
  logo?: string
  moeda: string
  limite_estoque_critico: number
  criado_em: string
  atualizado_em: string
}

export interface Profile {
  id: string
  empresa_id: string
  nome: string
  sobrenome: string
  email: string
  foto_perfil?: string
  role: UserRole
  criado_em: string
  atualizado_em: string
}

export interface Category {
  id: string
  empresa_id: string
  nome: string
  descricao?: string
  criado_em: string
}

export interface Product {
  id: string
  empresa_id: string
  nome: string
  descricao?: string
  sku: string
  categoria_id?: string
  categoria?: Category
  foto_principal?: string
  preco_custo: number
  preco_venda: number
  margem_lucro: number
  unidade_medida: UnitMeasure
  estoque_minimo: number
  status: ProductStatus
  criado_em: string
  atualizado_em: string
  // Joined from stock table
  quantidade_estoque?: number
  valor_total_custo?: number
  valor_total_venda?: number
}

export interface ProductPhoto {
  id: string
  produto_id: string
  url: string
  criado_em: string
}

export interface Stock {
  id: string
  produto_id: string
  quantidade: number
  ultima_movimentacao: string
}

export interface StockMovement {
  id: string
  produto_id: string
  produto?: Product
  tipo: StockMovementType
  quantidade: number
  motivo?: string
  responsavel_id: string
  responsavel?: Profile
  criado_em: string
}

export interface Sale {
  id: string
  empresa_id: string
  vendedor_id: string
  vendedor?: Profile
  data_venda: string
  total_venda: number
  total_custo: number
  lucro_gerado: number
  margem: number
  observacoes?: string
  status: 'concluida' | 'cancelada'
  criado_em: string
  itens?: SaleItem[]
}

export interface SaleItem {
  id: string
  venda_id: string
  produto_id: string
  produto?: Product
  quantidade: number
  preco_unitario: number
  preco_custo_unitario: number
  desconto: number
  subtotal: number
  lucro_item: number
}

export interface PriceHistory {
  id: string
  produto_id: string
  preco_custo_anterior: number
  preco_custo_novo: number
  preco_venda_anterior: number
  preco_venda_novo: number
  alterado_por: string
  alterado_por_profile?: Profile
  criado_em: string
}

export interface DashboardStats {
  total_vendas: number
  total_lucro: number
  margem_media: number
  quantidade_transacoes: number
  valor_estoque_custo: number
  valor_estoque_venda: number
  produto_mais_vendido?: { nome: string; quantidade: number }
  produto_mais_lucrativo?: { nome: string; lucro: number }
}

export interface ChartDataPoint {
  date: string
  vendas: number
  lucro: number
}
