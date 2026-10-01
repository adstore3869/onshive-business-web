import {
  readLimitedText,
  validateInquiry,
  type DeliveryReply,
  type Inquiry,
} from "./inquiry.js";

const failureCodes = new Set([
  "METHOD_NOT_ALLOWED",
  "ORIGIN_REJECTED",
  "INVALID_CONTENT_TYPE",
  "BODY_TOO_LARGE",
  "INVALID_JSON",
  "INVALID_INPUT",
  "SPAM_REJECTED",
  "TOO_FAST",
  "NOT_CONFIGURED",
  "RATE_LIMITED",
  "DELIVERY_REJECTED",
]);

export async function sendInquiry(
  values: Inquiry,
  transport: typeof fetch = fetch,
  timeoutMs = 12000,
): Promise<DeliveryReply> {
  const unknown: DeliveryReply = {
    state: "unknown",
    code: "DELIVERY_UNKNOWN",
    reference: values.requestId,
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await transport("/api/inquiry", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "ONSHIVE-Contact",
      },
      body: JSON.stringify(values),
      redirect: "error",
      signal: controller.signal,
    });
    const result: unknown = JSON.parse(
      await readLimitedText(response.body, 2048),
    );
    if (!result || typeof result !== "object" || Array.isArray(result))
      return unknown;
    const received = result as Record<string, unknown>;
    if (
      response.status === 200 &&
      received.state === "success" &&
      received.code === "ACCEPTED" &&
      received.reference === values.requestId
    ) {
      return {
        state: "success",
        code: "ACCEPTED",
        reference: values.requestId,
      };
    }
    if (
      !response.ok &&
      received.state === "failure" &&
      typeof received.code === "string" &&
      failureCodes.has(received.code)
    ) {
      return {
        state: "failure",
        code: received.code,
        reference: values.requestId,
      };
    }
  } catch {
    // A lost response is not proof of non-delivery. No automatic retries.
  } finally {
    clearTimeout(timer);
  }
  return unknown;
}

export function setupPartnershipForm(): void {
  const form = document.querySelector<HTMLFormElement>("#partnership-form");
  const button = form?.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  );
  const buttonLabel = button?.querySelector<HTMLElement>(".button-label");
  const status = form?.querySelector<HTMLElement>('[role="status"]');
  const title = status?.querySelector<HTMLElement>(".status-title");
  const copy = status?.querySelector<HTMLElement>(".status-copy");
  const contact = status?.querySelector<HTMLAnchorElement>(".status-contact");
  if (
    !form ||
    !button ||
    !buttonLabel ||
    !status ||
    !title ||
    !copy ||
    !contact
  )
    return;

  let state: "idle" | "sending" | DeliveryReply["state"] = "idle";
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const controls = form.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >("input, select, textarea");
  const setState = (next: typeof state, heading: string, message: string) => {
    state = next;
    form.dataset.state = next;
    form.setAttribute("aria-busy", String(next === "sending"));
    const locked =
      next === "sending" || next === "success" || next === "unknown";
    button.disabled = locked;
    for (const control of controls) control.disabled = locked;
    buttonLabel.textContent =
      next === "sending"
        ? "전송 중…"
        : next === "success"
          ? "전송 완료"
          : "문의 보내기";
    status.hidden = next === "idle";
    status.dataset.tone = next === "failure" ? "error" : "normal";
    title.textContent = heading;
    copy.textContent = message;
    contact.hidden = next !== "failure" && next !== "unknown";
  };

  const submit = async () => {
    if (state === "sending" || state === "success" || state === "unknown")
      return;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const text = (name: string) => data.get(name);
    const validation = validateInquiry({
      company: text("company"),
      name: text("name"),
      phone: text("phone"),
      email: text("email"),
      type: text("type"),
      description: text("description"),
      consent: data.get("consent") === "on",
      website: text("website"),
      startedAt,
      requestId,
    });
    if (!validation.ok) {
      setState("failure", "입력 내용을 확인해 주세요.", validation.message);
      return;
    }
    setState(
      "sending",
      "문의 내용을 보내고 있습니다.",
      "완료 안내가 표시될 때까지 잠시 기다려 주세요.",
    );
    const result = await sendInquiry(validation.value);
    if (result.state === "success") {
      setState(
        "success",
        "문의가 전달되었습니다.",
        "담당자가 내용을 검토한 뒤 남겨 주신 연락처로 답변드립니다.",
      );
    } else if (result.state === "failure") {
      setState(
        "failure",
        "문의가 전송되지 않았습니다.",
        result.code === "RATE_LIMITED"
          ? "잠시 후 다시 시도하거나 아래 연락처로 문의해 주세요. 입력 내용은 그대로 남아 있습니다."
          : "입력 내용을 확인하고 다시 시도하거나 아래 연락처로 문의해 주세요. 입력 내용은 그대로 남아 있습니다.",
      );
    } else {
      setState(
        "unknown",
        "전송 결과를 확인하지 못했습니다.",
        `중복 문의를 막기 위해 다시 보내기를 멈췄습니다. 아래 연락처로 전달 여부를 확인해 주세요. 문의 번호: ${requestId}`,
      );
    }
  };
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void submit().catch(() => {
      setState(
        "unknown",
        "전송 결과를 확인하지 못했습니다.",
        `입력 내용은 그대로 남아 있습니다. 아래 연락처로 확인해 주세요. 문의 번호: ${requestId}`,
      );
    });
  });
  // Enable only after initialization. No-JS visitors keep the direct contact links.
  setState("idle", "", "");
  form.hidden = false;
}
