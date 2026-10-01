# 콘텐츠 수정 안내

홈 본문은 `src/index.html`, 개별 페이지는 `src/<페이지>/index.html`입니다.
원본 스타일 3종은 유지하고 승인된 보강 레이아웃은 `src/content-pages.css`에
분리했습니다. 공통 메뉴·모션은 `src/main.ts`, 문의 UI는 `src/partnership-form.ts`,
Slack 서버 API는 `server/inquiry.ts`와 `functions/api/inquiry.ts`입니다.
P-0009의 홈03/04/05 편집 구간과 사업 이미지 프레임은 `src/editorial-content.css`,
승인 글자 크기18/17/15px는 `src/readability.css`, 첫 등장·초점 대응은 `src/reveal.ts`입니다.

## 2.2.0 주요 메뉴

Home `/`, Company `/about/`, Business `/business/`, Capabilities `/capabilities/`,
Careers `/careers/`, Partnership `/contact/`. 기존 `/history/`는 계속 제공되며
회사소개의 `#activities`와 연결됩니다. 본문과 메뉴는 JavaScript 없이도 읽을 수 있습니다.

## 회사소개·사업·성과

`src/about/index.html`, `src/business/index.html`, `src/history/index.html`의 해당 내용을 수정합니다. 통계는 제공된 2026 회사소개서에 적힌 범위와 기간을 함께 유지하세요.

- 커머스 채널 10개: 자사몰을 포함한 운영 채널 수입니다.
- 30종: 목우촌 멍수무강 사료·간식·영양제 상품 포트폴리오입니다.
- 펫 박람회 15회: 2026년 1~6월 참가 실적입니다.

사업분야의 주요 사업은 동등한 PET·PRINT 두 영역입니다. 운영과 브랜드 역량은
별도 Capabilities의 7개 내부 역량으로 구분합니다.

- PET COMMERCE: 멍수무강 상품 기획·브랜딩·가격·10개 판매 채널·자사몰·CRM·박람회 운영.
- PRINT COMMERCE: 프린터 소모품 제조사 발굴·품질 확인·수입·통관·상품 등록·재고·가격·광고·리뷰 운영.
- Capabilities: 상품·포트폴리오, 소싱·제조 파트너, 커머스 채널, 오프라인·유통,
  브랜드·마케팅, 재고·판매 관리, 고객관리·재구매. 별도 광고 대행 상품으로 표기하지 않습니다.

PRINT 브랜드명과 상세 성과는 파트너 보호를 위해 공개하지 않습니다. 자료가
없는 수치나 성과를 추가하지 않습니다.

페이지별 원문 근거는 `tmp/pdfs/company-content.md`에 있습니다. 이 파일은 로컬 검토 자료이며 배포 결과에 포함되지 않습니다.

## v2.2.3 방문자 문구 기준

2026-10-01 사용자 요청으로 회사소개서 출처·쪽수, 반복적인 내부 안내와 이미지의
생성·비실사 설명을 화면에서 제거했습니다. 방문자에게 필요한 사업 정보와 이용
안내만 표시하고, 근거 자료·생성 분류·프롬프트·해시는 내부 기록에 보존합니다.
수치의 범위·기간, 외부 제조 파트너 협력, 채용 공고 게시 여부와 문의 양식의
이용 안내는 유지합니다. 이후 승인 P-0010에서 메일 초안을 Slack 수신으로 대체했습니다.
이미지에는 중립적인 장면 설명 alt를 사용하며
실제 상품·고객·회사 현장이라는 새로운 주장을 붙이지 않습니다.

## 회사 연혁

회사소개의 `#activities`와 기존 `history`에는 확인된 2026년 상반기 활동만
날짜로 표시합니다. 시작 연도가 없는 PET·PRINT는 자료 수록 운영 사례로
구분하며 실시간 현황처럼 보이는 NOW를 사용하지 않습니다. 설립연도와 계약
연혁은 근거 자료가 제공될 때만 추가합니다.

## 채용

`careers`는 상품·브랜드·채널·현장·콘텐츠·CRM 업무에서 경험할 수 있는 범위를
설명하지만 현재 모집 직무를 의미하지 않습니다. 현재 공고 게시가 없다는
페이지 수준의 사실만 안내하며, 회사가 채용하지 않는다고 단정하지 않습니다.
조직 명칭은 자료 원문 그대로이며 인원·복지·근무조건을 추정하지 않습니다.

직무·근무조건·지원방법이 확정되면 해당 섹션에 공고를 추가하고 실제 지원 채널을 연결합니다. 지금의 일반 문의 이메일을 별도 확인 없이 지원 접수처로 안내하지 않습니다.

## 문의와 주소

`src/contact/index.html`의 이메일·주소와 `src/partials/footer.html`의 사업자정보를
함께 관리합니다. 사업 제휴는 `scm@onshive.kr`, 일반 문의는
`onhive2002@naver.com`, 전자세금계산서는 `tax@onshive.kr`입니다. 회사 전화번호는
사용자 요청으로 제거했습니다.

승인 P-0010은 6개 문의 항목과 답변받을 이메일을 유지하며 동일 출처 API에서
슬랙으로만 전송합니다. 자동 이메일·문의 DB·큐·분석 추적·파일 업로드는 없습니다.
소개 자료와 직접 메일 연락 링크는 유지합니다. Secret·실제 채널·배포가 연결되지
않았으면 전송 완료로 안내하지 않습니다. 상세 [연결 안내](slack-contact-setup.md).

초기 HTML은 양식 hidden·버튼 disabled이고 listener 연결 후에만 활성화됩니다.
문서의 `form-action 'none'` CSP는 초기화 실패 시 기본 GET 제출도 차단합니다.
JavaScript가 없어도 기존 이메일 링크와 본문이 표시됩니다. 동의와 입력 검증은
클라이언트와 서버에서 모두 수행합니다. 보유기간은 사용자 지정 접수일로부터 3년이며,
Slack 실제 보존·삭제 정책은 운영자가 확인해야 합니다. 운영 Secret은 로컬에 가져오지 않습니다.

## 이미지와 글꼴

- P-0004 생성 콘셉트: `public/images/brand-connections.webp`(회사소개의 보조 이미지).
  미사용 `creative-materials.webp`는 재사용/복구용으로 보존. 생성 원본과 프롬프트,
  P-0006 실제 자료 캡처 3종의 원본·해시는 [이미지 안내](image-assets.md)에 기록.
- P-0009 생성3종: `pet-commerce.webp`, `print-commerce.webp`, `pet-customer.webp`를
  홈·사업에 각각 배치합니다. v2.2.3부터 생성·비실사 안내는 화면에 표시하지 않고,
  중립적인 장면 설명 alt와 홈의 사업 분야 캡션만 유지합니다.
  [제작 기록](image-provenance-p0009.json)에 승인·프롬프트·해시를 기록했으며,
  앞선 캡처3종은 공개 표시에서 제외하되 복구용 파일은 보존합니다.
- 홈 추가 섹션 스타일은 `src/home-scenes.css`, 하위 페이지 시각 요소는 `src/visual-pages.css`에서 관리합니다. 이미지 크기·비율과 alt를 유지하세요.

- 로고: `public/logo.png`, 원본 비율 유지.
- 파비콘: `public/favicon.svg`.
- 입체 그래픽: HTML에 포함된 SVG, 외부 이미지 요청 없음.
- Noto Sans KR·Archivo 글꼴은 사이트 빌드에 포함됩니다. 라이선스는 `public/licenses/`에 있습니다.

## 모션

`src/scroll-scenes.ts`는 이미지의 `data-image-parallax`, 가로 문자의 `data-scroll-x`, 홈 운영 업무의 `data-service-step`을 처리합니다. `src/main.ts`의 기존 단일 스크롤 프레임과 모션 설정을 공유합니다. 이미지가 패널보다 크게 배치된 여유 안에서만 이동합니다. 편집 이미지 여유는 PC44px/모바일12px이며 실제 이동은 여유·프레임8%·data 값 중 최솟값 이내입니다.

`src/reveal.ts`의 `.reveal`과 `data-editorial-reveal`은 첫 진입에서 한 번만 표시합니다.
키보드 초점은 즉시 표시하며 이미 읽은 문장을 다시 숨기지 않습니다. Observer
부재/실패 또는 모션 감소에서는 본문을 표시합니다. 시안 전용 라우터나 바는 실제
페이지에 포함하지 않습니다. 외부 모션 라이브러리·분석 추적은 추가하지 않았습니다.

별도의 방문자 모션 토글이나 브라우저 저장 상태는 없습니다. 기기의 `prefers-reduced-motion` 설정이 켜져 있으면 아스키 파도·패럴랙스·등장 효과를 줄이고 콘텐츠를 즉시 표시합니다.

홈의 전체 배경 아스키 파도는 `src/ascii-wave.ts`에서 관리합니다. `src/main.ts`의 공통 모션 설정을 사용하며 화면 밖이나 숨긴 탭에서는 애니메이션을 멈춥니다. 제목 뒤 문자 농도는 낮게 유지합니다. 로고와 회사소개 페이지의 SVG는 별도 요소입니다.

## 배포 시

`npm test`는 빌드와 산출물, 실제 Slack 서버·클라이언트, ASCII19, 편집·스크롤34 회귀 검사를 수행합니다.
편집 검사는 프로젝트의 기존 TypeScript 컴파일러로 `tmp/editorial-module-test/`에
비공개 테스트 산출물만 생성합니다. production 소스를 쓰거나 배포하지 않습니다.
실제 Slack/메일 전송이나 외부 앱 실행은 하지 않습니다. UI 반응형·모션은 별도 브라우저로 검증하세요.

`npm run build` 후 프로젝트 루트에서 Wrangler로 `dist/` 및 Functions를 함께 반영합니다.
프로젝트 전체나 비밀 파일을 업로드하지 않습니다. canonical, og:url과 사이트맵은
`https://onshive.kr` 기준입니다. [기존 배포 안내서](cloudflare-domain-guide.md)와
[Slack Functions 연결 안내](slack-contact-setup.md)를 함께 확인하세요.
# 2026-09-25 개편 안내

- 홈 `/`, 회사소개 `/about/`, 사업분야 `/business/`, 성과·연혁 `/history/`, 채용 `/careers/`, 문의 `/contact/`로 분리했습니다. 각 페이지 원문은 `src/<페이지>/index.html`이며 홈은 `src/index.html`입니다.
- 공통 메뉴와 하단은 `src/partials/header.html`, `src/partials/footer.html`입니다. Vite 빌드에서 각 페이지 HTML에 결합되므로 JavaScript 없이도 메뉴가 보입니다.
- 회사소개 모션은 `data-depth`의 속도 값과 `src/main.ts`에서 관리합니다. 모바일에서는 sticky 서사를 일반 흐름으로 전환합니다.
- 사용자 요청에 따라 전화번호와 전화 링크를 제거했습니다. 일반 프로젝트 문의는 소개서의 `onhive2002@naver.com`을 유지합니다.
- 최신 사업자등록증(2026-07-01, 1쪽)을 기준으로 법인명 주식회사 온스하이브, 대표 서동완, 사업자번호 234-86-02681, 동탄구 동탄대로 635 1동 306호로 수정했습니다. 회사소개서의 이전 주소 대신 이 등록증의 주소를 사용합니다.
- `tax@onshive.kr`은 전자세금계산서 전용으로 구분해 표시합니다. 등록증 원문은 공개 사이트에 포함하지 않습니다.
- 실배포는 [Cloudflare 안내](cloudflare-domain-guide.md)를 참고합니다. `dist/`만 공개하며 도메인 기준은 `https://onshive.kr`입니다.

## 2026-09-29 원본 스타일 복원과 콘텐츠 보강

아래는 v2.1.0 당시의 변경 이력입니다. 현재 v2.2.0 메뉴·콘텐츠 기준은 위 설명을 따릅니다.

- `v1.0.0`의 CSS·타이포·ASCII 파도·패럴랙스·공통 레이아웃을 복원했습니다.
- 새 디자인 시스템이나 v2 전용 페이지를 섞지 않고 기존 Home/About/Business/History/Careers/Contact 구조만 사용합니다.
- v2에서 검증된 PET·PRINT·운영·파트너십 내용을 회사소개서 근거 범위 안에서 이관했습니다.
- 공개 배포는 별도 승인 범위이며 이 변경 자체는 GitHub 버전과 로컬 미리보기까지만 관리합니다.
