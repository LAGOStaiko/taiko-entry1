import { serverError } from './response.js'

export async function callGas(context, { action, token, payload }) {
  const url = context.env?.GAS_WEBAPP_URL
  if (!url) return { ok: false, message: 'GAS_WEBAPP_URL이 설정되지 않았습니다.' }

  const body = JSON.stringify({ action, token, payload })

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    })
  } catch (err) {
    return { ok: false, message: 'GAS 호출 실패: ' + (err?.message || String(err)) }
  }

  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    // GAS가 오류 HTML을 반환한 경우
    return { ok: false, message: 'GAS 응답이 JSON이 아닙니다.', raw: text.slice(0, 500) }
  }
}

export function pickTokens(env, kind) {
  const pub = env?.GAS_PUBLIC_TOKEN
  const adm = env?.GAS_ADMIN_TOKEN
  if (kind === 'admin') return adm
  return pub
}

export function assertTokenConfigured(env) {
  if (!env?.GAS_WEBAPP_URL) return serverError('GAS_WEBAPP_URL이 설정되지 않았습니다.')
  if (!env?.GAS_PUBLIC_TOKEN) return serverError('GAS_PUBLIC_TOKEN이 설정되지 않았습니다.')
  if (!env?.GAS_ADMIN_TOKEN) return serverError('GAS_ADMIN_TOKEN이 설정되지 않았습니다.')
  return null
}
