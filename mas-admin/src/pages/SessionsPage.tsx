import { useState, useEffect, useCallback } from 'react'
import { useAuth } from 'react-oidc-context'
import { Trash2, RefreshCw } from 'lucide-react'
import { listSessions, revokeSession, type MasSession } from '../lib/masApi'
import { formatDistanceToNow } from 'date-fns'

interface SessionRow {
  id: string
  attributes: MasSession
}

export default function SessionsPage() {
  const auth = useAuth()
  const token = auth.user?.access_token ?? ''

  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revoking, setRevoking] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listSessions(token)
      setSessions(res.data as SessionRow[])
      setTotal(res.meta.count)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this session?')) return
    setRevoking(id)
    try {
      await revokeSession(token, id)
      await load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to revoke session')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Active Sessions</h1>
          <p className="text-sm text-gray-500">{total} total (compat sessions)</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3">Session ID</th>
              <th className="text-left px-4 py-3">User Agent</th>
              <th className="text-left px-4 py-3">Last active</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">Loading…</td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">No sessions found</td>
              </tr>
            ) : (
              sessions.map(({ id, attributes: s }) => (
                <tr key={id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {id.slice(0, 16)}…
                  </td>
                  <td className="px-4 py-3 text-gray-400 max-w-xs truncate text-xs">
                    {s.user_agent ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.last_active_at
                      ? formatDistanceToNow(new Date(s.last_active_at), { addSuffix: true })
                      : '—'
                    }
                  </td>
                  <td className="px-4 py-3">
                    {s.finished_at
                      ? <span className="badge-gray">Ended</span>
                      : <span className="badge-green">Active</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!s.finished_at && (
                      <button
                        title="Revoke session"
                        disabled={revoking === id}
                        className="btn-danger p-1.5"
                        onClick={() => handleRevoke(id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
