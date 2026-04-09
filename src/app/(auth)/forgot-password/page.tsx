'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations'
import { Package2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordFormData) {
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: '#0B0F19' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.5rem', height: '3.5rem', background: 'linear-gradient(135deg, #A78BFA, #818CF8)', borderRadius: '1rem', marginBottom: '1rem', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
            <Package2 size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F1F5F9' }}>Brique</h1>
        </div>

        <div className="glass" style={{ borderRadius: '1.25rem', padding: '2rem' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle2 size={48} color="#10B981" style={{ marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.5rem' }}>Email enviado!</h2>
              <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
              <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1.5rem', justifyContent: 'center' }}>
                <ArrowLeft size={16} /> Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.25rem' }}>Esqueceu sua senha?</h2>
              <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '1.75rem' }}>Digite seu email e enviaremos um link de redefinição.</p>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#FCA5A5', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                  <input {...register('email')} type="email" placeholder="seu@email.com" className="input-base" />
                  {errors.email && <p style={{ color: '#FCA5A5', fontSize: '0.75rem', marginTop: '0.35rem' }}>{errors.email.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                  <Mail size={16} />
                  {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/login" style={{ color: '#94A3B8', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={14} /> Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}
