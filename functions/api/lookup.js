import { json, methodNotAllowed, badRequest } from '../_lib/response.js'
import { callGas, pickTokens } from '../_lib/gas.js'

export async function onRequest(context) {
  if (context.request.method !== 'POST') return methodNotAllowed()

  let body
  try { body = await context.request.json() } catch { return badRequest('JSON 바디가 필요합니다.') }

  const token = pickTokens(context.env, 'public')
  const res = await callGas(context, { action: 'lookup', token, payload: body })
  return json(res)
}
