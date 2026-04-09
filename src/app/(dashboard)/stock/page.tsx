'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '@/lib/utils'
import { Package, Plus, ArrowUp, ArrowDown, History, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { Product, StockMovement } from '@/types'

interface StockProduct extends Product { movimentos?: number }

export default function StockPage() {
  const [products, setProducts] = useState<StockProduct[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [tab, setTab] = useState<'overview' | 'movements'>('overview')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ product: Product; tipo: 'entrada' | 'saida' } | null>(null)
  const [qty, setQty] = useState('')
  const [motivo, setMotivo] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [prodRes, movRes] = await Promise.all([
      supabase.from('products').select('*, categories(nome), stock(quantidade)').eq('status', 'ativo').order('nome'),
      supabase.from('stock_movements').select('*, products(nome, sku), profiles(nome, sobrenome)').order('criado_em', { ascending: false }).limit(50),
    ])
    setProducts((prodRes.data ?? []).map((p: any) => ({ ...p, quantidade_estoque: p.stock?.[0]?.quantidade ?? 0 })))
    setMovements(movRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function registerMovement() {
    if (!modal || !qty) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const qtdNum = Number(qty)
    const isEntry = modal.tipo === 'entrada'

    await supabase.from('stock_movements').insert({
      produto_id: modal.product.id,
      tipo: modal.tipo,
      quantidade: qtdNum,
      motivo,
      responsavel_id: user!.id,
    })

    const currentQty = modal.product.quantidade_estoque ?? 0
    const newQty = isEntry ? currentQty + qtdNum : Math.max(0, currentQty - qtdNum)
    await supabase.from('stock').update({ quantidade: newQty, ultima_movimentacao: new Date().toISOString() }).eq('produto_id', modal.product.id)

    setModal(null); setQty(''); setMotivo(''); setSaving(false)
    load()
  }

  const lowStock = products.filter(p => (p.quantidade_estoque ?? 0) < p.estoque_minimo)
  const totalValue = products.reduce((s, p) => s + (p.quantidade_estoque ?? 0) * p.preco_custo, 0)
  const totalSaleValue = products.reduce((s, p) => s + (p.quantidade_estoque ?? 0) * p.preco_venda, 0)

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #161B26', borderTopColor: '#A78BFA', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Valor em estoque (custo)', value: formatCurrency(totalValue), color: '#A78BFA', bg: 'rgba(99,102,241,0.12)' },
          { label: 'Valor potencial (venda)', value: formatCurrency(totalSaleValue), color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
          { label: 'Produtos com baixo estoque', value: String(lowStock.length), color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
          { label: 'Total de produtos ativos', value: String(products.length), color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: s.bg, marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F1F5F9' }}>{s.value}</p>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alert */}
      {lowStock.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '1rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={18} color="#F59E0B" />
          <p style={{ color: '#FCD34D', fontSize: '0.875rem' }}>
            {lowStock.map(p => p.nome).join(', ')} — estoque abaixo do mínimo
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', background: '#161B26', borderRadius: '0.875rem', padding: '0.3rem', width: 'fit-content' }}>
        {(['overview', 'movements'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.625rem', background: tab === t ? '#1F2937' : 'transparent', border: 'none', color: tab === t ? '#F1F5F9' : '#94A3B8', cursor: 'pointer', fontSize: '0.875rem', fontWeight: tab === t ? 600 : 400, transition: 'all 0.15s' }}>
            {t === 'overview' ? 'Visão Geral' : 'Movimentações'}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'overview' ? (
        <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #161B26' }}>
                {['Produto', 'Categoria', 'Qtd. Estoque', 'Mín.', 'Valor (custo)', 'Valor (venda)', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const low = (p.quantidade_estoque ?? 0) < p.estoque_minimo
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #0B0F19' }}>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <p style={{ fontWeight: 600, color: '#F1F5F9', fontSize: '0.875rem' }}>{p.nome}</p>
                      <p style={{ color: '#64748B', fontSize: '0.72rem' }}>{p.sku}</p>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#94A3B8', fontSize: '0.8rem' }}>{(p as any).categories?.nome ?? '—'}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ fontWeight: 700, color: low ? '#FCA5A5' : '#F1F5F9', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {low && <AlertTriangle size={12} color="#F59E0B" />}
                        {formatNumber(p.quantidade_estoque ?? 0)} {p.unidade_medida}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#64748B', fontSize: '0.8rem' }}>{formatNumber(p.estoque_minimo)}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#F1F5F9', fontSize: '0.875rem' }}>{formatCurrency((p.quantidade_estoque ?? 0) * p.preco_custo)}</td>
                    <td style={{ padding: '0.875rem 1rem', color: '#34D399', fontWeight: 600, fontSize: '0.875rem' }}>{formatCurrency((p.quantidade_estoque ?? 0) * p.preco_venda)}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setModal({ product: p, tipo: 'entrada' })} style={{ padding: '0.35rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34D399', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <ArrowUp size={12} /> Entrada
                        </button>
                        <button onClick={() => setModal({ product: p, tipo: 'saida' })} style={{ padding: '0.35rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <ArrowDown size={12} /> Saída
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #161B26' }}>
                {['Data', 'Produto', 'Tipo', 'Quantidade', 'Motivo', 'Responsável'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #0B0F19' }}>
                  <td style={{ padding: '0.875rem 1rem', color: '#94A3B8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDateTime(m.criado_em)}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <p style={{ color: '#F1F5F9', fontSize: '0.875rem', fontWeight: 600 }}>{(m as any).products?.nome}</p>
                    <p style={{ color: '#64748B', fontSize: '0.72rem' }}>{(m as any).products?.sku}</p>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={`badge ${m.tipo === 'entrada' ? 'badge-success' : 'badge-danger'}`}>
                      {m.tipo === 'entrada' ? <ArrowUp size={10} /> : <ArrowDown size={10} />} {m.tipo}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: m.tipo === 'entrada' ? '#34D399' : '#FCA5A5', fontSize: '0.875rem' }}>
                    {m.tipo === 'entrada' ? '+' : '-'}{formatNumber(m.quantidade)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#94A3B8', fontSize: '0.8rem' }}>{m.motivo ?? '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#94A3B8', fontSize: '0.8rem' }}>{(m as any).profiles?.nome} {(m as any).profiles?.sobrenome}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {movements.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Nenhuma movimentação registrada</div>}
        </div>
      )}

      {/* Movement Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setModal(null)}>
          <div className="glass" style={{ borderRadius: '1.25rem', padding: '1.75rem', width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.25rem' }}>
              {modal.tipo === 'entrada' ? '➕ Entrada de Estoque' : '➖ Saída de Estoque'}
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '1.25rem' }}>{modal.product.nome}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Quantidade *</label>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" placeholder="0" className="input-base" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Motivo</label>
                <input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex: Compra de fornecedor" className="input-base" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
                <button type="button" onClick={registerMovement} disabled={saving || !qty} className="btn-primary">
                  {saving ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
