/** Draws the approved image and service scenes from the shared scroll frame. */
export function createScrollScenes(isPaused: () => boolean): () => void {
  const pictures = [
    ...document.querySelectorAll<HTMLImageElement>("[data-image-parallax]"),
  ];
  const horizontal = [
    ...document.querySelectorAll<HTMLElement>("[data-scroll-x]"),
  ];
  const steps = [
    ...document.querySelectorAll<HTMLElement>("[data-service-step]"),
  ];
  const number = document.querySelector<HTMLElement>("[data-service-count]");
  const track = document.querySelector<HTMLElement>("[data-service-progress]");
  let previousStep = -1;
  const clamp = (value: number) => Math.max(-1, Math.min(1, value));

  return () => {
    const paused = isPaused();
    const viewport = window.innerHeight;
    for (const image of pictures) {
      if (paused) {
        image.style.transform = "none";
        continue;
      }
      const panel = image.parentElement;
      if (!panel) continue;
      const rect = panel.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewport) continue;
      const progress = clamp(
        (viewport / 2 - rect.top - rect.height / 2) /
          (viewport / 2 + rect.height / 2),
      );
      // Respect each image's real overscan so scrolling never exposes a gap.
      const overscan = Math.max(
        0,
        Math.min(
          -image.offsetTop,
          image.offsetTop + image.offsetHeight - panel.clientHeight,
        ),
      );
      const travel = Math.min(
        Number(image.dataset.imageParallax) || 60,
        rect.height * 0.08,
        overscan,
      );
      image.style.transform = `translateY(${progress * travel}px)`;
    }
    for (const element of horizontal) {
      if (paused) {
        element.style.transform = "none";
        continue;
      }
      const panel = element.parentElement;
      if (!panel) continue;
      const rect = panel.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewport) continue;
      const progress = clamp(
        (viewport / 2 - rect.top) / (viewport + rect.height),
      );
      element.style.transform = `translateX(${progress * (Number(element.dataset.scrollX) || 0)}px)`;
    }
    if (steps.length === 0) return;
    let active = 0;
    steps.forEach((step, index) => {
      if (step.getBoundingClientRect().top < viewport * 0.56) active = index;
    });
    if (active === previousStep) return;
    previousStep = active;
    steps.forEach((step, index) =>
      step.classList.toggle("active", index === active),
    );
    if (number) number.textContent = String(active + 1).padStart(2, "0");
    if (track) track.style.width = `${((active + 1) / steps.length) * 100}%`;
  };
}
