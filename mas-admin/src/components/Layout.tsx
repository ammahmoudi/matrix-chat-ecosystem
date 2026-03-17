import { useAuth } from 'react-oidc-context'
import { NavLink } from 'react-router-dom'
import { Users, KeyRound, MonitorSmartphone, LogOut, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { to: '/mas-admin/users', label: 'Users', icon: Users },
  { to: '/mas-admin/tokens', label: 'Registration Tokens', icon: KeyRound },
  { to: '/mas-admin/sessions', label: 'Sessions', icon: MonitorSmartphone },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const auth = useAuth()

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
            <span className="font-semibold text-sm">MAS Admin</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{auth.user?.profile.preferred_username}</p>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-gray-800">
          <button
            onClick={() => auth.signoutRedirect()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
