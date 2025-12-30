import React from 'react'

export default function Modal({ open, title, children, footer, onClose }) {
  React.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3>{title}</h3>
          <button className="xBtn" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <div className="modalBody">{children}</div>
        <div className="modalFooter">{footer}</div>
      </div>
    </div>
  )
}
