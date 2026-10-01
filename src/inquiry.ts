export const proposalTypes = [
  "제조·OEM 제안",
  "상품 공급",
  "유통",
  "오프라인 리테일",
  "온라인 판매 채널",
  "B2B 제안",
  "전략적 제휴",
  "기타",
] as const;

export type Inquiry = {
  company: string;
  name: string;
  phone: string;
  email: string;
  type: string;
  description: string;
  consent: true;
  website: string;
  startedAt: number;
  requestId: string;
};

export type DeliveryReply = {
  state: "success" | "failure" | "unknown";
  code: string;
  reference?: string;
};

type Validation =
  { ok: true; value: Inquiry } | { ok: false; code: string; message: string };

export function validateInquiry(value: unknown, now = Date.now()): Validation {
  const invalid = (message: string, code = "INVALID_INPUT"): Validation => ({
    ok: false,
    code,
    message,
  });
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalid("문의 항목을 확인해 주세요.");
  }
  const fields = value as Record<string, unknown>;
  const limits = {
    company: 100,
    name: 100,
    phone: 80,
    email: 254,
    type: 30,
    description: 1000,
  };
  const cleaned: Record<string, string> = {};
  for (const [field, limit] of Object.entries(limits)) {
    const text = fields[field];
    if (typeof text !== "string" || text.length > limit) {
      return invalid("입력한 항목의 형식과 길이를 확인해 주세요.");
    }
    const controls =
      field === "description"
        ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/
        : /[\x00-\x1f\x7f]/;
    if (controls.test(text)) {
      return invalid("입력 항목에 사용할 수 없는 문자가 있습니다.");
    }
    cleaned[field] = text.replace(/\r\n?/g, "\n").trim();
  }
  if (!cleaned.company || !cleaned.name || !cleaned.description) {
    return invalid("회사명, 담당자명과 제안 내용을 확인해 주세요.");
  }
  if (!proposalTypes.some((type) => type === cleaned.type)) {
    return invalid("제휴 유형을 선택해 주세요.");
  }
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(cleaned.email)) {
    return invalid("답변받을 이메일 주소를 확인해 주세요.");
  }
  if (fields.consent !== true) {
    return invalid("개인정보 수집·이용 동의를 확인해 주세요.");
  }
  if (fields.website !== "") {
    return invalid("양식을 새로 열어 다시 확인해 주세요.", "SPAM_REJECTED");
  }
  const startedAt = fields.startedAt;
  if (
    typeof startedAt !== "number" ||
    !Number.isSafeInteger(startedAt) ||
    startedAt <= 0 ||
    now - startedAt < 2000
  ) {
    return invalid("양식을 확인한 뒤 잠시 후 다시 보내 주세요.", "TOO_FAST");
  }
  if (now - startedAt > 24 * 60 * 60 * 1000) {
    return invalid(
      "양식을 연 지 오래됐습니다. 내용을 복사한 뒤 새로 열어 주세요.",
    );
  }
  if (
    typeof fields.requestId !== "string" ||
    !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
      fields.requestId,
    )
  ) {
    return invalid("양식을 새로 열어 다시 확인해 주세요.");
  }
  return {
    ok: true,
    value: {
      company: cleaned.company,
      name: cleaned.name,
      phone: cleaned.phone,
      email: cleaned.email,
      type: cleaned.type,
      description: cleaned.description,
      consent: true,
      website: "",
      startedAt,
      requestId: fields.requestId,
    },
  };
}

export class BodyLimitError extends Error {}

// Bound actual streamed bytes, not only the untrusted Content-Length header.
export async function readLimitedText(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<string> {
  if (!body) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false });
  let bytes = 0;
  let result = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) throw new BodyLimitError("Body too large");
      result += decoder.decode(chunk.value, { stream: true });
    }
    return result + decoder.decode();
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
}
