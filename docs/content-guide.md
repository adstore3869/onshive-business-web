# 콘텐츠 수정 안내

홈 본문은 `src/index.html`, 개별 페이지는 `src/<페이지>/index.html`, 화면 스타일은 `src/styles.css`, 상호작용은 `src/main.ts`에 있습니다.

## 회사소개·사업·성과

`src/about/index.html`, `src/business/index.html`, `src/history/index.html`의 해당 내용을 수정합니다. 통계는 제공된 2026 회사소개서에 적힌 범위와 기간을 함께 유지하세요.

- 커머스 채널 10개: 자사몰을 포함한 운영 채널 수입니다.
- 30종: 목우촌 멍수무강 사료·간식·영양제 상품 포트폴리오입니다.
- 펫 박람회 15회: 2026년 1~6월 참가 실적입니다.

사업분야는 원본 4단 구성을 유지하면서 다음 내용을 담습니다.

- PET COMMERCE: 멍수무강 상품 기획·브랜딩·가격·10개 판매 채널·자사몰·CRM·박람회 운영.
- PRINT COMMERCE: 프린터 소모품 제조사 발굴·품질 확인·수입·통관·상품 등록·재고·가격·광고·리뷰 운영.
- COMMERCE OPERATIONS: 입점·상세·광고·CS·리뷰·재고·정산·재구매 흐름.
- BRAND & GROWTH: 브랜드·콘텐츠, 퍼포먼스, 검색 최적화, 오프라인 현장.

PRINT 브랜드명과 상세 성과는 파트너 보호를 위해 공개하지 않습니다. 자료가
없는 수치나 성과를 추가하지 않습니다.

페이지별 원문 근거는 `tmp/pdfs/company-content.md`에 있습니다. 이 파일은 로컬 검토 자료이며 배포 결과에 포함되지 않습니다.

## 회사 연혁

`history`에 확인된 2026년 상반기 활동을 표시했습니다. 설립연도나 주요 사건은 아직 미정입니다. 자료를 받으면 `history-year` 행을 추가하고 날짜·설명을 작성합니다. 확인 후에만 `history-pending` 안내를 제거합니다.

## 채용

`careers`는 상품·브랜드·채널·현장·콘텐츠·CRM 업무에서 경험할 수 있는 범위를 설명하지만 현재 채용 공고를 의미하지 않습니다. 안내를 누르면 아직 모집 직무와 지원 방법을 준비 중이라는 설명이 열립니다. 모집 중이라고 표기하지 않습니다.

직무·근무조건·지원방법이 확정되면 해당 섹션에 공고를 추가하고 실제 지원 채널을 연결합니다. 지금의 일반 문의 이메일을 별도 확인 없이 지원 접수처로 안내하지 않습니다.

## 문의와 주소

`src/contact/index.html`의 이메일·주소와 `src/partials/footer.html`의 사업자정보를 함께 관리합니다. 사업 제휴는 `scm@onshive.kr`, 일반·프로젝트 문의는 `onhive2002@naver.com`, 전자세금계산서는 `tax@onshive.kr`입니다. 전화번호는 사용자 요청으로 제거했습니다. 메일 링크는 사용자의 기본 메일 앱을 실행하며 사이트 자체에서 메시지나 개인정보를 수집하지 않습니다.

## 이미지와 글꼴

- P-0004 생성 이미지: `public/images/brand-connections.webp`(홈/회사소개), `public/images/creative-materials.webp`(홈/사업분야/채용). 생성 원본과 프롬프트는 [이미지 안내](image-assets.md)에 보존했습니다.
- 홈 추가 섹션 스타일은 `src/home-scenes.css`, 하위 페이지 시각 요소는 `src/visual-pages.css`에서 관리합니다. 이미지 크기·비율과 alt를 유지하세요.

- 로고: `public/logo.png`, 원본 비율 유지.
- 파비콘: `public/favicon.svg`.
- 입체 그래픽: HTML에 포함된 SVG, 외부 이미지 요청 없음.
- Noto Sans KR·Archivo 글꼴은 사이트 빌드에 포함됩니다. 라이선스는 `public/licenses/`에 있습니다.

## 모션

`src/scroll-scenes.ts`는 이미지의 `data-image-parallax`, 가로 문자의 `data-scroll-x`, 홈 사업 소개의 `data-service-step`을 처리합니다. `src/main.ts`의 기존 스크롤 프레임과 모션 설정을 공유합니다. 이미지가 패널보다 크게 배치된 여유 안에서만 이동합니다.

별도의 방문자 모션 토글이나 브라우저 저장 상태는 없습니다. 기기의 `prefers-reduced-motion` 설정이 켜져 있으면 아스키 파도·패럴랙스·등장 효과를 줄이고 콘텐츠를 즉시 표시합니다.

홈의 전체 배경 아스키 파도는 `src/ascii-wave.ts`에서 관리합니다. `src/main.ts`의 공통 모션 설정을 사용하며 화면 밖이나 숨긴 탭에서는 애니메이션을 멈춥니다. 제목 뒤 문자 농도는 낮게 유지합니다. 로고와 회사소개 페이지의 SVG는 별도 요소입니다.

## 배포 시

`npm run build` 후 **dist 폴더만** 정적 호스팅에 업로드합니다. 프로젝트 전체를 업로드하지 않습니다. canonical, og:url과 사이트맵은 지정 도메인 `https://onshive.kr` 기준입니다. Pages 프로젝트와 배포 명령은 [배포 안내서](cloudflare-domain-guide.md)에 있습니다.
# 2026-09-25 개편 안내

- 홈 `/`, 회사소개 `/about/`, 사업분야 `/business/`, 성과·연혁 `/history/`, 채용 `/careers/`, 문의 `/contact/`로 분리했습니다. 각 페이지 원문은 `src/<페이지>/index.html`이며 홈은 `src/index.html`입니다.
- 공통 메뉴와 하단은 `src/partials/header.html`, `src/partials/footer.html`입니다. Vite 빌드에서 각 페이지 HTML에 결합되므로 JavaScript 없이도 메뉴가 보입니다.
- 회사소개 모션은 `data-depth`의 속도 값과 `src/main.ts`에서 관리합니다. 모바일에서는 sticky 서사를 일반 흐름으로 전환합니다.
- 사용자 요청에 따라 전화번호와 전화 링크를 제거했습니다. 일반 프로젝트 문의는 소개서의 `onhive2002@naver.com`을 유지합니다.
- 최신 사업자등록증(2026-07-01, 1쪽)을 기준으로 법인명 주식회사 온스하이브, 대표 서동완, 사업자번호 234-86-02681, 동탄구 동탄대로 635 1동 306호로 수정했습니다. 회사소개서의 이전 주소 대신 이 등록증의 주소를 사용합니다.
- `tax@onshive.kr`은 전자세금계산서 전용으로 구분해 표시합니다. 등록증 원문은 공개 사이트에 포함하지 않습니다.
- 실배포는 [Cloudflare 안내](cloudflare-domain-guide.md)를 참고합니다. `dist/`만 공개하며 도메인 기준은 `https://onshive.kr`입니다.

## 2026-09-29 원본 스타일 복원과 콘텐츠 보강

- `v1.0.0`의 CSS·타이포·ASCII 파도·패럴랙스·공통 레이아웃을 복원했습니다.
- 새 디자인 시스템이나 v2 전용 페이지를 섞지 않고 기존 Home/About/Business/History/Careers/Contact 구조만 사용합니다.
- v2에서 검증된 PET·PRINT·운영·파트너십 내용을 회사소개서 근거 범위 안에서 이관했습니다.
- 공개 배포는 별도 승인 범위이며 이 변경 자체는 GitHub 버전과 로컬 미리보기까지만 관리합니다.
