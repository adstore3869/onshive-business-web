# 콘텐츠 수정 안내

홈 본문은 `src/index.html`, 개별 페이지는 `src/<페이지>/index.html`,
화면 스타일은 `src/styles.css`, 상호작용은 `src/main.ts`에 있습니다.

## 페이지 구조

- 홈: `/`
- 회사: `/company/`
- 사업: `/business/`
- 운영 역량: `/capabilities/`
- 채용: `/careers/`
- 제휴: `/partnership/`

이전 주소 `/about/`, `/history/`, `/contact/`는 새 페이지로 안내하는 호환
문서입니다. 공통 메뉴와 하단은 `src/partials/header.html`,
`src/partials/footer.html`이며 Vite 빌드 시 각 HTML에 결합됩니다.

## 사실과 수치

통계는 제공된 2026 회사소개서의 범위와 기간을 함께 유지합니다.

- 커머스 채널 10개: 자사몰을 포함한 직접 운영 채널 수
- 30종: 목우촌 멍수무강 사료·간식·영양제 포트폴리오
- 펫 박람회 15회: 2026년 1~6월 참가 실적

설립일, 임직원, 거래처, 주문과 고객 수처럼 확정 근거가 없는 값은 임의로
추가하지 않습니다. 확인 후 `자료 확인 중` 표지를 실제 값과 기준일로
교체합니다. 로컬 원문 근거는 `tmp/pdfs/company-content.md`에 있으며 배포
결과에는 포함되지 않습니다.

## 연혁과 채용

확인된 2026년 상반기 활동만 `src/company/index.html#milestones`에
표시합니다. 사건 날짜가 확인되면 `timeline` 항목을 갱신합니다.

확정 채용 공고가 없을 때는 모집 중이라고 표기하지 않습니다. 직무, 근무조건,
지원 방법과 접수 채널이 모두 확정된 후 `src/careers/index.html`에 추가합니다.
일반 문의 이메일을 확인 없이 채용 접수처로 사용하지 않습니다.

## 문의와 주소

`src/partnership/index.html`의 이메일과
`src/partials/footer.html`의 사업자정보를 함께 관리합니다. 전화번호는 사용자
요청으로 제거했습니다. 제휴 폼은 서버에 개인정보를 저장하지 않고 사용자의 메일
앱을 실행합니다. 브라우저는 파일을 메일에 자동 첨부할 수 없으므로 첨부파일은
메일 앱에서 다시 선택하도록 안내합니다.

- 일반 문의: `onhive2002@naver.com`
- 제휴: `scm@onshive.kr`
- 전자세금계산서 전용: `tax@onshive.kr`

법인명, 대표, 사업자번호와 주소는 2026-07-01 사업자등록증 기준입니다. 등록증
원문은 공개 사이트나 Git 저장소에 포함하지 않습니다.

## 이미지와 글꼴

- 제품·커머스 이미지: `public/images/commerce/`
- 로고·파비콘: `public/logo.png`, `public/favicon.svg`
- 생성·보정 이력: [이미지 자산 기록](image-assets.md)
- 새 상품 이미지 처리: [제품 이미지 제작 규칙](image-workflow.md)
- 자체 호스팅 글꼴 라이선스: `public/licenses/`

제품 라벨과 실제 외형을 임의로 바꾸지 않으며, 자료가 없는 PRINT 제품이나 현장
사진은 실제인 것처럼 생성하지 않습니다.

## 접근성과 모션

`src/main.ts`는 모바일 메뉴, 키보드 조작 가능한 운영 단계 탭, 뷰포트 등장
효과와 메일 앱 제휴 문의를 담당합니다. 콘텐츠는 JavaScript가 없어도 읽을 수
있고, 운영체제의 `prefers-reduced-motion` 설정이 켜지면 등장 효과를 생략합니다.

## 배포와 버전

`npm run build` 후 `dist/`만 정적 호스팅에 업로드합니다. canonical,
Open Graph URL과 사이트맵은 `https://onshive.kr` 기준입니다. 배포 전
typecheck, lint, build와 브라우저 점검을 모두 수행합니다.

- Cloudflare: [배포 안내서](cloudflare-domain-guide.md)
- Git 버전 복구: [버전 및 롤백](versioning-and-rollback.md)
