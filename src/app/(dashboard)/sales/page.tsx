'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ShoppingCart, TrendingUp, Search } from 'lucide-react'
import Link from 'next/link'
import type { Sale } from '@/types'

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('sales')
      .select('*, profiles(nome, sobrenome), sale_items(produto_id, quantidade, subtotal, lucro_item, products(nome))')
      .order('data_venda', { ascending: false })
    setSales(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = sales.filter(s => {
    const q = search.toLowerCase()
    return (
      (s as any).profiles?.nome?.toLowerCase().includes(q) ||
      formatDate(s.data_venda).includes(q) ||
      s.id.includes(q)
    )
  })

  const totalVendas = sales.filter(s => s.status === 'concluida').reduce((a, s) => a + s.total_venda, 0)
  const totalLucro = sales.filter(s => s.status === 'concluida').reduce((a, s) => a + s.lucro_gerado, 0)

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #1E293B', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total vendido', value: formatCurrency(totalVendas), color: '#6366F1' },
          { label: 'Lucro total', value: formatCurrency(totalLucro), color: '#10B981' },
          { label: 'Nº de vendas', value: String(sales.filter(s => s.status === 'concluida').length), color: '#3B82F6' },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por vendedor ou data..." className="input-base" style={{ paddingLeft: '2.5rem' }} />
        </div>
        <Link href="/sales/new" className="btn-primary"><Plus size={15} /> Nova Venda</Link>
      </div>

      {/* Sales list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <ShoppingCart size={48} style={{ margin: '0 auto 1rem', color: '#334155' }} />
          <p style={{ color: '#94A3B8', marginBottom: '1rem' }}>Nenhuma venda registrada</p>
          <Link href="/sales/new" className="btn-primary">Registrar venda</Link>
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E293B' }}>
                {['Data', 'Vendedor', 'Produtos', 'Total', 'Lucro', 'Margem', 'Status'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #0F172A', cursor: 'pointer', transition: 'background 0.15s' }}>
                  <td style={{ padding: '0.875rem 1rem', color: '#94A3B8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(s.data_venda)}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <p style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.875rem' }}>{(s as any).profiles?.nome} {(s as any).profiles?.sobrenome}</p>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                    {((s as any).sale_items ?? []).length} item(s)
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#F1F5F9', fontSize: '0.875rem' }}>{formatCurrency(s.total_venda)}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#34D399', fontSize: '0.875rem' }}>+{formatCurrency(s.lucro_gerado)}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={`badge ${s.margem >= 20 ? 'badge-success' : s.margem >= 10 ? 'badge-warning' : 'badge-danger'}`}>{s.margem.toFixed(1)}%</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={`badge ${s.status === 'concluida' ? 'badge-success' : 'badge-danger'}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
