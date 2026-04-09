'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type Period = 'dia' | 'semana' | 'mes'

export default function ProfitHistoryPage() {
  const [period, setPeriod] = useState<Period>('dia')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalLucro, setTotalLucro] = useState(0)
  const [avg, setAvg] = useState(0)

  useEffect(() => { loadData() }, [period])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const days = period === 'dia' ? 30 : period === 'semana' ? 90 : 365
    const from = new Date(); from.setDate(from.getDate() - days)

    const { data: sales } = await supabase.from('sales').select('data_venda, lucro_gerado, total_venda, margem').eq('status', 'concluida').gte('data_venda', from.toISOString()).order('data_venda')

    const salesArr = sales ?? []
    const grouped: Record<string, { lucro: number; vendas: number; txs: number }> = {}

    salesArr.forEach(s => {
      let key: string
      const d = new Date(s.data_venda)
      if (period === 'dia') {
        key = d.toISOString().slice(0, 10)
      } else if (period === 'semana') {
        const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay())
        key = weekStart.toISOString().slice(0, 10)
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      }
      if (!grouped[key]) grouped[key] = { lucro: 0, vendas: 0, txs: 0 }
      grouped[key].lucro += s.lucro_gerado
      grouped[key].vendas += s.total_venda
      grouped[key].txs++
    })

    const arr = Object.entries(grouped).map(([date, v]) => ({
      date: period === 'mes' ? date : formatDate(date),
      ...v,
      margem: v.vendas > 0 ? (v.lucro / v.vendas) * 100 : 0,
    }))

    setData(arr)
    setTotalLucro(arr.reduce((s, x) => s + x.lucro, 0))
    setAvg(arr.length ? arr.reduce((s, x) => s + x.lucro, 0) / arr.length : 0)
    setLoading(false)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
        <p style={{ color: '#94A3B8', marginBottom: '0.5rem' }}>{label}</p>
        <p style={{ color: '#10B981', fontWeight: 700 }}>Lucro: {formatCurrency(payload[0].value)}</p>
        {payload[1] && <p style={{ color: '#6366F1', fontWeight: 600 }}>Vendas: {formatCurrency(payload[1].value)}</p>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', background: '#1E293B', borderRadius: '0.875rem', padding: '0.3rem', gap: '0.25rem' }}>
          {(['dia', 'semana', 'mes'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '0.4rem 1rem', borderRadius: '0.625rem', background: period === p ? '#334155' : 'transparent', border: 'none', color: period === p ? '#F1F5F9' : '#94A3B8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: period === p ? 600 : 400, transition: 'all 0.15s', textTransform: 'capitalize' }}>
              {p === 'dia' ? 'Por Dia' : p === 'semana' ? 'Por Semana' : 'Por Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Lucro total no período', value: formatCurrency(totalLucro), icon: TrendingUp, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
          { label: `Lucro médio por ${period}`, value: formatCurrency(avg), icon: Calendar, color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
          { label: 'Períodos analisados', value: String(data.length), icon: Calendar, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F1F5F9' }}>{s.value}</p>
              <p style={{ fontSize: '0.72rem', color: '#64748B' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '1.25rem' }}>Histórico de Lucro</h3>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div style={{ width: '2rem', height: '2rem', border: '3px solid #1E293B', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="lucro-h" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.9} /><stop offset="100%" stopColor="#10B981" stopOpacity={0.4} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="lucro" fill="url(#lucro-h)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table */}
      <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E293B' }}>
              {['Período', 'Vendas', 'Lucro', 'Margem', 'Transações'].map(h => (
                <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice().reverse().map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #0F172A' }}>
                <td style={{ padding: '0.875rem 1rem', color: '#94A3B8', fontSize: '0.8rem' }}>{row.date}</td>
                <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#F1F5F9', fontSize: '0.875rem' }}>{formatCurrency(row.vendas)}</td>
                <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#34D399', fontSize: '0.875rem' }}>{formatCurrency(row.lucro)}</td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <span className={`badge ${row.margem >= 20 ? 'badge-success' : row.margem >= 10 ? 'badge-warning' : 'badge-danger'}`}>{row.margem.toFixed(1)}%</span>
                </td>
                <td style={{ padding: '0.875rem 1rem', color: '#94A3B8', fontSize: '0.8rem' }}>{row.txs}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && !loading && <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>Nenhum dado disponível para o período</div>}
      </div>
    </div>
  )
}
