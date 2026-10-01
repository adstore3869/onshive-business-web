import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const files = [
  "index.html",
  ...["about", "business", "capabilities", "careers", "contact", "history"].map(
    (p) => `${p}/index.html`,
  ),
];
const results = [];
const probe = (name, run) => {
  run();
  results.push(name);
};
const markup = Object.fromEntries(
  files.map((file) => [file, read(`dist/${file}`)]),
);
const source = Object.fromEntries(
  files.map((file) => [file, read(`src/${file}`)]),
);
const compact = (text) => text.replace(/\s+/g, " ");

probe(
  "Seven real documents have one H1, metadata, static main, and shared layout",
  () => {
    const titles = new Set();
    for (const [file, html] of Object.entries(markup)) {
      assert.equal((html.match(/<h1\b/g) || []).length, 1, file);
      assert.match(html, /<meta\s+name="description"/);
      assert.match(html, /<main id="main"/);
      assert.match(html, /<nav class="nav"/);
      assert.match(html, /<footer class="site-footer/);
      const route = file === "index.html" ? "/" : `/${file.split("/")[0]}/`;
      assert.ok(html.includes(`href="https://onshive.kr${route}"`));
      assert.ok(html.includes(`content="https://onshive.kr${route}"`));
      titles.add(html.match(/<title>(.*?)<\/title>/s)[1]);
    }
    assert.equal(titles.size, 7);
  },
);
probe(
  "All local links, anchors, scripts and images resolve in built output",
  () => {
    for (const [file, html] of Object.entries(markup)) {
      for (const [, attribute, value] of html.matchAll(
        /(href|src)="(\/(?!\/)[^"]*|#[^"]+)"/g,
      )) {
        const [url, fragment] = value.split("#");
        let target = url || `/${file}`;
        if (target.endsWith("/")) target += "index.html";
        assert.ok(
          fs.existsSync(path.join(root, "dist", target)),
          `${file}: ${attribute}=${value}`,
        );
        if (fragment)
          assert.ok(
            read(`dist${target}`).includes(`id="${fragment}"`),
            `${file}: #${fragment}`,
          );
      }
      for (const [, attributes] of html.matchAll(/<img\b([^>]+)>/g)) {
        assert.match(attributes, /alt="[^\"]+"/);
        assert.match(attributes, /width="\d+"/);
        assert.match(attributes, /height="\d+"/);
      }
    }
  },
);
probe("Main navigation uses five approved destinations and active page", () => {
  for (const [file, html] of Object.entries(markup)) {
    const nav = html.match(/<nav\b[\s\S]*?<\/nav>/)[0];
    assert.equal((nav.match(/<a\b/g) || []).length, 5);
    assert.ok(nav.includes("/capabilities/"));
    assert.ok(!nav.includes("/history/"));
    if (file !== "index.html") assert.ok(nav.includes('aria-current="page"'));
  }
});
probe(
  "Home nine sections: two businesses, seven capabilities, three editorial work rows",
  () => {
    assert.equal(
      (source["index.html"].match(/data-service-step\b/g) || []).length,
      3,
    );
    assert.equal((source["index.html"].match(/<section\b/g) || []).length, 9);
    assert.equal(
      (source["capabilities/index.html"].match(/<h3>/g) || []).length,
      13,
    );
    for (const name of ["판매 준비", "판매 운영", "구매 이후"])
      assert.ok(source["index.html"].includes(`<dt>${name}</dt>`));
    for (const id of ["pet", "print"])
      assert.ok(source["business/index.html"].includes(`id="${id}"`));
  },
);
probe(
  "Factual scopes and dates are retained; hiring is a page-level statement",
  () => {
    const home = compact(source["index.html"]);
    assert.match(home, /2026년 1–6월 참가 실적/);
    assert.match(
      compact(source["business/index.html"]),
      /자사몰 포함 10개 채널/,
    );
    assert.match(home, /멍수무강 상품 포트폴리오/);
    const careers = compact(source["careers/index.html"]);
    assert.match(careers, /이 페이지에 게시된 채용 공고는 없습니다/);
    assert.match(careers, /모집 직무·근무조건·지원 방법은 공고가 게시될 때/);
    assert.ok(!careers.includes("현재 채용 없음"));
    for (const html of Object.values(source))
      assert.ok(
        !/\[REAL IMAGE REQUIRED|\[CONTENT REQUIRED|시안 검토 항목|\?page=|>NOW<|p6-ribbon/.test(
          html,
        ),
      );
  },
);
probe(
  "Original palette, all three CSS files and scroll remain v1.0.0-identical",
  () => {
    for (const file of [
      "src/styles.css",
      "src/home-scenes.css",
      "src/visual-pages.css",
      "src/scroll-scenes.ts",
    ]) {
      const baseline = execFileSync("git", ["show", `v1.0.0:${file}`], {
        cwd: root,
        encoding: "utf8",
      });
      assert.equal(
        read(file).replace(/\r\n/g, "\n"),
        baseline.replace(/\r\n/g, "\n"),
        file,
      );
    }
    assert.ok(!read("src/content-pages.css").includes("119px"));
    assert.ok(!read("src/content-pages.css").includes("103px"));
  },
);
probe(
  "Approved ASCII variants preserve original renderer, characters and mask",
  () => {
    const wave = read("src/ascii-wave.ts");
    const original = execFileSync("git", ["show", "v1.0.0:src/ascii-wave.ts"], {
      cwd: root,
      encoding: "utf8",
    });
    // 수식 선택·접속 처리 외에 기존 투영·문자·색상·제목 마스크·정지 제어를 보존한다.
    for (const [start, end] of [
      ["  const points:", "  const canMove"],
      ["      const x = point.x", "    ctx.globalAlpha = 1;"],
      ["  function tick", "  resize();"],
    ]) {
      const section = (text) =>
        text.slice(text.indexOf(start), text.indexOf(end, text.indexOf(start)));
      assert.ok(wave.includes(start) && wave.includes(end));
      assert.equal(section(wave), section(original));
    }
    assert.ok(
      wave.includes("sampleAsciiSurface(variant, point.x, point.z, time)"),
    );
    assert.ok(wave.includes("if (event.persisted)"));
  },
);
probe(
  "Approved readability layer uses 18/17/15px without restyling headings",
  () => {
    const css = read("src/readability.css");
    assert.match(css, /--read-text:\s*18px/);
    assert.match(css, /--read-note:\s*15px/);
    assert.match(css, /@media \(max-width: 700px\)[\s\S]*--read-text:\s*17px/);
    assert.match(
      css,
      /\.p6-footnote\s*\{\s*font-size: var\(--read-note\) !important/,
    );
    assert.match(css, /\.p6-form textarea\s*\{\s*font-size: 17px/);
    assert.ok(
      !/\b(?:color|background|font-family|animation|transition)\s*:/.test(css),
    );
    assert.ok(!/(?:^|[,}\n])\s*(?:h[12]|[^{}\n]*\bh[12])\s*[{,]/.test(css));
    const main = read("src/main.ts");
    assert.ok(
      main.indexOf('import "./readability.css"') >
        main.indexOf('import "./content-pages.css"'),
    );
    for (const html of Object.values(markup)) {
      const cssPath = html.match(
        /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/,
      )[1];
      const builtCss = read(`dist${cssPath}`);
      assert.ok(
        builtCss.includes("--read-text:18px") &&
          builtCss.includes("--read-note:15px"),
      );
      assert.ok(builtCss.includes("--read-text:17px"));
    }
  },
);
probe("Three actual deck captures match preserved SHA-256 values", () => {
  const expected = {
    "product-portfolio":
      "5c21e8818b64a47e5b77a7d55225617ebc4f5667f569ce7435c0f9f77312098d",
    "store-screen":
      "8689e486597425cfffd104b1bd18696cd7f119a25953da60dfd67ef1736b8baf",
    "content-hub":
      "c61dd93007ca09e68ab2fa8029258efb2d502220ec2879257c190be630079062",
  };
  for (const [name, hash] of Object.entries(expected)) {
    assert.equal(
      createHash("sha256")
        .update(
          fs.readFileSync(
            path.join(root, `public/images/commerce/${name}.webp`),
          ),
        )
        .digest("hex"),
      hash,
    );
  }
});
probe(
  "Contact is fail-closed without JS and cannot upload or submit to a server",
  () => {
    const contact = source["contact/index.html"];
    assert.match(contact, /id="partnership-form" hidden/);
    assert.match(contact, /type="submit" disabled/);
    assert.ok(contact.includes("form-action 'none'"));
    assert.ok(contact.includes("<noscript"));
    assert.ok(!contact.includes('type="file"'));
    assert.match(read("src/main.ts"), /setupPartnershipForm\(\)/);
    assert.ok(
      !/fetch\(|XMLHttpRequest|localStorage|sessionStorage|FileReader/.test(
        read("src/partnership-form.ts"),
      ),
    );
  },
);
probe(
  "No external resources, private source material, or preview bundles ship",
  () => {
    for (const html of Object.values(markup))
      assert.ok(!/<(?:script|img)[^>]+src="(?:https?:|data:)/.test(html));
    const walk = (directory) =>
      fs
        .readdirSync(directory, { withFileTypes: true })
        .flatMap((e) =>
          e.isDirectory()
            ? walk(path.join(directory, e.name))
            : [path.join(directory, e.name)],
        );
    assert.ok(
      walk(path.join(root, "dist")).every(
        (p) => !/(?:\.env|\.leerness|\.pdf|mockup)/i.test(p),
      ),
    );
    assert.ok(
      read("public/sitemap.xml").includes("https://onshive.kr/capabilities/"),
    );
    assert.ok(fs.existsSync(path.join(root, "dist/404.html")));
  },
);
probe(
  "Seven source and built pages omit source, internal and AI image notes",
  () => {
    const unwanted =
      /회사소개서|COMPANY (?:DECK|PROFILE)|제공(?:된)? 자료|AI 생성|생성 콘셉트|콘셉트 생성 이미지|실제 (?:판매 )?(?:상품|제품|고객|공간).*?(?:아님|아닙니다|공개하지)|대면 미팅|출처:|자료에 기재|파트너 보호|공장 소유를 의미|성과를 보장/;
    for (const collection of [source, markup])
      for (const [file, html] of Object.entries(collection))
        assert.doesNotMatch(compact(html), unwanted, file);
  },
);
probe("Removed meta notes leave no empty note or caption wrappers", () => {
  for (const [file, html] of Object.entries(markup)) {
    // The existing live region is populated by form validation/draft status.
    const withoutLiveStatus = html.replace(
      /<p class="p6-form-status" role="status" aria-live="polite"><\/p>/g,
      "",
    );
    assert.doesNotMatch(
      withoutLiveStatus,
      /<(p|figcaption|small)\b[^>]*>\s*<\/\1>/,
      file,
    );
    assert.ok(!html.includes('class="editorial-source-note"'), file);
  }
  assert.ok(
    !markup["business/index.html"].includes('class="p6-image-caption"'),
  );
  assert.equal(
    (markup["index.html"].match(/class="editorial-caption"/g) || []).length,
    3,
  );
});
probe(
  "Useful scopes, periods and manufacturing partnership remain without citations",
  () => {
    for (const file of [
      "index.html",
      "about/index.html",
      "history/index.html",
    ]) {
      const text = compact(markup[file]);
      assert.match(text, /멍수무강/);
      assert.match(text, /자사몰/);
      assert.match(text, /2026년 1–6월/);
      for (const number of [10, 30, 15])
        assert.match(text, new RegExp(`<strong>${number}<small>`));
    }
    for (const file of ["index.html", "business/index.html"])
      assert.match(
        compact(markup[file]),
        /멍수무강 콘텐츠 허브 · 13개 가이드 · 5개 주제 카테고리/,
      );
    assert.match(
      compact(markup["business/index.html"]),
      /외부 제조 파트너와 협력해 상품을 공급합니다/,
    );
    assert.match(
      compact(markup["business/index.html"]),
      /목우촌과의 브랜드 사용 계약/,
    );
  },
);
probe(
  "Existing images have neutral scene descriptions, not invented product attribution",
  () => {
    const descriptions = new Map([
      ["pet-commerce", "사료가 담긴 그릇과 반려동물 목줄"],
      ["print-commerce", "용지 위에 놓인 토너와 골드 컬러 소품"],
      ["pet-customer", "반려견에게 간식을 건네는 손"],
    ]);
    for (const file of ["index.html", "business/index.html"])
      for (const [name, alt] of descriptions) {
        const image = [...markup[file].matchAll(/<img\b[^>]*>/g)].find(
          ([tag]) => tag.includes(`/images/commerce/${name}.webp`),
        );
        assert.ok(image, `${file}: ${name}`);
        assert.ok(image[0].includes(`alt="${alt}"`));
      }
    const provenance = JSON.parse(read("docs/image-provenance-p0009.json"));
    assert.equal(provenance.length, 3);
    assert.ok(
      provenance.every((image) =>
        image.classification.startsWith("Generated category concept"),
      ),
    );
  },
);
probe(
  "Useful contact and hiring guidance remains while redundant qualification is removed",
  () => {
    const contact = compact(markup["contact/index.html"]);
    assert.match(contact, /사이트에서 접수·저장·전송하지 않습니다/);
    assert.match(contact, /첨부파일은 메일 앱에서 직접 추가/);
    assert.match(contact, /초안을 열어도 문의가 접수된 것은 아닙니다/);
    assert.match(
      compact(markup["careers/index.html"]),
      /이 페이지에 게시된 채용 공고는 없습니다/,
    );
  },
);
probe("Package and lock use the same 2.2.3 version", () => {
  assert.equal(JSON.parse(read("package.json")).version, "2.2.3");
  const lock = JSON.parse(read("package-lock.json"));
  assert.equal(lock.version, "2.2.3");
  assert.equal(lock.packages[""].version, "2.2.3");
});

// Compile the actual production module, not a copied implementation.
execFileSync(
  process.execPath,
  [
    path.join(root, "node_modules/typescript/bin/tsc"),
    "--ignoreConfig",
    "src/partnership-form.ts",
    "--target",
    "ES2022",
    "--module",
    "ESNext",
    "--moduleResolution",
    "Bundler",
    "--lib",
    "ES2022,DOM",
    "--skipLibCheck",
    "--outDir",
    "tmp/p6-form-test",
  ],
  { cwd: root, stdio: "pipe" },
);
const { buildPartnershipMailto, setupPartnershipForm } = await import(
  pathToFileURL(path.join(root, "tmp/p6-form-test/partnership-form.js")).href
);
const valid = {
  company: "검증용 회사 & co",
  name: "검증 담당자",
  phone: "",
  email: "preview@example.invalid",
  type: "상품 공급",
  description: "상품 소개\n두 번째 줄 & 협력 범위",
};
probe("Mail draft recipient, Korean subject, body and optional phone", () => {
  const draft = new URL(buildPartnershipMailto(valid));
  assert.equal(draft.pathname, "scm@onshive.kr");
  assert.equal(draft.protocol, "mailto:");
  assert.equal(
    draft.searchParams.get("subject"),
    "[사업 제휴] 검증용 회사 & co / 상품 공급",
  );
  assert.ok(draft.searchParams.get("body").includes(valid.description));
  assert.ok(draft.searchParams.get("body").includes("연락처: 미기재"));
});
for (const field of ["company", "name", "description"])
  probe(`Empty ${field} is rejected`, () =>
    assert.throws(() => buildPartnershipMailto({ ...valid, [field]: "" })),
  );
probe("Unsupported proposal type rejected", () =>
  assert.throws(() => buildPartnershipMailto({ ...valid, type: "허위 유형" })),
);
probe("Invalid email rejected", () =>
  assert.throws(() => buildPartnershipMailto({ ...valid, email: "bad@" })),
);
probe(
  "Subject control characters normalized and query injection escaped",
  () => {
    const url = new URL(
      buildPartnershipMailto({
        ...valid,
        company: "a\r\nb&bcc=evil@example.invalid",
      }),
    );
    assert.ok(!url.searchParams.has("bcc"));
    assert.ok(!url.searchParams.get("subject").includes("\n"));
  },
);
probe("Oversized draft is rejected without silent truncation", () =>
  assert.throws(
    () => buildPartnershipMailto({ ...valid, description: "가".repeat(2000) }),
    /너무 깁니다/,
  ),
);

const saved = {
  document: globalThis.document,
  window: globalThis.window,
  FormData: globalThis.FormData,
};
try {
  let listener;
  let validated = true;
  let formValues = valid;
  const button = { disabled: true },
    status = { textContent: "" };
  const form = {
    hidden: true,
    querySelector: (s) => (s.startsWith("button") ? button : status),
    addEventListener: (name, handler) => {
      assert.equal(name, "submit");
      listener = handler;
      assert.equal(button.disabled, true);
      assert.equal(form.hidden, true);
    },
    reportValidity: () => validated,
  };
  globalThis.document = { querySelector: () => null };
  probe("Non-contact pages initialize without a form", () =>
    setupPartnershipForm(),
  );
  globalThis.document = { querySelector: () => form };
  globalThis.window = { location: { href: "" } };
  globalThis.FormData = class {
    get(field) {
      return formValues[field];
    }
  };
  probe(
    "Listener is connected before form visibility and submit activation",
    () => {
      setupPartnershipForm();
      assert.equal(typeof listener, "function");
      assert.equal(button.disabled, false);
      assert.equal(form.hidden, false);
    },
  );
  probe(
    "Invalid browser form prevents default and does not open mail app",
    () => {
      validated = false;
      let stopped = false;
      listener({
        preventDefault() {
          stopped = true;
        },
      });
      assert.equal(stopped, true);
      assert.equal(window.location.href, "");
    },
  );
  probe(
    "Valid submit only creates a mock mail draft; never says received",
    () => {
      validated = true;
      listener({ preventDefault() {} });
      assert.equal(window.location.href, buildPartnershipMailto(valid));
      assert.ok(status.textContent.includes("접수되거나 전송된 것은 아닙니다"));
    },
  );
  probe("Draft error keeps page and entered data intact", () => {
    window.location.href = "";
    formValues = { ...valid, email: "bad" };
    listener({ preventDefault() {} });
    assert.equal(window.location.href, "");
    assert.ok(status.textContent.includes("이메일 주소"));
    assert.equal(formValues.company, valid.company);
  });
} finally {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete globalThis[key];
    else globalThis[key] = value;
  }
}
await import("./verify-ascii.mjs");
await import("./verify-editorial.mjs");
console.log(
  JSON.stringify(
    { passed: results.length, failed: 0, checks: results },
    null,
    2,
  ),
);
console.log(
  `${results.length}/${results.length} PASS — static built-site and actual mail-module regression probes; no email sent.`,
);
