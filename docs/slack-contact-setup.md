# 문의 양식 — 슬랙 단일 수신 설정

P-0010 승인 범위: 기존 화면·6개 문의 항목을 유지하고 슬랙으로만 전송합니다.
이메일 자동 발송, 메일 서비스, 파일 업로드, 문의 DB, 큐와 자동 재시도는 없습니다.
답변받을 이메일과 기존 직접 메일 연락 링크는 그대로입니다.

## 운영 서버 비밀 설정

수신 목적지는 사용자가 지정한 `ons-hive / C0C5V3G62SW`입니다.
채널의 `archives/...` 링크는 웹훅 주소가 아닙니다. 기존 Incoming Webhook의
설치 대상이 이 채널인지 Slack 앱 관리 화면에서 확인해 주세요.

1. Cloudflare **Workers & Pages → onshive → Settings → Variables and Secrets**.
2. **Production** 환경을 선택하고 **Add**.
3. 이름 `SLACK_WEBHOOK_URL`, 값은 기존 Incoming Webhook 주소.
4. **Encrypt → Save**. 웹훅 주소를 채팅·Git·코드·명령행·캡처에 넣지 않습니다.
5. 설정한 뒤 승인된 코드로 다시 배포해야 새 서버 함수에 반영됩니다.

Preview에서 검증하려면 **Preview 전용 테스트 채널 웹훅**을 별도로 설정합니다.
운영 Secret을 로컬 또는 Preview에 복사하지 않습니다. 실제 수신·원격 검증과
Production 배포는 모의 테스트와 구분하며 사용자 승인 후 진행합니다.

설정값은 서버 `context.env`에서만 사용합니다. 브라우저는 같은 사이트의
`POST /api/inquiry`만 호출하며, 수신 주소·채널은 방문자가 바꿀 수 없습니다.
키가 없거나 형식이 잘못되면 실제 전송하지 않고 실패로 안내합니다.

## 로컬 실행과 검증

```sh
npm ci
npm test
npm run build:server
npm run preview:server
```

`preview:server`는 `http://127.0.0.1:4175`에서 Pages Functions와 정적 사이트를
같이 실행합니다. **Secret을 넣지 않는 기본 상태에서는 전송이 실패해야 정상**이며,
운영 웹훅을 넣어 시험하지 않습니다. 기존 `npm run preview`의 4174는 정적
미리보기이므로 서버 API를 실행하지 않습니다.

`scripts/verify-inquiry.mjs`는 실제 TypeScript 모듈을 컴파일하고 주입된 모의
transport만 사용합니다. 실제 Slack/메일 발송이나 웹훅 조회는 하지 않습니다.
생성 Env/runtime 타입은 `npm run types:server`로 다시 만들며 Git에서는 제외합니다.

## 상태와 재전송

- `success`: Slack의 HTTP 200 및 `ok` 수락 응답을 확인한 경우만 표시합니다.
  담당자가 읽거나 답변했다는 뜻은 아닙니다.
- `failure`: 입력·설정 오류 또는 알려진 거절 응답. 입력을 보존하고 수정할 수 있습니다.
- `unknown`: 타임아웃·네트워크·5xx·뜻밖 응답. 이미 전달됐을 수 있으므로 같은
  화면에서 다시 보내기를 잠그고 문의 번호와 직접 확인 경로를 안내합니다.
- 전송 중/성공/불명 상태에서 버튼을 잠그고 자동 재시도하지 않습니다.
  이 잠금은 서버 멱등성이나 새 탭·새로고침의 중복 차단 보장이 아닙니다.

## 개인정보와 운영 확인

사용자 지정 보유기간은 **접수일로부터 3년**입니다. 화면은 이용 목적·수집 항목·
기간·동의 거부·슬랙을 통한 담당자 전달을 안내하고 동의를 필수 검증합니다.
이 변경은 **Slack에 자동 3년 삭제 기능을 설정한 것이 아닙니다**. 운영자는 채널
조회 권한, Slack 보존 정책, 삭제 절차 및 별도 개인정보처리방침의 일치를 확인해야 합니다.
웹훅/문의 원문/연락처/예외 원문을 애플리케이션 로그나 검증 보고서에 남기지 않습니다.

기본 스팸 방지는 동일 출처·JSON/커스텀 헤더·honeypot·입력 시간·길이 제한입니다.
서버 rate limit/CAPTCHA 또는 영속 저장 기반 정확히 한 번 전송을 구현한 것은 아닙니다.
트래픽·스팸 상황에 따라 별도 WAF/Turnstile 등을 검토하되 권한·비용·리소스를
사용자 승인 없이 추가하지 않습니다.

## 배포와 복구

승인된 배포는 **프로젝트 루트**에서 실행하여 `functions/`를 함께 컴파일합니다.
정적 `dist/` 폴더만 다른 호스팅에 복사하면 문의 API는 동작하지 않습니다.

```sh
npm test
npm run build:server
npx wrangler pages deploy dist --project-name onshive --branch main
```

위 명령은 안내이며 지금 실행한 배포가 아닙니다. 기존 v2.2.3 및 이전 공개 배포는
보존합니다. 문제가 생기면 승인된 Git revert와 기존 Pages 배포 이력으로 복구합니다.
Secret은 코드/태그에 없으므로 Git 롤백으로 웹훅이 노출되지는 않습니다.

근거: [Cloudflare Secrets](https://developers.cloudflare.com/pages/functions/bindings/#secrets),
[Slack Incoming Webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/),
[Pages Functions](https://developers.cloudflare.com/pages/functions/).
