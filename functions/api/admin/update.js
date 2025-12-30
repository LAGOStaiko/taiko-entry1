import { json, methodNotAllowed, badRequest } from '../../_lib/response.js'
import { requireAdmin } from '../../_lib/auth.js'
import { callGas, pickTokens } from '../../_lib/gas.js'

export async function onRequest(context) {
  if (context.request.method !== 'POST') return methodNotAllowed()

  const guard = requireAdmin(context)
  if (guard) return guard

  let body
  try { body = await context.request.json() } catch { return badRequest('JSON 바디가 필요합니다.') }

  const token = pickTokens(context.env, 'admin')
  const res = await callGas(context, { action: 'admin.update', token, payload: body })
  return json(res)
}
