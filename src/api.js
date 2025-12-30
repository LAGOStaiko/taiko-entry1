function normalizeError(err) {
  if (!err) return '알 수 없는 오류'
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message || '오류'
  return String(err)
}

async function requestJson(path, { method = 'GET', body, adminPassword } = {}) {
  const headers = { 'Accept': 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (adminPassword) headers['Authorization'] = `Bearer ${adminPassword}`

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Cloudflare error pages can be HTML; try best-effort JSON parse
  const text = await res.text()
  let json
  try { json = text ? JSON.parse(text) : null } catch { json = null }

  if (!res.ok) {
    const msg = (json && json.message) ? json.message : `요청 실패 (${res.status})`
    const e = new Error(msg)
    e.status = res.status
    e.payload = json
    throw e
  }

  return json
}

export async function apiListEvents() {
  return requestJson('/api/events')
}

export async function apiSubmitApplication(payload) {
  return requestJson('/api/submit', { method: 'POST', body: payload })
}

export async function apiLookup(payload) {
  return requestJson('/api/lookup', { method: 'POST', body: payload })
}

export async function apiAdminListEvents(adminPassword) {
  return requestJson('/api/admin/events', { adminPassword })
}

export async function apiAdminList(filters, adminPassword) {
  const qs = new URLSearchParams()
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') qs.set(k, String(v))
  })
  return requestJson('/api/admin/list?' + qs.toString(), { adminPassword })
}

export async function apiAdminUpdate(payload, adminPassword) {
  return requestJson('/api/admin/update', { method: 'POST', body: payload, adminPassword })
}

export { normalizeError }
