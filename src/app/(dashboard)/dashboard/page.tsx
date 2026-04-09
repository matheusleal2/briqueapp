'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'
import { DollarSign, TrendingUp, ShoppingCart, Package, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface KpiData {
  totalVendas: number
  totalLucro: number
  margemMedia: number
  qtdTransacoes: number
  valorEstoque: number
  produtosAtivos: number
  alertasBaixoEstoque: number
}

interface ChartPoint { date: string; vendas: number; lucro: number }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
      <p style={{ color: '#94A3B8', marginBottom: '0.5rem' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KpiData | null>(null)
  const [chart, setChart] = useState<ChartPoint[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const supabase = createClient()

    // Get current month range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [salesRes, stockRes, productsRes, recentSalesRes] = await Promise.all([
      supabase.from('sales').select('total_venda, lucro_gerado, margem').eq('status', 'concluida').gte('data_venda', startOfMonth),
      supabase.from('stock').select('quantidade, produtos(preco_custo)'),
      supabase.from('products').select('id, status'),
      supabase.from('sales').select('id, data_venda, total_venda, lucro_gerado, profiles(nome, sobrenome)').eq('status', 'concluida').order('data_venda', { ascending: false }).limit(5),
    ])

    const sales = salesRes.data ?? []
    const totalVendas = sales.reduce((s, x) => s + (x.total_venda ?? 0), 0)
    const totalLucro = sales.reduce((s, x) => s + (x.lucro_gerado ?? 0), 0)
    const margemMedia = sales.length ? sales.reduce((s, x) => s + (x.margem ?? 0), 0) / sales.length : 0

    const stockItems: any[] = stockRes.data ?? []
    const valorEstoque = stockItems.reduce((s, x) => s + (x.quantidade ?? 0) * (x.produtos?.preco_custo ?? 0), 0)
    const alertasBaixoEstoque = stockItems.filter((x) => (x.quantidade ?? 0) < 5).length

    const products = productsRes.data ?? []
    const produtosAtivos = products.filter((p) => p.status === 'ativo').length

    setKpi({ totalVendas, totalLucro, margemMedia, qtdTransacoes: sales.length, valorEstoque, produtosAtivos, alertasBaixoEstoque })
    setRecentSales(recentSalesRes.data ?? [])

    // Chart: last 14 days
    const days: ChartPoint[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const { data: daySales } = await supabase.from('sales').select('total_venda, lucro_gerado').eq('status', 'concluida').gte('data_venda', dateStr + 'T00:00:00').lt('data_venda', dateStr + 'T23:59:59')
      days.push({
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        vendas: (daySales ?? []).reduce((s, x) => s + x.total_venda, 0),
        lucro: (daySales ?? []).reduce((s, x) => s + x.lucro_gerado, 0),
      })
    }
    setChart(days)
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '3rem', height: '3rem', border: '3px solid #1E293B', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Carregando dashboard...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const kpis = [
    { label: 'Vendas este mês', value: formatCurrency(kpi?.totalVendas ?? 0), icon: ShoppingCart, color: '#6366F1', bg: 'rgba(99,102,241,0.12)', trend: '+12%', up: true },
    { label: 'Lucro este mês',  value: formatCurrency(kpi?.totalLucro ?? 0),  icon: DollarSign, color: '#10B981', bg: 'rgba(16,185,129,0.12)', trend: '+8%',  up: true },
    { label: 'Margem média',    value: formatPercent(kpi?.margemMedia ?? 0),   icon: TrendingUp, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', trend: '',     up: true },
    { label: 'Valor em estoque',value: formatCurrency(kpi?.valorEstoque ?? 0), icon: Package,    color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', trend: '',     up: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {kpis.map((k, i) => (
          <div key={i} className="glass card-hover" style={{ borderRadius: '1rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={18} color={k.color} />
              </div>
              {k.trend && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 600, color: k.up ? '#34D399' : '#FCA5A5' }}>
                  {k.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{k.trend}
                </span>
              )}
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F1F5F9', lineHeight: 1.1 }}>{k.value}</p>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {(kpi?.alertasBaixoEstoque ?? 0) > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '1rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={18} color="#F59E0B" />
          <p style={{ color: '#FCD34D', fontSize: '0.875rem' }}>
            <strong>{kpi?.alertasBaixoEstoque}</strong> produto(s) com estoque baixo.{' '}
            <Link href="/stock" style={{ color: '#FCD34D', fontWeight: 600 }}>Verificar estoque →</Link>
          </p>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Sales chart */}
        <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.25rem' }}>Vendas (últimos 14 dias)</h3>
          <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1.25rem' }}>Receita total por dia</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="vendas-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="vendas" name="Vendas" stroke="#6366F1" strokeWidth={2} fill="url(#vendas-grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Profit chart */}
        <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.25rem' }}>Lucro (últimos 14 dias)</h3>
          <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1.25rem' }}>Lucro bruto por dia</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="lucro-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="lucro" name="Lucro" fill="url(#lucro-grad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent sales */}
      <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9' }}>Vendas Recentes</h3>
          <Link href="/sales" style={{ fontSize: '0.8rem', color: '#818CF8', textDecoration: 'none', fontWeight: 600 }}>Ver todas →</Link>
        </div>

        {recentSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.875rem' }}>
            <ShoppingCart size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p>Nenhuma venda registrada ainda</p>
            <Link href="/sales/new" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1rem' }}>Registrar venda</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {recentSales.map((sale) => (
              <div key={sale.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'rgba(15,23,42,0.5)', borderRadius: '0.75rem', border: '1px solid #1E293B' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F1F5F9' }}>
                    {sale.profiles?.nome} {sale.profiles?.sobrenome}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>{formatDate(sale.data_venda)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F1F5F9' }}>{formatCurrency(sale.total_venda)}</p>
                  <p style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '0.15rem' }}>+{formatCurrency(sale.lucro_gerado)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
