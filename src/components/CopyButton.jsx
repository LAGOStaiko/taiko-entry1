import React from 'react'

export default function CopyButton({ text, className = 'btn', children = '복사' }) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 900)
    } catch {
      // clipboard 권한이 막히면 fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 900)
    }
  }

  return (
    <button type="button" className={className} onClick={copy}>
      {copied ? '복사됨!' : children}
    </button>
  )
}
