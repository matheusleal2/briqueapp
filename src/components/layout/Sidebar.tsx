'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Package2, LayoutDashboard, Boxes, ShoppingCart, BarChart2,
  TrendingUp, Settings, LogOut, Menu, X, ChevronRight,
  Users, History
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/products',        icon: Boxes,           label: 'Produtos' },
  { href: '/stock',           icon: Package2,        label: 'Estoque' },
  { href: '/sales',           icon: ShoppingCart,    label: 'Vendas' },
  { href: '/reports',         icon: BarChart2,       label: 'Relatórios' },
  { href: '/profit-history',  icon: TrendingUp,      label: 'Histórico de Lucro' },
]

const settingsItems = [
  { href: '/settings/profile',  icon: Settings, label: 'Configurações' },
  { href: '/settings/users',    icon: Users,    label: 'Usuários' },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside style={{ width: '240px', minHeight: '100vh', background: 'rgba(15,23,42,0.95)', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column', padding: '1.25rem 0', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '0 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '2.25rem', height: '2.25rem', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
            <Package2 size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.125rem', color: '#F1F5F9' }}>Brique</span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.75rem', flex: 1 }}>
        <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.5rem', marginBottom: '0.5rem' }}>Menu</p>

        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', borderRadius: '0.625rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: active ? 600 : 400, color: active ? '#F1F5F9' : '#94A3B8', background: active ? 'rgba(99,102,241,0.15)' : 'transparent', transition: 'all 0.15s', position: 'relative' }}>
              <Icon size={17} color={active ? '#818CF8' : '#64748B'} />
              {label}
              {active && <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}><ChevronRight size={14} color="#818CF8" /></div>}
            </Link>
          )
        })}

        <div style={{ height: '1px', background: '#1E293B', margin: '1rem 0' }} />
        <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.5rem', marginBottom: '0.5rem' }}>Conta</p>

        {settingsItems.map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', borderRadius: '0.625rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: active ? 600 : 400, color: active ? '#F1F5F9' : '#94A3B8', background: active ? 'rgba(99,102,241,0.15)' : 'transparent', transition: 'all 0.15s' }}>
              <Icon size={17} color={active ? '#818CF8' : '#64748B'} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '0 0.75rem', marginTop: '1rem' }}>
        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', borderRadius: '0.625rem', fontSize: '0.875rem', color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', fontWeight: 500, transition: 'background 0.15s' }}>
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </aside>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}>
        <Menu size={22} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
          {/* Drawer */}
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50, width: '260px' }} className="animate-slide-in">
            <Sidebar onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  )
}
