// 승인 편집·이미지·모션을 실제 소스로 검증하는 독립 유한 회귀 검사.
// 브라우저/네트워크/운영 파일 쓰기 없이 설치된 tsc의 비공개 산출물만 생성한다.
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const project = new URL("../", import.meta.url);
const read = (name) => readFileSync(new URL(name, project), "utf8");
const hash = (name) =>
  createHash("sha256")
    .update(readFileSync(new URL(name, project)))
    .digest("hex");
const snapshot = (name) => ({
  sha256: hash(name),
  bytes: statSync(new URL(name, project)).size,
  mtime: statSync(new URL(name, project)).mtime.toISOString(),
});
const reviewed = [
  "src/reveal.ts",
  "src/main.ts",
  "src/scroll-scenes.ts",
  "src/editorial-content.css",
  "src/index.html",
  "src/business/index.html",
];
const before = Object.fromEntries(
  reviewed.map((name) => [name, snapshot(name)]),
);
const source = Object.fromEntries(reviewed.map((name) => [name, read(name)]));
// 프로젝트의 기존 설정으로 실제 tsc 컴파일을 수행한다. 작성 소스는 변경하지 않고
// tmp/editorial-module-test의 기계 산출물만 만든다. 최소 Node 엔진에 새 API를 요구하지 않는다.
execFileSync(
  process.execPath,
  [
    fileURLToPath(new URL("node_modules/typescript/bin/tsc", project)),
    "--project",
    fileURLToPath(new URL("tsconfig.json", project)),
    "--rootDir",
    fileURLToPath(new URL("src/", project)),
    "--noEmit",
    "false",
    "--outDir",
    fileURLToPath(new URL("tmp/editorial-module-test/", project)),
  ],
  { cwd: fileURLToPath(project), encoding: "utf8", timeout: 30000 },
);
const compiled = {
  reveal: read("tmp/editorial-module-test/reveal.js"),
  scenes: read("tmp/editorial-module-test/scroll-scenes.js"),
  main: read("tmp/editorial-module-test/main.js"),
};
const moduleUrl = (text) =>
  `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`;
// 실제 컴파일된 ESM을 메모리에서 import한다. 함수/수식은 재구현하지 않는다.
const { setupReveals } = await import(moduleUrl(compiled.reveal));
const { createScrollScenes } = await import(moduleUrl(compiled.scenes));
// main 본문은 그대로 실행하고 정적 import만 명시적인 테스트 바인딩으로 연결한다.
const mainScript = compiled.main.replace(/^import[^\n]*\n/gm, "");
assert.doesNotMatch(
  mainScript,
  /^import\s/m,
  "VM import 제거 실패는 검증 실패",
);

class Events {
  listeners = new Map();
  addEventListener(type, callback, options) {
    const list = this.listeners.get(type) ?? [];
    if (!list.some((item) => item.callback === callback))
      list.push({ callback, options });
    this.listeners.set(type, list);
  }
  removeEventListener(type, callback) {
    this.listeners.set(
      type,
      (this.listeners.get(type) ?? []).filter(
        (item) => item.callback !== callback,
      ),
    );
  }
  emit(type, event = {}) {
    for (const { callback } of [...(this.listeners.get(type) ?? [])]) {
      callback({ type, ...event });
    }
  }
  count() {
    return [...this.listeners.values()].reduce((n, list) => n + list.length, 0);
  }
}
class Classes {
  names = new Set();
  add(...names) {
    names.forEach((name) => this.names.add(name));
  }
  remove(...names) {
    names.forEach((name) => this.names.delete(name));
  }
  contains(name) {
    return this.names.has(name);
  }
  toggle(name, force) {
    const enabled = force ?? !this.contains(name);
    if (enabled) this.add(name);
    else this.remove(name);
    return enabled;
  }
}
class Element extends Events {
  classList = new Classes();
  dataset = {};
  attributes = new Map();
  style = {};
  parentElement = null;
  textContent = "";
  reads = 0;
  constructor(top = 1000, height = 100, tagName = "DIV") {
    super();
    Object.assign(this, { top, height, clientHeight: height, tagName });
  }
  getBoundingClientRect() {
    this.reads++;
    return {
      top: this.top,
      height: this.height,
      bottom: this.top + this.height,
    };
  }
  contains(target) {
    for (let node = target; node; node = node.parentElement) {
      if (node === this) return true;
    }
    return false;
  }
  hasAttribute(name) {
    return this.attributes.has(name);
  }
  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }
  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name.startsWith("data-")) {
      this.dataset[
        name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase())
      ] = String(value);
    }
  }
  closest(selector) {
    for (let node = this; node; node = node.parentElement) {
      if (selector === "section" && node.tagName === "SECTION") return node;
    }
    return null;
  }
}

function environment({
  reduced = false,
  hidden = false,
  io = "available",
  mobile = false,
} = {}) {
  const reveals = [
    new Element(30),
    new Element(1000),
    new Element(1200),
    new Element(1400),
  ];
  reveals[0].classList.add("reveal");
  reveals[3].classList.add("reveal");
  reveals[1].setAttribute("data-editorial-reveal", "60");
  reveals[2].setAttribute("data-editorial-reveal", "300");
  const root = new Element(0, 800, "HTML");
  const panel = new Element(0, 400);
  const image = new Element();
  const overscan = mobile ? 12 : 44;
  Object.assign(image, {
    parentElement: panel,
    offsetTop: -overscan,
    offsetHeight: 400 + overscan * 2,
  });
  image.dataset.imageParallax = "56";
  const horizontalPanel = new Element(0, 400);
  const horizontal = new Element();
  horizontal.parentElement = horizontalPanel;
  horizontal.dataset.scrollX = "20";
  const layerSection = new Element(-100, 400, "SECTION");
  const layer = new Element();
  layer.parentElement = layerSection;
  layer.dataset.depth = "0.1";
  const steps = [new Element(10), new Element(600), new Element(900)];
  const number = new Element();
  const track = new Element();
  const doc = new Events();
  doc.hidden = hidden;
  doc.documentElement = root;
  const many = (selector) => {
    if (selector === ".reveal, [data-editorial-reveal]") return reveals;
    if (selector === "[data-image-parallax]") return [image];
    if (selector === "[data-scroll-x]") return [horizontal];
    if (selector === "[data-service-step]") return steps;
    if (selector === "[data-parallax], [data-depth]") return [layer];
    if (selector === "[data-chapter]") return [];
    throw new Error(`허용하지 않은 DOM 선택자: ${selector}`);
  };
  root.querySelectorAll = doc.querySelectorAll = many;
  doc.querySelector = (selector) => {
    if (selector === "[data-service-count]") return number;
    if (selector === "[data-service-progress]") return track;
    if (
      [
        ".menu-button",
        ".nav",
        ".ascii-canvas",
        ".story-count",
        ".story-track i",
      ].includes(selector)
    )
      return null;
    throw new Error(`허용하지 않은 DOM 선택자: ${selector}`);
  };
  const win = new Events();
  win.innerHeight = 800;
  const reducedMotion = new Events();
  reducedMotion.matches = reduced;
  const desktop = new Events();
  desktop.matches = !mobile;
  win.matchMedia = (query) => {
    if (query === "(prefers-reduced-motion: reduce)") return reducedMotion;
    if (query === "(min-width: 701px)") return desktop;
    throw new Error(`허용하지 않은 media query: ${query}`);
  };
  const observers = [];
  const queue = new Map();
  const releases = [];
  const counts = {
    rafRequests: 0,
    rafCancels: 0,
    rafDraws: 0,
    sceneDraws: 0,
    revealSetups: 0,
    formSetups: 0,
  };
  let frameId = 0;
  class Observer {
    targets = new Set();
    disconnected = false;
    constructor(callback, options) {
      if (io === "constructor-failure") throw new Error("생성 거부 mock");
      this.callback = callback;
      this.options = options;
      observers.push(this);
    }
    observe(target) {
      // 한 대상이 이미 숨겨진 뒤 두 번째 observe가 실패하는 부분 초기화 경로.
      if (io === "observe-failure" && this.targets.size === 1)
        throw new Error("observe 거부 mock");
      this.targets.add(target);
    }
    unobserve(target) {
      this.targets.delete(target);
    }
    disconnect() {
      this.disconnected = true;
      this.targets.clear();
    }
    trigger(target, intersecting) {
      this.callback([{ target, isIntersecting: intersecting }]);
    }
  }
  const globals = {
    document: doc,
    window: win,
    Node: Element,
    Element,
    requestAnimationFrame(callback) {
      counts.rafRequests++;
      queue.set(++frameId, callback);
      return frameId;
    },
    cancelAnimationFrame(frame) {
      counts.rafCancels++;
      queue.delete(frame);
    },
  };
  if (io !== "absent") {
    win.IntersectionObserver = Observer;
    globals.IntersectionObserver = Observer;
  }
  return {
    root,
    doc,
    win,
    reducedMotion,
    desktop,
    reveals,
    image,
    panel,
    horizontal,
    layer,
    layerSection,
    steps,
    number,
    track,
    observers,
    queue,
    releases,
    counts,
    globals,
    startReveal() {
      const release = setupReveals(root, reducedMotion);
      releases.push(release);
      return release;
    },
    startMain() {
      const context = vm.createContext({
        ...globals,
        setupReveals(...args) {
          counts.revealSetups++;
          const release = setupReveals(...args);
          releases.push(release);
          return release;
        },
        createScrollScenes(...args) {
          const draw = createScrollScenes(...args);
          return () => {
            counts.sceneDraws++;
            draw();
          };
        },
        // ASCII/문의는 별도 기존 회귀의 담당이므로 초기화 호출만 대역으로 제공한다.
        createAsciiWave() {
          throw new Error("ASCII canvas는 이 유한 검사에 포함하지 않음");
        },
        setupPartnershipForm() {
          counts.formSetups++;
        },
      });
      vm.runInContext(mainScript, context, {
        timeout: 1000,
        filename: "actual-main.vm.js",
      });
    },
    drawScene() {
      createScrollScenes(() => reducedMotion.matches)();
    },
    flush() {
      assert.ok(queue.size <= 1, "공통 RAF는 최대 한 개");
      for (const [key, callback] of [...queue]) {
        queue.delete(key);
        counts.rafDraws++;
        callback(counts.rafDraws * 16);
      }
    },
    hidden(value) {
      doc.hidden = value;
      doc.emit("visibilitychange");
    },
    reduced(value) {
      reducedMotion.matches = value;
      reducedMotion.emit("change");
    },
    readable() {
      return reveals.every(
        (element) =>
          !element.classList.contains("editorial-pending") &&
          (!element.classList.contains("reveal") ||
            !root.classList.contains("js-motion") ||
            element.classList.contains("visible")),
      );
    },
  };
}

const results = [];
function check(name, run, options) {
  const h = environment(options);
  const keys = [...Object.keys(h.globals), "IntersectionObserver"];
  const saved = Object.fromEntries(
    keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  try {
    for (const key of keys) {
      if (key in h.globals)
        Object.defineProperty(globalThis, key, {
          configurable: true,
          writable: true,
          value: h.globals[key],
        });
      else delete globalThis[key];
    }
    run(h);
    results.push({ name, pass: true });
    console.log(`PASS editorial: ${name}`);
  } catch (error) {
    results.push({ name, pass: false, detail: error.stack });
    console.error(`FAIL editorial: ${name}\n${error.stack}`);
  } finally {
    h.releases.forEach((release) => release());
    for (const key of keys) {
      if (saved[key]) Object.defineProperty(globalThis, key, saved[key]);
      else delete globalThis[key];
    }
  }
}

for (const io of ["absent", "constructor-failure", "observe-failure"]) {
  check(
    `Observer ${io}는 본문 표시로 fallback`,
    (h) => {
      h.startReveal();
      assert.equal(h.readable(), true);
      assert.equal(h.root.classList.contains("js-motion"), false);
      assert.equal(h.counts.rafRequests, 0);
      if (h.observers.length) assert.equal(h.observers[0].disconnected, true);
    },
    { io },
  );
}
check("실제 reveal 모듈은 RAF를 생성하지 않음", (h) => {
  h.startReveal();
  h.observers[0].trigger(h.reveals[1], true);
  h.reduced(true);
  h.reduced(false);
  assert.equal(h.counts.rafRequests, 0);
});
check("처음 화면은 즉시 표시, 화면밖만 observe, threshold0/bottom24", (h) => {
  h.startReveal();
  assert.equal(h.reveals[0].classList.contains("visible"), true);
  assert.equal(h.observers[0].targets.has(h.reveals[0]), false);
  assert.equal(h.observers[0].targets.has(h.reveals[1]), true);
  assert.equal(h.observers[0].options.threshold, 0);
  assert.equal(h.observers[0].options.rootMargin, "0px 0px -24px 0px");
  assert.equal(h.reveals[1].style.transitionDelay, "60ms");
  assert.equal(h.reveals[2].style.transitionDelay, "120ms");
});
check("등장은 한 번, unobserve 후 비진입으로 재숨김 없음", (h) => {
  h.startReveal();
  const element = h.reveals[1];
  const observer = h.observers[0];
  observer.trigger(element, false);
  assert.equal(element.classList.contains("editorial-pending"), true);
  observer.trigger(element, true);
  assert.equal(element.classList.contains("visible"), true);
  assert.equal(element.classList.contains("editorial-pending"), false);
  assert.equal(observer.targets.has(element), false);
  observer.trigger(element, false);
  assert.equal(element.classList.contains("editorial-shown"), true);
});
check("키보드 focusin은 자손 포함 즉시 표시/지연0, 다른 대상은 유지", (h) => {
  h.startReveal();
  const child = new Element();
  child.parentElement = h.reveals[1];
  h.root.emit("focusin", { target: child });
  assert.equal(h.reveals[1].classList.contains("editorial-pending"), false);
  assert.equal(
    h.reveals[1].classList.contains("editorial-focus-visible"),
    true,
  );
  assert.equal(h.reveals[1].style.transitionDelay, "0ms");
  assert.equal(h.observers[0].targets.has(h.reveals[1]), false);
  assert.equal(h.reveals[2].classList.contains("editorial-pending"), true);
});
check("일반 .reveal 초점도 즉시 표시, Node 아닌 대상은 무시", (h) => {
  h.startReveal();
  h.root.emit("focusin", { target: {} });
  assert.equal(h.reveals[3].classList.contains("visible"), false);
  h.root.emit("focusin", { target: h.reveals[3] });
  assert.equal(h.reveals[3].classList.contains("visible"), true);
  assert.equal(
    h.reveals[3].classList.contains("editorial-focus-visible"),
    true,
  );
});
check(
  "초기 감소 모션은 Observer 없이 모두 표시",
  (h) => {
    h.startReveal();
    assert.equal(h.observers.length, 0);
    assert.equal(h.readable(), true);
    assert.equal(h.root.classList.contains("js-motion"), false);
  },
  { reduced: true },
);
check("실시간 감소 모션은 모두 표시/unobserve, resume 재숨김 없음", (h) => {
  h.startReveal();
  h.reduced(true);
  assert.equal(h.readable(), true);
  assert.equal(h.observers[0].targets.size, 0);
  assert.ok(h.reveals.every((el) => el.style.transitionDelay === "0ms"));
  h.reduced(false);
  assert.equal(h.readable(), true);
});
check(
  "초기 감소 이후 resume에도 이미 읽은 본문 유지",
  (h) => {
    h.startReveal();
    h.reduced(false);
    assert.equal(h.readable(), true);
    assert.equal(h.observers.length, 0);
  },
  { reduced: true },
);
check("cleanup은 Observer/listener/숨김 제거, 반복 호출 안전", (h) => {
  const release = h.startReveal();
  release();
  release();
  assert.equal(h.observers[0].disconnected, true);
  assert.equal(h.root.count() + h.reducedMotion.count(), 0);
  assert.equal(h.root.classList.contains("js-motion"), false);
  assert.equal(h.readable(), true);
  assert.equal(h.queue.size, 0);
  h.reduced(true);
  h.root.emit("focusin", { target: h.reveals[1] });
  assert.equal(h.queue.size, 0);
});
check("main 실제 본문이 실제 reveal/scenes를 연결", (h) => {
  h.startMain();
  assert.equal(h.counts.revealSetups, 1);
  assert.equal(h.counts.formSetups, 1);
  h.flush();
  assert.equal(h.counts.sceneDraws, 1);
  assert.match(h.image.style.transform, /^translateY\(/);
});
check("scroll/resize listener는 passive", (h) => {
  h.startMain();
  for (const type of ["scroll", "resize"])
    assert.equal(h.win.listeners.get(type)[0].options.passive, true);
});
check("50 scroll+resize+pageshow를 RAF 한 개로 합침", (h) => {
  h.startMain();
  for (let i = 0; i < 50; i++) {
    h.win.emit("scroll");
    h.win.emit("resize");
    h.win.emit("pageshow");
  }
  assert.equal(h.queue.size, 1);
  assert.equal(h.counts.rafRequests, 1);
  h.flush();
  assert.equal(h.counts.sceneDraws, 1);
  assert.equal(h.queue.size, 0);
});
check("idle은 계속 도는 루프 없음", (h) => {
  h.startMain();
  h.flush();
  const reads = h.panel.reads;
  for (let i = 0; i < 20; i++) h.flush();
  assert.equal(h.counts.rafRequests, 1);
  assert.equal(h.panel.reads, reads);
  assert.equal(h.queue.size, 0);
});
check("hidden은 예약 취소 및 이후 이벤트 RAF 금지", (h) => {
  h.startMain();
  h.hidden(true);
  assert.equal(h.queue.size, 0);
  assert.equal(h.counts.rafCancels, 1);
  h.win.emit("scroll");
  h.win.emit("resize");
  h.win.emit("pageshow");
  assert.equal(h.counts.rafRequests, 1);
  assert.equal(h.counts.sceneDraws, 0);
});
check(
  "hidden 초기 접속/표시 복귀/pageshow는 한 프레임",
  (h) => {
    h.startMain();
    assert.equal(h.queue.size, 0);
    h.hidden(false);
    h.win.emit("pageshow");
    h.win.emit("scroll");
    assert.equal(h.queue.size, 1);
    h.flush();
    assert.equal(h.counts.sceneDraws, 1);
  },
  { hidden: true },
);
check("취소된 RAF callback도 hidden 상태면 실제 장면 계산 금지", (h) => {
  h.startMain();
  const callback = [...h.queue.values()][0];
  h.hidden(true);
  callback(16);
  assert.equal(h.counts.sceneDraws, 0);
  assert.equal(h.panel.reads, 0);
});
check(
  "main 초기 감소 모션은 이미지/레이어 정적, RAF0, 본문 표시",
  (h) => {
    h.startMain();
    assert.equal(h.queue.size, 0);
    assert.equal(h.counts.rafRequests, 0);
    assert.equal(h.image.style.transform, "none");
    assert.equal(h.horizontal.style.transform, "none");
    assert.equal(h.layer.style.translate, "none");
    assert.equal(h.readable(), true);
    assert.equal(h.root.classList.contains("editorial-scroll-ready"), false);
  },
  { reduced: true },
);
check("main 실시간 감소는 예약 취소/즉시 transform 초기화", (h) => {
  h.startMain();
  h.flush();
  h.win.emit("scroll");
  h.reduced(true);
  assert.equal(h.queue.size, 0);
  assert.equal(h.image.style.transform, "none");
  assert.equal(h.layer.style.translate, "none");
  assert.equal(h.readable(), true);
  assert.equal(h.root.classList.contains("motion-paused"), true);
});
check("숨긴 탭에서도 감소 설정 변경은 오래된 이미지 이동 초기화", (h) => {
  h.startMain();
  h.flush();
  h.hidden(true);
  h.reduced(true);
  assert.equal(h.image.style.transform, "none");
  assert.equal(h.layer.style.translate, "none");
  assert.equal(h.readable(), true);
  assert.equal(h.queue.size, 0);
});
check("main resume은 RAF1로 복귀하며 읽은 본문 재숨김 없음", (h) => {
  h.startMain();
  h.reduced(true);
  h.reduced(false);
  assert.equal(h.queue.size, 1);
  h.flush();
  assert.equal(h.queue.size, 0);
  assert.notEqual(h.image.style.transform, "none");
  assert.equal(h.readable(), true);
});
for (const mobile of [false, true]) {
  check(
    `실제 scene ${mobile ? "모바일12" : "PC44"} overscan 경계`,
    (h) => {
      const margin = mobile ? 12 : 44;
      for (const height of [100, 400, 900]) {
        h.panel.height = h.panel.clientHeight = height;
        h.image.offsetTop = -margin;
        h.image.offsetHeight = height + margin * 2;
        for (const top of [-height, -height / 2, 0, 400, 800]) {
          h.panel.top = top;
          h.drawScene();
          const delta = Number(
            /^translateY\(([-\d.eE]+)px\)$/.exec(h.image.style.transform)[1],
          );
          assert.ok(Number.isFinite(delta));
          assert.ok(Math.abs(delta) <= margin + 1e-9);
          assert.ok(h.image.offsetTop + delta <= 1e-9);
          assert.ok(
            h.image.offsetTop + h.image.offsetHeight + delta >= height - 1e-9,
          );
        }
      }
    },
    { mobile },
  );
}
check("scene 비대칭/overscan0도 경계 보호", (h) => {
  for (const [upper, lower] of [
    [20, 7],
    [0, 0],
  ]) {
    h.image.offsetTop = -upper;
    h.image.offsetHeight = h.panel.clientHeight + upper + lower;
    h.panel.top = -400;
    h.drawScene();
    const delta = Number(
      /^translateY\(([-\d.eE]+)px\)$/.exec(h.image.style.transform)[1],
    );
    assert.ok(Math.abs(delta) <= Math.min(upper, lower));
  }
});
check("scene 화면밖 skip/데이터값/8% 이동량 제한", (h) => {
  h.drawScene();
  const old = h.image.style.transform;
  h.panel.top = 801;
  h.drawScene();
  assert.equal(h.image.style.transform, old);
  h.panel.top = -401;
  h.drawScene();
  assert.equal(h.image.style.transform, old);
  for (const limit of [2, 44, 56, 64]) {
    h.image.dataset.imageParallax = String(limit);
    h.panel.top = -400;
    h.drawScene();
    const delta = Number(
      /^translateY\(([-\d.eE]+)px\)$/.exec(h.image.style.transform)[1],
    );
    assert.ok(Math.abs(delta) <= Math.min(limit, 32, 44) + 1e-9);
  }
});
check("scene 감소 모션은 화면밖 이미지까지 초기화", (h) => {
  h.drawScene();
  h.panel.top = 1200;
  h.reducedMotion.matches = true;
  h.drawScene();
  assert.equal(h.image.style.transform, "none");
  assert.equal(h.horizontal.style.transform, "none");
});
check("실제 main 업무 active 이동/56% 경계/숫자/진행폭", (h) => {
  h.startMain();
  h.flush();
  assert.equal(h.number.textContent, "01");
  h.steps[1].top = 447;
  h.win.emit("scroll");
  h.flush();
  assert.equal(h.number.textContent, "02");
  assert.equal(h.steps[1].classList.contains("active"), true);
  h.steps[2].top = 447;
  h.win.emit("scroll");
  h.flush();
  assert.equal(h.number.textContent, "03");
  assert.equal(h.track.style.width, "100%");
  h.steps[1].top = h.win.innerHeight * 0.56;
  h.steps[2].top = 600;
  h.win.emit("scroll");
  h.flush();
  assert.equal(h.number.textContent, "01");
  assert.equal(
    h.steps.filter((step) => step.classList.contains("active")).length,
    1,
  );
});
check("CSS는 초점 즉시/감소 sticky 해제/모바일12/글자 변수 유지", () => {
  const css = source["src/editorial-content.css"];
  assert.match(
    css,
    /\.editorial-focus-visible\s*\{\s*transition:\s*none\s*!important/,
  );
  assert.match(
    css,
    /\.reveal\.editorial-focus-visible\s*\{\s*transition:\s*none\s*!important/,
  );
  assert.match(css, /--editorial-overscan:\s*44px/);
  assert.match(
    css,
    /@media\s*\(max-width:\s*700px\)[\s\S]*?--editorial-overscan:\s*12px/,
  );
  assert.match(
    css,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?position:\s*static\s*!important/,
  );
  const reduced = css.slice(
    css.indexOf("@media (prefers-reduced-motion: reduce)"),
  );
  assert.match(
    reduced,
    /\.editorial-enter,\s*\.editorial-work-row::before\s*\{\s*transition:\s*none\s*!important/,
  );
  assert.match(
    css,
    /\.editorial-work-row dd\s*\{[^}]*font-size:\s*var\(--read-text\)/,
  );
  for (const [, selectors, declarations] of css.matchAll(
    /([^{}]+)\{([^{}]*)\}/g,
  )) {
    if (
      selectors.includes("editorial-work-row") &&
      !selectors.includes("::before")
    ) {
      assert.doesNotMatch(
        declarations,
        /(?:opacity:\s*0|visibility:\s*hidden|display:\s*none)/,
      );
    }
  }
});
check("추적 출처 문서의 승인 WebP3 해시/bytes 일치, 캡처3 유지", () => {
  // 로컬 시안 보관 경로는 기록 정보일 뿐, npm 회귀의 필수 입력으로 읽지 않는다.
  const assets = JSON.parse(read("docs/image-provenance-p0009.json"));
  assert.deepEqual(assets.map((image) => image.key).sort(), [
    "pet-commerce",
    "pet-customer",
    "print-commerce",
  ]);
  for (const image of assets) {
    assert.equal(image.approved, true, image.key);
    assert.equal(image.formatOnly, true, image.key);
    assert.equal(image.publicFile, `public/images/commerce/${image.key}.webp`);
    assert.match(image.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Number.isSafeInteger(image.bytes) && image.bytes > 0);
    assert.equal(hash(image.publicFile), image.sha256, image.key);
    assert.equal(
      statSync(new URL(image.publicFile, project)).size,
      image.bytes,
    );
    assert.equal(image.width, 1536);
    assert.equal(image.height, 1024);
  }
  for (const name of ["content-hub", "product-portfolio", "store-screen"]) {
    assert.ok(
      statSync(new URL(`public/images/commerce/${name}.webp`, project)).size >
        0,
    );
  }
});
check("홈/사업 6배치에 장면 alt·치수·lazy 유지, 생성 안내 제거", () => {
  for (const file of ["src/index.html", "src/business/index.html"]) {
    const html = source[file];
    const generated = [
      ...html.matchAll(
        /<img\b[^>]*src="\/images\/commerce\/(?:pet-commerce|print-commerce|pet-customer)\.webp"[^>]*>/g,
      ),
    ];
    assert.equal(generated.length, 3, file);
    for (const [image] of generated) {
      assert.match(image, /width="1536"/);
      assert.match(image, /height="1024"/);
      assert.match(image, /loading="lazy"/);
      assert.match(image, /data-image-parallax="(?:44|56|64)"/);
      assert.match(
        image,
        /alt="(?:사료가 담긴 그릇과 반려동물 목줄|용지 위에 놓인 토너와 골드 컬러 소품|반려견에게 간식을 건네는 손)"/,
      );
    }
    const notices = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    assert.doesNotMatch(
      notices,
      /AI 생성|생성 콘셉트|실제 (?:상품|고객).*아님/,
    );
  }
});
check("콘텐츠 근거 범위/기간·실제 링크 유지, 시안 UI 이관 없음", () => {
  const home = source["src/index.html"]
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  const business = source["src/business/index.html"]
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  assert.match(home, /멍수무강 콘텐츠 허브 · 13개 가이드 · 5개 주제 카테고리/);
  assert.match(business, /15회.*2026년 1–6월 박람회/);
  assert.match(business, /자사몰 포함/);
  assert.match(business, /멍수무강 상품 범위/);
  for (const file of ["src/index.html", "src/business/index.html"]) {
    assert.doesNotMatch(source[file], /p9-review|data-p9-|P-0009|(?:\?|&)p9=/);
  }
  for (const link of ["/business/#pet", "/business/#print", "/capabilities/"]) {
    assert.ok(source["src/index.html"].includes(`href="${link}"`), link);
  }
  assert.ok(
    source["src/main.ts"].indexOf('import "./editorial-content.css"') <
      source["src/main.ts"].indexOf('import "./readability.css"'),
  );
});
check("검사 실행 중 운영 입력 SHA/mtime 불변", () => {
  for (const name of reviewed)
    assert.deepEqual(snapshot(name), before[name], name);
});

const passed = results.filter((result) => result.pass).length;
console.log(
  JSON.stringify(
    {
      suite: "actual-editorial-module-regression",
      passed,
      total: results.length,
      failed: results.filter((result) => !result.pass).map(({ name }) => name),
      sourceLines: Object.fromEntries(
        reviewed.map((name) => [
          name,
          source[name].split(/\r?\n/).length -
            (source[name].endsWith("\n") ? 1 : 0),
        ]),
      ),
      inputSnapshots: before,
      privateCompile:
        "기존 tsconfig의 실제 tsc 출력 -> tmp/editorial-module-test; 운영 파일 쓰기 없음",
      notRun: [
        "browser/pixels",
        "real hardware/performance",
        "site build/deploy",
        "ASCII/mail behavior",
        "minimum Node runtime",
      ],
    },
    null,
    2,
  ),
);
if (passed !== results.length)
  throw new Error(
    `편집 회귀 ${passed}/${results.length} PASS: 실패 항목 확인 필요`,
  );
console.log(
  `${passed}/${results.length} PASS — 실제 편집 모듈·공통 스크롤 회귀; 브라우저·메일 전송 없음.`,
);
