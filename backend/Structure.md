```aiignore

com.foongdoll.dailyon
├─ DailyonApplication.java
├─ config/                          # 전역 설정 (환경/보안/관측성/캐시/스토리지)
│  ├─ WebConfig.java                # CORS, 메시지컨버터, 인터셉터
│  ├─ SwaggerConfig.java            # API 문서 (springdoc)
│  ├─ JacksonConfig.java            # 직렬화 규칙(날짜/스네이크케이스 등)
│  ├─ CacheConfig.java              # RedisCacheManager
│  ├─ S3Config.java                 # AWS S3 클라이언트
│  ├─ SchedulerConfig.java          # 스케줄러(리포트/정리 작업)
│  └─ AsyncConfig.java              # @Async 풀/타임아웃
│
├─ security/                        # 인증/인가 전담
│  ├─ JwtProperties.java
│  ├─ JwtTokenProvider.java
│  ├─ JwtAuthenticationFilter.java
│  ├─ SecurityConfig.java           # HttpSecurity, 경로별 권한, 세션정책
│  ├─ CustomUserDetails.java
│  ├─ CustomUserDetailsService.java
│  └─ Role.java                     # ADMIN/USER/GUEST
│
├─ common/                          # 공통 유틸/베이스/응답 표준화
│  ├─ api/
│  │  ├─ ApiResponse.java           # {success,data,error,traceId}
│  │  └─ GlobalExceptionHandler.java# 예외→표준응답 매핑
│  ├─ error/
│  │  ├─ ErrorCode.java
│  │  └─ DailyonException.java
│  ├─ mapper/                       # MapStruct 인터페이스(선택)
│  ├─ util/                         # 문자열/시간/암호화/파일 등
│  └─ audit/
│     ├─ Auditable.java             # 생성/수정자, 시간
│     └─ AuditConfig.java
│
├─ infra/                           # 외부 연동/기반시설 어댑터
│  ├─ s3/
│  │  ├─ S3Uploader.java            # 이미지/첨부 업로드
│  │  └─ PresignedUrlService.java
│  ├─ redis/
│  │  └─ RedisTemplateConfig.java
│  ├─ mail/
│  │  └─ MailSender.java
│  └─ ai/                           # AI 라우팅(로컬 3B + 클라우드 7B)
│     ├─ AiClient.java              # 인터페이스
│     ├─ LocalAiClient.java         # 로컬 게이트웨이(Ollama 등)
│     └─ CloudAiClient.java         # OpenRouter 등
│
├─ modules/                         # 도메인 모듈들(DDD-lite: presentation/application/domain)
│  ├─ auth/
│  │  ├─ presentation/
│  │  │  └─ AuthController.java     # 로그인/토큰리프레시
│  │  ├─ application/
│  │  │  └─ AuthService.java
│  │  └─ domain/
│  │     └─ dto/ LoginRequest, TokenPair, ...
│  │
│  ├─ user/
│  │  ├─ presentation/ UserController.java
│  │  ├─ application/ UserService.java
│  │  └─ domain/
│  │     ├─ User.java               # @Entity extends Auditable
│  │     ├─ UserRepository.java
│  │     └─ dto/ UserProfileDto.java
│  │
│  ├─ note/                         # 메모/포스팅(마크다운, 첨부, 버전)
│  │  ├─ presentation/ NoteController.java
│  │  ├─ application/
│  │  │  ├─ NoteService.java
│  │  │  └─ NoteSearchService.java
│  │  └─ domain/
│  │     ├─ Note.java, NoteVersion.java, NoteTag.java
│  │     ├─ NoteRepository.java, NoteQueryRepository.java
│  │     └─ dto/ NoteCreateDto, NoteResponseDto, ...
│  │
│  ├─ calendar/                     # 일정/반복/공유/알림
│  │  ├─ presentation/ CalendarController.java
│  │  ├─ application/ CalendarService.java
│  │  └─ domain/
│  │     ├─ Event.java, RecurrenceRule.java
│  │     ├─ EventRepository.java
│  │     └─ dto/ EventCreateDto, EventShareDto, ...
│  │
│  ├─ ledger/                       # 가계부(카테고리/예산/리포트)
│  │  ├─ presentation/ LedgerController.java
│  │  ├─ application/
│  │  │  ├─ LedgerService.java
│  │  │  └─ LedgerReportService.java
│  │  └─ domain/
│  │     ├─ Entry.java, Budget.java, Category.java
│  │     ├─ LedgerRepository.java, QuerydslLedgerRepository.java
│  │     └─ dto/ EntryDto, BudgetDto, ReportDto
│  │
│  ├─ chat/                         # 실시간 채팅(WebSocket/STOMP, 파일카드)
│  │  ├─ presentation/
│  │  │  ├─ ChatController.java     # REST 보조(히스토리/검색)
│  │  │  └─ ChatWsEndpoint.java     # @MessageMapping("/chat/**")
│  │  ├─ application/
│  │  │  ├─ ChatService.java
│  │  │  └─ MessageSummaryService.java
│  │  └─ domain/
│  │     ├─ ChatRoom.java, Message.java, ReadState.java
│  │     ├─ ChatRepository.java
│  │     └─ dto/ SendMessageDto, RoomCreateDto, ...
│  │
│  └─ ai/                           # AI 기능(요약/태깅/추천 파사드)
│     ├─ presentation/ AiController.java
│     ├─ application/ AiOrchestrator.java  # 로컬/클라우드 라우팅 + 캐시
│     └─ domain/ dto/ SummaryRequest, TagSuggestResponse, ...
│
├─ support/                         # 횡단 관심사 보조 레이어
│  ├─ logging/ HttpLoggingFilter.java
│  ├─ id/     SnowflakeIdGenerator.java
│  ├─ pagination/ SliceResponse.java
│  └─ spec/   Specifications.java    # JPA 동적 조건(검색)
│
└─ migration/
└─ db/migration/ V1__init.sql, V2__note_indices.sql ...  # Flyway

```