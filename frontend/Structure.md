```
src/
  app/                      # 앱 전역(루트) 구성요소
    providers/              # 전역 Provider (QueryClient, Store, Theme 등)
    router/                 # 라우터 설정 & 가드(보호 라우트)
    layout/                 # 공통 레이아웃(Header/Sidebar/Footer)
    pwa/                    # service worker, update toasts, install prompts
    index.tsx               # 앱 엔트리 (최소한만)

  shared/                   # 전 기능 공통 재사용 레이어
    ui/                     # 디자인 시스템(버튼, 카드, 입력 등)
    hooks/                  # 범용 훅(useToggle, useDebounce 등)
    lib/                    # 유틸(log, date, number, storage), constants, types
    api/                    # simple-request 래퍼, 인터셉터, 공통 DTO/에러 타입
    store/                  # 전역(아주 제한적으로) 상태: auth, app, theme
    assets/                 # 아이콘, 이미지
    styles/                 # tailwind 설정, tokens, 전역 css

  entities/                 # 엔티티 단위 모델 & 경량 컴포넌트(예: User, Note, Schedule)
    user/
      model/                # 타입, 파서, 엔티티 스키마
      ui/                   # UserAvatar 등 엔티티 표현 컴포넌트
    note/
    schedule/
    ledger/
    chat/

  features/                 # 사용자 행동 단위(로그인, 메모작성, 일정생성 등)
    auth/
      model/                # useAuth(), useSession(), token 로직(리프레시 포함)
      api/                  # /public/login, /public/refresh 연동
      ui/                   # LoginForm, SignupForm, LogoutButton 등
    notes/
      model/                # query key, 캐시 갱신 로직, selection 상태
      api/                  # notes CRUD
      ui/                   # NoteEditor, NoteCard, NoteList, TagChips
    planner/
      model/
      api/                  # schedules CRUD
      ui/                   # CalendarView, ScheduleForm
    ledger/
      model/
      api/                  # entries CRUD, stats
      ui/                   # LedgerTable, BudgetSummary, Charts
    chat/
      model/                # WS 연결 훅, 메시지 상태
      api/                  # history/load
      ui/                   # ChatPanel, MessageItem, InputBar

  pages/                    # 라우트 단위 페이지(얇게 유지, 조립만)
    home/
      index.tsx
    notes/
      index.tsx
      detail.tsx
    planner/
      index.tsx
    ledger/
      index.tsx
    chat/
      index.tsx
    auth/
      login.tsx
      signup.tsx

  tests/                    # 중요 유틸/훅/모델 단위 테스트

```