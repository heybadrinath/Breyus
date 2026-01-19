export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'

export const SIDEBAR_WIDTH = 280
export const SIDEBAR_COLLAPSED_WIDTH = 72

export const NAV_ITEMS = {
  main: [
    { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
    { label: 'Users', href: '/users', icon: 'Users' },
    { label: 'Companies', href: '/companies', icon: 'Building2' },
    { label: 'Trades', href: '/trades', icon: 'FileText' },
    { label: 'Disputes', href: '/disputes', icon: 'AlertTriangle' },
    { label: 'KYC Documents', href: '/kyc', icon: 'ShieldCheck' },
    { label: 'Products', href: '/products', icon: 'Package' },
  ],
  system: [
    { label: 'System Health', href: '/system', icon: 'Activity' },
    { label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
    { label: 'Activity Log', href: '/activity', icon: 'History' },
  ],
  settings: [
    { label: 'Content', href: '/content', icon: 'FileEdit' },
    { label: 'Alerts', href: '/alerts', icon: 'Bell' },
    { label: 'Settings', href: '/settings', icon: 'Settings' },
  ],
} as const
