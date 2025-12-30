export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  })
}

export function methodNotAllowed() {
  return json({ ok: false, message: 'Method not allowed' }, 405)
}

export function badRequest(message = 'Bad request') {
  return json({ ok: false, message }, 400)
}

export function unauthorized(message = 'Unauthorized') {
  return json({ ok: false, message }, 401, { 'www-authenticate': 'Bearer' })
}

export function serverError(message = 'Server error') {
  return json({ ok: false, message }, 500)
}
