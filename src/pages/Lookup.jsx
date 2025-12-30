import React from 'react'
import Alert from '../components/Alert.jsx'
import CopyButton from '../components/CopyButton.jsx'
import { apiLookup, normalizeError } from '../api.js'

export default function LookupPage() {
  const [busy, setBusy] = React.useState(false)
  const [alert, setAlert] = React.useState({ type: 'warn', message: '' })
  const [result, setResult] = React.useState(null)

  const [appCode, setAppCode] = React.useState('')
  const [last4, setLast4] = React.useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setAlert({ type: 'warn', message: '' })
    setResult(null)

    const code = String(appCode || '').trim().toUpperCase()
    const p4 = String(last4 || '').replace(/\D/g, '').slice(-4)

    if (!code) return setAlert({ type: 'danger', message: '신청 코드를 입력해주세요.' })
    if (p4.length !== 4) return setAlert({ type: 'danger', message: '전화번호 뒤 4자리를 정확히 입력해주세요.' })

    setBusy(true)
    try {
      const res = await apiLookup({ app_code: code, phone_last4: p4 })
      if (!res || !res.ok) {
        setAlert({ type: 'warn', message: res?.message || '조회 결과가 없습니다.' })
        return
      }
      setAlert({ type: 'success', message: '조회 성공' })
      setResult(res)
    } catch (err) {
      setAlert({ type: 'danger', message: normalizeError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <div className="cardHeader">
        <h1 className="cardTitle">신청 조회</h1>
        <p className="cardSub">신청 코드 + 전화번호 뒤 4자리로 조회합니다.</p>
      </div>
      <div className="cardBody">
        <Alert type={alert.type} message={alert.message} />

        <form onSubmit={onSubmit}>
          <div className="grid2">
            <div className="field">
              <label className="req">신청 코드</label>
              <input className="input mono" value={appCode} onChange={(e) => setAppCode(e.target.value)} placeholder="A-XXXXX" />
            </div>
            <div className="field">
              <label className="req">전화번호 뒤 4자리</label>
              <input className="input" value={last4} onChange={(e) => setLast4(e.target.value)} inputMode="numeric" maxLength={4} placeholder="1234" />
            </div>
          </div>

          <div className="actions" style={{ marginTop: 14 }}>
            <button className="btn btnPrimary" type="submit" disabled={busy}>
              {busy ? <span className="spinner" /> : null}
              조회
            </button>
            <button className="btn btnGhost" type="button" disabled={busy} onClick={() => { setAppCode(''); setLast4(''); setResult(null); setAlert({ type: 'warn', message: '' }) }}>
              초기화
            </button>
          </div>
        </form>

        {result ? (
          <div style={{ marginTop: 16 }}>
            <div className="divider" />
            <ResultCard result={result} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ResultCard({ result }) {
  const app = result.app || {}
  const user = result.user || {}
  const status = String(app.status || '').trim()

  return (
    <div>
      <div className="rowBetween">
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{app.event_name || '대회/부문'}</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>접수일: {app.submitted_at || '-'}</div>
        </div>
        <div className={'badge badgeStatus-' + status}>{status || '상태'}</div>
      </div>

      <div style={{ marginTop: 12 }} className="grid2">
        <Info label="동더 네임" value={user.donder_name} />
        <Info label="디스코드" value={user.discord} copy />
        <Info label="전화(마스킹)" value={user.phone_masked} />
        <Info label="지역" value={user.region || '-'} />
        <Info label="컨트롤러" value={user.controller || '-'} />
        <Info label="신청 코드" value={app.app_code} copy />
      </div>
    </div>
  )
}

function Info({ label, value, copy }) {
  return (
    <div className="card" style={{ boxShadow: 'none' }}>
      <div className="cardInner" style={{ padding: 14 }}>
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>{label}</div>
        <div className="rowBetween" style={{ marginTop: 6 }}>
          <div style={{ fontWeight: 750 }}>{value || '-'}</div>
          {copy && value ? <CopyButton text={String(value)} className="btn btnGhost">복사</CopyButton> : null}
        </div>
      </div>
    </div>
  )
}
