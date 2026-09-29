# onshive.kr — Cloudflare 호스팅과 가비아 도메인 연결

2026-09-25 확인 기준. 도메인 등록/연장은 가비아에 유지하고, DNS와 웹사이트 호스팅을 Cloudflare에서 운영하는 구성입니다.

## 현재 상태

- Cloudflare 계정: **하이브** (`a5f96c42f071fe97a6c25e62b2b42a94`). Wrangler 로그인과 Pages 배포 권한 확인 완료.
- Pages 프로젝트: **onshive**, 운영 브랜치 `main`. 새 사이트 배포 완료.
- 공개 사이트: [onshive.kr](https://onshive.kr), 보조 주소 [onshive.pages.dev](https://onshive.pages.dev). 최종 배포 고유 주소 [5d21ac19.onshive.pages.dev](https://5d21ac19.onshive.pages.dev).
- 6개 독립 페이지와 404, 사이트맵의 HTTP 응답을 확인했습니다.
- `onshive.kr`을 하이브 계정의 무료 요금제로 추가했습니다. Pages 사용자 지정 도메인 등록 및 연결용 CNAME도 완료했습니다.
- **도메인 연결 및 HTTPS 활성화 완료.** 2026-09-25 최종 확인 시 zone, Pages 도메인, 소유권 및 HTTP 검증 모두 active입니다. 브라우저에서 새 ASCII 배경 사이트 접속을 확인했습니다.
- 이 도메인에 실제 할당된 네임서버: **`burt.ns.cloudflare.com`**, **`hazel.ns.cloudflare.com`**.
- Google DNS는 새 NS와 Cloudflare A 레코드를 반환합니다. 일부 resolver/로컬 OS에는 이전 NS 또는 주소 없음 캐시가 남아 있을 수 있습니다. 공개 DNS 주소 기준 HTTPS 인증서 검증을 유지한 6개 페이지·사이트맵·404 점검은 통과했습니다.
- 현재 루트 도메인의 Google 메일 MX와 소유권 확인 TXT가 존재합니다. 웹사이트 연결 후에도 유지해야 합니다.
- 가비아 네임서버는 사용자가 변경했습니다. Cloudflare에는 기존 공개 MX/TXT를 가져오고 웹 CNAME을 추가했습니다. 이번 확인에서 두 공개 DNS resolver의 MX `1 smtp.google.com` 보존을 확인했습니다.

## 1. Cloudflare에 도메인 준비 — 완료

1. [Cloudflare 하이브 계정](https://dash.cloudflare.com/a5f96c42f071fe97a6c25e62b2b42a94)에 로그인합니다.
2. 도메인 추가 화면에서 `onshive.kr`을 추가하고 무료 요금제를 선택합니다.
3. DNS 자동 검색 결과를 **가비아 DNS 관리 화면의 전체 레코드**와 대조합니다. 자동 검색은 모든 하위 도메인/메일 인증 레코드를 찾는다는 보장이 없습니다.
4. 기존 공개 MX와 TXT는 가져오기 완료 후 값 대조를 마쳤습니다. 실제 지정 네임서버는 아래와 같습니다. 가비아 관리 화면에 추가 하위 도메인 레코드가 있다면 전환 전 함께 복사합니다.

```text
burt.ns.cloudflare.com
hazel.ns.cloudflare.com
```

공개 DNS에서 확인한 최소 보존 항목:

| 유형 | 이름 | 값 | 우선순위 | TTL |
|---|---|---|---|---|
| MX | `@` | `smtp.google.com` | `1` | 가비아 600 / Cloudflare 자동 |
| TXT | `@` | 가비아의 기존 `google-site-verification=…` 값을 그대로 복사 | — | 기존 값 유지 |

추가로 가비아에 SPF, DKIM, DMARC 또는 다른 하위 도메인이 등록되어 있다면 함께 복사합니다. 위 표는 전체 DNS 목록이 아닙니다. 메일 관련 호스트는 원래 목적에 맞는 DNS only 설정을 유지합니다.

[Cloudflare 공식 도메인 등록 절차](https://developers.cloudflare.com/fundamentals/manage-domains/add-site/)

## 2. 가비아에서 네임서버 변경 — 사용자 변경 완료 (참고 절차)

1. 가비아 로그인 → **My가비아 → 서비스 관리 → 도메인 통합 관리툴**.
2. **전체 도메인**에서 `onshive.kr`을 선택 → **네임서버**.
3. 기존 가비아 네임서버 세 개를 모두 지우고 **1차 `burt.ns.cloudflare.com`, 2차 `hazel.ns.cloudflare.com`**만 입력합니다. IP 주소는 입력하지 않습니다.
4. 소유자 휴대전화 또는 이메일 인증을 완료하고 적용합니다.
5. Cloudflare에서 네임서버 확인을 실행하고 상태가 **Active**가 되는지 확인합니다. 전파에 최대 48시간이 걸릴 수 있습니다.

이 작업은 가비아 DNS 관리 화면에서 NS 레코드를 추가하는 작업과 다릅니다. 도메인 자체의 **네임서버 설정**을 변경해야 합니다. 도메인 소유권과 가비아 갱신 관리는 유지됩니다.

기존 Google 메일 설정은 **1단계에서 먼저 복사한 다음** 네임서버를 변경합니다.

[가비아 공식 네임서버 변경 안내](https://customer.gabia.com/faq/detail/286/26000)

## 3. Pages 사이트와 도메인 연결 — 활성화 완료

`onshive.kr`은 아래 1–2단계를 마쳤고 도메인과 HTTPS가 활성화됐습니다. Cloudflare의 루트 CNAME이 `onshive.pages.dev`를 가리킵니다. `www`는 별도 등록하지 않았습니다.

1. Cloudflare **Workers & Pages → onshive → Custom domains → Set up a domain**.
2. `onshive.kr`을 추가하고 안내에 따라 DNS 레코드를 활성화합니다. 같은 계정의 활성 Cloudflare 도메인이라면 Pages가 연결용 CNAME을 생성합니다.
3. `www.onshive.kr`도 사용할 경우 동일 메뉴에서 별도로 추가합니다.
4. 도메인 연결과 HTTPS 인증서가 활성화되면 `https://onshive.kr` 및 각 하위 페이지를 직접 열어 확인합니다.

| 웹 DNS 유형 | 이름 | 대상 |
|---|---|---|
| CNAME | `@` | `onshive.pages.dev` |
| CNAME | `www` (선택 사항, 현재 미등록) | `onshive.pages.dev` |

먼저 Pages의 Custom domains에서 도메인을 등록해야 합니다. CNAME 레코드만 수동으로 추가해서는 Pages 연결이 완료되지 않습니다. 루트 도메인 `onshive.kr`은 Pages 프로젝트와 같은 Cloudflare 계정에서 DNS를 관리해야 합니다.

[Cloudflare Pages 공식 사용자 지정 도메인 안내](https://developers.cloudflare.com/pages/configuration/custom-domains/)

## 배포 담당자용

P-0004 배포는 2026-09-25 완료했습니다. 공개 DNS 기반의 onshive.kr HTTPS 검증11건이 통과했으며, 현재 작업 PC의 기본 DNS 조회는 여전히 실패합니다. 이 환경에서는 위 보조 주소로 즉시 확인할 수 있습니다. DNS·메일 설정을 다시 변경하지 않았습니다. 되돌리기가 필요하면 Cloudflare Pages 배포 이력에서 이전 정상 운영 배포 `5b7af706`을 선택해 롤백합니다.

완성된 정적 산출물 `dist/`만 업로드합니다. 현재 프로젝트는 Git 저장소가 없어 Direct Upload 방식으로 준비했습니다. 변경 후에는 다시 빌드·배포해야 합니다.

`wrangler.jsonc`에는 Pages 프로젝트 이름과 출력 폴더를 기록했습니다. Pages 설정 파일은 `account_id`를 지원하지 않으므로 아래처럼 계정을 환경변수로 명시합니다.

```powershell
npm run build
$env:CLOUDFLARE_ACCOUNT_ID = 'a5f96c42f071fe97a6c25e62b2b42a94'
wrangler pages deploy dist --project-name onshive --branch main
```

`.env`, 원본 회사소개서, 내부 작업 문서, 테스트 스크린샷은 공개 산출물에 포함하지 않습니다. 배포 이력은 `wrangler pages deployment list --project-name onshive`로 확인합니다.

[Cloudflare 공식 Direct Upload 안내](https://developers.cloudflare.com/pages/get-started/direct-upload/)
