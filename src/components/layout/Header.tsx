import { createClient } from '@/lib/supabase/server'
import { MobileSidebar } from './Sidebar'
import { Bell, Search } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
}

export async function Header({ title, subtitle }: HeaderProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const name = user?.user_metadata?.nome ?? user?.email ?? 'Usuário'
  const initial = name.charAt(0).toUpperCase()

  return (
    <header style={{ background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1E293B', padding: '0 1.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="mobile-menu-btn">
          <MobileSidebar />
        </div>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F1F5F9', lineHeight: 1.2 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.1rem' }}>{subtitle}</p>}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: 'rgba(30,41,59,0.8)', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94A3B8', transition: 'all 0.15s' }}>
          <Bell size={15} />
        </button>
        {/* Avatar */}
        <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', flexShrink: 0 }}>
          {initial}
        </div>
      </div>
    </header>
  )
}
