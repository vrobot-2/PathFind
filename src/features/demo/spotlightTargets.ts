/**
 * Best-effort "what are we talking about" target resolution for the demo
 * spotlight. Keeps DOM knowledge in one place so DemoMode stays about timing.
 */
function isVisible(el: HTMLElement | null): el is HTMLElement {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function climb(
  start: HTMLElement | null,
  test: (el: HTMLElement) => boolean,
  maxLevels = 8,
): HTMLElement | null {
  let node: HTMLElement | null = start;
  for (let level = 0; node && level <= maxLevels; level += 1) {
    if (test(node)) return node;
    node = node.parentElement;
  }
  return null;
}

function leafByText(selector: string, needle: string): HTMLElement | null {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return (
    nodes.find(
      (el) =>
        el.textContent?.toLowerCase().includes(needle.toLowerCase()) &&
        (el.children.length === 0 || el.tagName === "P" || el.tagName === "H2") &&
        isVisible(el),
    ) ?? null
  );
}

function isRoundedCard(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return (
    el.className.toString().includes("rounded-") &&
    rect.width > 280 &&
    rect.height > 90
  );
}

/**
 * 0-based step index -> element to cut out.
 * Steps 5–7 (map, walk, report) intentionally return null so the map stays clean.
 */
export function resolveSpotlightTarget(stepIndex: number): HTMLElement | null {
  let target: HTMLElement | null = null;

  switch (stepIndex) {
    // 1 — hero headline
    case 0:
      target = document.querySelector<HTMLElement>("h1");
      return isVisible(target) ? target : null;

    // 2 — park accessibility card ("step-free" copy, rounded card ancestor)
    case 1: {
      const scoreCard = document.querySelector<HTMLElement>(
        'section[aria-labelledby="park-access-heading"]',
      );
      if (isVisible(scoreCard)) return scoreCard;

      const leaves = Array.from(document.querySelectorAll<HTMLElement>("p, span, h2")).filter(
        (el) =>
          el.textContent?.toLowerCase().includes("step-free") &&
          (el.children.length === 0 || el.tagName === "P" || el.tagName === "H2") &&
          isVisible(el),
      );
      for (const leaf of leaves) {
        const card = climb(leaf, isRoundedCard, 6);
        if (card) return card;
      }
      return null;
    }

    // 3 — QR code, framed by its link
    case 2: {
      const img = document.querySelector<HTMLElement>('img[src="/qr-pathfind.svg"]');
      target = img?.closest<HTMLElement>("a") ?? img;
      return isVisible(target) ? target : null;
    }

    // 4 — the profile selector (the Wheelchair option, two levels up)
    case 3: {
      const button = Array.from(document.querySelectorAll<HTMLElement>("button")).find(
        (el) => el.textContent?.includes("Wheelchair") && isVisible(el),
      );
      target = button?.parentElement?.parentElement ?? null;
      if (target && target.getBoundingClientRect().width < 280) {
        target = climb(target, isRoundedCard, 4) ?? target;
      }
      return isVisible(target) ? target : null;
    }

    // 8 — admin KPI row
    case 7: {
      const leaf = leafByText("p, span", "Active visitors today");
      target = climb(
        leaf,
        (el) =>
          el.className.toString().includes("grid") &&
          el.getBoundingClientRect().width > 280,
        8,
      );
      return isVisible(target) ? target : null;
    }

    // 9 — report queue list
    case 8: {
      const heading = Array.from(document.querySelectorAll<HTMLElement>("h1")).find(
        (el) => el.textContent?.toLowerCase().includes("report queue"),
      );
      const main = heading?.closest<HTMLElement>("main") ?? null;
      target =
        main?.querySelector<HTMLElement>("section.min-w-0") ??
        main?.querySelector<HTMLElement>("section") ??
        null;
      return isVisible(target) ? target : null;
    }

    // map / walk / hazard-report steps: clean map, no dim
    default:
      return null;
  }
}
