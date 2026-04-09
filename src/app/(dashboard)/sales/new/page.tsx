'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, calcMargin } from '@/lib/utils'
import { Plus, Trash2, ShoppingCart, Search } from 'lucide-react'
import Link from 'next/link'
import type { Product } from '@/types'

interface CartItem {
  product: Product
  quantidade: number
  desconto: number
}

export default function NewSalePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProducts() {
      const supabase = createClient()
      const { data } = await supabase.from('products').select('*, stock(quantidade)').eq('status', 'ativo').order('nome')
      setProducts((data ?? []).map((p: any) => ({ ...p, quantidade_estoque: p.stock?.[0]?.quantidade ?? 0 })))
    }
    loadProducts()
  }, [])

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return p.nome.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  }).filter(p => !cart.find(c => c.product.id === p.id))

  function addToCart(product: Product) {
    setCart(prev => [...prev, { product, quantidade: 1, desconto: 0 }])
    setSearch('')
  }

  function updateItem(idx: number, field: 'quantidade' | 'desconto', value: number) {
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  function removeItem(idx: number) {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  // Totals
  const subtotal = cart.reduce((s, item) => {
    const disc = (item.product.preco_venda * item.quantidade) * (item.desconto / 100)
    return s + item.product.preco_venda * item.quantidade - disc
  }, 0)
  const totalCost = cart.reduce((s, item) => s + item.product.preco_custo * item.quantidade, 0)
  const totalProfit = subtotal - totalCost
  const margin = subtotal > 0 ? (totalProfit / subtotal) * 100 : 0

  async function confirmSale() {
    if (cart.length === 0) { setError('Adicione pelo menos um produto'); return }
    setSaving(true); setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: sale, error: saleError } = await supabase.from('sales').insert({
      vendedor_id: user.id,
      data_venda: new Date().toISOString(),
      total_venda: subtotal,
      total_custo: totalCost,
      lucro_gerado: totalProfit,
      margem: margin,
      observacoes,
      status: 'concluida',
    }).select('id').single()

    if (saleError || !sale) { setError(saleError?.message ?? 'Erro ao registrar venda'); setSaving(false); return }

    // Insert items
    const items = cart.map(item => {
      const disc = (item.product.preco_venda * item.quantidade) * (item.desconto / 100)
      const sub = item.product.preco_venda * item.quantidade - disc
      const lucro = sub - item.product.preco_custo * item.quantidade
      return {
        venda_id: sale.id,
        produto_id: item.product.id,
        quantidade: item.quantidade,
        preco_unitario: item.product.preco_venda,
        preco_custo_unitario: item.product.preco_custo,
        desconto: item.desconto,
        subtotal: sub,
        lucro_item: lucro,
      }
    })
    await supabase.from('sale_items').insert(items)

    // Decrease stock
    for (const item of cart) {
      const currentStock = item.product.quantidade_estoque ?? 0
      const newStock = Math.max(0, currentStock - item.quantidade)
      await supabase.from('stock').update({ quantidade: newStock, ultima_movimentacao: new Date().toISOString() }).eq('produto_id', item.product.id)
      await supabase.from('stock_movements').insert({
        produto_id: item.product.id,
        tipo: 'saida',
        quantidade: item.quantidade,
        motivo: `Venda #${sale.id.slice(0, 8)}`,
        responsavel_id: user.id,
      })
    }

    router.push('/sales')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', alignItems: 'start', maxWidth: '1100px' }}>
      {/* Product selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '1rem' }}>Selecionar Produtos</h3>

          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto por nome ou SKU..." className="input-base" style={{ paddingLeft: '2.5rem' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
            {filtered.slice(0, 20).map(p => (
              <button key={p.id} onClick={() => addToCart(p)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(15,23,42,0.5)', borderRadius: '0.75rem', border: '1px solid #1E293B', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s' }}>
                <div>
                  <p style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.875rem' }}>{p.nome}</p>
                  <p style={{ color: '#64748B', fontSize: '0.75rem' }}>{p.sku} · Estoque: {p.quantidade_estoque}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                  <p style={{ color: '#34D399', fontWeight: 700, fontSize: '0.875rem' }}>{formatCurrency(p.preco_venda)}</p>
                  <Plus size={14} color="#6366F1" style={{ marginLeft: 'auto' }} />
                </div>
              </button>
            ))}
            {search && filtered.length === 0 && <p style={{ color: '#64748B', textAlign: 'center', padding: '1rem', fontSize: '0.875rem' }}>Nenhum produto encontrado</p>}
          </div>
        </div>

        {/* Cart items */}
        {cart.length > 0 && (
          <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '1rem' }}>Itens no Carrinho</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cart.map((item, idx) => (
                <div key={item.product.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px auto', gap: '0.75rem', alignItems: 'center', padding: '0.875rem', background: 'rgba(15,23,42,0.5)', borderRadius: '0.75rem', border: '1px solid #1E293B' }}>
                  <div>
                    <p style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.875rem' }}>{item.product.nome}</p>
                    <p style={{ color: '#64748B', fontSize: '0.72rem' }}>{formatCurrency(item.product.preco_venda)} / {item.product.unidade_medida}</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748B', marginBottom: '0.2rem' }}>Qtd.</label>
                    <input type="number" min="1" value={item.quantidade} onChange={e => updateItem(idx, 'quantidade', Number(e.target.value))} className="input-base" style={{ padding: '0.375rem 0.5rem', fontSize: '0.875rem', textAlign: 'center' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', color: '#64748B', marginBottom: '0.2rem' }}>Desc. %</label>
                    <input type="number" min="0" max="100" value={item.desconto} onChange={e => updateItem(idx, 'desconto', Number(e.target.value))} className="input-base" style={{ padding: '0.375rem 0.5rem', fontSize: '0.875rem', textAlign: 'center' }} />
                  </div>
                  <button onClick={() => removeItem(idx)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.5rem', color: '#FCA5A5', cursor: 'pointer', padding: '0.375rem', display: 'flex' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '80px' }}>
        <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '1.25rem' }}>Resumo da Venda</h3>

          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.75rem', marginBottom: '1rem', color: '#FCA5A5', fontSize: '0.8rem' }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Subtotal', value: formatCurrency(subtotal) },
              { label: 'Custo total', value: formatCurrency(totalCost), sub: true },
              { label: 'Lucro bruto', value: `+${formatCurrency(totalProfit)}`, color: '#34D399' },
              { label: 'Margem', value: `${margin.toFixed(1)}%`, color: margin >= 20 ? '#34D399' : margin >= 10 ? '#FCD34D' : '#FCA5A5' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < 3 ? '1px solid #1E293B' : 'none' }}>
                <span style={{ fontSize: '0.8rem', color: r.sub ? '#64748B' : '#94A3B8' }}>{r.label}</span>
                <span style={{ fontSize: r.label === 'Subtotal' ? '1.1rem' : '0.875rem', fontWeight: 700, color: r.color ?? '#F1F5F9' }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Observações</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} placeholder="Observações da venda..." className="input-base" style={{ resize: 'none' }} />
          </div>

          <button onClick={confirmSale} disabled={saving || cart.length === 0} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '0.95rem' }}>
            <ShoppingCart size={17} />
            {saving ? 'Confirmando...' : `Confirmar venda · ${formatCurrency(subtotal)}`}
          </button>
        </div>

        <Link href="/sales" className="btn-secondary" style={{ justifyContent: 'center' }}>Cancelar</Link>
      </div>
    </div>
  )
}
