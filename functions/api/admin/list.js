import { json, methodNotAllowed } from '../../_lib/response.js'
import { requireAdmin } from '../../_lib/auth.js'
import { callGas, pickTokens } from '../../_lib/gas.js'

export async function onRequest(context) {
  if (context.request.method !== 'GET') return methodNotAllowed()

  const guard = requireAdmin(context)
  if (guard) return guard

  const url = new URL(context.request.url)
  const filters = {
    event_id: url.searchParams.get('event_id') || '',
    status: url.searchParams.get('status') || '',
    q: url.searchParams.get('q') || '',
    limit: 300,
    offset: 0,
  }

  const token = pickTokens(context.env, 'admin')
  const res = await callGas(context, { action: 'admin.list', token, payload: filters })
  return json(res)
}
