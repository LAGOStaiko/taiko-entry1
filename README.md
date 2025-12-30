# TAIKO LABS 참가 시스템 (Cloudflare Pages + Apps Script)

이 프로젝트는 **프론트(예쁜 SPA)** 는 Cloudflare Pages에 배포하고,
데이터 저장/조회는 **Google Sheets + Apps Script**로 처리합니다.

- 참가자: /apply (신청), /lookup (조회)
- 운영자: /admin (아카이브) — 관리자 비밀번호 필요

---

## 1) Cloudflare Pages 환경변수 (필수)

Cloudflare Pages → **Settings → Environment variables**에 아래를 추가하세요.

### Production / Preview 둘 다 넣는 걸 추천
- `GAS_WEBAPP_URL` : Apps Script Web App URL (끝이 `/exec`)
- `GAS_PUBLIC_TOKEN` : Apps Script에서 생성한 공개 토큰
- `GAS_ADMIN_TOKEN` : Apps Script에서 생성한 관리자 토큰
- `ADMIN_PASSWORD` : 운영자 아카이브 접속 비밀번호 (직접 정하기)

---

## 2) Build 설정
Cloudflare Pages Build settings:

- Build command: `npm run build`
- Build output directory: `dist`

---

## 3) 로컬 개발(선택)
```bash
npm i
npm run dev
```

---

## 4) API 라우팅 (Cloudflare Functions)
- `GET /api/events`
- `POST /api/submit`
- `POST /api/lookup`
- `GET /api/admin/events` (ADMIN_PASSWORD 필요)
- `GET /api/admin/list` (ADMIN_PASSWORD 필요)
- `POST /api/admin/update` (ADMIN_PASSWORD 필요)
