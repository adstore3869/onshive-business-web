import {
  BodyLimitError,
  readLimitedText,
  validateInquiry,
  type DeliveryReply,
  type Inquiry,
} from "../src/inquiry.js";

type Runtime = {
  fetch?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
};

const reply = (status: number, result: DeliveryReply) =>
  new Response(JSON.stringify(result), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

function isSlackWebhook(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "hooks.slack.com" &&
      url.href === value &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      /^\/services\/[A-Za-z0-9]+\/[A-Za-z0-9]+\/[A-Za-z0-9]+$/.test(
        url.pathname,
      )
    );
  } catch {
    return false;
  }
}

function slackMessage(inquiry: Inquiry, now: number) {
  // Plain-text objects cannot invoke Slack mentions or user-supplied markdown.
  const plain = (text: string) => ({
    type: "plain_text",
    text: text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;"),
    emoji: false,
  });
  return {
    text: "ONSHIVE 사업 제휴 문의",
    blocks: [
      { type: "header", text: plain("ONSHIVE 사업 제휴 문의") },
      {
        type: "section",
        fields: [
          plain(`회사명\n${inquiry.company}`),
          plain(`담당자명\n${inquiry.name}`),
          plain(`답변받을 이메일\n${inquiry.email}`),
          plain(`연락처\n${inquiry.phone || "미기재"}`),
          plain(`제휴 유형\n${inquiry.type}`),
        ],
      },
      // Escape without truncation; each block stays below Slack's text limit.
      ...(inquiry.description.match(/[\s\S]{1,500}/gu) ?? []).map(
        (part, index) => ({
          type: "section",
          text: plain(`제안 내용${index ? " (계속)" : ""}\n${part}`),
        }),
      ),
      {
        type: "context",
        elements: [
          plain(
            `문의 번호: ${inquiry.requestId} · ${new Date(now).toISOString()}`,
          ),
          plain("개인정보 수집·이용 동의 확인 · 보유기간 접수일로부터 3년"),
        ],
      },
    ],
  };
}

export async function handleInquiry(
  request: Request,
  webhookUrl: string | undefined,
  runtime: Runtime = {},
): Promise<Response> {
  if (request.method !== "POST") {
    const response = reply(405, {
      state: "failure",
      code: "METHOD_NOT_ALLOWED",
    });
    response.headers.set("Allow", "POST");
    return response;
  }
  if (
    request.headers.get("Origin") !== new URL(request.url).origin ||
    request.headers.get("X-Requested-With") !== "ONSHIVE-Contact" ||
    (request.headers.has("Sec-Fetch-Site") &&
      request.headers.get("Sec-Fetch-Site") !== "same-origin")
  ) {
    return reply(403, { state: "failure", code: "ORIGIN_REJECTED" });
  }
  if (
    request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    return reply(415, { state: "failure", code: "INVALID_CONTENT_TYPE" });
  }
  const maxBytes = 16 * 1024;
  const length = request.headers.get("Content-Length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) {
    return reply(413, { state: "failure", code: "BODY_TOO_LARGE" });
  }
  let value: unknown;
  try {
    value = JSON.parse(await readLimitedText(request.body, maxBytes));
  } catch (error) {
    return reply(error instanceof BodyLimitError ? 413 : 400, {
      state: "failure",
      code: error instanceof BodyLimitError ? "BODY_TOO_LARGE" : "INVALID_JSON",
    });
  }
  const now = (runtime.now ?? Date.now)();
  const validation = validateInquiry(value, now);
  if (!validation.ok) {
    return reply(400, { state: "failure", code: validation.code });
  }
  const inquiry = validation.value;
  const reference = inquiry.requestId;
  if (!isSlackWebhook(webhookUrl)) {
    return reply(503, { state: "failure", code: "NOT_CONFIGURED", reference });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), runtime.timeoutMs ?? 8000);
  try {
    const response = await (runtime.fetch ?? fetch)(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackMessage(inquiry, now)),
      redirect: "error",
      signal: controller.signal,
    });
    if (response.status === 200) {
      const accepted = await readLimitedText(response.body, 256);
      if (accepted.trim() === "ok") {
        return reply(200, { state: "success", code: "ACCEPTED", reference });
      }
    } else {
      await response.body?.cancel().catch(() => undefined);
      if ([400, 403, 404, 410, 429].includes(response.status)) {
        return reply(502, {
          state: "failure",
          code: response.status === 429 ? "RATE_LIMITED" : "DELIVERY_REJECTED",
          reference,
        });
      }
    }
  } catch {
    // It may already have arrived. Never expose exception text or retry here.
  } finally {
    clearTimeout(timer);
  }
  return reply(502, { state: "unknown", code: "DELIVERY_UNKNOWN", reference });
}
