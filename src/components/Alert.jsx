import React from 'react'

export default function Alert({ type = 'warn', message }) {
  if (!message) return null
  const cls =
    type === 'success' ? 'alert alertSuccess' :
    type === 'danger' ? 'alert alertDanger' :
    type === 'warn' ? 'alert alertWarn' : 'alert'

  return <div className={cls} role="alert">{message}</div>
}
