type WavePoint = { x: number; z: number; seed: number };
type ProjectedPoint = WavePoint & { y: number; light: number };

export function createAsciiWave(
  canvas: HTMLCanvasElement,
  isPaused: () => boolean,
): { sync: () => void } | null {
  const artElement = canvas.closest<HTMLElement>(".ascii-art");
  const heroElement = artElement?.closest<HTMLElement>(".hero");
  if (!artElement || !heroElement) return null;
  const art = artElement;
  const hero = heroElement;

  let context: CanvasRenderingContext2D | null;
  try {
    context = canvas.getContext("2d");
  } catch {
    return null;
  }
  if (!context) return null;
  const ctx = context;

  let frame: number | null = null;
  let elapsed = 0;
  let previous: number | null = null;
  let width = 0;
  let height = 0;
  let pointerX = 0;
  let pointerY = 0;
  let driftX = 0;
  let driftY = 0;
  let pageActive = true;
  let ready = false;
  const initialBounds = hero.getBoundingClientRect();
  let visible = initialBounds.bottom > 0 && initialBounds.top < innerHeight;

  const points: WavePoint[] = [];
  for (let column = 0; column < 176; column++) {
    const x = (column / 175 - 0.5) * 6.4;
    for (let row = 0; row < 48; row++) {
      const z = (row / 47 - 0.5) * 3.8;
      points.push({ x, z, seed: column * 17 + row * 13 });
    }
  }
  // Reuse projection records while depth sorting the character surface.
  const projected: ProjectedPoint[] = points.map((point) => ({
    ...point,
    y: 0,
    light: 0,
  }));
  const grid = new Map<string, ProjectedPoint>();
  const glyphs = ".:+=*onshive#";
  const colors = [
    "#c3c2af",
    "#b4b49d",
    "#98997f",
    "#9e883f",
    "#aa8025",
    "#8c681f",
    "#514f3b",
  ];
  const canMove = () =>
    ready &&
    width > 0 &&
    height > 0 &&
    !isPaused() &&
    visible &&
    pageActive &&
    !document.hidden;

  function draw(): void {
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width, height);
    const time = elapsed * 0.00022;
    const roll = -0.1 + driftX * 0.35;
    const cosB = Math.cos(roll);
    const sinB = Math.sin(roll);

    for (let index = 0; index < points.length; index++) {
      const point = points[index];
      const phase = point.x * 1.3 - time * 1.7;
      const wave =
        0.62 * Math.sin(phase) +
        0.24 * Math.cos(point.z * 1.8 + point.x * 0.68 - time) +
        0.12 * Math.sin(point.z * 3 - time);
      const x = point.x + point.z * 0.23;
      const ty = wave * 0.95 + point.z * (0.44 + driftY);
      const tx = x * cosB - ty * sinB;
      const ry = x * sinB + ty * cosB;
      const target = projected[index];
      target.x = width * 0.5 + tx * width * 0.166 * (tx > 0 ? 1.15 : 1);
      target.y = height * 0.5 + ry * height * 0.28;
      target.z = point.z - wave * 0.25;
      target.seed = point.seed;
      target.light = Math.max(
        0.1,
        Math.min(0.95, 0.5 + wave * 0.31 + point.z * 0.13),
      );
    }

    projected.sort((a, b) => a.z - b.z);
    const cell = Math.max(7, width / 165);
    grid.clear();
    for (const point of projected) {
      grid.set(
        `${Math.round(point.x / cell)},${Math.round(point.y / cell)}`,
        point,
      );
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.min(11, Math.max(8, width / 130))}px "Consolas", "Courier New", monospace`;
    for (const point of grid.values()) {
      const level = Math.max(0, Math.min(6, Math.floor(point.light * 6.9)));
      ctx.fillStyle = colors[level];
      const nx = point.x / width;
      const ny = point.y / height;
      // The wave remains behind copy without reducing headline contrast.
      const copyFade =
        width > 700
          ? 0.1 + 0.9 * Math.max(0, Math.min(1, (nx - 0.35) / 0.37))
          : 0.12 + 0.72 * Math.max(0, Math.min(1, (ny - 0.4) / 0.28));
      ctx.globalAlpha = (0.72 + point.light * 0.25) * copyFade;
      ctx.fillText(
        glyphs[(level + point.seed) % glyphs.length],
        point.x,
        point.y,
      );
    }

    ctx.font = `${Math.max(8, scale / 70)}px "Consolas", monospace`;
    for (let index = 0; index < 36; index++) {
      const x = (index / 35 - 0.5) * 0.83;
      const y =
        Math.sin(x * 7 - time * 1.7) * 0.11 + (index % 2 ? -0.28 : 0.24);
      ctx.globalAlpha = 0.08 + (index % 4) * 0.018;
      ctx.fillStyle = index % 3 ? "#8e8e77" : "#b08829";
      ctx.fillText(
        index % 3 ? "." : "+",
        width * 0.5 + x * width,
        height * 0.5 + y * height,
      );
    }
    ctx.globalAlpha = 1;
    art.dataset.frame = String(Math.round(elapsed));
  }

  function tick(now: number): void {
    frame = null;
    if (!canMove()) {
      previous = null;
      art.dataset.running = "false";
      return;
    }
    if (previous === null || now - previous >= 1000 / 30) {
      elapsed += previous === null ? 0 : Math.min(now - previous, 80);
      previous = now;
      driftX += (pointerX - driftX) * 0.035;
      driftY += (pointerY - driftY) * 0.035;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }

  function sync(): void {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    // Resuming from a hidden page starts at the last painted moment.
    previous = null;
    const running = canMove();
    art.dataset.running = String(running);
    if (running) frame = requestAnimationFrame(tick);
  }

  function resize(): void {
    width = art.clientWidth;
    height = art.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (width > 0 && height > 0) {
      // Resizing a paused canvas redraws the same time and pointer position.
      draw();
      ready = true;
      art.classList.add("ascii-ready");
    }
    sync();
  }

  resize();
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(resize).observe(art);
  } else {
    window.addEventListener("resize", resize, { passive: true });
  }
  if (typeof IntersectionObserver !== "undefined") {
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    ).observe(hero);
  } else {
    window.addEventListener(
      "scroll",
      () => {
        const bounds = hero.getBoundingClientRect();
        const next = bounds.bottom > 0 && bounds.top < innerHeight;
        if (visible !== next) {
          visible = next;
          sync();
        }
      },
      { passive: true },
    );
  }
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pagehide", () => {
    pageActive = false;
    sync();
  });
  window.addEventListener("pageshow", () => {
    pageActive = true;
    const bounds = hero.getBoundingClientRect();
    visible = bounds.bottom > 0 && bounds.top < innerHeight;
    sync();
  });
  hero.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch" || !canMove()) return;
      const bounds = art.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.3;
      pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.3;
    },
    { passive: true },
  );
  hero.addEventListener("pointerleave", () => {
    pointerX = 0;
    pointerY = 0;
  });

  return { sync };
}
