# 온스하이브 기업 웹사이트

승인된 P-0006 콘텐츠와 P-0009 편집·생성 이미지·패럴랙스를 P-0001 원본 스타일로
구현한 회사소개·PET/PRINT 사업·운영역량·채용·파트너십 웹사이트입니다. 이전 연혁
페이지도 보존합니다. 현재 문의 기능 검토 후보는 v2.3.0-rc.1입니다.
안정 main은 v2.2.3, 마지막 확인한 공개 사이트는 v2.2.2이며 공개 배포는 별도입니다.
정적 HTML, TypeScript, CSS와 Vite, 문의 API용 Cloudflare Pages Functions를 사용합니다. 로고·그래픽·글꼴을 자체 호스팅하며 런타임 CDN은 사용하지 않습니다.

## 실행

Node.js 22.12 이상이 필요합니다.

```sh
npm ci
npm run dev
```

개발 주소: http://127.0.0.1:5173

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

배포 빌드 미리보기: http://127.0.0.1:4174
4174는 정적 화면만 확인합니다. 서버 문의 기능은 `npm run preview:server`의 4175에서 실행합니다.
배포 시에는 프로젝트 루트에서 Wrangler로 `dist/`와 `functions/`를 함께 반영합니다.
`.env`, `.dev.vars`, `.leerness/`, 회사소개서 원본과 검토 자료는 빌드에 포함되지 않습니다.

## 수정 위치

| 대상 | 파일 |
|---|---|
| 홈 | `src/index.html` |
| 회사소개·사업·역량·연혁·채용·파트너십 | `src/about/`, `src/business/`, `src/capabilities/`, `src/history/`, `src/careers/`, `src/contact/` |
| 공통 메뉴·사업자정보 | `src/partials/header.html`, `src/partials/footer.html` |
| 원본 스타일 / 승인된 콘텐츠 확장 | `src/styles.css`, `src/home-scenes.css`, `src/visual-pages.css` / `src/content-pages.css` |
| 편집형 홈·사업 / 가독성 | `src/editorial-content.css` / `src/readability.css` |
| 문의 UI·검증·슬랙 API / 회귀 | `src/partnership-form.ts`, `src/inquiry.ts`, `server/inquiry.ts`, `functions/api/inquiry.ts` / `scripts/verify-site.mjs`, `scripts/verify-inquiry.mjs` |
| 모바일 메뉴·패럴랙스·모션 설정 | `src/main.ts` |
| 1회 등장·초점·Observer fallback / 실제 모듈 회귀 | `src/reveal.ts` / `scripts/verify-editorial.mjs` |
| 홈 전체 배경 아스키 파도 | `src/ascii-wave.ts` |
| 로고·파비콘·글꼴 라이선스 | `public/` |

[콘텐츠 수정 안내](docs/content-guide.md)에 콘텐츠 근거, 채용 추가 방법과 배포 시 확인할 설정을 정리했습니다.

확인된 활동만 날짜로 표시하고 채용 여부를 추정하지 않습니다. 회사 전화번호는
제거했으며, 사업 제휴·일반 문의·전자세금계산서 이메일을 구분합니다.
승인 P-0010 문의 양식은 동일 출처 서버 API를 통해 지정 슬랙 채널로만 전달합니다.
이메일 자동 발송은 없으며 실제 사용에는 서버 Secret과 배포가 필요합니다.
[슬랙 문의 연결·보유기간·실패 처리 안내](docs/slack-contact-setup.md)를 확인하세요.
사업자정보는 2026-07-01 사업자등록증 기준입니다.

공개 사이트: [onshive.kr](https://onshive.kr) · [Cloudflare 배포 및 가비아 도메인 연결](docs/cloudflare-domain-guide.md)

## 접근성과 모션

- 키보드 사용이 가능한 메뉴와 네이티브 입력 검증
- 기기의 모션 감소 설정을 따르고 화면 밖·숨김 탭에서는 모션 자동 정지
- JavaScript가 없어도 본문·링크·채용 안내 이용 가능
- 320px부터 넓은 데스크톱까지 반응형 레이아웃

## 버전 관리

- `v1.0.0`: 원본 P-0001 스타일 기준점
- `v2.0.0`: Commerce & Brand Operator 전면 리디자인 보존본
- `v2.1.0`: 원본 스타일 복원 + PET·PRINT·운영 콘텐츠 보강본
- `v2.2.0`: 승인 P-0006 콘텐츠 확장·7역량·메일 초안
- `v2.2.1`: 승인 본문18/17·보조15px와 ASCII4종
- `v2.2.2`: 승인 생성 이미지3종·편집형 구성·패럴랙스 (현재 공개 버전)
- `v2.2.3`: 방문자용 출처·내부 안내·생성 이미지 문구 정리 (로컬/Git, 공개 미배포)
- `v2.3.0-rc.1`: 승인 P-0010 슬랙 전용 문의 후보 (실제 수신·공개 배포 미확인)

문의 후보는 `codex/slack-contact-intake` 브랜치에서 검토하며, 서버 Secret 설정과
실제 지정 채널 수신 확인 전에는 안정 main 또는 공개 배포 완료로 표시하지 않습니다.

강제 초기화 없이 태그와 revert로 복구합니다. 자세한 절차는
[버전 관리와 롤백](docs/versioning-and-rollback.md)을 참고하세요.

<!-- leerness:project-readme:start -->
## Leerness Project Harness

이 프로젝트는 Leerness v1.36.188 하네스를 사용합니다. AI 에이전트는 작업 전 `leerness handoff`로 컨텍스트를 적재하고, 작업 후 `leerness check`/`leerness audit`/`leerness session close`를 수행해야 합니다.

### 정체성 — AI 에이전트 운영 레이어 (UR-0030)

Leerness 는 **실행기/코딩 에이전트가 아니라**, 어떤 AI 코딩 에이전트(Claude Code · Codex · Cursor · Goose 등) 위에도 얹는 **범용 운영 레이어**입니다. 5개 공통 계층을 제공합니다:

- **기억(Memory)** — 프로젝트 상태/결정/진행을 `.leerness/` 에 영속화
- **정책(Policy)** — 8단계 권한 등급 + enforce (read-only→publish), MCP 호출 게이트
- **인수인계(Handoff)** — 에이전트 간 컨텍스트 표준 전달 + `get_project_context` 1콜 온보딩
- **검증(Verification)** — 근거 기반 완료 검증으로 허위 완료 감지 (권고; CI 게이트 필수화 시 차단)
- **감사(Audit)** — drift/idempotency/secret/encoding 자동 감사 (self-heal: drift·idempotency --auto-fix, encoding --apply; secret 은 감지 전용)

AGENTS.md(정적 지침)을 **대체하지 않고 보완**합니다 — 정적 규칙은 AGENTS.md, 동적 상태·검증·인수인계는 leerness. 정체성 조회: `leerness about` (MCP `leerness_about`).

### Core Commands

```bash
leerness handoff .            # 세션 시작 컨텍스트 자동 로드
leerness status .             # 설치 상태
leerness verify .             # 필수 파일 검증
leerness audit .              # 일관성·계획-진행 정렬 감사
leerness scan secrets .       # 시크릿 패턴 스캔
leerness encoding check .     # UTF-8 / BOM / NUL / .bat 인코딩 검사
leerness lazy detect .        # 게으름 방지 자동 평가
leerness memory search "키"   # 결정/이력 검색
leerness session close .      # 세션 종료 + handoff 자동 작성
leerness update .             # 자동 버전 감지 + 마이그레이션
```

### Memory Surface CRUD (5 surfaces × add/list/drop)

```bash
# Tasks
leerness task add "T-9999 작업 제목"
leerness task list --json
# Decisions
leerness decision add "결정 제목" --reason "이유"
leerness decision list --query "키워드"   # 1.9.139
# Rules (영구 자연어 룰)
leerness rule add "매 commit마다 changelog 갱신" --trigger every-commit
leerness rule list
# Plan (milestones)
leerness plan add "M-XXXX 계획" --next "다음 단계"
leerness plan list
# Lessons (영구 교훈)
leerness lesson save "교훈 본문" --tag perf
leerness lesson list --query "키워드"     # 1.9.139
# DELETE → RESTORE (1.9.126~128)
leerness memory archive list . --query "키워드"   # 1.9.138
leerness memory restore decision <date|title>
```

### MCP server (외부 AI 통합)

Leerness v1.36.188는 stdio JSON-RPC MCP server를 내장합니다 — Claude Code · Cursor · Codex CLI 등 외부 AI에 **98개 도구**를 노출:

```jsonc
// 카테고리별
// • Core: handoff / drift_check / audit / health / verify_claim / contract_verify
// • Memory READ:  task_list / decision_list / lesson_list / plan_list / rule_list / memory_status
// • Memory WRITE: task_add / decision_add / lesson_save / plan_add / rule_add
// • Memory DELETE: task_drop / decision_drop / lesson_drop / plan_remove / rule_remove
// • Skill: skill_match / skill_list / skill_search / skill_info / skill_suggest
// • Insight: lessons / lessons_auto / brainstorm / retro / benchmark / lazy_detect
// • Workflow: session_close / agents_list / task_export / env_check / usage_stats / reuse_map / whats_new

// MCP server 실행: leerness mcp serve
// tools/list 응답: 98 도구
```

### Autonomous mode (자율 모드)

`<<autonomous-loop-dynamic>>` 신호만 보내면 AI가:
1) 다음 라운드 후보 선정 → 2) 코드 변경 → 3) 회귀 테스트 갱신 → 4) 전체 e2e 스위트 통과 → 5) npm publish + git tag → 6) main push → 7) session close → 8) 다음 라운드 예약.

현재 누적: **v1.9.x → 1.36.188 릴리스 태그 이력** (수백 라운드) · _reports/는 비공개 보존.

### 성능 가이드

- `leerness handoff .` — 평균 ~1.5s (캐시 워밍업 후 ~0.6s)
- `leerness memory status --json` — 평균 ~250ms
- `leerness task list --json` — 평균 ~200ms
- `leerness drift check --json` — 평균 ~400ms
- MCP `tools/list` 응답 — 평균 ~150ms
- usage-stats / lessons / listAllSkills 모두 메모리 캐싱

### 빠른 시작

```bash
# 1. 설치 (글로벌)
npm install -g leerness

# 2. 프로젝트에 하네스 설치
cd my-project && leerness init . --yes --skills recommended

# 3. AI 세션 시작 시
leerness handoff .            # 컨텍스트 자동 로드

# 4. 세션 종료 시
leerness session close .      # 9 카테고리 + 룰 검증 + 다음 라운드 추천

# 5. release 자동화 (main 자동 push 포함)
leerness release pack --close --auto-main-push
```

### Planning Files

- `.leerness/plan.md`: 전체 목표, milestone, 제외/드랍 범위
- `.leerness/progress-tracker.md`: 요청 단위 상태와 증거
- `.leerness/current-state.md`: 지금 이어서 할 작업
- `.leerness/session-handoff.md`: 다음 세션 인수인계 (자동 작성)
- `.leerness/lessons.md` / `decisions.md` / `rules.md`: 영구 메모리 (5 surface)

Last synced by Leerness v1.36.188: 2026-09-25
<!-- leerness:project-readme:end -->
