'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'
import { Plus, Search, Grid3X3, List, Package, AlertTriangle, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import Link from 'next/link'
import type { Product } from '@/types'
import Image from 'next/image'

const UNITS: Record<string, string> = { unidade: 'un', 'm²': 'm²', 'dúzia': 'dz', cento: 'cento', kg: 'kg', 'm³': 'm³', 'pç': 'pç' }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'todos' | 'ativo' | 'inativo' | 'baixo_estoque'>('todos')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('*, categories(nome), stock(quantidade)')
      .order('nome')
    setProducts((data ?? []).map((p: any) => ({ ...p, quantidade_estoque: p.stock?.[0]?.quantidade ?? 0 })))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = p.nome.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    const matchFilter =
      filter === 'todos' ? true :
      filter === 'ativo' ? p.status === 'ativo' :
      filter === 'inativo' ? p.status === 'inativo' :
      (p.quantidade_estoque ?? 0) < p.estoque_minimo
    return matchSearch && matchFilter
  })

  async function toggleStatus(p: Product) {
    const supabase = createClient()
    await supabase.from('products').update({ status: p.status === 'ativo' ? 'inativo' : 'ativo' }).eq('id', p.id)
    load()
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #1E293B', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou SKU..." className="input-base" style={{ paddingLeft: '2.5rem' }} />
        </div>

        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="input-base" style={{ width: 'auto', minWidth: '160px' }}>
          <option value="todos">Todos os produtos</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
          <option value="baixo_estoque">Baixo estoque</option>
        </select>

        <div style={{ display: 'flex', background: '#1E293B', borderRadius: '0.75rem', padding: '0.25rem', gap: '0.25rem' }}>
          {(['grid', 'list'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '0.35rem 0.625rem', borderRadius: '0.5rem', background: view === v ? '#334155' : 'transparent', border: 'none', color: view === v ? '#F1F5F9' : '#64748B', cursor: 'pointer', display: 'flex', transition: 'all 0.15s' }}>
              {v === 'grid' ? <Grid3X3 size={15} /> : <List size={15} />}
            </button>
          ))}
        </div>

        <Link href="/products/new" className="btn-primary">
          <Plus size={15} /> Novo Produto
        </Link>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total de produtos', value: products.length, color: '#6366F1' },
          { label: 'Ativos', value: products.filter(p => p.status === 'ativo').length, color: '#10B981' },
          { label: 'Estoque baixo', value: products.filter(p => (p.quantidade_estoque ?? 0) < p.estoque_minimo).length, color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', background: 'rgba(30,41,59,0.6)', borderRadius: '0.625rem', border: '1px solid #1E293B' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{s.label}:</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F1F5F9' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Products */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Package size={48} style={{ margin: '0 auto 1rem', color: '#334155' }} />
          <p style={{ color: '#94A3B8', marginBottom: '1rem' }}>Nenhum produto encontrado</p>
          <Link href="/products/new" className="btn-primary">Cadastrar produto</Link>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {filtered.map((p) => <ProductCard key={p.id} product={p} onToggle={toggleStatus} />)}
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E293B' }}>
                {['Produto', 'SKU', 'Preço Custo', 'Preço Venda', 'Margem', 'Estoque', 'Status', 'Ações'].map((h) => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #0F172A', transition: 'background 0.15s' }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <p style={{ fontWeight: 600, color: '#F1F5F9', fontSize: '0.875rem' }}>{p.nome}</p>
                    <p style={{ color: '#64748B', fontSize: '0.75rem' }}>{(p as any).categories?.nome ?? '—'}</p>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#94A3B8', fontSize: '0.875rem' }}>{p.sku}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#F1F5F9', fontSize: '0.875rem' }}>{formatCurrency(p.preco_custo)}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#F1F5F9', fontSize: '0.875rem' }}>{formatCurrency(p.preco_venda)}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={`badge ${p.margem_lucro >= 20 ? 'badge-success' : p.margem_lucro >= 10 ? 'badge-warning' : 'badge-danger'}`}>{formatPercent(p.margem_lucro)}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ color: (p.quantidade_estoque ?? 0) < p.estoque_minimo ? '#FCA5A5' : '#F1F5F9', fontWeight: 600, fontSize: '0.875rem' }}>
                      {formatNumber(p.quantidade_estoque ?? 0)} {UNITS[p.unidade_medida]}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={`badge ${p.status === 'ativo' ? 'badge-success' : 'badge-muted'}`}>{p.status}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/products/${p.id}/edit`} style={{ padding: '0.375rem', borderRadius: '0.5rem', background: 'rgba(99,102,241,0.12)', color: '#818CF8', display: 'flex', textDecoration: 'none' }}><Edit size={14} /></Link>
                      <button onClick={() => toggleStatus(p)} style={{ padding: '0.375rem', borderRadius: '0.5rem', background: 'rgba(71,85,105,0.2)', color: '#94A3B8', border: 'none', cursor: 'pointer', display: 'flex' }}>
                        {p.status === 'ativo' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                    </div>
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

function ProductCard({ product: p, onToggle }: { product: Product; onToggle: (p: Product) => void }) {
  const lowStock = (p.quantidade_estoque ?? 0) < p.estoque_minimo
  return (
    <div className="glass card-hover" style={{ borderRadius: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Photo */}
      <div style={{ height: '160px', background: '#1E293B', position: 'relative', overflow: 'hidden' }}>
        {p.foto_principal ? (
          <img src={p.foto_principal} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={40} color="#334155" />
          </div>
        )}
        {lowStock && (
          <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
            <span className="badge badge-warning"><AlertTriangle size={10} /> Baixo</span>
          </div>
        )}
        <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem' }}>
          <span className={`badge ${p.status === 'ativo' ? 'badge-success' : 'badge-muted'}`}>{p.status}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', flex: 1 }}>
        <div>
          <p style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.925rem', lineHeight: 1.3 }}>{p.nome}</p>
          <p style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '0.2rem' }}>{p.sku}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '0.5rem', padding: '0.5rem' }}>
            <p style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custo</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F1F5F9' }}>{formatCurrency(p.preco_custo)}</p>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '0.5rem', padding: '0.5rem' }}>
            <p style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Venda</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10B981' }}>{formatCurrency(p.preco_venda)}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Estoque: </span>
            <span style={{ fontWeight: 700, color: lowStock ? '#FCA5A5' : '#F1F5F9', fontSize: '0.875rem' }}>{formatNumber(p.quantidade_estoque ?? 0)}</span>
          </div>
          <span className={`badge ${p.margem_lucro >= 20 ? 'badge-success' : p.margem_lucro >= 10 ? 'badge-warning' : 'badge-danger'}`}>{formatPercent(p.margem_lucro)}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
          <Link href={`/products/${p.id}`} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem' }}>Ver</Link>
          <Link href={`/products/${p.id}/edit`} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem' }}>Editar</Link>
        </div>
      </div>
    </div>
  )
}
