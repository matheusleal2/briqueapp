'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { productSchema, type ProductFormData } from '@/lib/validations'
import { generateSKU, formatCurrency, calcMargin } from '@/lib/utils'
import { Save, Upload, X, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const UNITS = ['unidade', 'm²', 'dúzia', 'cento', 'kg', 'm³', 'pç']

interface ProductFormPageProps { isEdit?: boolean }

export default function ProductFormPage({ isEdit }: ProductFormPageProps) {
  const router = useRouter()
  const params = useParams()
  const productId = params?.id as string | undefined
  const [loading, setLoading] = useState(!!isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: { unidade_medida: 'unidade', status: 'ativo', estoque_minimo: 0 },
  })

  const watchedCost = watch('preco_custo')
  const watchedSale = watch('preco_venda')
  const margin = calcMargin(Number(watchedSale) || 0, Number(watchedCost) || 0)

  useEffect(() => {
    loadCategories()
    if (isEdit && productId) loadProduct(productId)
  }, [isEdit, productId])

  async function loadCategories() {
    const supabase = createClient()
    const { data } = await supabase.from('categories').select('id, nome').order('nome')
    setCategories(data ?? [])
  }

  async function loadProduct(id: string) {
    const supabase = createClient()
    const { data } = await supabase.from('products').select('*, product_photos(url)').eq('id', id).single()
    if (data) {
      Object.entries(data).forEach(([k, v]) => setValue(k as any, v))
      setExistingPhotos(data.product_photos?.map((p: any) => p.url) ?? [])
    }
    setLoading(false)
  }

  async function onSubmit(data: ProductFormData) {
    setSaving(true); setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('empresa_id').eq('id', user.id).single()
    const empresa_id = profile?.empresa_id

    const margin = calcMargin(data.preco_venda, data.preco_custo)
    const productData = { ...data, empresa_id, margem_lucro: margin }

    let productId_: string
    if (isEdit && productId) {
      await supabase.from('products').update(productData).eq('id', productId)
      productId_ = productId
    } else {
      const { data: created, error: createError } = await supabase.from('products').insert(productData).select('id').single()
      if (createError || !created) { setError(createError?.message ?? 'Erro ao criar produto'); setSaving(false); return }
      productId_ = created.id
      // Create stock entry
      await supabase.from('stock').insert({ produto_id: productId_, quantidade: 0 })
    }

    // Upload photos
    for (const file of photos) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${productId_}/${Date.now()}.${ext}`
      const { data: uploaded } = await supabase.storage.from('product-photos').upload(path, file)
      if (uploaded) {
        const { data: { publicUrl } } = supabase.storage.from('product-photos').getPublicUrl(path)
        await supabase.from('product_photos').insert({ produto_id: productId_, url: publicUrl })
        if (!isEdit) await supabase.from('products').update({ foto_principal: publicUrl }).eq('id', productId_)
      }
    }

    router.push('/products')
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setPhotos((prev) => [...prev, ...files].slice(0, 5))
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #161B26', borderTopColor: '#A78BFA', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style></div>

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '800px' }}>
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.875rem 1rem', color: '#FCA5A5', fontSize: '0.875rem' }}>{error}</div>}

      <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9' }}>Informações do Produto</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome *</label>
            <input {...register('nome')} placeholder="Ex: Tijolo Cerâmico 8 Furos" className="input-base" />
            {errors.nome && <p style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: '0.3rem' }}>{errors.nome.message}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SKU *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input {...register('sku')} placeholder="EX: TIJCR-001" className="input-base" />
              <button type="button" onClick={() => setValue('sku', generateSKU(watch('nome') || 'PRD'))} style={{ padding: '0.625rem', background: '#161B26', border: '1px solid #1F2937', borderRadius: '0.75rem', color: '#94A3B8', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                <RefreshCw size={15} />
              </button>
            </div>
            {errors.sku && <p style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: '0.3rem' }}>{errors.sku.message}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoria</label>
            <select {...register('categoria_id')} className="input-base">
              <option value="">Sem categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unidade de Medida *</label>
            <select {...register('unidade_medida')} className="input-base">
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</label>
            <textarea {...register('descricao')} rows={3} placeholder="Especificações, dimensões, características..." className="input-base" style={{ resize: 'vertical' }} />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9' }}>Preços</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preço de Custo (R$) *</label>
            <input {...register('preco_custo')} type="number" step="0.01" min="0" placeholder="0,00" className="input-base" />
            {errors.preco_custo && <p style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: '0.3rem' }}>{errors.preco_custo.message}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preço de Venda (R$) *</label>
            <input {...register('preco_venda')} type="number" step="0.01" min="0" placeholder="0,00" className="input-base" />
            {errors.preco_venda && <p style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: '0.3rem' }}>{errors.preco_venda.message}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Margem de Lucro</label>
            <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.75rem', fontSize: '1.1rem', fontWeight: 800, color: margin >= 20 ? '#34D399' : margin >= 10 ? '#FCD34D' : '#FCA5A5' }}>
              {margin.toFixed(1)}%
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estoque Mínimo</label>
            <input {...register('estoque_minimo')} type="number" min="0" placeholder="0" className="input-base" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
            <select {...register('status')} className="input-base">
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '1rem' }}>Fotos</h3>
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '2rem', border: '2px dashed #1F2937', borderRadius: '0.75rem', cursor: 'pointer', transition: 'border-color 0.2s' }}>
          <Upload size={24} color="#64748B" />
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Arraste ou clique para adicionar fotos</p>
          <p style={{ color: '#64748B', fontSize: '0.75rem' }}>JPG, PNG, WebP — Máx. 5MB cada</p>
          <input type="file" multiple accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
        </label>

        {(photos.length > 0 || existingPhotos.length > 0) && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {existingPhotos.map((url, i) => (
              <div key={i} style={{ width: '80px', height: '80px', borderRadius: '0.75rem', overflow: 'hidden', position: 'relative', border: '2px solid #1F2937' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
            {photos.map((file, i) => (
              <div key={i} style={{ width: '80px', height: '80px', borderRadius: '0.75rem', overflow: 'hidden', position: 'relative', border: '2px solid #A78BFA' }}>
                <img src={URL.createObjectURL(file)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <Link href="/products" className="btn-secondary">Cancelar</Link>
        <button type="submit" disabled={saving} className="btn-primary">
          <Save size={15} />
          {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar produto'}
        </button>
      </div>
    </form>
  )
}
