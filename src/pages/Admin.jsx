import React from 'react'
import Alert from '../components/Alert.jsx'
import Modal from '../components/Modal.jsx'
import { apiAdminListEvents, apiAdminList, apiAdminUpdate, normalizeError } from '../api.js'

const STORAGE_KEY = 'taiko_admin_password'

export default function AdminPage() {
  const [adminPassword, setAdminPassword] = React.useState(() => sessionStorage.getItem(STORAGE_KEY) || '')
  const [loginInput, setLoginInput] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const [events, setEvents] = React.useState([])
  const [filters, setFilters] = React.useState({ event_id: '', status: '', q: '' })
  const [alert, setAlert] = React.useState({ type: 'warn', message: '' })

  const [items, setItems] = React.useState([])
  const [total, setTotal] = React.useState(0)

  const [editOpen, setEditOpen] = React.useState(false)
  const [editRow, setEditRow] = React.useState(null)
  const [editStatus, setEditStatus] = React.useState('접수')
  const [editMemo, setEditMemo] = React.useState('')

  const authed = !!adminPassword

  React.useEffect(() => {
    if (!authed) return
    loadEventsAndList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  async function loadEventsAndList() {
    setAlert({ type: 'warn', message: '' })
    setBusy(true)
    try {
      const evRes = await apiAdminListEvents(adminPassword)
      const list = (evRes && evRes.events) ? evRes.events : []
      setEvents(list)
      await refreshList()
    } catch (err) {
      setAlert({ type: 'danger', message: normalizeError(err) })
    } finally {
      setBusy(false)
    }
  }

  async function refreshList(nextFilters) {
    const f = nextFilters || filters
    setAlert({ type: 'warn', message: '' })
    setBusy(true)
    try {
      const res = await apiAdminList(f, adminPassword)
      if (!res || !res.ok) {
        setAlert({ type: 'danger', message: res?.message || '불러오기 실패' })
        return
      }
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      setAlert({ type: 'danger', message: normalizeError(err) })
    } finally {
      setBusy(false)
    }
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY)
    setAdminPassword('')
    setLoginInput('')
    setItems([])
    setEvents([])
    setTotal(0)
    setAlert({ type: 'warn', message: '' })
  }

  function openEdit(row) {
    setEditRow(row)
    setEditStatus(row.status || '접수')
    setEditMemo(row.admin_memo || '')
    setEditOpen(true)
  }

  async function saveEdit() {
    if (!editRow) return
    setBusy(true)
    try {
      const res = await apiAdminUpdate({ app_id: editRow.app_id, status: editStatus, admin_memo: editMemo }, adminPassword)
      if (!res || !res.ok) {
        setAlert({ type: 'danger', message: res?.message || '저장 실패' })
        return
      }
      setAlert({ type: 'success', message: '저장 완료' })
      setEditOpen(false)
      await refreshList()
    } catch (err) {
      setAlert({ type: 'danger', message: normalizeError(err) })
    } finally {
      setBusy(false)
    }
  }

  async function login(e) {
    e.preventDefault()
    const pw = String(loginInput || '').trim()
    if (!pw) return setAlert({ type: 'danger', message: '관리자 비밀번호를 입력해주세요.' })

    // 저장 후 로딩 시도
    sessionStorage.setItem(STORAGE_KEY, pw)
    setAdminPassword(pw)
    setLoginInput('')
  }

  if (!authed) {
    return (
      <div className="card">
        <div className="cardHeader">
          <h1 className="cardTitle">유저 아카이브(관리자)</h1>
          <p className="cardSub">운영자 전용 페이지입니다. 비밀번호가 필요합니다.</p>
        </div>
        <div className="cardBody">
          <Alert type={alert.type} message={alert.message} />
          <form onSubmit={login} className="grid2">
            <div className="field">
              <label className="req">관리자 비밀번호</label>
              <input className="input" type="password" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} />
              <div className="help">이 비밀번호는 Cloudflare 환경변수(ADMIN_PASSWORD)와 일치해야 합니다.</div>
            </div>
            <div className="field" style={{ display: 'flex', alignItems: 'end' }}>
              <button className="btn btnPrimary" type="submit">입장</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div className="cardHeader">
          <div className="rowBetween">
            <div>
              <h1 className="cardTitle">유저 아카이브</h1>
              <p className="cardSub">검색/필터/상태 변경 (총 {total}건)</p>
            </div>
            <div className="actions">
              <button className="btn" onClick={() => refreshList()} disabled={busy}>
                {busy ? <span className="spinner" /> : null}
                새로고침
              </button>
              <button className="btn btnDanger" onClick={logout} disabled={busy}>로그아웃</button>
            </div>
          </div>
        </div>

        <div className="cardBody">
          <Alert type={alert.type} message={alert.message} />

          <div className="grid2">
            <div className="field">
              <label>대회/부문</label>
              <select
                className="select"
                value={filters.event_id}
                onChange={(e) => setFilters((f) => ({ ...f, event_id: e.target.value }))}
              >
                <option value="">전체</option>
                {events.map((ev) => (
                  <option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>상태</label>
              <select
                className="select"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">전체</option>
                <option value="접수">접수</option>
                <option value="확정">확정</option>
                <option value="대기">대기</option>
                <option value="탈락">탈락</option>
                <option value="취소">취소</option>
              </select>
            </div>

            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>검색(코드/동더/디스코드)</label>
              <input
                className="input"
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                placeholder="예: A-8F3K2 / 라고스 / lagos"
              />
              <div className="actions" style={{ marginTop: 10 }}>
                <button className="btn btnPrimary" onClick={() => refreshList(filters)} disabled={busy}>
                  {busy ? <span className="spinner" /> : null}
                  검색
                </button>
                <button className="btn btnGhost" onClick={() => { const cleared = { event_id: '', status: '', q: '' }; setFilters(cleared); refreshList(cleared); }} disabled={busy}>
                  초기화
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14 }} className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>코드</th>
                  <th>대회/부문</th>
                  <th>상태</th>
                  <th>동더</th>
                  <th>디스코드</th>
                  <th>전화</th>
                  <th>접수일</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 18, color: 'var(--muted)' }}>
                      {busy ? '불러오는 중…' : '결과가 없습니다.'}
                    </td>
                  </tr>
                ) : items.map((x) => (
                  <tr key={x.app_id}>
                    <td className="mono">{x.app_code}</td>
                    <td>{x.event_name}</td>
                    <td><span className={'badge badgeStatus-' + String(x.status || '').trim()}>{x.status}</span></td>
                    <td>{x.donder_name}</td>
                    <td>{x.discord}</td>
                    <td>{x.phone_masked}</td>
                    <td>{x.submitted_at}</td>
                    <td>
                      <button className="btn btnGhost" onClick={() => openEdit(x)} disabled={busy}>수정</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="help" style={{ marginTop: 10 }}>
            팁: 운영 중에는 Apps Script 쿼터가 있을 수 있으니, 과도한 새로고침은 피해주세요.
          </div>
        </div>
      </div>

      <Modal
        open={editOpen}
        title="상태/메모 수정"
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <button className="btn" onClick={() => setEditOpen(false)} disabled={busy}>닫기</button>
            <button className="btn btnPrimary" onClick={saveEdit} disabled={busy}>
              {busy ? <span className="spinner" /> : null}
              저장
            </button>
          </>
        }
      >
        {editRow ? (
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>신청 코드</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>{editRow.app_code}</div>

            <div className="divider" />

            <div className="grid2">
              <div className="field">
                <label className="req">상태</label>
                <select className="select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="접수">접수</option>
                  <option value="확정">확정</option>
                  <option value="대기">대기</option>
                  <option value="탈락">탈락</option>
                  <option value="취소">취소</option>
                </select>
              </div>
              <div className="field">
                <label>참고</label>
                <div className="help">상태 변경은 AUDIT_LOG에 기록됩니다.</div>
              </div>

              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>운영 메모(내부)</label>
                <textarea className="textarea" rows={4} value={editMemo} onChange={(e) => setEditMemo(e.target.value)} placeholder="예: 결제 확인 / 장비 특이사항 등" />
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
