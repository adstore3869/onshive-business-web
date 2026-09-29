<!-- leerness:managed -->
# Leerness Agent Instructions

## ⭐ 매 세션 첫 행동
**반드시 `.leerness/session-workflow.md`를 먼저 읽고 6단계 워크플로를 따른다**: 요청분석→계획→분배→sub-agent작업→종합검증→마감. 라운드 길이/복잡도 무관, drift 방지를 위해 모든 작업에 동일 흐름 유지.

## 정적 vs 동적 — leerness 역할 경계
**AGENTS.md = 정적 프로젝트 지침** (코딩 규칙·테스트 명령·금지 사항·배포 절차 — 자주 안 변함).
**leerness = 동적 작업 상태·기억·검증·인수인계** (현재 목표·수정 파일·실패 시도·검증 결과·다음 에이전트 인계 — 매 작업 변함).
- 규칙/명령/금지는 여기 AGENTS.md 에 적는다.
- 동적 상태(결정/교훈/계획/진행/검증/인수인계)는 leerness 가 **기본 워크스페이스 `.leerness/`** 에 기록한다 (decisions.md / lessons.md / plan.md / progress-tracker.md / session-handoff.md). 기본 `leerness handoff`는 이를 읽고 ignored 세션 runtime record만 갱신하며, 추적 상태 갱신은 `decision add` · `lesson save` · `session close` 같은 명시 쓰기 명령 또는 `handoff --writeback`이 수행한다.
- (선택) `leerness state show|start|record|verify|handoff` (또는 MCP `leerness_state_*`) 의 JSON 상태 substrate 는 `.leerness/` (에이전트 간 인수인계 표준 — state 명령 사용 시 생성). 메인 워크스페이스(.leerness)와 별개.
- leerness 는 AGENTS.md 를 **대체하지 않고 보완**한다. 정적 지침은 여기, 동적 상태는 leerness.

## Mandatory read order (session start)
1. **.leerness/session-workflow.md** (6단계 워크플로 — 최우선)
2. .leerness/context-routing.md
3. .leerness/session-handoff.md
4. .leerness/current-state.md
5. .leerness/plan.md
6. .leerness/progress-tracker.md
7. .leerness/guideline.md
8. .leerness/protected-files.md
9. .leerness/writeback-policy.md
10. .leerness/anti-lazy-work-policy.md
11. **.leerness/rules.md** (사용자 정의 영구 룰 — 매 세션 반드시 따름)

## Required behavior
- 작업 시작 시 `leerness handoff .`를 실행해 컨텍스트를 적재합니다 (handoff가 active rules를 자동 출력).
- **모호성 질문 의무**: 사용자 요청에 판단이 갈리는 부분(모호한 수식어/지시대명사/복수 선택지/불명확한 범위)이 있으면 **추측으로 구현하지 말고 먼저 사용자에게 질문**합니다. `leerness clarify "<요청>"` 이 감지한 질문 목록을 그대로 사용자에게 물어보세요. 신호가 없어도 스스로 판단이 갈리면 질문이 우선입니다.
- **미리보기 승인 의무 (신규 기능)**: 사용자가 신규 기능 추가/구현을 요청하면 **코드를 먼저 작성하지 않습니다**. ① `leerness preview add "<기능>" --design "<디자인/UX 설명>" --features "<기능 목록>"` 으로 미리보기를 등록하고 ② 그 내용을 사용자에게 제시해 승인 또는 수정사항을 질문으로 받습니다. ③ 사용자가 승인하면 `leerness preview approve <P-ID>`, 수정 요구면 `leerness preview revise <P-ID> --note "..."` 후 미리보기를 고쳐 다시 제시합니다. **approve 전에는 해당 기능의 코드를 작성하지 않습니다.**
- **디자인 시안 의무 (웹페이지/디자인 작업)**: 신규 페이지 제작·디자인/리디자인 요청이면 텍스트 설명만으로 끝내지 않습니다. `leerness preview mockup <P-ID>` 로 자립형 HTML 시안 스캐폴드(`.leerness/previews/<P-ID>-mockup.html`)를 만들고, **placeholder 영역을 실제 레이아웃 초안(HTML/CSS, 외부 리소스 없이)으로 교체**한 뒤 사용자에게 브라우저로 열어 보여주고 수정/승인을 질문으로 받습니다. 수정 요구가 오면 시안 파일을 고쳐 다시 제시하고, **approve 전에는 실제 페이지/기능 코드를 작성하지 않습니다.** (이미 만든 시안이 있으면 `preview add ... --mockup <파일>` 로 첨부)
- 작업 분류는 `leerness route <task-type>`로 확인합니다 (planning, feature, bugfix, refactor, research, consistency, release, migration, session-start, session-close, harness-maintenance).
- 보호 파일/관리 섹션을 삭제하지 않습니다. 머지·아카이브·deprecated 표시를 사용합니다.
- 의미 있는 변경 후 progress-tracker, current-state, task-log, session-handoff를 갱신합니다.
- 완료 선언 전 `leerness check .` 또는 `leerness lazy detect .`로 자기검증하고, `leerness lens`의 분야별 자기질문에 답합니다 (코드: "선임 개발자가 복잡하다고 느끼지 않을까?" / 디자인: "선임 디자이너와 일반 사용자가 이쁘고 직관적이라 느낄까?").
- 변경 전 secret/encoding 가드: `leerness scan secrets .`, `leerness encoding check .`.
- 같은 기능 중복 생성 전 design-system.md, consistency-policy.md, reuse-map.md를 확인합니다.
- 매 세션 종료 시 `leerness session close .`로 9개 카테고리(완료/진행중/미완료/예정/대기/보류/차단/드랍/검증) + **활성 룰 검증 결과**를 보고합니다.
- 업데이트는 `leerness update --check` (감지) → `leerness update --yes` (자동 마이그레이션).

## 자연어 회고/통찰/브레인스토밍
사용자가 자연어로 회고/통찰/브레인스토밍을 요청하면 즉시 leerness 명령으로 호출합니다.

| 사용자 발화 (자연어) | 즉시 실행할 명령 |
|---|---|
| "회고해줘 / 돌아보자 / 정리해줘" | `leerness retro` |
| "최근 N일 회고" | `leerness retro --days N` |
| "통계 / 누적 지표 / insights" | `leerness insights` |
| "X에 대해 브레인스토밍 / X 관련 자료 / X 시작 전 검토" | `leerness brainstorm "X"` |

session close가 매번 자동으로 한 줄 요약을 출력하고, 5세션마다 자동 깊은 회고를 실행합니다. 사용자가 명시 요청 시 즉시 호출.

## 자연어 룰 처리
사용자가 자연어로 영구 룰을 요청하면 즉시 leerness rule 명령으로 등록합니다.

| 사용자 발화 (자연어) | 즉시 실행할 명령 |
|---|---|
| "매 업데이트마다 버전 bump해줘" | `leerness rule add "버전을 patch로 bump" --trigger every-update` |
| "매 커밋마다 패치노트 추가해줘" | `leerness rule add "패치노트 추가" --trigger every-commit` |
| "세션 종료마다 배포해줘" | `leerness rule add "배포 (release publish)" --trigger session-close` |
| "X 룰 중지/그만/끄기" | `leerness rule pause <ID>` (해당 룰 ID는 list로 확인) |
| "X 룰 제거/삭제" | `leerness rule remove <ID>` |
| "모든 룰 중지" | `leerness rule stop` |
| "룰 다시 켜줘" | `leerness rule resume-all` 또는 `leerness rule resume <ID>` |

룰을 등록한 후 사용자에게 등록 결과(ID + trigger + 설명)를 보고하고, 그 이후 매 세션마다 자동 적용합니다. 사용자가 "중지" 또는 "제거"를 명시적으로 말하기 전까지는 룰을 비활성화하지 않습니다.

## 룰 자동 적용
leerness가 자동 검증 가능한 trigger:
- **every-update / version bump 키워드 룰**: package.json의 version이 갱신됐는지 검사 (handoff/session close가 baseline 캐시와 비교).
- **CHANGELOG / 패치노트 키워드 룰**: CHANGELOG.md의 mtime이 갱신됐는지 검사.
- **test / 테스트 / verify 키워드 룰**: review-evidence.md에 오늘 verify-code 흔적이 있는지 검사.
- **배포 / publish / push 키워드 룰**: 자동 검증 불가 → 사용자에게 release publish 명령을 안내.

자동 검증 가능한 룰의 실행은 `leerness release bump`, `leerness release note "..."`, `leerness release publish`를 사용해 자동화합니다.
