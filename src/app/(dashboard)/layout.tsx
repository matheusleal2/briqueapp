import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { headers } from 'next/headers'

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard':      { title: 'Dashboard',          subtitle: 'Visão geral do seu negócio' },
  '/products':       { title: 'Produtos',            subtitle: 'Gerencie seu catálogo' },
  '/stock':          { title: 'Estoque',             subtitle: 'Controle de movimentações' },
  '/sales':          { title: 'Vendas',              subtitle: 'Histórico e registro de vendas' },
  '/sales/new':      { title: 'Nova Venda',          subtitle: 'Registrar uma nova venda' },
  '/reports':        { title: 'Relatórios',          subtitle: 'Análises e exportações' },
  '/profit-history': { title: 'Histórico de Lucro',  subtitle: 'Evolução dos seus resultados' },
  '/settings/profile':  { title: 'Configurações',   subtitle: 'Perfil e preferências' },
  '/settings/company':  { title: 'Empresa',          subtitle: 'Dados da empresa' },
  '/settings/users':    { title: 'Usuários',         subtitle: 'Gerenciamento de equipe' },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? '/dashboard'
  const pageInfo = Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] ?? { title: 'Brique' }

  return (
    <div className="bg-background text-foreground" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <div className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main style={{ flex: 1, padding: '1.5rem', overflowX: 'hidden' }}>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      <style>{`
        .desktop-sidebar { display: flex; }
        .mobile-menu-btn { display: none; }
        @media (max-width: 768px) {
          .desktop-sidebar { display: none; }
          .mobile-menu-btn { display: flex; }
        }
      `}</style>
    </div>
  )
}
