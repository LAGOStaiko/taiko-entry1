import { json, methodNotAllowed } from '../../_lib/response.js'
import { requireAdmin } from '../../_lib/auth.js'
import { callGas, pickTokens } from '../../_lib/gas.js'

export async function onRequest(context) {
  if (context.request.method !== 'GET') return methodNotAllowed()

  const guard = requireAdmin(context)
  if (guard) return guard

  const token = pickTokens(context.env, 'admin')
  const res = await callGas(context, { action: 'events.admin', token, payload: {} })
  return json(res)
}
