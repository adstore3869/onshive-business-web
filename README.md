# 온스하이브 기업 웹사이트

승인된 P-0001 시안을 기반으로 만든 회사소개·사업분야·성과·연혁·채용·문의 웹사이트입니다.
정적 HTML, TypeScript, CSS와 Vite를 사용합니다. 로고·그래픽·글꼴을 자체 호스팅하며 런타임 CDN은 사용하지 않습니다.

## 실행

Node.js 22.12 이상이 필요합니다.

```sh
npm ci
npm run dev
```

개발 주소: http://127.0.0.1:5173

```sh
npm run typecheck
npm run build
npm run preview
```

배포 빌드 미리보기: http://127.0.0.1:4174
정적 호스팅에는 `dist/`만 업로드합니다. `.env`, `.leerness/`, 회사소개서 원본과 검토 자료는 빌드에 포함되지 않습니다.

## 수정 위치

| 대상 | 파일 |
|---|---|
| 홈 | `src/index.html` |
| 회사소개·사업·연혁·채용·문의 | `src/about/`, `src/business/`, `src/history/`, `src/careers/`, `src/contact/` |
| 공통 메뉴·사업자정보 | `src/partials/header.html`, `src/partials/footer.html` |
| 색상·여백·반응형 | `src/styles.css` |
| 모바일 메뉴·패럴랙스·모션 설정 | `src/main.ts` |
| 홈 전체 배경 아스키 파도 | `src/ascii-wave.ts` |
| 로고·파비콘·글꼴 라이선스 | `public/` |

[콘텐츠 수정 안내](docs/content-guide.md)에 콘텐츠 근거, 채용 추가 방법과 배포 시 확인할 설정을 정리했습니다.

연혁과 채용은 사용자 확인에 따라 확정 예정으로 표시했습니다. 전화번호는 제거했으며, 일반 문의 이메일과 전자세금계산서 전용 이메일을 구분합니다. 사업자정보는 2026-07-01 사업자등록증 기준입니다.

공개 사이트: [onshive.kr](https://onshive.kr) · [Cloudflare 배포 및 가비아 도메인 연결](docs/cloudflare-domain-guide.md)

## 접근성과 모션

- 키보드 사용이 가능한 메뉴와 네이티브 펼침 영역
- 기기의 모션 감소 설정 및 방문자별 애니메이션 일시정지 지원
- JavaScript가 없어도 본문·링크·채용 안내 이용 가능
- 320px부터 넓은 데스크톱까지 반응형 레이아웃

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
