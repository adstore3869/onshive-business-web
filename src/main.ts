import "@fontsource-variable/noto-sans-kr";
import "@fontsource-variable/archivo";
import "./styles.css";
import "./home-scenes.css";
import "./visual-pages.css";
import "./content-pages.css";
import "./editorial-content.css";
import "./readability.css";
import { createAsciiWave } from "./ascii-wave";
import { createScrollScenes } from "./scroll-scenes";
import { setupPartnershipForm } from "./partnership-form";
import { setupReveals } from "./reveal";

setupPartnershipForm();

const root = document.documentElement;
const menuButton = document.querySelector<HTMLButtonElement>(".menu-button");
const navigation = document.querySelector<HTMLElement>(".nav");
const desktop = window.matchMedia("(min-width: 701px)");

// Keep ordinary links accessible until the enhanced menu is ready.
if (menuButton && navigation) {
  const setMenuOpen = (open: boolean, restoreFocus = false) => {
    navigation.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    if (restoreFocus) menuButton.focus();
  };

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
  root.classList.add("js");
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
setupReveals(root, reducedMotion);

const layers = [
  ...document.querySelectorAll<HTMLElement>("[data-parallax], [data-depth]"),
].map((element) => ({
  element,
  section: element.closest("section"),
  speed: Number(element.dataset.depth ?? element.dataset.parallax) || 0,
}));
let frame: number | null = null;

function motionPaused(): boolean {
  return reducedMotion.matches;
}

const asciiCanvas = document.querySelector<HTMLCanvasElement>(".ascii-canvas");
const asciiWave = asciiCanvas
  ? createAsciiWave(asciiCanvas, motionPaused)
  : null;
const drawScrollScenes = createScrollScenes(motionPaused);

function drawParallax(): void {
  frame = null;
  if (document.hidden && !motionPaused()) return;
  const viewportHeight = window.innerHeight;
  const amplitude = desktop.matches ? 1 : 0.45;

  for (const { element, section, speed } of layers) {
    if (motionPaused()) {
      element.style.translate = "none";
      continue;
    }
    if (!section) continue;
    const bounds = section.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > viewportHeight) continue;
    const travel = Math.max(
      -viewportHeight,
      Math.min(viewportHeight, -bounds.top),
    );
    element.style.translate = `0 ${travel * speed * amplitude}px`;
  }
  updateStory();
  drawScrollScenes();
}

function scheduleParallax(): void {
  if (!document.hidden && frame === null)
    frame = requestAnimationFrame(drawParallax);
}

function syncMotion(): void {
  const paused = motionPaused();
  root.classList.toggle("motion-paused", paused);
  root.classList.toggle("editorial-scroll-ready", !paused);

  if (paused) {
    // 설정 전환 즉시 이미지 위치를 초기화하고 이미 예약된 프레임도 정리한다.
    if (frame !== null) cancelAnimationFrame(frame);
    drawParallax();
  } else {
    scheduleParallax();
  }
  asciiWave?.sync();
}

reducedMotion.addEventListener("change", syncMotion);
window.addEventListener("scroll", scheduleParallax, { passive: true });
window.addEventListener("resize", scheduleParallax, { passive: true });
window.addEventListener("pageshow", scheduleParallax);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  } else {
    scheduleParallax();
  }
});

// Page navigation is rendered into the HTML; only the about narrative follows scrolling.
const chapters = [...document.querySelectorAll<HTMLElement>("[data-chapter]")];
const storyCount = document.querySelector<HTMLElement>(".story-count");
const storyTrack = document.querySelector<HTMLElement>(".story-track i");
function updateStory(): void {
  if (chapters.length === 0) return;
  let active = 0;
  chapters.forEach((chapter, index) => {
    if (chapter.getBoundingClientRect().top < window.innerHeight * 0.6)
      active = index;
  });
  chapters.forEach((chapter, index) =>
    chapter.classList.toggle("active", index === active),
  );
  if (storyCount) storyCount.textContent = String(active + 1).padStart(2, "0");
  if (storyTrack)
    storyTrack.style.width = `${((active + 1) / chapters.length) * 100}%`;
}

syncMotion();
updateStory();
