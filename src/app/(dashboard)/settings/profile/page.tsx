'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { profileSchema, type ProfileFormData } from '@/lib/validations'
import { Save, User } from 'lucide-react'

export default function ProfileSettingsPage() {
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('nome, sobrenome').eq('id', user.id).single()
      if (profile) {
        setValue('nome', profile.nome)
        setValue('sobrenome', profile.sobrenome)
      }
    }
    loadProfile()
  }, [])

  async function onSubmit(data: ProfileFormData) {
    setError(null); setSaved(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ nome: data.nome, sobrenome: data.sobrenome, atualizado_em: new Date().toISOString() }).eq('id', user.id)
    if (error) { setError(error.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ maxWidth: '500px' }}>
      <div className="glass" style={{ borderRadius: '1rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.75rem' }}>
          <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'linear-gradient(135deg, #A78BFA, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9' }}>Perfil do Usuário</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B' }}>Atualize seus dados pessoais</p>
          </div>
        </div>

        {saved && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#34D399', fontSize: '0.875rem' }}>✓ Perfil atualizado com sucesso!</div>}
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#FCA5A5', fontSize: '0.875rem' }}>{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome</label>
              <input {...register('nome')} className="input-base" />
              {errors.nome && <p style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: '0.3rem' }}>{errors.nome.message}</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sobrenome</label>
              <input {...register('sobrenome')} className="input-base" />
              {errors.sobrenome && <p style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: '0.3rem' }}>{errors.sobrenome.message}</p>}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: 'fit-content' }}>
            <Save size={15} /> {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}
