# 🌤️ DAILYON 기능 기획 및 시스템 설계 문서

> **프로젝트명:** Dailyon  
> **의미:** Daily + On → “매일 켜지는 일상 관리 플랫폼”  
> **목표:**  
> 일정, 메모, 대화, 가계부를 하나의 플랫폼에서 관리하고  
> AI가 자동으로 요약·분류·추천해주는 생활형 어시스턴트 구축

---

## 🏗️ 1. 서비스 개요

| 항목 | 내용 |
|------|------|
| **개발 목적** | 개인의 일상 데이터를 효율적으로 기록하고 관리하며, AI가 이를 요약·제안하는 자동화된 라이프 매니저 제공 |
| **플랫폼** | PWA 기반 웹앱 (Android, iOS, Desktop 모두 지원) |
| **개발 스택** | React + Vite + TypeScript + Tailwind + NestJS + MySQL + Redis |
| **AI 구조** | Local 3B (AWS EC2) + Cloud 7B 모델 하이브리드 |
| **Infra** | AWS Free Tier (EC2 t4g.small, S3, CloudFront, Route53) |
| **보안** | JWT + Refresh Token + HTTPS + S3 암호화 |

---

## 💬 2. 채팅 시스템

### 2.1 개요
AI 및 사용자 간 대화, 일정·메모·가계부 공유 중심의 커뮤니케이션 허브.

### 2.2 요구사항
| 항목 | 내용 |
|------|------|
| **실시간 통신** | WebSocket (NestJS Gateway 기반) |
| **대화 유형** | ① 개인채팅 ② AI챗 ③ 공유방 (캘린더용) |
| **메시지 타입** | 텍스트, 이미지, 파일, 일정 카드, 지도 링크 |
| **파일 업로드** | AWS S3, 20MB 제한, 썸네일 생성 |
| **상태 표시** | 송신/수신/읽음 상태 |
| **AI 연동** | “오늘 일정 요약해줘”, “이번주 가계부 리포트 보여줘” |
| **검색/요약** | 키워드 검색 + AI 기반 요약 검색 |
| **보안** | JWT + WS 인증, 메시지 암호화 |

---

## 🗒️ 3. 메모 / 포스팅 시스템

### 3.1 개요
일기, 주식 분석, 공부 노트 등 다양한 포맷의 메모 작성 및 자동 요약.

### 3.2 요구사항
| 항목 | 내용 |
|------|------|
| **에디터** | Markdown 지원, 이미지/파일 첨부, 인라인 미리보기 |
| **동적 폼 구조** | JSON 스키마 기반 입력폼 (예: 주식, 일상, 공부 등) |
| **템플릿** | 사용자 지정 템플릿 저장/불러오기 |
| **AI 요약** | 본문 자동 요약 + 키워드/태그 생성 |
| **버전 관리** | 수정 시 diff 비교 가능 |
| **검색/필터** | 제목, 태그, 카테고리, 기간 필터링 |
| **공개 범위** | 개인 / 일부공개 / 전체공개 |
| **관계형 연결** | 일정, 가계부, 채팅과 상호 연결 |
| **AI 확장** | 문장 교정, 감정 분석, 주제 추천 |

---

## 📆 4. 캘린더 / 플래너 시스템

### 4.1 개요
일정 등록, 지도 마커, 주소 API, 공유 기능 포함한 플래너 모듈.

### 4.2 요구사항
| 항목 | 내용 |
|------|------|
| **UI 구조** | 월/주/일 보기, 드래그로 일정 생성 및 이동 |
| **일정 데이터** | 제목, 내용, 시작/종료시간, 위치, 메모 참조 |
| **지도 연동** | Kakao Maps API로 위치 마커 표시 |
| **주소 자동완성** | Daum 주소 API로 표준 주소 관리 |
| **AI 일정 등록** | “토요일 3시에 카페 약속 잡아줘” → 자동 일정화 |
| **공유 기능** | 일정 카드 채팅 공유 → 상대방 일정 자동 반영 |
| **알림 기능** | 푸시 알림 (로컬 + 이메일) |
| **반복 루틴** | 매일/주간/월간 일정 반복 |
| **감정 기록** | 일정 종료 시 감정 이모지 기록 |
| **통계 리포트** | 일정 완료율, 카테고리별 시간 비율 시각화 |

---

## 💰 5. 가계부 시스템

### 5.1 개요
수입/지출 내역 관리 및 AI 자동 요약 리포트 제공.

### 5.2 요구사항
| 항목 | 내용 |
|------|------|
| **기본 항목** | 날짜, 금액, 분류, 결제수단, 메모, 태그 |
| **통계 시각화** | Pie / Line Chart 기반 지출 비중 |
| **AI 분석** | “이번달 외식비 30% 증가” 자동 리포트 |
| **예산 관리** | 월별 예산 설정 및 초과 알림 |
| **OCR 입력 (확장)** | 영수증 이미지 → OCR 자동 입력 |
| **AI 질의** | “지난주 교통비 얼마 썼어?” → 자연어 검색 |
| **공유 가계부** | 커플/가족 단위 공유 가능 |
| **데이터 내보내기** | CSV 백업 및 다운로드 |
| **보안** | 서버단 암호화 + 사용자별 데이터 격리 |

---

## 🤖 6. AI 어시스턴트 구조

### 6.1 설계 개요
로컬 3B + 클라우드 7B 모델을 활용한 하이브리드 AI 라우팅 구조.

### 6.2 역할 분담
| 항목 | 로컬 (3B) | 클라우드 (7B+) |
|------|-------------|----------------|
| **용도** | 요약, 태깅, 짧은 응답 | 복합 reasoning, 일정 제안, 감정 분석 |
| **환경** | AWS EC2 t4g.small (4-bit 양자화) | API 연동 (Ollama / OpenRouter) |
| **성능 목표** | 2GB RAM 내 추론, 단문 응답 | 고품질 대화형 분석 |
| **컨텍스트 제한** | 1K tokens 이하 | 8K~32K tokens |

### 6.3 데이터 흐름
```plaintext
사용자 입력
 ├─ 단문 (요약/태그) → Local AI
 ├─ 복합 질의 (추천/분석) → Cloud AI
 └─ 결과 저장 → Redis + MySQL
```

# 🌐 7. PWA (Progressive Web App)

### 7.1 개요
Dailyon은 React 기반 웹앱을 **iOS / Android / Desktop** 환경 모두에서  
설치형 앱처럼 사용할 수 있도록 PWA(Progressive Web App) 기술을 적용한다.  
이는 별도의 하이브리드(React Native, Flutter 등) 코드를 작성하지 않고  
웹 기술만으로도 네이티브 앱 수준의 경험을 제공하기 위함이다.

---

### 7.2 구성 요소
| 파일 | 설명 |
|------|------|
| **manifest.json** | 앱 이름, 색상, 아이콘, 시작 경로, 디스플레이 모드 정의 |
| **service-worker.js** | 캐시 관리, 오프라인 접근, 푸시 알림 및 업데이트 감지 |
| **vite-plugin-pwa** | Vite 빌드 시 PWA 구성 자동화 플러그인 |
| **firebase-messaging.js** | 푸시 알림 전송용 Firebase 클라이언트 설정 파일 |

---

### 7.3 주요 기능 명세
| 기능 | 설명 |
|------|------|
| **홈 화면 설치** | Android는 완벽 지원, iOS는 Safari 16.4 이상부터 Add to Home 지원 |
| **오프라인 접근** | Service Worker가 HTML, JS, 이미지, 메모/일정 데이터를 캐싱 |
| **푸시 알림** | 일정 리마인더, 가계부 초과 알림, AI 리포트 도착 알림 |
| **자동 업데이트** | 새로운 버전 배포 시 자동 새로고침 유도 |
| **아이콘 및 테마** | `512x512` 및 `192x192` 아이콘, theme_color와 background_color 지정 |
| **HTTPS 필수** | PWA 및 Service Worker는 HTTPS 환경에서만 동작 |

---

### 7.4 설치 UX
- 첫 접속 시 `manifest.json`을 감지하여 “홈 화면에 추가” 안내  
- 설치 후 전체화면 모드(`display: standalone`)로 동작  
- 푸시 알림 허용 시, 예약 일정 및 분석 리포트 자동 알림 가능  

---

## ⚙️ 8. 시스템 구조 및 모듈 구성

### 8.1 백엔드 모듈 구조 (NestJS)
| 모듈 | 역할 |
|------|------|
| **AuthModule** | 로그인, JWT 발급, Refresh Token, Role Guard |
| **UserModule** | 회원 프로필, 환경설정 관리 |
| **NoteModule** | 메모 CRUD, 템플릿, 버전 관리 |
| **CalendarModule** | 일정 등록, 조회, 공유, 알림 |
| **LedgerModule** | 가계부 CRUD 및 통계 리포트 |
| **ChatModule** | WebSocket 채팅, 파일 전송, AI 대화 |
| **AiModule** | Local/Cloud AI 라우팅, 캐싱, 요청 필터링 |
| **CommonModule** | 공통 DTO, ExceptionFilter, 응답 통일 구조 |

---

### 8.2 프론트엔드 구조 (React + Vite)
| 디렉터리 | 설명 |
|-----------|------|
| **/src/pages** | 주요 페이지 단위 컴포넌트 (Home, Notes, Planner, Ledger, Chat 등) |
| **/src/components** | UI 컴포넌트, 버튼, 카드, 모달, 폼 요소 등 |
| **/src/store** | Zustand 전역 상태 관리 (auth, theme, notifications 등) |
| **/src/api** | `simple-request` 기반 API Layer (fetch + interceptor) |
| **/src/hooks** | React Query / Custom Hook (AI 호출, 데이터 캐시 등) |
| **/src/styles** | Tailwind theme token, radius, color, typography 정의 |
| **/src/assets** | 이미지 및 아이콘 |
| **/public/icons** | PWA 앱 아이콘 리소스 |
| **/public/manifest.json** | PWA 메타데이터 파일 |

---

### 8.3 상태 관리 및 공통 로직
| 모듈 | 역할 |
|------|------|
| **Zustand Store** | 유저 정보, 테마, 알림 상태 등 관리 |
| **React Query** | API 캐싱 및 요청 상태 관리 |
| **Router System** | React Router DOM v6 기반 페이지 라우팅 |
| **Theme Tokens** | 색상/폰트/반경/그림자 등 통일된 디자인 토큰 적용 |
| **Responsive Design** | 480~1440px 범위 모바일 퍼스트 반응형 레이아웃 |

---

## 🔒 9. 보안 및 개인정보 보호 정책

| 구분 | 내용 |
|------|------|
| **통신 보안** | HTTPS + HSTS 적용 |
| **인증 구조** | JWT + Refresh Token Rotation 전략 |
| **비밀번호 보호** | bcrypt 해싱 |
| **데이터 암호화** | S3 객체 암호화, MySQL 내 민감정보 비식별화 |
| **AI 데이터 처리** | 로컬 3B 모델은 사용자 데이터 외부 전송 금지 |
| **역할 기반 접근 제어** | Role Guard (Admin, User, Guest) |
| **백업 정책** | 주 1회 자동 백업 + 로그 보존 30일 |
| **로그 관리** | Winston + CloudWatch Logs 연동 |
| **개인정보 접근 제한** | 관리자도 개인 데이터 열람 불가 (masking 처리) |

---

## 🧭 10. 운영 및 배포 전략

| 구분 | 내용 |
|------|------|
| **환경** | AWS EC2 Free Tier (t4g.small, Ubuntu 22.04) |
| **도커 구성** | Backend / Frontend / Redis / MySQL Compose 배포 |
| **CI/CD** | GitHub Actions → EC2 배포 자동화 |
| **Reverse Proxy** | Nginx + SSL (Let's Encrypt) |
| **캐시/세션** | Redis 기반 세션 및 임시 저장소 |
| **도메인** | Route53 + CloudFront 연동 |
| **에러 모니터링** | Sentry 통합 (Frontend + Backend) |
| **로그 관리** | CloudWatch Logs + PM2 프로세스 상태 확인 |

---

## 🧠 11. 핵심 가치 및 서비스 철학

> **Dailyon은 단순한 일정 앱이 아니라,  
> 당신의 하루·감정·소비·생각을 함께 정리해주는 개인형 어시스턴트입니다.**

| 핵심 가치 | 설명 |
|------------|------|
| **통합성 (Integration)** | 일정, 메모, 가계부, 채팅이 하나의 흐름으로 연결 |
| **자동화 (Automation)** | AI가 데이터를 요약·분류·추천 |
| **확장성 (Modularity)** | 독립 모듈 구조로 기능 확장 용이 |
| **프라이버시 (Privacy)** | 로컬 AI 중심, 오프라인 모드, 개인정보 최소 전송 |
| **감성 UX (Emotion)** | 종이노트 감성 + 현대적 인터랙션 (Framer Motion 활용) |

---

## ✨ 12. 슬로건 및 브랜드 아이덴티티

| 항목 | 내용 |
|------|------|
| **슬로건** | _“Turn your daily life on — with Dailyon”_ |
| **키워드** | 기록 · 통합 · 자동화 · 감성 · 연결 |
| **브랜드 톤** | 따뜻함, 진정성, 균형, 명료함 |
| **대표 컬러** | #0f172a (Midnight Navy), #f1f5f9 (Snow White), #38bdf8 (Sky Accent) |
| **폰트 제안** | Pretendard (KR), Inter (EN) |
| **아이콘 스타일** | Lucide Flat + Minimal Round |
| **Favicon / Logo** | ☀️ + 🌤️ 조합 — "하루를 여는 빛" 컨셉 |

---

## 📅 13. 향후 확장 로드맵

| 단계 | 기능 |
|------|------|
| **Phase 1 (MVP)** | 로그인, 메모, 일정, 기본 채팅, PWA 완성 |
| **Phase 2** | AI 요약, 자동 태깅, 가계부 통계 |
| **Phase 3** | 지도/주소 연동, AI 일정 제안 |
| **Phase 4** | 감정분석, OCR 가계부 입력, 공유 캘린더 |
| **Phase 5** | Google Calendar Sync + Electron 포팅 (데스크탑 앱화) |

---

**Made with ☀️ by Foongdoll**
