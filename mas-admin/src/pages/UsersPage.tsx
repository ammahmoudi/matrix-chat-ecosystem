import { useState, useEffect, useCallback } from 'react'
import { useAuth } from 'react-oidc-context'
import { Search, Lock, Unlock, ShieldCheck, ShieldOff, RefreshCw } from 'lucide-react'
import { listUsers, lockUser, unlockUser, setAdmin, type MasUser } from '../lib/masApi'
import { formatDistanceToNow } from 'date-fns'

interface UserRow {
  id: string
  attributes: MasUser
}

export default function UsersPage() {
  const auth = useAuth()
  const token = auth.user?.access_token ?? ''

  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async (filter = '') => {
    setLoading(true)
    setError('')
    try {
      const res = await listUsers(token, { filter: filter || undefined })
      setUsers(res.data as UserRow[])
      setTotal(res.meta.count)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search, load])

  async function doAction(id: string, action: () => Promise<void>) {
    setActionLoading(id)
    try {
      await action()
      await load(search)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Users</h1>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        <button onClick={() => load(search)} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          className="input pl-9"
          placeholder="Search by username…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3">Username</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Admin</th>
              <th className="text-left px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map(({ id, attributes: u }) => (
                <tr key={id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium">
                    @{u.username}
                  </td>
                  <td className="px-4 py-3">
                    {u.locked_at ? (
                      <span className="badge-red">Locked</span>
                    ) : (
                      <span className="badge-green">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.can_request_admin ? (
                      <span className="badge-yellow">Admin</span>
                    ) : (
                      <span className="badge-gray">User</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {u.locked_at ? (
                        <button
                          title="Unlock"
                          disabled={actionLoading === id}
                          className="btn-secondary p-1.5"
                          onClick={() => doAction(id, () => unlockUser(token, id))}
                        >
                          <Unlock className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          title="Lock"
                          disabled={actionLoading === id}
                          className="btn-danger p-1.5"
                          onClick={() => {
                            if (confirm(`Lock @${u.username}?`))
                              doAction(id, () => lockUser(token, id))
                          }}
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {u.can_request_admin ? (
                        <button
                          title="Remove admin"
                          disabled={actionLoading === id}
                          className="btn-secondary p-1.5"
                          onClick={() => {
                            if (confirm(`Remove admin from @${u.username}?`))
                              doAction(id, () => setAdmin(token, id, false))
                          }}
                        >
                          <ShieldOff className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          title="Make admin"
                          disabled={actionLoading === id}
                          className="btn-secondary p-1.5"
                          onClick={() => doAction(id, () => setAdmin(token, id, true))}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
