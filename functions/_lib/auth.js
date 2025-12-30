import { unauthorized, serverError } from './response.js'

export function requireAdmin(context) {
  const expectedPw = context.env?.ADMIN_PASSWORD
  if (!expectedPw) {
    return serverError('ADMIN_PASSWORD가 설정되지 않았습니다. (Cloudflare Pages → Settings → Environment variables)')
  }
  const auth = context.request.headers.get('authorization') || ''
  const expected = `Bearer ${expectedPw}`
  if (auth !== expected) return unauthorized('관리자 비밀번호가 올바르지 않습니다.')
  return null
}
