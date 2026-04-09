import { z } from 'zod'

// Auth
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  sobrenome: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número'),
  empresa: z.string().min(2, 'Nome da empresa é obrigatório'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

// Product
export const productSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  sku: z.string().min(1, 'SKU é obrigatório'),
  categoria_id: z.string().optional(),
  unidade_medida: z.enum(['unidade', 'm²', 'dúzia', 'cento', 'kg', 'm³', 'pç']),
  preco_custo: z.coerce.number().min(0, 'Preço de custo não pode ser negativo'),
  preco_venda: z.coerce.number().min(0, 'Preço de venda não pode ser negativo'),
  estoque_minimo: z.coerce.number().min(0).default(0),
  status: z.enum(['ativo', 'inativo']).default('ativo'),
})

// Stock movement
export const stockMovementSchema = z.object({
  produto_id: z.string().uuid(),
  tipo: z.enum(['entrada', 'saida']),
  quantidade: z.coerce.number().min(1, 'Quantidade deve ser maior que 0'),
  motivo: z.string().optional(),
})

// Sale
export const saleItemSchema = z.object({
  produto_id: z.string().uuid(),
  quantidade: z.coerce.number().min(1, 'Quantidade deve ser maior que 0'),
  preco_unitario: z.coerce.number().min(0),
  desconto: z.coerce.number().min(0).max(100).default(0),
})

export const saleSchema = z.object({
  observacoes: z.string().optional(),
  itens: z.array(saleItemSchema).min(1, 'Adicione pelo menos um produto'),
})

// Profile
export const profileSchema = z.object({
  nome: z.string().min(2),
  sobrenome: z.string().min(2),
})

// Company settings
export const companySchema = z.object({
  nome: z.string().min(2),
  limite_estoque_critico: z.coerce.number().min(0).default(5),
  moeda: z.string().default('BRL'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ProductFormData = z.infer<typeof productSchema>
export type StockMovementFormData = z.infer<typeof stockMovementSchema>
export type SaleFormData = z.infer<typeof saleSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type CompanyFormData = z.infer<typeof companySchema>
