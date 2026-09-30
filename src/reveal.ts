/** 기존 등장 효과와 승인 편집 구간을 한 번만 표시하는 수명 주기. */
export function setupReveals(
  root: HTMLElement,
  reducedMotion: MediaQueryList,
): () => void {
  const elements = [
    ...root.querySelectorAll<HTMLElement>(".reveal, [data-editorial-reveal]"),
  ];
  let observer: IntersectionObserver | null = null;

  const show = (element: HTMLElement, immediate = false) => {
    if (immediate) {
      element.style.transitionDelay = "0ms";
      element.classList.add("editorial-focus-visible");
    }
    element.classList.remove("editorial-pending");
    element.classList.add("visible", "editorial-shown");
    observer?.unobserve(element);
  };
  const showAll = () => elements.forEach((element) => show(element, true));
  const sync = () => {
    root.classList.toggle("js-motion", !reducedMotion.matches && !!observer);
    if (reducedMotion.matches) showAll();
  };

  // 실패/무JS의 기본은 보이는 본문. Observer 연결 뒤에만 미표시 상태를 부여한다.
  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    try {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) show(entry.target as HTMLElement);
          }
        },
        { threshold: 0, rootMargin: "0px 0px -24px 0px" },
      );
      for (const element of elements) {
        const delay = Number(element.dataset.editorialReveal) || 0;
        if (element.hasAttribute("data-editorial-reveal")) {
          element.classList.add("editorial-enter");
          element.style.transitionDelay = `${Math.max(0, Math.min(120, delay))}ms`;
        }
        if (element.getBoundingClientRect().top < window.innerHeight - 24) {
          show(element);
        } else {
          observer.observe(element);
          if (element.hasAttribute("data-editorial-reveal"))
            element.classList.add("editorial-pending");
        }
      }
    } catch {
      observer?.disconnect();
      observer = null;
      showAll();
    }
  }

  const onFocus = (event: FocusEvent) => {
    if (!(event.target instanceof Node)) return;
    for (const element of elements) {
      if (element.contains(event.target)) show(element, true);
    }
  };
  root.addEventListener("focusin", onFocus);
  reducedMotion.addEventListener("change", sync);
  sync();

  return () => {
    showAll();
    observer?.disconnect();
    observer = null;
    root.classList.remove("js-motion");
    root.removeEventListener("focusin", onFocus);
    reducedMotion.removeEventListener("change", sync);
  };
}
