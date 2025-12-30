import React from 'react'
import Alert from '../components/Alert.jsx'
import CopyButton from '../components/CopyButton.jsx'
import { apiListEvents, apiSubmitApplication, normalizeError } from '../api.js'

export default function ApplyPage() {
  const [events, setEvents] = React.useState([])
  const [eventsLoading, setEventsLoading] = React.useState(true)
  const [selectedId, setSelectedId] = React.useState('')
  const [requiresSecret, setRequiresSecret] = React.useState(false)
  const [notice, setNotice] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const [alert, setAlert] = React.useState({ type: 'warn', message: '' })
  const [doneCode, setDoneCode] = React.useState('')

  const [form, setForm] = React.useState({
    event_id: '',
    name: '',
    phone: '',
    discord: '',
    donder_name: '',
    donder_no: '',
    controller: '',
    region: '',
    secret: '',
    website: '', // honeypot
    agree: false,
  })

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setEventsLoading(true)
        const res = await apiListEvents()
        const list = (res && res.events) ? res.events : []
        if (!mounted) return
        setEvents(list)
        const firstId = list[0]?.event_id || ''
        setSelectedId(firstId)
        setForm((f) => ({ ...f, event_id: firstId }))
        applyEventMeta(firstId, list)
      } catch (err) {
        if (!mounted) return
        setAlert({ type: 'danger', message: normalizeError(err) })
      } finally {
        if (mounted) setEventsLoading(false)
      }
    })()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyEventMeta(id, list = events) {
    const ev = (list || []).find((x) => x.event_id === id)
    setNotice(ev?.notice || '')
    setRequiresSecret(!!ev?.requires_secret)
  }

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setAlert({ type: 'warn', message: '' })

    if (!form.event_id) return setAlert({ type: 'danger', message: '대회/부문을 선택해주세요.' })
    if (!String(form.phone).trim()) return setAlert({ type: 'danger', message: '전화번호를 입력해주세요.' })
    if (!String(form.discord).trim()) return setAlert({ type: 'danger', message: '디스코드를 입력해주세요.' })
    if (!String(form.donder_name).trim()) return setAlert({ type: 'danger', message: '동더 네임을 입력해주세요.' })
    if (requiresSecret && !String(form.secret).trim()) return setAlert({ type: 'danger', message: '신청 비밀번호를 입력해주세요.' })
    if (!form.agree) return setAlert({ type: 'danger', message: '개인정보 수집/이용 동의가 필요합니다.' })

    setBusy(true)
    try {
      const payload = { ...form }
      // agree/폼 내부 표시용 값은 서버에 보내도 되지만, 깔끔하게 제거
      delete payload.agree

      const res = await apiSubmitApplication(payload)
      if (!res || !res.ok) {
        setAlert({ type: 'danger', message: res?.message || '신청에 실패했어요.' })
        return
      }
      setAlert({ type: 'success', message: res.message || '신청이 완료되었습니다.' })
      setDoneCode(res.app_code || '')
    } catch (err) {
      setAlert({ type: 'danger', message: normalizeError(err) })
    } finally {
      setBusy(false)
    }
  }

  const showForm = !doneCode

  return (
    <>
      <div className="card">
        <div className="cardHeader">
          <h1 className="cardTitle">참가 신청</h1>
          <p className="cardSub">제출하면 신청 코드가 발급됩니다. (조회 페이지에서 확인 가능)</p>
        </div>
        <div className="cardBody">
          <Alert type={alert.type} message={alert.message} />

          {showForm ? (
            <form onSubmit={onSubmit}>
              <div className="grid2">
                <div className="field">
                  <label className="req">대회/부문</label>
                  <select
                    className="select"
                    value={selectedId}
                    disabled={eventsLoading}
                    onChange={(e) => {
                      const id = e.target.value
                      setSelectedId(id)
                      update('event_id', id)
                      applyEventMeta(id)
                    }}
                  >
                    {events.map((ev) => (
                      <option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>
                    ))}
                  </select>
                  <div className="help">{eventsLoading ? '불러오는 중…' : (notice || ' ')}</div>
                </div>

                <div className="field" style={{ display: 'none' }}>
                  <label>Website</label>
                  <input className="input" value={form.website} onChange={(e) => update('website', e.target.value)} />
                </div>

                <div className="field">
                  <label>이름</label>
                  <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="선택" />
                </div>

                <div className="field">
                  <label className="req">전화번호</label>
                  <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="숫자만" />
                  <div className="help">저장은 원문, 화면 표시는 마스킹 처리됩니다.</div>
                </div>

                <div className="field">
                  <label className="req">디스코드</label>
                  <input className="input" value={form.discord} onChange={(e) => update('discord', e.target.value)} placeholder="예: lagos#0000" />
                </div>

                <div className="field">
                  <label className="req">동더 네임</label>
                  <input className="input" value={form.donder_name} onChange={(e) => update('donder_name', e.target.value)} />
                </div>

                <div className="field">
                  <label>동더 번호</label>
                  <input className="input" value={form.donder_no} onChange={(e) => update('donder_no', e.target.value)} placeholder="선택" />
                </div>

                <div className="field">
                  <label>컨트롤러</label>
                  <input className="input" value={form.controller} onChange={(e) => update('controller', e.target.value)} placeholder="예: 타타콘/조이콘/터치" />
                </div>

                <div className="field">
                  <label>지역</label>
                  <input className="input" value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="선택" />
                </div>

                {requiresSecret ? (
                  <div className="field">
                    <label className="req">신청 비밀번호</label>
                    <input className="input" value={form.secret} onChange={(e) => update('secret', e.target.value)} />
                    <div className="help">이 값은 대회 운영자만 알고 있는 코드입니다.</div>
                  </div>
                ) : (
                  <div />
                )}
              </div>

              <div className="divider" />

              <div className="checkboxRow">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => update('agree', e.target.checked)}
                  id="agree"
                />
                <label htmlFor="agree" className="req">
                  개인정보 수집/이용에 동의합니다.
                  <div className="help">대회 운영 및 안내 목적. (연락/신원 확인 최소 범위)</div>
                </label>
              </div>

              <div className="actions" style={{ marginTop: 14 }}>
                <button className="btn btnPrimary" type="submit" disabled={busy || eventsLoading}>
                  {busy ? <span className="spinner" /> : null}
                  신청 제출
                </button>
                <button className="btn btnGhost" type="button" disabled={busy} onClick={() => window.location.reload()}>
                  새로고침
                </button>
              </div>
            </form>
          ) : (
            <DoneCard code={doneCode} />
          )}
        </div>
      </div>
    </>
  )
}

function DoneCard({ code }) {
  return (
    <div>
      <div className="rowBetween">
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>신청 완료</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>아래 코드를 복사해두세요.</div>
        </div>
        <CopyButton text={code} className="btn">코드 복사</CopyButton>
      </div>

      <div style={{ marginTop: 14 }} className="codeBox">{code}</div>

      <div className="actions" style={{ marginTop: 14 }}>
        <a className="btn btnPrimary" href="/lookup">조회 페이지로 이동</a>
        <a className="btn" href="/apply" onClick={(e) => { e.preventDefault(); window.location.reload() }}>다른 신청</a>
      </div>
    </div>
  )
}
