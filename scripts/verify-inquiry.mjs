import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceFiles = [
  "src/inquiry.ts",
  "src/partnership-form.ts",
  "server/inquiry.ts",
];
const fingerprints = () =>
  sourceFiles.map((name) => ({
    name,
    bytes: fs.readFileSync(path.join(root, name)),
    mtime: fs.statSync(path.join(root, name)).mtimeMs,
  }));
const before = fingerprints();
execFileSync(
  process.execPath,
  [
    path.join(root, "node_modules/typescript/bin/tsc"),
    "--ignoreConfig",
    ...sourceFiles,
    "--rootDir",
    ".",
    "--target",
    "ES2022",
    "--module",
    "ESNext",
    "--moduleResolution",
    "Bundler",
    "--lib",
    "ES2022,DOM",
    "--strict",
    "--skipLibCheck",
    "--outDir",
    "tmp/inquiry-test",
  ],
  { cwd: root, stdio: "pipe" },
);
const compiled = (name) =>
  pathToFileURL(path.join(root, "tmp/inquiry-test", name)).href;
const results = [];
const probe = async (name, run) => {
  try {
    let timer;
    try {
      await Promise.race([
        Promise.resolve().then(run),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("Probe exceeded its 1s local bound")),
            1000,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
    results.push({ name, pass: true });
  } catch (error) {
    results.push({ name, pass: false, error: String(error.message) });
  }
};
const originalFetch = globalThis.fetch;
const forbiddenRequests = [];
globalThis.fetch = async () => {
  forbiddenRequests.push("unmocked request");
  throw new Error("No real network is permitted in this regression suite");
};
const controlledTimeout = async (run) => {
  const original = globalThis.setTimeout;
  const delays = [];
  globalThis.setTimeout = (callback, milliseconds, ...args) => {
    delays.push(milliseconds);
    return original(
      callback,
      milliseconds === 8000 ? 2 : milliseconds,
      ...args,
    );
  };
  try {
    return { value: await run(), delays };
  } finally {
    globalThis.setTimeout = original;
  }
};

const NOW = 1790830800000;
const ID = "123e4567-e89b-42d3-a456-426614174000";
// This is a synthetic fixture. It is never passed to a real network transport.
const WEBHOOK = new URL(
  "/services/ReviewOnly/FixtureOnly/NeverSent123",
  "https://hooks.slack.com",
).href;
const valid = (changes = {}) => ({
  company: "검수 더미 회사",
  name: "검수 담당자",
  phone: "",
  email: "review@example.invalid",
  type: "기타",
  description: "로컬 모의 검수용 제안",
  consent: true,
  website: "",
  startedAt: NOW - 2000,
  requestId: ID,
  ...changes,
});
const encoder = new TextEncoder();
const stream = (chunks, onCancel = () => {}) =>
  new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
    cancel: onCancel,
  });
const request = (body = JSON.stringify(valid()), overrides = {}) => {
  const headers = new Headers({
    Origin: "https://onshive.kr",
    "Content-Type": "application/json; charset=utf-8",
    "X-Requested-With": "ONSHIVE-Contact",
    ...overrides.headers,
  });
  for (const name of overrides.omitHeaders ?? []) headers.delete(name);
  const method = overrides.method ?? "POST";
  return new Request("https://onshive.kr/api/inquiry", {
    method,
    headers,
    ...(method === "GET" || method === "HEAD" ? {} : { body }),
    ...(body instanceof ReadableStream ? { duplex: "half" } : {}),
  });
};
const inspect = async (
  response,
  expectedStatus,
  expectedState,
  expectedCode,
) => {
  assert.equal(response.status, expectedStatus);
  assert.match(response.headers.get("Content-Type"), /^application\/json/);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  const value = await response.json();
  assert.equal(value.state, expectedState);
  assert.equal(value.code, expectedCode);
  assert.ok(
    Object.keys(value).every((key) =>
      ["state", "code", "reference"].includes(key),
    ),
  );
  const text = JSON.stringify(value);
  assert.ok(!text.includes(WEBHOOK));
  assert.ok(!text.includes("review@example.invalid"));
  assert.ok(!text.includes("검수 더미 회사"));
  assert.ok(!text.includes("NEVER_EXPOSE_ERROR"));
  return value;
};
const recorder = (respond = () => new Response("ok", { status: 200 })) => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return respond(url, init);
  };
  return { calls, fetch };
};
const accepted = (reference = ID) =>
  Response.json({ state: "success", code: "ACCEPTED", reference });
const aborting = (calls) => async (url, init) => {
  calls.push({ url, init, aborted: false });
  return new Promise((_, reject) => {
    init.signal.addEventListener(
      "abort",
      () => {
        calls.at(-1).aborted = true;
        reject(new DOMException("Mock timeout", "AbortError"));
      },
      { once: true },
    );
  });
};
const swapGlobal = (name, value) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
  return () =>
    original
      ? Object.defineProperty(globalThis, name, original)
      : Reflect.deleteProperty(globalThis, name);
};
const withForm = async (options, run) => {
  const fields = valid(options.values);
  const controls = [
    "company",
    "name",
    "phone",
    "email",
    "type",
    "description",
    "consent",
    "website",
  ].map((name) => ({ name, value: fields[name], disabled: false }));
  const label = { textContent: "문의 보내기" };
  const title = { textContent: "" };
  const copy = { textContent: "" };
  const contact = { hidden: true };
  const status = {
    hidden: true,
    dataset: {},
    querySelector: (name) =>
      ({
        ".status-title": title,
        ".status-copy": copy,
        ".status-contact": contact,
      })[name] ?? null,
  };
  const button = {
    disabled: true,
    querySelector: () => (options.missingLabel ? null : label),
  };
  const events = new Map(),
    attributes = new Map(),
    calls = [];
  const form = {
    hidden: true,
    dataset: {},
    resetCalls: 0,
    querySelector: (name) =>
      name === 'button[type="submit"]' ? button : status,
    querySelectorAll: () => controls,
    setAttribute: (name, value) => attributes.set(name, value),
    reportValidity: () => options.nativeValid !== false,
    addEventListener: (name, callback) => events.set(name, callback),
    reset() {
      this.resetCalls++;
    },
  };
  const snapshot = JSON.stringify(controls.map((control) => control.value));
  let clock = NOW;
  const realNow = Date.now;
  Date.now = () => clock;
  const restore = [
    swapGlobal("document", {
      querySelector: () => (options.missingForm ? null : form),
    }),
    swapGlobal("crypto", { randomUUID: () => ID }),
    swapGlobal(
      "FormData",
      class {
        constructor() {
          if (options.formDataThrows) throw new Error("NEVER_EXPOSE_ERROR");
        }
        get(name) {
          return name === "consent"
            ? fields.consent === true
              ? "on"
              : null
            : fields[name];
        }
      },
    ),
    swapGlobal("fetch", async (url, init) => {
      calls.push({ url, init });
      return options.transport ? options.transport(url, init) : accepted();
    }),
  ];
  const h = {
    form,
    button,
    controls,
    title,
    copy,
    contact,
    status,
    label,
    attributes,
    calls,
    submit() {
      let prevented = false;
      events.get("submit")?.({
        preventDefault: () => {
          prevented = true;
        },
      });
      return prevented;
    },
    setClock: (value) => {
      clock = value;
    },
    preserved: () => {
      assert.equal(
        JSON.stringify(controls.map((control) => control.value)),
        snapshot,
      );
      assert.equal(form.resetCalls, 0);
    },
    async settle(state) {
      for (let count = 0; count < 40 && form.dataset.state !== state; count++)
        await new Promise((resolve) => setImmediate(resolve));
      assert.equal(form.dataset.state, state);
    },
  };
  try {
    setupPartnershipForm();
    clock += 2000;
    await run(h);
  } finally {
    Date.now = realNow;
    for (const undo of restore.reverse()) undo();
  }
};

let validateInquiry, readLimitedText, BodyLimitError, proposalTypes;
let handleInquiry, sendInquiry, setupPartnershipForm;
try {
  ({ validateInquiry, readLimitedText, BodyLimitError, proposalTypes } =
    await import(compiled("src/inquiry.js")));
  ({ handleInquiry } = await import(compiled("server/inquiry.js")));
  ({ sendInquiry, setupPartnershipForm } = await import(
    compiled("src/partnership-form.js")
  ));

  await probe(
    "Valid request is normalized and extra routing fields are discarded",
    () => {
      const result = validateInquiry(
        valid({
          company: "  검수 더미 회사  ",
          description: "앞줄\r\n뒷줄\r끝",
          webhookUrl: "https://example.invalid/not-used",
          recipient: "not-used",
        }),
        NOW,
      );
      assert.equal(result.ok, true);
      assert.equal(result.value.company, "검수 더미 회사");
      assert.equal(result.value.description, "앞줄\n뒷줄\n끝");
      assert.deepEqual(
        Object.keys(result.value).sort(),
        Object.keys(valid()).sort(),
      );
    },
  );
  for (const input of [
    null,
    undefined,
    false,
    7,
    "text",
    [],
    {},
    { company: null },
  ])
    await probe(
      "Unknown JSON-like value rejected: " + JSON.stringify(input),
      () => {
        assert.equal(validateInquiry(input, NOW).ok, false);
      },
    );
  for (const field of Object.keys(valid()))
    await probe("Missing field rejected: " + field, () => {
      const input = valid();
      delete input[field];
      assert.equal(validateInquiry(input, NOW).ok, false);
    });
  for (const field of [
    "company",
    "name",
    "phone",
    "email",
    "type",
    "description",
  ])
    await probe("Non-string field rejected: " + field, () => {
      for (const wrong of [1, false, null, [], {}])
        assert.equal(validateInquiry(valid({ [field]: wrong }), NOW).ok, false);
    });
  const limitValues = {
    company: "a".repeat(100),
    name: "a".repeat(100),
    phone: "1".repeat(80),
    description: "a".repeat(1000),
    email:
      "a".repeat(60) +
      "@" +
      Array(3).fill("b".repeat(61)).join(".") +
      ".invalid",
  };
  for (const [field, exact] of Object.entries(limitValues))
    await probe(
      "Exact length accepted and one extra character rejected: " + field,
      () => {
        assert.equal(validateInquiry(valid({ [field]: exact }), NOW).ok, true);
        assert.equal(
          validateInquiry(valid({ [field]: exact + "x" }), NOW).ok,
          false,
        );
      },
    );
  await probe("Required non-whitespace values and optional empty phone", () => {
    for (const field of ["company", "name", "description"])
      assert.equal(validateInquiry(valid({ [field]: " \t " }), NOW).ok, false);
    assert.equal(validateInquiry(valid({ phone: "" }), NOW).ok, true);
  });
  await probe(
    "All declared proposal types accepted and unknown types rejected",
    () => {
      assert.equal(proposalTypes.length, 8);
      for (const type of proposalTypes)
        assert.equal(validateInquiry(valid({ type }), NOW).ok, true);
      for (const type of ["", "unknown", "기타\n", "a".repeat(31)])
        assert.equal(validateInquiry(valid({ type }), NOW).ok, false);
    },
  );
  await probe(
    "Email syntax and line/control-character injection rejected",
    () => {
      for (const email of [
        "a",
        "a@host",
        "a@@host.test",
        "a b@host.test",
        "a<b@host.test",
        "a@host.test\n",
      ])
        assert.equal(validateInquiry(valid({ email }), NOW).ok, false);
      for (const field of [
        "company",
        "name",
        "phone",
        "email",
        "type",
        "description",
      ])
        for (const character of ["\x00", "\x01", "\x7f"])
          assert.equal(
            validateInquiry(valid({ [field]: valid()[field] + character }), NOW)
              .ok,
            false,
          );
      for (const field of ["company", "name", "phone"])
        assert.equal(
          validateInquiry(valid({ [field]: "a\nb" }), NOW).ok,
          false,
        );
      assert.equal(
        validateInquiry(valid({ description: "첫줄\n둘째줄" }), NOW).ok,
        true,
      );
    },
  );
  await probe("Consent must be literal true and honeypot exactly empty", () => {
    for (const consent of [false, null, "true", "on", 1])
      assert.equal(validateInquiry(valid({ consent }), NOW).ok, false);
    for (const website of ["bot", " ", false, null]) {
      const result = validateInquiry(valid({ website }), NOW);
      assert.equal(result.ok, false);
      assert.equal(result.code, "SPAM_REJECTED");
    }
  });
  await probe("Two-second and 24-hour boundaries plus invalid clocks", () => {
    for (const age of [2000, 2001, 86400000])
      assert.equal(
        validateInquiry(valid({ startedAt: NOW - age }), NOW).ok,
        true,
      );
    for (const startedAt of [
      NOW - 1999,
      NOW + 1,
      0,
      -1,
      NaN,
      Infinity,
      NOW - 2000.5,
      String(NOW),
    ])
      assert.equal(validateInquiry(valid({ startedAt }), NOW).ok, false);
    assert.equal(
      validateInquiry(valid({ startedAt: NOW - 86400001 }), NOW).ok,
      false,
    );
  });
  await probe("UUIDv4 variant/version required, uppercase valid", () => {
    assert.equal(
      validateInquiry(valid({ requestId: ID.toUpperCase() }), NOW).ok,
      true,
    );
    for (const requestId of [
      "",
      "123",
      ID.replace("42d3", "12d3"),
      ID.replace("a456", "7456"),
      1,
    ])
      assert.equal(validateInquiry(valid({ requestId }), NOW).ok, false);
  });

  await probe(
    "Bounded reader handles exact bytes and split multibyte UTF-8",
    async () => {
      const text = "한글🙂\r\n";
      const bytes = encoder.encode(text);
      assert.equal(
        await readLimitedText(
          stream(Array.from(bytes, (byte) => new Uint8Array([byte]))),
          bytes.length,
        ),
        text,
      );
      assert.equal(
        await readLimitedText(
          stream([encoder.encode("a".repeat(16384))]),
          16384,
        ),
        "a".repeat(16384),
      );
      assert.equal(await readLimitedText(null, 1), "");
    },
  );
  await probe(
    "Bounded reader cancels oversized bytes and releases lock",
    async () => {
      let cancelled = false;
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(10000));
          controller.enqueue(new Uint8Array(7000));
        },
        cancel() {
          cancelled = true;
        },
      });
      await assert.rejects(readLimitedText(body, 16384), BodyLimitError);
      assert.equal(cancelled, true);
      assert.equal(body.locked, false);
    },
  );
  await probe("Malformed UTF-8 is rejected rather than replaced", async () => {
    const body = stream([new Uint8Array([0xc3, 0x28])]);
    await assert.rejects(readLimitedText(body, 256), TypeError);
    assert.equal(body.locked, false);
  });

  await probe("Only POST accepted; rejection does not dispatch", async () => {
    const mock = recorder();
    for (const method of ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]) {
      const response = await handleInquiry(
        request(undefined, { method }),
        WEBHOOK,
        { fetch: mock.fetch, now: () => NOW },
      );
      assert.equal(response.headers.get("Allow"), "POST");
      await inspect(response, 405, "failure", "METHOD_NOT_ALLOWED");
    }
    assert.equal(mock.calls.length, 0);
  });
  await probe("Exact Origin and custom header required", async () => {
    const mock = recorder();
    for (const overrides of [
      { omitHeaders: ["Origin"] },
      { headers: { Origin: "null" } },
      { headers: { Origin: "https://evil.invalid" } },
      { headers: { Origin: "https://onshive.kr.evil.invalid" } },
      { headers: { Origin: "https://onshive.kr:444" } },
      { omitHeaders: ["X-Requested-With"] },
      { headers: { "X-Requested-With": "wrong" } },
    ])
      await inspect(
        await handleInquiry(request(undefined, overrides), WEBHOOK, {
          fetch: mock.fetch,
          now: () => NOW,
        }),
        403,
        "failure",
        "ORIGIN_REJECTED",
      );
    assert.equal(mock.calls.length, 0);
  });
  await probe("Present Sec-Fetch-Site must be same-origin", async () => {
    const mock = recorder();
    for (const value of ["same-site", "cross-site", "none"])
      await inspect(
        await handleInquiry(
          request(undefined, { headers: { "Sec-Fetch-Site": value } }),
          WEBHOOK,
          { fetch: mock.fetch, now: () => NOW },
        ),
        403,
        "failure",
        "ORIGIN_REJECTED",
      );
    await inspect(
      await handleInquiry(
        request(undefined, { headers: { "Sec-Fetch-Site": "same-origin" } }),
        WEBHOOK,
        { fetch: mock.fetch, now: () => NOW },
      ),
      200,
      "success",
      "ACCEPTED",
    );
    assert.equal(mock.calls.length, 1);
  });
  await probe(
    "Only JSON content type; declared size checked before dispatch",
    async () => {
      const mock = recorder();
      for (const value of [
        "text/plain",
        "multipart/form-data",
        "application/jsonp",
      ])
        await inspect(
          await handleInquiry(
            request(undefined, { headers: { "Content-Type": value } }),
            WEBHOOK,
            { fetch: mock.fetch, now: () => NOW },
          ),
          415,
          "failure",
          "INVALID_CONTENT_TYPE",
        );
      for (const value of ["-1", "NaN", "16385"])
        await inspect(
          await handleInquiry(
            request(undefined, { headers: { "Content-Length": value } }),
            WEBHOOK,
            { fetch: mock.fetch, now: () => NOW },
          ),
          413,
          "failure",
          "BODY_TOO_LARGE",
        );
      assert.equal(mock.calls.length, 0);
    },
  );
  await probe(
    "Actual streaming size wins over missing or misleading Content-Length",
    async () => {
      const mock = recorder();
      for (const headers of [
        {},
        { "Content-Length": "0" },
        { "Content-Length": "10" },
      ]) {
        const body = stream([
          encoder.encode(" ".repeat(10000)),
          encoder.encode(" ".repeat(7000)),
        ]);
        await inspect(
          await handleInquiry(request(body, { headers }), WEBHOOK, {
            fetch: mock.fetch,
            now: () => NOW,
          }),
          413,
          "failure",
          "BODY_TOO_LARGE",
        );
      }
      assert.equal(mock.calls.length, 0);
    },
  );
  await probe(
    "Invalid JSON UTF-8 and unvalidated data never reach Slack",
    async () => {
      const mock = recorder();
      for (const body of [
        "{",
        "",
        JSON.stringify(null),
        JSON.stringify(valid({ consent: false })),
        stream([new Uint8Array([0xc3, 0x28])]),
      ])
        assert.equal(
          (
            await handleInquiry(request(body), WEBHOOK, {
              fetch: mock.fetch,
              now: () => NOW,
            })
          ).status,
          400,
        );
      assert.equal(mock.calls.length, 0);
    },
  );
  await probe(
    "Missing malformed or attacker-controlled webhook is not dispatched",
    async () => {
      const mock = recorder();
      for (const hook of [
        undefined,
        "",
        "not-a-url",
        WEBHOOK.replace("https:", "http:"),
        WEBHOOK.replace("hooks.slack.com", "hooks.slack.com.evil.invalid"),
        WEBHOOK.replace("hooks.slack.com", "evil.invalid"),
        WEBHOOK.replace("hooks.slack.com", "hooks.slack.com:8443"),
        WEBHOOK.replace("https://", "https://user:password@"),
        WEBHOOK + "?next=evil",
        WEBHOOK + "#fragment",
        " " + WEBHOOK,
        WEBHOOK + "\n",
        WEBHOOK.replace("hooks.slack.com", "HOOKS.SLACK.COM"),
        WEBHOOK.replace("/services/", "/ignored/../services/"),
        "https://hooks.slack.com/archives/FixtureOnly",
      ])
        await inspect(
          await handleInquiry(request(), hook, {
            fetch: mock.fetch,
            now: () => NOW,
          }),
          503,
          "failure",
          "NOT_CONFIGURED",
        );
      assert.equal(mock.calls.length, 0);
    },
  );
  await probe(
    "Explicit HTTPS default port is rejected by no-port contract",
    async () => {
      const mock = recorder();
      await inspect(
        await handleInquiry(
          request(),
          WEBHOOK.replace("hooks.slack.com", "hooks.slack.com:443"),
          { fetch: mock.fetch, now: () => NOW },
        ),
        503,
        "failure",
        "NOT_CONFIGURED",
      );
      assert.equal(mock.calls.length, 0);
    },
  );
  await probe(
    "Fixed Slack POST uses plain_text even for hostile mention/link input",
    async () => {
      const hostile = "<!channel> <@U12345> *bold* <https://evil.invalid|LINK>";
      const mock = recorder();
      const response = await handleInquiry(
        request(
          JSON.stringify(valid({ company: hostile, description: hostile })),
        ),
        WEBHOOK,
        { fetch: mock.fetch, now: () => NOW },
      );
      const result = await inspect(response, 200, "success", "ACCEPTED");
      assert.equal(result.reference, ID);
      assert.equal(mock.calls.length, 1);
      const { url, init } = mock.calls[0];
      assert.equal(url, WEBHOOK);
      assert.equal(init.method, "POST");
      assert.equal(init.redirect, "error");
      assert.ok(init.signal instanceof AbortSignal);
      assert.equal(
        new Headers(init.headers).get("Content-Type"),
        "application/json",
      );
      const message = JSON.parse(init.body),
        objects = [];
      const walk = (value) => {
        if (!value || typeof value !== "object") return;
        if ("type" in value && typeof value.text === "string")
          objects.push(value);
        for (const child of Object.values(value))
          if (typeof child === "object") {
            if (Array.isArray(child)) child.forEach(walk);
            else walk(child);
          }
      };
      walk(message.blocks);
      assert.ok(objects.length >= 8);
      assert.ok(
        objects.every(
          (value) => value.type === "plain_text" && value.emoji === false,
        ),
      );
      const escaped = hostile
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
      assert.ok(objects.some((value) => value.text.includes(escaped)));
      assert.ok(objects.every((value) => !/[<>]/.test(value.text)));
      assert.equal(message.text, "ONSHIVE 사업 제휴 문의");
      assert.ok(!("channel" in message) && !("link_names" in message));
      assert.match(init.body, /접수일로부터 3년/);
    },
  );
  for (const [name, description] of [
    ["1000 ampersands", "&".repeat(1000)],
    ["emoji across chunk boundary", "a".repeat(499) + "😀" + "b".repeat(499)],
    ["500 supplementary emoji", "😀".repeat(500)],
    [
      "literal entities and mention syntax",
      "literal &amp; &lt; &#60; <!channel>\r\n<@U12345>",
    ],
  ])
    await probe(
      "Slack plain-text chunking preserves all content: " + name,
      async () => {
        const normalized = validateInquiry(valid({ description }), NOW);
        assert.equal(normalized.ok, true);
        const mock = recorder();
        await inspect(
          await handleInquiry(
            request(JSON.stringify(valid({ description }))),
            WEBHOOK,
            { fetch: mock.fetch, now: () => NOW },
          ),
          200,
          "success",
          "ACCEPTED",
        );
        assert.equal(mock.calls.length, 1);
        const message = JSON.parse(mock.calls[0].init.body);
        const sections = message.blocks.filter(
          (block) =>
            block.type === "section" && typeof block.text?.text === "string",
        );
        assert.equal(
          sections.length,
          Math.ceil(Array.from(normalized.value.description).length / 500),
        );
        const decodeOnce = (text) =>
          text.replace(
            /&(amp|lt|gt);/g,
            (_, entity) => ({ amp: "&", lt: "<", gt: ">" })[entity],
          );
        const parts = sections.map((block, index) => {
          assert.equal(block.text.type, "plain_text");
          assert.equal(block.text.emoji, false);
          assert.ok(block.text.text.length <= 3000);
          const prefix = `제안 내용${index ? " (계속)" : ""}\n`;
          assert.ok(block.text.text.startsWith(prefix));
          const part = decodeOnce(block.text.text.slice(prefix.length));
          assert.ok(Array.from(part).length <= 500);
          assert.ok(
            !/[\uD800-\uDBFF]$/.test(part) && !/^[\uDC00-\uDFFF]/.test(part),
          );
          return part;
        });
        assert.equal(parts.join(""), normalized.value.description);
      },
    );
  await probe("Only HTTP200 plus trimmed ok is Slack acceptance", async () => {
    const mock = recorder(() => new Response(" ok\r\n", { status: 200 }));
    await inspect(
      await handleInquiry(request(), WEBHOOK, {
        fetch: mock.fetch,
        now: () => NOW,
      }),
      200,
      "success",
      "ACCEPTED",
    );
    assert.equal(mock.calls.length, 1);
  });
  for (const status of [400, 403, 404, 410, 429])
    await probe(
      "Known Slack rejection is definite failure: " + status,
      async () => {
        const mock = recorder(
          () => new Response("NEVER_EXPOSE_ERROR " + WEBHOOK, { status }),
        );
        await inspect(
          await handleInquiry(request(), WEBHOOK, {
            fetch: mock.fetch,
            now: () => NOW,
          }),
          502,
          "failure",
          status === 429 ? "RATE_LIMITED" : "DELIVERY_REJECTED",
        );
        assert.equal(mock.calls.length, 1);
      },
    );
  for (const status of [201, 202, 302, 401, 500, 503])
    await probe(
      "Unexpected Slack HTTP remains unknown without retry: " + status,
      async () => {
        const mock = recorder(() => new Response("ok", { status }));
        await inspect(
          await handleInquiry(request(), WEBHOOK, {
            fetch: mock.fetch,
            now: () => NOW,
          }),
          502,
          "unknown",
          "DELIVERY_UNKNOWN",
        );
        assert.equal(mock.calls.length, 1);
      },
    );
  await probe(
    "Unexpected oversized or malformed Slack200 body remains unknown",
    async () => {
      for (const body of [
        '"ok"',
        '{"ok":true}',
        "not_ok",
        "x".repeat(257),
        new Uint8Array([0xc3, 0x28]),
      ]) {
        const mock = recorder(() => new Response(body, { status: 200 }));
        await inspect(
          await handleInquiry(request(), WEBHOOK, {
            fetch: mock.fetch,
            now: () => NOW,
          }),
          502,
          "unknown",
          "DELIVERY_UNKNOWN",
        );
        assert.equal(mock.calls.length, 1);
      }
    },
  );
  await probe(
    "Thrown transport errors do not leak raw data or retry",
    async () => {
      const mock = recorder(() => {
        throw new Error("NEVER_EXPOSE_ERROR " + WEBHOOK);
      });
      await inspect(
        await handleInquiry(request(), WEBHOOK, {
          fetch: mock.fetch,
          now: () => NOW,
        }),
        502,
        "unknown",
        "DELIVERY_UNKNOWN",
      );
      assert.equal(mock.calls.length, 1);
    },
  );
  await probe(
    "Outbound default is eight seconds and abort returns unknown",
    async () => {
      const calls = [];
      const { value, delays } = await controlledTimeout(() =>
        handleInquiry(request(), WEBHOOK, {
          fetch: aborting(calls),
          now: () => NOW,
        }),
      );
      assert.ok(delays.includes(8000));
      await inspect(value, 502, "unknown", "DELIVERY_UNKNOWN");
      assert.equal(calls.length, 1);
      assert.equal(calls[0].aborted, true);
    },
  );
  await probe(
    "Timeout also bounds reading an upstream response body",
    async () => {
      const calls = [];
      const transport = async (url, init) => {
        calls.push({ url, init });
        return new Response(
          new ReadableStream({
            start(controller) {
              init.signal.addEventListener(
                "abort",
                () =>
                  controller.error(
                    new DOMException("Mock aborted body", "AbortError"),
                  ),
                { once: true },
              );
            },
          }),
          { status: 200 },
        );
      };
      await inspect(
        await handleInquiry(request(), WEBHOOK, {
          fetch: transport,
          now: () => NOW,
          timeoutMs: 5,
        }),
        502,
        "unknown",
        "DELIVERY_UNKNOWN",
      );
      assert.equal(calls.length, 1);
      assert.equal(calls[0].init.signal.aborted, true);
    },
  );
  await probe(
    "Separate same-ID requests prove no fake server deduplication guarantee",
    async () => {
      const mock = recorder();
      for (let index = 0; index < 2; index++)
        await inspect(
          await handleInquiry(request(), WEBHOOK, {
            fetch: mock.fetch,
            now: () => NOW,
          }),
          200,
          "success",
          "ACCEPTED",
        );
      assert.equal(mock.calls.length, 2);
    },
  );

  await probe(
    "Client uses one fixed same-origin path and minimal validated success envelope",
    async () => {
      const input = valid(),
        snapshot = structuredClone(input),
        mock = recorder(() => accepted());
      const result = await sendInquiry(input, mock.fetch);
      assert.deepEqual(result, {
        state: "success",
        code: "ACCEPTED",
        reference: ID,
      });
      assert.deepEqual(input, snapshot);
      assert.equal(mock.calls.length, 1);
      const { url, init } = mock.calls[0];
      assert.equal(url, "/api/inquiry");
      assert.equal(init.method, "POST");
      assert.equal(init.credentials, "same-origin");
      assert.equal(init.redirect, "error");
      assert.deepEqual(JSON.parse(init.body), input);
      assert.equal(
        new Headers(init.headers).get("X-Requested-With"),
        "ONSHIVE-Contact",
      );
      assert.equal(
        new Headers(init.headers).get("Content-Type"),
        "application/json",
      );
    },
  );
  for (const result of [
    null,
    [],
    {},
    1,
    "ok",
    { state: "success", code: "ACCEPTED" },
    { state: "success", code: "ACCEPTED", reference: "different" },
    { state: "success", code: "other", reference: ID },
    { state: "partial", code: "ACCEPTED", reference: ID },
  ])
    await probe(
      "Client rejects malformed or mismatched success: " +
        JSON.stringify(result),
      async () => {
        const mock = recorder(() => Response.json(result));
        assert.deepEqual(await sendInquiry(valid(), mock.fetch), {
          state: "unknown",
          code: "DELIVERY_UNKNOWN",
          reference: ID,
        });
        assert.equal(mock.calls.length, 1);
      },
    );
  await probe(
    "Client recognizes known HTTP failure but not ambiguous envelopes",
    async () => {
      for (const code of [
        "INVALID_INPUT",
        "NOT_CONFIGURED",
        "RATE_LIMITED",
        "DELIVERY_REJECTED",
      ]) {
        const mock = recorder(() =>
          Response.json(
            { state: "failure", code, error: "NEVER_EXPOSE_ERROR" },
            { status: 502 },
          ),
        );
        assert.deepEqual(await sendInquiry(valid(), mock.fetch), {
          state: "failure",
          code,
          reference: ID,
        });
        assert.equal(mock.calls.length, 1);
      }
      for (const [status, data] of [
        [200, { state: "failure", code: "INVALID_INPUT" }],
        [502, { state: "failure", code: "UNRECOGNIZED" }],
        [502, { state: "unknown", code: "DELIVERY_UNKNOWN" }],
        [201, { state: "success", code: "ACCEPTED", reference: ID }],
      ]) {
        const mock = recorder(() => Response.json(data, { status }));
        assert.equal((await sendInquiry(valid(), mock.fetch)).state, "unknown");
        assert.equal(mock.calls.length, 1);
      }
    },
  );
  await probe(
    "Client rejects unbounded malformed responses without leaking exceptions",
    async () => {
      for (const body of [
        "{",
        "x".repeat(2049),
        new Uint8Array([0xc3, 0x28]),
      ]) {
        const mock = recorder(() => new Response(body, { status: 200 }));
        assert.equal((await sendInquiry(valid(), mock.fetch)).state, "unknown");
        assert.equal(mock.calls.length, 1);
      }
      const mock = recorder(() => {
        throw new Error("NEVER_EXPOSE_ERROR " + WEBHOOK);
      });
      const result = await sendInquiry(valid(), mock.fetch);
      assert.deepEqual(result, {
        state: "unknown",
        code: "DELIVERY_UNKNOWN",
        reference: ID,
      });
      assert.equal(mock.calls.length, 1);
    },
  );
  await probe(
    "Client abort timeout is unknown and never automatically retries",
    async () => {
      const calls = [];
      assert.deepEqual(await sendInquiry(valid(), aborting(calls), 5), {
        state: "unknown",
        code: "DELIVERY_UNKNOWN",
        reference: ID,
      });
      assert.equal(calls.length, 1);
      assert.equal(calls[0].aborted, true);
    },
  );

  await probe(
    "Missing DOM prerequisites fail closed and native invalid input sends nothing",
    async () => {
      for (const options of [{ missingForm: true }, { missingLabel: true }])
        await withForm(options, async (h) => {
          assert.equal(h.form.hidden, true);
          assert.equal(h.button.disabled, true);
          assert.equal(h.calls.length, 0);
        });
      await withForm({ nativeValid: false }, async (h) => {
        assert.equal(h.form.hidden, false);
        assert.equal(h.form.dataset.state, "idle");
        assert.equal(h.submit(), true);
        await new Promise((resolve) => setImmediate(resolve));
        assert.equal(h.calls.length, 0);
        h.preserved();
      });
    },
  );
  await probe(
    "Too-fast or absent consent is rejected before transport and preserves fields",
    async () => {
      await withForm({}, async (h) => {
        h.setClock(NOW + 1000);
        h.submit();
        await h.settle("failure");
        assert.equal(h.calls.length, 0);
        assert.equal(h.button.disabled, false);
        h.preserved();
      });
      await withForm({ values: { consent: false } }, async (h) => {
        h.submit();
        await h.settle("failure");
        assert.equal(h.calls.length, 0);
        h.preserved();
      });
    },
  );
  await probe(
    "Sending locks all controls, duplicate submit ignored, accepted result stays locked",
    async () => {
      let resolve;
      await withForm(
        {
          transport: () =>
            new Promise((done) => {
              resolve = done;
            }),
        },
        async (h) => {
          h.submit();
          assert.equal(h.form.dataset.state, "sending");
          assert.equal(h.attributes.get("aria-busy"), "true");
          assert.equal(h.button.disabled, true);
          assert.ok(h.controls.every((control) => control.disabled));
          h.submit();
          assert.equal(h.calls.length, 1);
          resolve(accepted());
          await h.settle("success");
          assert.equal(h.attributes.get("aria-busy"), "false");
          assert.equal(h.contact.hidden, true);
          assert.equal(h.button.disabled, true);
          assert.ok(h.controls.every((control) => control.disabled));
          h.submit();
          assert.equal(h.calls.length, 1);
          h.preserved();
        },
      );
    },
  );
  await probe(
    "Known failure unlocks controls for explicit user retry only",
    async () => {
      await withForm(
        {
          transport: () =>
            Response.json(
              { state: "failure", code: "RATE_LIMITED" },
              { status: 502 },
            ),
        },
        async (h) => {
          h.submit();
          await h.settle("failure");
          assert.equal(h.calls.length, 1);
          assert.equal(h.contact.hidden, false);
          assert.equal(h.button.disabled, false);
          assert.ok(h.controls.every((control) => !control.disabled));
          h.preserved();
          h.submit();
          await new Promise((resolve) => setImmediate(resolve));
          await h.settle("failure");
          assert.equal(h.calls.length, 2);
          h.preserved();
        },
      );
    },
  );
  await probe(
    "Unknown preserves fields/reference and prevents blind re-send",
    async () => {
      await withForm(
        {
          transport: () => {
            throw new Error("NEVER_EXPOSE_ERROR");
          },
        },
        async (h) => {
          h.submit();
          await h.settle("unknown");
          assert.equal(h.calls.length, 1);
          assert.match(h.copy.textContent, new RegExp(ID));
          assert.ok(!h.copy.textContent.includes("NEVER_EXPOSE_ERROR"));
          assert.equal(h.contact.hidden, false);
          assert.equal(h.button.disabled, true);
          assert.ok(h.controls.every((control) => control.disabled));
          h.submit();
          assert.equal(h.calls.length, 1);
          h.preserved();
        },
      );
    },
  );
  await probe(
    "Unexpected local form exception fails closed without raw error text",
    async () => {
      await withForm({ formDataThrows: true }, async (h) => {
        h.submit();
        await h.settle("unknown");
        assert.equal(h.calls.length, 0);
        assert.equal(h.button.disabled, true);
        assert.ok(!h.copy.textContent.includes("NEVER_EXPOSE_ERROR"));
        h.preserved();
      });
    },
  );
  await probe(
    "Regression compile/import did not mutate real modules or perform unmocked fetch",
    () => {
      assert.ok(results.length > 0);
      assert.deepEqual(fingerprints(), before);
      assert.equal(forbiddenRequests.length, 0);
    },
  );
} finally {
  globalThis.fetch = originalFetch;
}

const failed = results.filter((result) => !result.pass);
console.log(
  JSON.stringify(
    {
      scope:
        "Actual compiled inquiry/server/UI modules with injected mocks; no external delivery",
      passed: results.length - failed.length,
      failed: failed.length,
      total: results.length,
      checks: results,
    },
    null,
    2,
  ),
);
console.log(
  results.length -
    failed.length +
    "/" +
    results.length +
    " PASS — actual inquiry regression probes; no Slack/email sent.",
);
if (failed.length || !results.length) process.exitCode = 1;
