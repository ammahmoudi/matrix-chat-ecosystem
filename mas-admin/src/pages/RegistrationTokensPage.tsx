import { useState, useEffect, useCallback } from 'react'
import { useAuth } from 'react-oidc-context'
import { Plus, Trash2, Copy, RefreshCw, Check } from 'lucide-react'
import { listTokens, createToken, deleteToken, type MasToken } from '../lib/masApi'
import { formatDistanceToNow, isPast } from 'date-fns'

interface TokenRow {
  id: string
  attributes: MasToken
}

export default function RegistrationTokensPage() {
  const auth = useAuth()
  const token = auth.user?.access_token ?? ''

  const [tokens, setTokens] = useState<TokenRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // New token form
  const [usageLimit, setUsageLimit] = useState<string>('1')
  const [expiryDays, setExpiryDays] = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listTokens(token)
      setTokens(res.data as TokenRow[])
      setTotal(res.meta.count)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load tokens')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    setCreating(true)
    try {
      const usage = usageLimit === '' ? undefined : parseInt(usageLimit)
      const expires = expiryDays === '' ? undefined : parseInt(expiryDays) * 86400
      await createToken(token, { usage_limit: usage, expires_in_secs: expires })
      setUsageLimit('1')
      setExpiryDays('')
      await load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to create token')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string, t: string) {
    if (!confirm(`Delete token ${t.slice(0, 12)}…?`)) return
    try {
      await deleteToken(token, id)
      await load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete token')
    }
  }

  function copyLink(t: string) {
    const url = `${window.location.protocol}//${window.location.host.replace('matrix.mamood.ir:8080', 'chat.mamood.ir')}/#/register?registration_token=${t}`
    navigator.clipboard.writeText(url)
    setCopied(t)
    setTimeout(() => setCopied(null), 2000)
  }

  const registrationBase = window.location.origin.includes('matrix.mamood.ir')
    ? 'https://chat.mamood.ir'
    : window.location.origin

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Registration Tokens</h1>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Create form */}
      <div className="card space-y-3">
        <h2 className="text-sm font-medium">Create New Token</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-32">
            <label className="text-xs text-gray-500 mb-1 block">Max uses (blank = unlimited)</label>
            <input
              type="number"
              min="1"
              className="input"
              placeholder="e.g. 1"
              value={usageLimit}
              onChange={e => setUsageLimit(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-32">
            <label className="text-xs text-gray-500 mb-1 block">Expires in days (blank = never)</label>
            <input
              type="number"
              min="1"
              className="input"
              placeholder="e.g. 7"
              value={expiryDays}
              onChange={e => setExpiryDays(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              className="btn-primary"
              disabled={creating}
              onClick={handleCreate}
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3">Token</th>
              <th className="text-left px-4 py-3">Uses</th>
              <th className="text-left px-4 py-3">Expires</th>
              <th className="text-left px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">Loading…</td>
              </tr>
            ) : tokens.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">No tokens yet</td>
              </tr>
            ) : (
              tokens.map(({ id, attributes: t }) => {
                const expired = t.expires_at ? isPast(new Date(t.expires_at)) : false
                const exhausted = t.usage_limit !== null && t.times_used >= t.usage_limit
                const inactive = expired || exhausted
                return (
                  <tr key={id} className={`hover:bg-gray-800/50 transition-colors ${inactive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs max-w-xs truncate">
                      {t.token}
                    </td>
                    <td className="px-4 py-3">
                      {t.usage_limit === null
                        ? <span className="badge-gray">{t.times_used} / ∞</span>
                        : <span className={exhausted ? 'badge-red' : 'badge-green'}>{t.times_used} / {t.usage_limit}</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {t.expires_at
                        ? expired
                          ? <span className="badge-red">Expired</span>
                          : formatDistanceToNow(new Date(t.expires_at), { addSuffix: true })
                        : '—'
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          title="Copy registration link"
                          className="btn-secondary p-1.5"
                          onClick={() => copyLink(t.token)}
                        >
                          {copied === t.token
                            ? <Check className="w-3.5 h-3.5 text-green-400" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </button>
                        <button
                          title="Delete"
                          className="btn-danger p-1.5"
                          onClick={() => handleDelete(id, t.token)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600">
        Registration link format: <span className="font-mono">{registrationBase}/#/register?registration_token=TOKEN</span>
      </p>
    </div>
  )
}
