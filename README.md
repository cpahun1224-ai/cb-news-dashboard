# CB Daily Brief - 기업신용평가·AI금융 트렌드 뉴스레터

CB 본부장용 **기업신용평가, 기업여신, AI금융 트렌드** 자동 뉴스 수집 및 뉴스레터 시스템입니다.

---

## 📋 주요 기능

- ✅ RSS 자동 뉴스 수집 (국내/글로벌/리포트)
- ✅ 키워드 기반 관련성 점수 필터링
- ✅ AI 요약 및 인사이트 생성 (OpenAI/Claude 선택)
- ✅ 이메일 뉴스레터 자동 발송
- ✅ 임원 보고용 금융 대시보드 UI
- ✅ 관리자 페이지 (RSS 소스, 키워드, 설정 관리)
- ✅ Vercel Cron으로 매일 자동 수집/발송

---

## 🚀 설치 방법 (초보자용)

### 1단계: Node.js 설치

[https://nodejs.org](https://nodejs.org) 에서 LTS 버전 설치

설치 확인:
```bash
node --version  # v18 이상이어야 함
npm --version
```

### 2단계: 프로젝트 폴더로 이동

```bash
cd cb-news-dashboard
```

### 3단계: 패키지 설치

```bash
npm install
```
(2~5분 소요, 기다리세요)

---

## 🗄️ Supabase 설정

### 1. Supabase 계정 생성
1. [https://supabase.com](https://supabase.com) 접속 → Sign Up
2. New Project 클릭
3. 프로젝트 이름: `cb-news` 입력
4. 비밀번호 설정 (기억해두세요!)
5. Region: **Northeast Asia (Seoul)** 선택
6. Create Project 클릭 (약 2분 대기)

### 2. 데이터베이스 테이블 생성
1. Supabase 대시보드 → **SQL Editor** 클릭
2. `New query` 클릭
3. `supabase/schema.sql` 파일 전체 내용을 복사해서 붙여넣기
4. **Run** 버튼 클릭
5. "Success" 메시지 확인

### 3. API 키 확인
1. Supabase 대시보드 → **Settings** → **API**
2. 다음 두 값을 복사해두기:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

---

## ⚙️ 환경변수 설정

프로젝트 폴더에서:

```bash
cp .env.local.example .env.local
```

텍스트 편집기로 `.env.local` 파일 열기:

```env
# 필수 - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# 선택 - AI 요약 (없으면 AI 기능 비활성화)
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=anthropic

# 선택 - 이메일 발송 (없으면 이메일 기능 비활성화)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Gmail 앱 비밀번호

# 보안키 (아무 문자나 입력)
CRON_SECRET=my-secret-key-1234

# 앱 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Gmail 앱 비밀번호 만들기
1. Google 계정 → **보안** → **2단계 인증** 활성화
2. Google 계정 → **보안** → **앱 비밀번호**
3. 앱 선택: "기타(직접 입력)" → "CB뉴스레터" 입력
4. 생성된 16자리 비밀번호를 `SMTP_PASSWORD`에 입력

---

## ▶️ 로컬 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 처음 뉴스 수집하기
1. 웹사이트 접속
2. 상단 헤더의 **"즉시 수집"** 버튼 클릭
3. 1~2분 대기
4. 화면에 뉴스가 나타나면 성공!

---

## 🌐 Vercel 배포

### 1. GitHub에 코드 올리기
```bash
git init
git add .
git commit -m "첫 번째 커밋"
git branch -M main
git remote add origin https://github.com/내-아이디/cb-news.git
git push -u origin main
```

### 2. Vercel 연결
1. [https://vercel.com](https://vercel.com) 접속 → GitHub으로 로그인
2. **New Project** → GitHub 저장소 선택
3. **Import** 클릭

### 3. 환경변수 설정
Vercel 프로젝트 → **Settings** → **Environment Variables**에서
`.env.local`의 모든 내용을 추가 (하나씩 입력)

### 4. 배포
**Deploy** 클릭 → 2~3분 후 배포 완료!

배포된 URL을 `NEXT_PUBLIC_APP_URL`에 업데이트:
```
NEXT_PUBLIC_APP_URL=https://cb-news-xxxxx.vercel.app
```

---

## ⏰ 자동 수집/발송 설정

`vercel.json`에 이미 설정되어 있습니다:

```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "0 22 * * *"
  }]
}
```

- `0 22 * * *` = 매일 UTC 22:00 = **한국 시간 오전 7:00**
- 매일 아침 7시에 자동으로 뉴스를 수집하고 이메일을 발송합니다.

### 발송 시각 변경 방법
```
"schedule": "0 23 * * *"  → 한국 08:00
"schedule": "0 0 * * *"   → 한국 09:00
"schedule": "30 22 * * *" → 한국 07:30
```
[Cron 표현식 도우미](https://crontab.guru/)

---

## 🔧 오류 해결 가이드

### ❌ "Supabase 환경변수가 설정되지 않았습니다"
→ `.env.local` 파일이 있는지 확인하고, URL과 키를 올바르게 입력했는지 확인

### ❌ RSS 수집 오류
→ Google News RSS URL은 인코딩된 한글이 포함됩니다. 관리자 페이지에서 소스를 확인하세요.
→ 방화벽이나 VPN 때문에 RSS 접근이 막힐 수 있습니다.

### ❌ 이메일 발송 실패
1. Gmail 2단계 인증이 활성화되어 있는지 확인
2. 앱 비밀번호를 사용했는지 확인 (일반 비밀번호 X)
3. `SMTP_USER`와 앱 비밀번호를 만든 계정이 같은지 확인

### ❌ AI 분석이 없음
→ 정상입니다. `.env.local`에 `ANTHROPIC_API_KEY` 또는 `OPENAI_API_KEY`를 추가하면 됩니다.
→ API 키 없이도 뉴스 수집은 정상 동작합니다.

### ❌ "Module not found" 오류
```bash
rm -rf node_modules
npm install
```

### ❌ TypeScript 타입 오류
```bash
npm run build
```
오류 메시지를 확인하고, 주로 import 경로 문제입니다.

---

## 📱 화면 구성

| 화면 | URL | 설명 |
|------|-----|------|
| 대시보드 | `/` | 오늘의 주요 뉴스, 통계, 카테고리별 목록 |
| 뉴스 상세 | `/news/[id]` | 요약, CB 인사이트, 액션 아이디어 |
| 관리자 | `/admin` | 설정, RSS 소스, 키워드, 발송 로그 |
| 뉴스레터 미리보기 | `/api/newsletter/preview` | 이메일 발송 전 미리보기 |

---

## 🏗️ 프로젝트 구조

```
cb-news-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 대시보드
│   │   ├── admin/page.tsx        # 관리자
│   │   ├── news/[id]/page.tsx    # 뉴스 상세
│   │   └── api/
│   │       ├── collect/          # RSS 수집
│   │       ├── news/             # 뉴스 조회/수정
│   │       ├── newsletter/       # 이메일 발송/미리보기
│   │       ├── cron/             # 자동 수집 (Vercel Cron)
│   │       ├── settings/         # 앱 설정
│   │       ├── sources/          # RSS 소스 관리
│   │       └── keywords/         # 키워드 관리
│   ├── components/
│   │   ├── Header.tsx            # 헤더 (네비게이션, 즉시 수집)
│   │   ├── NewsCard.tsx          # 뉴스 카드 UI
│   │   ├── NewsFilter.tsx        # 필터 바
│   │   └── DashboardStats.tsx    # 통계 카드
│   ├── lib/
│   │   ├── supabase.ts           # Supabase 클라이언트 (브라우저)
│   │   ├── supabase-server.ts    # Supabase 클라이언트 (서버)
│   │   ├── rss.ts                # RSS 수집 로직
│   │   ├── ai.ts                 # AI 분석 (OpenAI/Claude)
│   │   ├── email.ts              # 이메일 생성/발송
│   │   └── relevance.ts          # 관련성 점수 계산
│   └── types/index.ts            # TypeScript 타입 정의
├── supabase/schema.sql            # 데이터베이스 스키마
├── vercel.json                    # Vercel Cron 설정
├── .env.local.example             # 환경변수 예시
└── README.md
```

---

## 💡 추가 개선 아이디어

- [ ] 뉴스 저장 즐겨찾기 기능
- [ ] 주간 리포트 자동 생성
- [ ] Slack/Teams 알림 연동
- [ ] 뉴스 트렌드 차트 (Chart.js)
- [ ] 모바일 PWA 지원
