# 버전 관리와 롤백

원격 저장소:
[adstore3869/onshive-business-web](https://github.com/adstore3869/onshive-business-web)

## 버전 기준

| 태그 | 내용 |
|---|---|
| `v1.0.0` | P-0005 리디자인 이전 운영 소스 기준점 |
| `v2.0.0` | 승인된 Commerce & Brand Operator 리디자인 |
| `v2.1.0` | v1.0.0 원본 스타일 복원과 검증된 커머스 콘텐츠 보강 |
| `v2.2.0` | 승인 P-0006, 원본 스타일의 6개 주요 화면·7역량·자료 캡처·메일 초안 |
| `v2.2.1` | 본문 18/17px·보조 15px 가독성 확대, 승인 ASCII 4종과 직전 패턴 제외 |
| `v2.2.2` | 승인 생성 이미지 3종, 편집형 홈·사업 구성과 접근성 패럴랙스 |
| `v2.2.3` | 방문자에게 불필요한 출처·내부 안내·AI 이미지 문구 제거 |
| `v2.3.0-rc.1` | 승인 P-0010 슬랙 전용 문의 검토 후보; 실제 수신·공개 배포 미확인 |

모든 운영 변경은 검증된 커밋과 annotated tag를 함께 남깁니다. `main`에는
검증된 버전만 반영하며 force push를 사용하지 않습니다.

문의 기능 후보는 `codex/slack-contact-intake`에서 검토합니다. 서버 Secret과
지정 채널 실수신을 확인하기 전에는 안정 main v2.2.3을 바꾸지 않습니다.
이 후보는 운영 배포가 아니므로 공개 사이트를 되돌리는 작업도 수행하지 않았습니다.

후보 적용을 취소하거나 이전 화면을 비교할 때는 현재 작업을 보존한 뒤 기존
`v2.2.3`을 별도 worktree에서 확인합니다. 후보가 이후 승인되어 main에 반영되면
아래 비파괴 `git revert` 절차로 복구하며 기존 태그나 이력을 이동하지 않습니다.

## 과거 버전 확인

현재 작업을 바꾸지 않고 별도 폴더에서 확인합니다.

```sh
git fetch origin --tags
git worktree add ../onshive-v1 v1.0.0
```

확인을 마친 뒤 해당 worktree에서 실행 중인 프로세스를 종료하고 제거합니다.

```sh
git worktree remove ../onshive-v1
```

## 안전한 운영 롤백

공개 이력을 지우지 않고 문제가 생긴 버전의 커밋을 되돌립니다.

```sh
git switch main
git pull --ff-only origin main
git revert <문제가-생긴-커밋-SHA>
npm ci
npm run typecheck
npm run lint
npm run build
git push origin main
```

특정 태그 상태로 복구 커밋을 만들어야 하면 먼저 임시 브랜치에서 검증합니다.

```sh
git switch -c rollback/v1.0.0 v1.0.0
npm ci
npm run build
```

검증 없이 `git reset --hard`, 태그 이동 또는 force push로 원격 이력을
덮어쓰지 않습니다.

## 현재 원본 스타일 버전으로 전환

`v2.1.0`은 `v2.0.0` 이력을 지우지 않고 새 커밋으로 원본 스타일을 복원한
버전입니다. 별도 검토 브랜치에서 확인할 수 있습니다.

```sh
git fetch origin --tags
git switch -c review/original-style v2.1.0
npm ci
npm run build
```

## 배포 롤백

`v2.2.0`에서 직전 `v2.1.0`으로 돌아가려면 새 버전의 변경 커밋 하나를
`git revert`하고 다시 검증합니다. 태그를 옮기거나 이력을 삭제하지 않습니다.
`v2.1.0`은 그대로 보존되어 별도 worktree에서도 비교할 수 있습니다.

v2.2.0은 초기 구현 뒤 별도 사용자 배포 요청으로 공개 반영됐습니다.
정상 production canonical은 `11415f6b-0020-47ea-8691-481efd93c641`이며
Git 커밋은 `e59fb16f383e247e9fe0a729b7148cf036304eb4`입니다.

v2.2.1은 GitHub와 로컬 미리보기 반영 범위이고 공개 추가 배포는 하지
않습니다. 직전 v2.2.0으로 돌아갈 때는 v2.2.1 변경 커밋만 `git revert`한
뒤 build/test/lint/typecheck로 재검증합니다. 공개 사이트는 별도 배포 요청
전까지 v2.2.0을 유지하므로 이번 버전을 취소하기 위한 Pages 롤백은 필요하지
않습니다. GitHub 버전과 실제 공개 Pages 배포 버전을 구분하세요.

ASCII 4종의 직전 이름은 localStorage `onshive:ascii:last`에만 저장합니다.
동일 브라우저·사이트에서는 탭을 닫은 뒤 다시 접속하거나 다른 탭으로 열어도
직전 기록을 사용할 수 있습니다. 방문자 정보·방문 횟수·식별자는 저장하지 않습니다.
서버로 전송하지 않으며, 저장 금지 환경은 정상 표시하되 새로고침 사이의
연속 반복 방지를 보장하지 못합니다. 캐시 문서에서는 읽기 또는 쓰기 실패를
기억하고 현재 표시 패턴을 기준으로 제외하므로, 쓰기만 거부되는 환경의 오래된
저장값도 반복 선택의 기준으로 사용하지 않습니다.

글자 크기는 사용자 선택대로 `src/readability.css` 계층에 분리했습니다.
본문 PC18/모바일17px, 보조15px, 링크·버튼16px, 입력17px입니다. 기존
CSS 3종과 큰 제목·문구·이미지 파일은 변경하지 않아 별도 계층만 추적·비교할 수
있습니다. 변경 전체를 되돌릴 때는 위 v2.2.1 커밋 revert 절차를 따릅니다.

Git 롤백 커밋을 만든 후 해당 커밋의 `dist/`를 다시 빌드해 Cloudflare Pages에
배포합니다. Pages의 이전 배포 재활성화는 긴급 임시 조치로만 사용하고, 최종
상태는 반드시 Git `main`과 일치시킵니다.

## 현재 버전 상태 / v2.2.2 복구

위 v2.2.1의 Git-only 설명은 최초 구현 당시 기록입니다. 이후 별도 사용자
승인으로 v2.2.1을 공개 배포했으며, 정상 canonical은
`06489b31-148a-4bff-8e78-6cf82434e922`, 공개 Git 커밋은
`7c9c205b0badd0f36c8834446c4f781c020ea0ef`입니다.

v2.2.2는 승인 P-0009의 로컬/Git 적용 이후 별도 사용자 승인을 받아 공개
배포됐습니다. onshive.kr의 정상 canonical은
`29b88d17-d264-4f24-a5c1-07d2dfde885b`, 공개 Git 커밋은
`010dedc8fd07d2747d1380831380bda11ed287ad`입니다.
정적 캡처와 이전 태그는 삭제하지 않았습니다.

v2.2.2에서 직전 v2.2.1로 복구할 때는 별도 검토 브랜치에서 새 변경 커밋을
역순으로 되돌립니다. 다음 범위에는 v2.2.2 이후의 다른 변경이 포함되지
않았는지 먼저 `git log --oneline v2.2.1..v2.2.2`로 확인합니다.

```sh
git switch -c codex/rollback-v222 main
git revert --no-commit v2.2.1..v2.2.2
npm test
npm run lint
npm run typecheck
git commit -m "Restore v2.2.1 website from v2.2.2"
```

복구 결과를 검토한 뒤 정상 merge/push합니다. 공개 배포 여부는 별도로 승인받습니다.
태그 이동·force push·`reset --hard`는 사용하지 않습니다.

## v2.2.3 문구 정리와 복구

v2.2.3은 사용자 요청에 따라 화면의 자료 출처·내부 검토/공유 메모와 생성
이미지 안내를 정리한 **로컬/Git 버전**입니다. 공개 onshive.kr은 v2.2.2를
유지하고 추가 공개 배포는 별도 승인받습니다. 이미지와 내부 출처 기록,
기존 스타일·폰트 크기·모션은 그대로 보존합니다.

직전 문구로 복구할 때는 변경 범위를 먼저 확인하고 비파괴 복구 커밋을 만듭니다.

```sh
git log --oneline v2.2.2..v2.2.3
git switch -c codex/rollback-v223 main
git revert --no-commit v2.2.2..v2.2.3
npm test
npm run lint
npm run typecheck
git commit -m "Restore v2.2.2 website copy"
```

실제 복구·재배포는 수행하지 않았습니다. 복구 검토 후 정상 merge/push를
사용하며 기존 태그 이동·이력 삭제·force push는 하지 않습니다.
