import React from 'react'
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import ApplyPage from './pages/Apply.jsx'
import LookupPage from './pages/Lookup.jsx'
import AdminPage from './pages/Admin.jsx'

function TopNav() {
  const linkClass = ({ isActive }) => (isActive ? 'navLink navLinkActive' : 'navLink')
  return (
    <div className="header">
      <div className="brand">
        <div className="brandMark" aria-hidden="true" />
        <div>
          <div className="brandTitle">TAIKO LABS</div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>참가 신청 · 조회 · 아카이브</div>
        </div>
      </div>
      <nav className="nav" aria-label="primary">
        <NavLink to="/apply" className={linkClass}>신청</NavLink>
        <NavLink to="/lookup" className={linkClass}>조회</NavLink>
        <NavLink to="/admin" className={linkClass}>아카이브</NavLink>
      </nav>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="container">
      <ScrollToTop />
      <TopNav />

      <Routes>
        <Route path="/" element={<Navigate to="/apply" replace />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/lookup" element={<LookupPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <div className="footerNote">
        운영 팁: URL만 공유하면 바로 신청/조회가 가능해요. (아카이브는 관리자 비밀번호 필요)
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="card">
      <div className="cardInner">
        <h2 className="cardTitle" style={{ marginTop: 0 }}>페이지를 찾을 수 없어요</h2>
        <p className="cardSub">링크가 잘못됐거나 페이지가 이동했을 수 있어요.</p>
        <div className="actions" style={{ marginTop: 12 }}>
          <NavLink className="btn btnPrimary" to="/apply">신청으로</NavLink>
          <NavLink className="btn" to="/lookup">조회로</NavLink>
        </div>
      </div>
    </div>
  )
}
