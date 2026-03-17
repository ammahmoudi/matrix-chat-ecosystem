import { MAS_BASE_URL } from '../config'

export class MasApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(token: string, path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${MAS_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const err = await res.json()
      msg = err.errors?.[0]?.title ?? msg
    } catch {}
    throw new MasApiError(res.status, msg)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface MasUser {
  id: string
  username: string
  locked_at: string | null
  can_request_admin: boolean
  created_at: string
}

export interface MasToken {
  id: string
  token: string
  usage_limit: number | null
  times_used: number
  created_at: string
  expires_at: string | null
}

export interface MasSession {
  id: string
  created_at: string
  last_active_at: string | null
  user_agent: string | null
  finished_at: string | null
}

export interface PageMeta {
  count: number
}

export interface PageLinks {
  next?: string
  prev?: string
}

export interface ListResponse<T> {
  meta: PageMeta
  data: Array<{ id: string; attributes: T; type: string }>
  links: PageLinks
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(
  token: string,
  params?: { filter?: string; after?: string }
): Promise<ListResponse<MasUser>> {
  const q = new URLSearchParams({ 'page[first]': '20' })
  if (params?.filter) q.set('filter[username]', params.filter)
  if (params?.after) q.set('page[after]', params.after)
  return request(token, `/api/admin/v1/users?${q}`)
}

export async function getUser(token: string, id: string): Promise<{ data: { id: string; attributes: MasUser } }> {
  return request(token, `/api/admin/v1/users/${id}`)
}

export async function lockUser(token: string, id: string): Promise<void> {
  return request(token, `/api/admin/v1/users/${id}/lock`, { method: 'POST' })
}

export async function unlockUser(token: string, id: string): Promise<void> {
  return request(token, `/api/admin/v1/users/${id}/unlock`, { method: 'POST' })
}

export async function setAdmin(token: string, id: string, admin: boolean): Promise<void> {
  return request(token, `/api/admin/v1/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ data: { attributes: { can_request_admin: admin } } }),
  })
}

// ── Registration Tokens ───────────────────────────────────────────────────────

export async function listTokens(token: string): Promise<ListResponse<MasToken>> {
  return request(token, '/api/admin/v1/registration-tokens?page[first]=100')
}

export async function createToken(
  token: string,
  opts: { usage_limit?: number; expires_in_secs?: number }
): Promise<{ data: { id: string; attributes: MasToken } }> {
  const body: Record<string, unknown> = {}
  if (opts.usage_limit !== undefined) body.usage_limit = opts.usage_limit
  if (opts.expires_in_secs !== undefined) body.expires_in = opts.expires_in_secs
  return request(token, '/api/admin/v1/registration-tokens', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function deleteToken(token: string, id: string): Promise<void> {
  return request(token, `/api/admin/v1/registration-tokens/${id}`, { method: 'DELETE' })
}

// ── Compat Sessions ───────────────────────────────────────────────────────────

export async function listSessions(
  token: string,
  params?: { after?: string }
): Promise<ListResponse<MasSession>> {
  const q = new URLSearchParams({ 'page[first]': '30' })
  if (params?.after) q.set('page[after]', params.after)
  return request(token, `/api/admin/v1/compat-sessions?${q}`)
}

export async function revokeSession(token: string, id: string): Promise<void> {
  return request(token, `/api/admin/v1/compat-sessions/${id}`, { method: 'DELETE' })
}
