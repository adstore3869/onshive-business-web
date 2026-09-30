import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const results = [];
const probe = (name, run) => {
  run();
  results.push(name);
};

// 실제 운영 TypeScript를 컴파일한다. 렌더러의 모듈 연결만 VM에서 대체한다.
execFileSync(
  process.execPath,
  [
    path.join(root, "node_modules/typescript/bin/tsc"),
    "--ignoreConfig",
    "src/ascii-patterns.ts",
    "src/ascii-wave.ts",
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
    "tmp/ascii-test",
  ],
  { cwd: root, stdio: "pipe" },
);
const { ASCII_VARIANTS, chooseAsciiVariant, sampleAsciiSurface } = await import(
  pathToFileURL(path.join(root, "tmp/ascii-test/ascii-patterns.js")).href
);
const renderer = fs
  .readFileSync(path.join(root, "tmp/ascii-test/ascii-wave.js"), "utf8")
  .replace(/^import[\s\S]*?from "\.\/ascii-patterns";\s*/m, "")
  .replace("export function createAsciiWave", "function createAsciiWave");
const variants = ["wave", "ripple", "crossflow", "ribbon"];

for (const previous of [null, ...variants]) {
  probe(
    `Random choice reaches all candidates and excludes ${previous ?? "none"}`,
    () => {
      const chosen = new Set();
      for (let index = 0; index < 1000; index++) {
        const next = chooseAsciiVariant(previous, () => (index + 0.5) / 1000);
        assert.ok(variants.includes(next));
        assert.notEqual(next, previous);
        chosen.add(next);
      }
      assert.equal(chosen.size, previous === null ? 4 : 3);
    },
  );
}
probe("Invalid stored names and random values have safe choices", () => {
  for (const value of [NaN, Infinity, -1, 1, 50])
    assert.equal(
      chooseAsciiVariant("wave", () => value),
      "ripple",
    );
  assert.equal(
    chooseAsciiVariant("invalid", () => 0),
    "wave",
  );
});
probe("Original wave equation, finite bounds and distinct patterns", () => {
  const fields = new Map(variants.map((variant) => [variant, []]));
  for (let column = 0; column <= 40; column++)
    for (let row = 0; row <= 20; row++)
      for (const time of [0, 1, 4, 1000]) {
        const x = -3.2 + column * 0.16;
        const z = -1.9 + row * 0.19;
        const original =
          0.62 * Math.sin(x * 1.3 - time * 1.7) +
          0.24 * Math.cos(z * 1.8 + x * 0.68 - time) +
          0.12 * Math.sin(z * 3 - time);
        assert.equal(sampleAsciiSurface("wave", x, z, time), original);
        for (const variant of variants) {
          const height = sampleAsciiSurface(variant, x, z, time);
          assert.ok(
            Number.isFinite(height) && Math.abs(height) <= 0.98 + 1e-12,
          );
          fields.get(variant).push(height);
        }
      }
  for (const variant of variants)
    for (const value of [1e308, -1e308, Infinity, NaN])
      assert.ok(
        Number.isFinite(sampleAsciiSurface(variant, value, value, value)),
      );
  for (let a = 0; a < variants.length; a++)
    for (let b = a + 1; b < variants.length; b++)
      assert.ok(
        fields
          .get(variants[a])
          .some(
            (value, index) =>
              Math.abs(value - fields.get(variants[b])[index]) > 0.5,
          ),
      );
});

function makeHarness({
  store = new Map(),
  paused = false,
  storageDenied = false,
  storageWriteDenied = false,
  hidden = false,
  noParent = false,
  noContext = false,
  random = Math.random,
} = {}) {
  const frames = new Map();
  const windowEvents = new Map();
  const documentEvents = new Map();
  let sequence = 0;
  let resize, intersection;
  const state = { paused, draws: 0, stores: 0 };
  const listen = (map) => (name, callback) => {
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(callback);
  };
  const art = {
    clientWidth: 640,
    clientHeight: 800,
    dataset: {},
    classList: { add: () => {} },
    closest: () => hero,
    getBoundingClientRect: () => ({
      top: 0,
      bottom: 800,
      left: 0,
      width: 640,
      height: 800,
    }),
  };
  const hero = {
    getBoundingClientRect: art.getBoundingClientRect,
    addEventListener: () => {},
  };
  const context = {
    clearRect: () => state.draws++,
    setTransform: () => {},
    fillText: () => {},
  };
  const canvas = {
    width: 0,
    height: 0,
    closest: () => (noParent ? null : art),
    getContext: () => (noContext ? null : context),
  };
  const document = { hidden, addEventListener: listen(documentEvents) };
  const environment = {
    ASCII_VARIANTS,
    chooseAsciiVariant: (previous) => chooseAsciiVariant(previous, random),
    sampleAsciiSurface,
    document,
    innerHeight: 1000,
    window: { devicePixelRatio: 4, addEventListener: listen(windowEvents) },
    localStorage: {
      getItem: (key) => {
        if (storageDenied) throw new Error("Storage denied");
        return store.get(key) ?? null;
      },
      setItem: (key, value) => {
        if (storageDenied || storageWriteDenied)
          throw new Error("Storage write denied");
        state.stores++;
        store.set(key, value);
      },
    },
    ResizeObserver: class {
      constructor(callback) {
        resize = callback;
      }
      observe() {}
    },
    IntersectionObserver: class {
      constructor(callback) {
        intersection = callback;
      }
      observe() {}
    },
    requestAnimationFrame: (callback) => {
      frames.set(++sequence, callback);
      return sequence;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  };
  const create = vm.runInNewContext(
    renderer + "\ncreateAsciiWave;",
    environment,
  );
  const controller = create(canvas, () => state.paused);
  return {
    art,
    canvas,
    controller,
    document,
    state,
    store,
    frames,
    advance(now) {
      const first = frames.entries().next().value;
      if (first) {
        frames.delete(first[0]);
        first[1](now);
      }
    },
    emitWindow(name, event = {}) {
      windowEvents.get(name)?.forEach((callback) => callback(event));
    },
    emitDocument(name) {
      documentEvents.get(name)?.forEach((callback) => callback());
    },
    resize() {
      resize();
    },
    intersect(visible) {
      intersection([{ isIntersecting: visible }]);
    },
  };
}

probe(
  "Non-hero pages and unavailable canvas exit without storage or frames",
  () => {
    for (const options of [{ noParent: true }, { noContext: true }]) {
      const h = makeHarness(options);
      assert.equal(h.controller, null);
      assert.equal(h.state.stores, 0);
      assert.equal(h.frames.size, 0);
    }
  },
);
probe(
  "Fresh entries and separate tabs share last-pattern storage without repeats",
  () => {
    const store = new Map([["onshive:ascii:last", "wave"]]);
    let previous = "wave";
    for (let index = 0; index < 20; index++) {
      const h = makeHarness({ store });
      assert.notEqual(h.art.dataset.variant, previous);
      previous = h.art.dataset.variant;
      assert.equal(store.get("onshive:ascii:last"), previous);
      assert.equal(store.size, 1);
    }
  },
);
probe(
  "Initial pageshow, sync, resize and visibility resume do not reselect",
  () => {
    const h = makeHarness();
    const initial = h.art.dataset.variant;
    h.emitWindow("pageshow", { persisted: false });
    h.controller.sync();
    h.resize();
    h.emitDocument("visibilitychange");
    assert.equal(h.art.dataset.variant, initial);
    assert.equal(h.state.stores, 1);
  },
);
probe("BFCache return selects a different pattern and resets time", () => {
  const h = makeHarness();
  h.advance(0);
  h.advance(40);
  const previous = h.art.dataset.variant;
  h.emitWindow("pagehide");
  h.emitWindow("pageshow", { persisted: true });
  assert.notEqual(h.art.dataset.variant, previous);
  assert.equal(h.art.dataset.frame, "0");
  assert.equal(h.frames.size, 1);
});
probe("Storage denial preserves rendering and BFCache repeat exclusion", () => {
  const h = makeHarness({ storageDenied: true });
  assert.ok(variants.includes(h.art.dataset.variant));
  const previous = h.art.dataset.variant;
  h.emitWindow("pagehide");
  h.emitWindow("pageshow", { persisted: true });
  assert.notEqual(h.art.dataset.variant, previous);
  assert.ok(h.state.draws > 0);
});
probe("Write-only storage denial never reuses a stale stored pattern", () => {
  const store = new Map([["onshive:ascii:last", "wave"]]);
  const h = makeHarness({ store, storageWriteDenied: true, random: () => 0 });
  assert.equal(h.art.dataset.variant, "ripple");
  for (let index = 0; index < 5; index++) {
    const previous = h.art.dataset.variant;
    h.emitWindow("pagehide");
    h.emitWindow("pageshow", { persisted: true });
    assert.notEqual(h.art.dataset.variant, previous);
    assert.equal(store.get("onshive:ascii:last"), "wave");
  }
});
probe(
  "BFCache excludes the most recently displayed pattern across home entries",
  () => {
    const h = makeHarness({ random: () => 0 });
    assert.equal(h.art.dataset.variant, "wave");
    // 다른 홈 history 문서에서 마지막으로 본 패턴이 현재 캐시 문서와 다르다.
    h.store.set("onshive:ascii:last", "ripple");
    h.emitWindow("pagehide");
    h.emitWindow("pageshow", { persisted: true });
    assert.notEqual(h.art.dataset.variant, "ripple");
  },
);
probe("Canvas DPR is capped at two even on a DPR-four device", () => {
  const h = makeHarness();
  assert.equal(h.canvas.width, 1280);
  assert.equal(h.canvas.height, 1600);
});
probe("RAF paint interval retains the 30fps upper bound", () => {
  const h = makeHarness();
  h.advance(0);
  const first = h.state.draws;
  h.advance(16);
  assert.equal(h.state.draws, first);
  h.advance(34);
  assert.equal(h.state.draws, first + 1);
});
probe(
  "OS reduced motion draws once; paused BFCache change stays static",
  () => {
    const h = makeHarness({ paused: true });
    assert.equal(h.state.draws, 1);
    assert.equal(h.frames.size, 0);
    const previous = h.art.dataset.variant;
    h.emitWindow("pageshow", { persisted: true });
    assert.notEqual(h.art.dataset.variant, previous);
    assert.equal(h.state.draws, 2);
    assert.equal(h.frames.size, 0);
  },
);
probe(
  "Offscreen and hidden pages pause without losing selected pattern",
  () => {
    const h = makeHarness();
    const previous = h.art.dataset.variant;
    h.intersect(false);
    assert.equal(h.frames.size, 0);
    assert.equal(h.art.dataset.running, "false");
    h.intersect(true);
    assert.equal(h.frames.size, 1);
    h.document.hidden = true;
    h.emitDocument("visibilitychange");
    assert.equal(h.frames.size, 0);
    h.document.hidden = false;
    h.emitDocument("visibilitychange");
    assert.equal(h.frames.size, 1);
    assert.equal(h.art.dataset.variant, previous);
  },
);
probe(
  "Pagehide cancels frames and normal pageshow resumes same pattern",
  () => {
    const h = makeHarness();
    const previous = h.art.dataset.variant;
    h.emitWindow("pagehide");
    assert.equal(h.frames.size, 0);
    h.emitWindow("pageshow", { persisted: false });
    assert.equal(h.art.dataset.variant, previous);
    assert.equal(h.frames.size, 1);
  },
);

console.log(
  JSON.stringify(
    {
      scope: "Actual compiled ASCII modules and mocked lifecycle",
      passed: results.length,
      failed: 0,
      checks: results,
    },
    null,
    2,
  ),
);
console.log(
  `${results.length}/${results.length} PASS — actual ASCII module regression probes.`,
);
