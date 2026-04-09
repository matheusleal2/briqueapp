'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { Package2, Eye, EyeOff, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterFormData) {
    setError(null)
    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { nome: data.nome, sobrenome: data.sobrenome, empresa: data.empresa }
      }
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Erro ao criar conta. Tente novamente.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'radial-gradient(ellipse at top right, rgba(16,185,129,0.12) 0%, transparent 50%), #0B0F19' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.5rem', height: '3.5rem', background: 'linear-gradient(135deg, #A78BFA, #818CF8)', borderRadius: '1rem', marginBottom: '1rem', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
            <Package2 size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F1F5F9' }}>Brique</h1>
          <p style={{ color: '#94A3B8', marginTop: '0.25rem', fontSize: '0.875rem' }}>Crie sua conta gratuita</p>
        </div>

        <div className="glass" style={{ borderRadius: '1.25rem', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '1.75rem' }}>Informações da conta</h2>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#FCA5A5', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome</label>
                <input {...register('nome')} placeholder="João" className="input-base" />
                {errors.nome && <p style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: '0.3rem' }}>{errors.nome.message}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sobrenome</label>
                <input {...register('sobrenome')} placeholder="Silva" className="input-base" />
                {errors.sobrenome && <p style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: '0.3rem' }}>{errors.sobrenome.message}</p>}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empresa</label>
              <input {...register('empresa')} placeholder="Nome da sua empresa" className="input-base" />
              {errors.empresa && <p style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: '0.3rem' }}>{errors.empresa.message}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <input {...register('email')} type="email" placeholder="seu@email.com" className="input-base" />
              {errors.email && <p style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: '0.3rem' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" className="input-base" style={{ paddingRight: '2.75rem' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: '0.3rem' }}>{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem' }}>
              {isSubmitting ? <span style={{ display: 'inline-block', width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-pulse-slow" /> : <UserPlus size={16} />}
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          Já tem uma conta?{' '}
          <Link href="/login" style={{ color: '#818CF8', textDecoration: 'none', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
