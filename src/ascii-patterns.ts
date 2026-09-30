export const ASCII_VARIANTS = [
  "wave",
  "ripple",
  "crossflow",
  "ribbon",
] as const;
export type AsciiVariant = (typeof ASCII_VARIANTS)[number];

// 직전 패턴을 후보에서 제외해 접속·새로고침에서 연속 반복을 막는다.
export function chooseAsciiVariant(
  previous: string | null,
  random: () => number = Math.random,
): AsciiVariant {
  const candidates = ASCII_VARIANTS.filter((variant) => variant !== previous);
  const value = random();
  const fraction =
    Number.isFinite(value) && value >= 0 && value < 1 ? value : 0;
  return candidates[Math.floor(fraction * candidates.length)];
}

export function sampleAsciiSurface(
  variant: AsciiVariant,
  x: number,
  z: number,
  time: number,
): number {
  let height: number;
  switch (variant) {
    case "ripple": {
      const radius = Math.hypot(x - 0.45, z);
      height = (0.86 * Math.sin(radius * 3.1 - time * 2)) / (1 + radius * 0.17);
      break;
    }
    case "crossflow":
      height =
        0.54 * Math.sin((x + z) * 1.85 - time * 1.4) +
        0.36 * Math.sin((x - z) * 2.1 + time * 1.15);
      break;
    case "ribbon":
      height =
        0.69 * Math.sin(x * 1.1 + z * 2.2 - time * 1.25) +
        0.22 * Math.cos(x * 2.2 - z * 0.5 + time * 0.7);
      break;
    default:
      // 기존 파도는 수식·진폭·속도를 그대로 유지한다.
      height =
        0.62 * Math.sin(x * 1.3 - time * 1.7) +
        0.24 * Math.cos(z * 1.8 + x * 0.68 - time) +
        0.12 * Math.sin(z * 3 - time);
  }
  // 극단적인 수치의 오버플로가 canvas 좌표로 전파되지 않게 한다.
  return Number.isFinite(height) ? height : 0;
}
