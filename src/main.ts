import "@fontsource-variable/noto-sans-kr";
import "@fontsource-variable/archivo";
import "./styles.css";

const root = document.documentElement;
root.classList.add("js");

const menuButton = document.querySelector<HTMLButtonElement>(".menu-button");
const navigation = document.querySelector<HTMLElement>(".primary-navigation");
const desktop = window.matchMedia("(min-width: 861px)");

function setMenuOpen(open: boolean, restoreFocus = false): void {
  if (!menuButton || !navigation) return;
  navigation.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.textContent = open ? "CLOSE" : "MENU";
  if (restoreFocus) menuButton.focus();
}

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
  });
  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      setMenuOpen(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navigation.classList.contains("open")) {
      setMenuOpen(false, true);
    }
  });
  document.addEventListener("click", (event) => {
    if (
      event.target instanceof Node &&
      !navigation.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      setMenuOpen(false);
    }
  });
  desktop.addEventListener("change", () => setMenuOpen(false));
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealElements = [...document.querySelectorAll<HTMLElement>(".reveal")];

function revealEverything(): void {
  revealElements.forEach((element) => element.classList.add("visible"));
}

if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  revealEverything();
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );
  revealElements.forEach((element) => observer.observe(element));
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) revealEverything();
  });
}

const tabs = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-flow-tab]"),
];
const panel = document.querySelector<HTMLElement>("[data-flow-panel]");

type Flow = {
  summary: string;
  pet: string;
  print: string;
};

const flows: Flow[] = [
  {
    summary: "판매 데이터, 고객 문의와 리뷰로 실제 수요를 확인합니다.",
    pet: "급여·증상 관련 고객 질문을 콘텐츠 주제와 상품 구성에 반영합니다.",
    print: "채널 판매와 리뷰 데이터로 취급 품목의 수요를 확인합니다.",
  },
  {
    summary: "상품 구성, 가격, 패키지와 상세페이지를 결정합니다.",
    pet: "멍수무강 사료·간식·영양제 30종의 구성과 가격을 운영합니다.",
    print: "소싱 상품의 상품화와 등록 정보를 구성합니다.",
  },
  {
    summary: "제조 파트너와 공급처를 발굴하고 품질을 확인합니다.",
    pet: "목우촌 브랜드 사용 계약을 기반으로 상품 공급 체계를 운영합니다.",
    print: "해외 제조사를 발굴하고 직수입·검품·통관을 수행합니다.",
  },
  {
    summary: "판매 채널에 직접 입점하고 상품·가격·재고를 운영합니다.",
    pet: "자사몰을 포함한 10개 판매 채널을 직접 운영합니다.",
    print: "쿠팡 입점 상품의 정보·재고·가격을 운영합니다.",
  },
  {
    summary: "광고, 콘텐츠, 현장 판매와 재구매 시나리오를 운영합니다.",
    pet: "펫 박람회 현장 판매를 자사몰 재유입으로 연결합니다.",
    print: "판매 채널의 광고와 리뷰 접점을 관리합니다.",
  },
  {
    summary: "재고, 출고, 고객 응대와 채널 정산을 관리합니다.",
    pet: "채널별 재고·CS·리뷰 데이터를 운영합니다.",
    print: "재고와 CS 흐름을 운영하며 물류 체계를 확장합니다.",
  },
];

function selectFlow(index: number, focus = false): void {
  if (!panel || !tabs[index] || !flows[index]) return;
  tabs.forEach((tab, tabIndex) => {
    const selected = tabIndex === index;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  const selected = tabs[index];
  const flow = flows[index];
  panel.setAttribute("aria-labelledby", selected.id);
  const summary = panel.querySelector<HTMLElement>("[data-flow-summary]");
  const pet = panel.querySelector<HTMLElement>("[data-flow-pet]");
  const print = panel.querySelector<HTMLElement>("[data-flow-print]");
  const step = panel.querySelector<HTMLElement>("[data-flow-step]");
  const label = selected.querySelector("strong")?.textContent ?? "";
  if (step) step.textContent = `0${index + 1} · ${label}`;
  if (summary) summary.textContent = flow.summary;
  if (pet) pet.textContent = flow.pet;
  if (print) print.textContent = flow.print;
  if (focus) selected.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectFlow(index));
  tab.addEventListener("keydown", (event) => {
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    selectFlow(next, true);
  });
});

const partnershipForm = document.querySelector<HTMLFormElement>(
  "[data-partnership-form]",
);
const formStatus = document.querySelector<HTMLElement>("[data-form-status]");

partnershipForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!partnershipForm.reportValidity()) return;

  const data = new FormData(partnershipForm);
  const type = String(data.get("inquiryType") ?? "Partnership");
  const company = String(data.get("company") ?? "");
  const name = String(data.get("name") ?? "");
  const email = String(data.get("email") ?? "");
  const phone = String(data.get("phone") ?? "");
  const description = String(data.get("description") ?? "");
  const body = [
    `문의 유형: ${type}`,
    `회사명: ${company}`,
    `담당자: ${name}`,
    `이메일: ${email}`,
    `연락처: ${phone || "미입력"}`,
    "",
    "제안 내용:",
    description,
  ].join("\n");

  if (formStatus) {
    formStatus.textContent =
      "메일 앱을 열었습니다. 선택한 파일이 있다면 메일 앱에서 직접 첨부해 주세요.";
  }
  window.location.href = `mailto:scm@onshive.kr?subject=${encodeURIComponent(
    `[ONSHIVE 제휴] ${type} · ${company}`,
  )}&body=${encodeURIComponent(body)}`;
});
