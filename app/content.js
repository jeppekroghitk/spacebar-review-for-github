(function () {
  'use strict';

  // The "Viewed" toggle on the PR "Files changed" tab.
  // GitHub's generated class names change between builds, so match the
  // toggle's ARIA attributes instead.
  const VIEWED_BTN =
    'button[aria-pressed][aria-label="Viewed"], button[aria-pressed][aria-label="Not Viewed"]';
  const REVIEW_BTN = 'button[class*="ReviewMenuButton"]';

  const allButtons = () => Array.from(document.querySelectorAll(VIEWED_BTN));
  const firstUnchecked = () =>
    allButtons().find((b) => b.getAttribute('aria-pressed') === 'false');

  const SCROLL_OFFSET_FROM_TOP = 200;

  function focusNext() {
    const btn = firstUnchecked();
    if (btn) {
      const top = btn.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_FROM_TOP;
      window.scrollTo({ top, behavior: 'smooth' });
      btn.focus({ preventScroll: true });
    }
    return btn;
  }

  // After a file is marked viewed it collapses, and on large PRs the next file
  // may only render after scrolling, so retry once if nothing is found yet.
  function advance() {
    requestAnimationFrame(() => {
      if (!focusNext()) setTimeout(focusNext, 250);
    });
  }

  const typingInField = (el) =>
    !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

  // Space -> mark the next unchecked "Viewed" box.
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' && e.key !== ' ') return;
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (typingInField(e.target)) return;

    const btn = firstUnchecked();
    if (!btn) {
      // Nothing left to mark viewed — open the "Submit review" menu instead.
      const review = document.querySelector(REVIEW_BTN);
      if (!review) return;
      e.preventDefault();
      review.click();
      return;
    }

    // If it's already focused, let the browser toggle it (avoids a double click).
    if (btn.contains(e.target)) return;

    e.preventDefault(); // stop the page from scrolling
    btn.click();        // GitHub marks viewed + collapses the file
  }, true);

  // Whenever a "Viewed" box flips off -> on (via Space OR mouse), go to the next file.
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      const t = m.target;
      if (!(t instanceof HTMLElement) || !t.matches(VIEWED_BTN)) continue;
      if (m.oldValue === 'false' && t.getAttribute('aria-pressed') === 'true') {
        advance();
        break;
      }
    }
  }).observe(document.body, {
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['aria-pressed'],
  });

})();
