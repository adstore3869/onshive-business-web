# 버전 관리와 롤백

원격 저장소:
[adstore3869/onshive-business-web](https://github.com/adstore3869/onshive-business-web)

## 버전 기준

| 태그 | 내용 |
|---|---|
| `v1.0.0` | P-0005 리디자인 이전 운영 소스 기준점 |
| `v2.0.0` | 승인된 Commerce & Brand Operator 리디자인 |

모든 운영 변경은 검증된 커밋과 annotated tag를 함께 남깁니다. `main`에는
검증된 버전만 반영하며 force push를 사용하지 않습니다.

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

## 배포 롤백

Git 롤백 커밋을 만든 후 해당 커밋의 `dist/`를 다시 빌드해 Cloudflare Pages에
배포합니다. Pages의 이전 배포 재활성화는 긴급 임시 조치로만 사용하고, 최종
상태는 반드시 Git `main`과 일치시킵니다.
