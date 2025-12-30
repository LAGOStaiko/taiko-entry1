import { json, methodNotAllowed } from '../_lib/response.js'
import { callGas, pickTokens } from '../_lib/gas.js'

export async function onRequest(context) {
  if (context.request.method !== 'GET') return methodNotAllowed()

  const token = pickTokens(context.env, 'public')
  const res = await callGas(context, { action: 'events.public', token, payload: {} })
  return json(res)
}
