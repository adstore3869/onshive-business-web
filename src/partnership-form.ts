type PartnershipValues = {
  company: string;
  name: string;
  phone: string;
  email: string;
  type: string;
  description: string;
};

const proposalTypes = [
  "제조·OEM 제안",
  "상품 공급",
  "유통",
  "오프라인 리테일",
  "온라인 판매 채널",
  "B2B 제안",
  "전략적 제휴",
  "기타",
];

// Only creates a local draft URL. No request, storage, file read or email send.
export function buildPartnershipMailto(values: PartnershipValues): string {
  const singleLine = (value: string) =>
    value.replace(/[\r\n\x00-\x1f]/g, " ").trim();
  const company = singleLine(values.company);
  const name = singleLine(values.name);
  const email = singleLine(values.email);
  const type = singleLine(values.type);
  const description = values.description.replace(/\r\n?/g, "\n").trim();
  if (!company || !name || !description || !proposalTypes.includes(type)) {
    throw new Error("회사명, 담당자명, 제휴 유형과 제안 내용을 확인해 주세요.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("연락받을 이메일 주소를 확인해 주세요.");
  }
  const body = [
    `회사명: ${company}`,
    `담당자: ${name}`,
    `연락처: ${singleLine(values.phone) || "미기재"}`,
    `이메일: ${email}`,
    `제휴 유형: ${type}`,
    "",
    "회사·상품 및 제안 내용:",
    description,
    "",
    "※ 소개 자료는 이 메일에 직접 첨부해 주세요.",
  ].join("\n");
  const url = `mailto:scm@onshive.kr?subject=${encodeURIComponent(`[사업 제휴] ${company} / ${type}`)}&body=${encodeURIComponent(body)}`;
  if (url.length > 8000) {
    throw new Error(
      "메일 초안이 너무 깁니다. 내용을 줄이거나 scm@onshive.kr로 직접 보내 주세요.",
    );
  }
  return url;
}

export function setupPartnershipForm(): void {
  const form = document.querySelector<HTMLFormElement>("#partnership-form");
  const button = form?.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  );
  const status = form?.querySelector<HTMLElement>('[role="status"]');
  if (!form || !button || !status) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const value = (field: string) => String(data.get(field) ?? "");
    try {
      const url = buildPartnershipMailto({
        company: value("company"),
        name: value("name"),
        phone: value("phone"),
        email: value("email"),
        type: value("type"),
        description: value("description"),
      });
      status.textContent =
        "메일 앱에서 초안을 확인한 뒤 직접 보내 주세요. 이 사이트에서 문의가 접수되거나 전송된 것은 아닙니다.";
      // Explicit user submit opens their mail client; it never sends the email.
      window.location.href = url;
    } catch (error) {
      status.textContent =
        error instanceof Error
          ? error.message
          : "메일 앱에서 문의를 작성하거나 이메일로 직접 연락해 주세요.";
    }
  });
  // Fail closed if the script fails to load or initialize. Direct email stays visible.
  button.disabled = false;
  form.hidden = false;
}
