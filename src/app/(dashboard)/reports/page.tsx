'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import { Download, TrendingUp, DollarSign, ShoppingCart, Package } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#A78BFA', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6']

export default function ReportsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '365d'>('30d')
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [summary, setSummary] = useState({ total: 0, lucro: 0, margem: 0, txs: 0 })
  const [categoryData, setCategoryData] = useState<any[]>([])

  useEffect(() => { loadData() }, [period])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const days = parseInt(period)
    const from = new Date(); from.setDate(from.getDate() - days)

    const { data: sales } = await supabase.from('sales').select('*, sale_items(*, products(nome, categories(nome)))').eq('status', 'concluida').gte('data_venda', from.toISOString()).order('data_venda')

    const salesArr = sales ?? []
    setSummary({
      total: salesArr.reduce((s, x) => s + x.total_venda, 0),
      lucro: salesArr.reduce((s, x) => s + x.lucro_gerado, 0),
      margem: salesArr.length ? salesArr.reduce((s, x) => s + x.margem, 0) / salesArr.length : 0,
      txs: salesArr.length,
    })

    // Group by date
    const byDate: Record<string, { vendas: number; lucro: number }> = {}
    salesArr.forEach(s => {
      const d = s.data_venda.slice(0, 10)
      if (!byDate[d]) byDate[d] = { vendas: 0, lucro: 0 }
      byDate[d].vendas += s.total_venda
      byDate[d].lucro += s.lucro_gerado
    })
    setChartData(Object.entries(byDate).map(([date, v]) => ({ date: formatDate(date), ...v })))

    // Top products by revenue
    const prodMap: Record<string, { nome: string; total: number; lucro: number; qty: number }> = {}
    salesArr.forEach(s => (s.sale_items ?? []).forEach((item: any) => {
      const name = item.products?.nome ?? 'Desconhecido'
      if (!prodMap[name]) prodMap[name] = { nome: name, total: 0, lucro: 0, qty: 0 }
      prodMap[name].total += item.subtotal
      prodMap[name].lucro += item.lucro_item
      prodMap[name].qty += item.quantidade
    }))
    setTopProducts(Object.values(prodMap).sort((a, b) => b.total - a.total).slice(0, 8))

    // Category breakdown
    const catMap: Record<string, number> = {}
    salesArr.forEach(s => (s.sale_items ?? []).forEach((item: any) => {
      const cat = item.products?.categories?.nome ?? 'Sem categoria'
      catMap[cat] = (catMap[cat] ?? 0) + item.subtotal
    }))
    setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })))

    setLoading(false)
  }

  async function exportCSV() {
    const supabase = createClient()
    const days = parseInt(period)
    const from = new Date(); from.setDate(from.getDate() - days)
    const { data: sales } = await supabase.from('sales').select('data_venda, total_venda, total_custo, lucro_gerado, margem, profiles(nome, sobrenome)').eq('status', 'concluida').gte('data_venda', from.toISOString()).order('data_venda')

    const rows = [['Data', 'Vendedor', 'Total Venda', 'Total Custo', 'Lucro', 'Margem %']]
    ;(sales ?? []).forEach(s => rows.push([
      formatDate(s.data_venda),
      `${(s as any).profiles?.nome} ${(s as any).profiles?.sobrenome}`,
      s.total_venda.toFixed(2),
      s.total_custo.toFixed(2),
      s.lucro_gerado.toFixed(2),
      `${s.margem.toFixed(1)}%`,
    ]))

    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `relatorio-brique-${period}.csv`; a.click()
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return <div style={{ background: '#161B26', border: '1px solid #1F2937', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.8rem' }}><p style={{ color: '#94A3B8', marginBottom: '0.5rem' }}>{label}</p>{payload.map((p: any) => <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {formatCurrency(p.value)}</p>)}</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#161B26', borderRadius: '0.875rem', padding: '0.3rem', gap: '0.25rem' }}>
          {(['7d', '30d', '90d', '365d'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.625rem', background: period === p ? '#1F2937' : 'transparent', border: 'none', color: period === p ? '#F1F5F9' : '#94A3B8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: period === p ? 600 : 400, transition: 'all 0.15s' }}>
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : p === '90d' ? '3 meses' : '1 ano'}
            </button>
          ))}
        </div>
        <button onClick={exportCSV} className="btn-secondary" style={{ marginLeft: 'auto' }}><Download size={15} /> Exportar CSV</button>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #161B26', borderTopColor: '#A78BFA', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div> : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Total vendido', value: formatCurrency(summary.total), icon: ShoppingCart, color: '#A78BFA', bg: 'rgba(99,102,241,0.12)' },
              { label: 'Lucro total', value: formatCurrency(summary.lucro), icon: DollarSign, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
              { label: 'Margem média', value: formatPercent(summary.margem), icon: TrendingUp, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
              { label: 'Transações', value: String(summary.txs), icon: Package, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
            ].map((k, i) => (
              <div key={i} className="glass" style={{ borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <k.icon size={18} color={k.color} />
                </div>
                <div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F1F5F9' }}>{k.value}</p>
                  <p style={{ fontSize: '0.72rem', color: '#64748B' }}>{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '1.25rem' }}>Evolução de Vendas e Lucro</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ left: -20 }}>
                  <defs>
                    <linearGradient id="v-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3} /><stop offset="95%" stopColor="#A78BFA" stopOpacity={0} /></linearGradient>
                    <linearGradient id="l-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161B26" />
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="vendas" name="Vendas" stroke="#A78BFA" strokeWidth={2} fill="url(#v-grad)" dot={false} />
                  <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#10B981" strokeWidth={2} fill="url(#l-grad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '1.25rem' }}>Por Categoria</h3>
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
                    {categoryData.slice(0, 4).map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: COLORS[i % COLORS.length] }} />
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{c.name}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F1F5F9' }}>{formatCurrency(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', color: '#64748B', fontSize: '0.875rem' }}>Sem dados</div>}
            </div>
          </div>

          {/* Top products */}
          <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '1.25rem' }}>Top Produtos por Receita</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {topProducts.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ width: '1.5rem', fontSize: '0.75rem', fontWeight: 700, color: i < 3 ? '#A78BFA' : '#64748B', textAlign: 'center' }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#F1F5F9', fontWeight: 600 }}>{p.nome}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F1F5F9' }}>{formatCurrency(p.total)}</span>
                    </div>
                    <div style={{ height: '4px', background: '#161B26', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: COLORS[i % COLORS.length], borderRadius: '2px', width: `${(p.total / (topProducts[0]?.total || 1)) * 100}%`, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Qtd: {p.qty}</span>
                      <span style={{ fontSize: '0.7rem', color: '#34D399' }}>Lucro: {formatCurrency(p.lucro)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.875rem' }}>Nenhuma venda no período</div>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
