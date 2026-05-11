// Shared helpers for responsive test suites.

export const VIEWPORTS = [
  { name: '320x568_iPhoneSE',   width: 320, height: 568 },
  { name: '360x640_AndroidS',   width: 360, height: 640 },
  { name: '390x844_iPhone14',   width: 390, height: 844 },
  { name: '414x896_iPhonePM',   width: 414, height: 896 },
  { name: '768x1024_iPad',      width: 768, height: 1024 },
  { name: '1280x800_Laptop',    width: 1280, height: 800 },
  { name: '1920x1080_Desktop',  width: 1920, height: 1080 },
];

// Find the deep iframe that hosts the React app. GAS triple-wraps it,
// the innermost frame URL ends in /blank. Match by body content.
export async function getAppFrame(page, expectText = /新規入会|お申込み|研修申込|マイページ|ダッシュボード|管理|会員|ログイン|loginId/i) {
  await page.waitForLoadState('domcontentloaded');
  for (let i = 0; i < 100; i++) {
    await page.waitForTimeout(500);
    for (const f of page.frames()) {
      try {
        const info = await f.evaluate(() => {
          const t = (document.body && document.body.innerText || '');
          return { len: t.length, txt: t.slice(0, 200) };
        });
        if (info.len > 20 && expectText.test(info.txt)) return f;
      } catch { /* mid-attach */ }
    }
  }
  throw new Error('App frame did not appear within 50s');
}

// Returns metrics + lists of failing tap targets (after filtering known
// false-positive WCAG-conformant patterns).
export async function collectMetrics(frame, viewportWidth) {
  return await frame.evaluate((vw) => {
    const doc = document.documentElement;
    const horizontalOverflow = doc.scrollWidth - doc.clientWidth;
    const interactiveSel = 'a[href], button, [role="button"], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
    const all = Array.from(document.querySelectorAll(interactiveSel));
    const visible = all.filter((el) => {
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    });
    const list = visible.map((el) => {
      const r = el.getBoundingClientRect();
      // SECRETS GUARD (AGENTS.md §0): never capture el.value — input contents may
      // contain credentials/PII. For inputs/textarea/selects, expose only a label
      // derived from non-value attributes.
      const tag = el.tagName.toLowerCase();
      const isInputLike = tag === 'input' || tag === 'textarea' || tag === 'select';
      const label = isInputLike
        ? (el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('name') || `<${tag}>`)
        : (el.innerText || el.getAttribute('aria-label') || '');
      return {
        tag,
        type: el.type || '',
        text: String(label).trim().slice(0, 60),
        w: Math.round(r.width), h: Math.round(r.height),
        isSrOnly: !!(el.className && typeof el.className === 'string' && /\bsr-only\b/.test(el.className)),
        wrappedInLabel: !!el.closest('label'),
      };
    });
    // Exclude WCAG-conformant patterns:
    //   - sr-only skip links (1x1, becomes visible on focus)
    //   - checkboxes/radios wrapped in a <label> (label is the hit area)
    const real = list.filter((t) => {
      if (t.isSrOnly) return false;
      if ((t.type === 'checkbox' || t.type === 'radio') && t.wrappedInLabel) return false;
      return true;
    });
    const below24 = real.filter((t) => t.w < 24 || t.h < 24);
    const below44 = real.filter((t) => t.w < 44 || t.h < 44);
    // Element overflowing viewport AND not inside an overflow-scrollable ancestor
    // (tables inside overflow-x-auto wrappers are intentional / acceptable).
    const hasScrollableAncestor = (node) => {
      let cur = node.parentElement;
      while (cur && cur !== document.body) {
        const cs = window.getComputedStyle(cur);
        if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflow === 'auto' || cs.overflow === 'scroll') return true;
        cur = cur.parentElement;
      }
      return false;
    };
    const overflowing = Array.from(document.body.querySelectorAll('*'))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.right > vw + 1 && r.width > 0 && r.height > 0)
      .filter(({ el }) => !hasScrollableAncestor(el))
      .slice(0, 10)
      .map(({ el, r }) => ({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '',
        right: Math.round(r.right), width: Math.round(r.width),
      }));
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      horizontalOverflow,
      hasHorizontalScroll: horizontalOverflow > 1,
      total: list.length,
      excluded: list.length - real.length,
      below24,
      below44,
      overflowing,
    };
  }, viewportWidth);
}

export function passCriteria(m) {
  const fails = [];
  if (!m) return { pass: false, fails: ['load-error'] };
  if (m.hasHorizontalScroll) fails.push(`C1 横スクロール+${m.horizontalOverflow}px`);
  if (m.below24.length > 0) fails.push(`C2 24px未満 ${m.below24.length}件`);
  if (m.below44.length > 0) fails.push(`C3 44px未満 ${m.below44.length}件`);
  if (m.overflowing.length > 0) fails.push(`C7 overflow ${m.overflowing.length}件`);
  return { pass: fails.length === 0, fails };
}
