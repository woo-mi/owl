/*
 * APPROVAL TRANSITION STORYBOARD
 *   0ms  Disable repeat submission; request details fade out.
 *  60ms  Card and conversation settle toward their selected-state heights.
 * 100ms  Request details are invisible.
 * 160ms  Selected summary fades in and rises 4px → 0px.
 * 340ms  Selected summary is fully visible.
 * 420ms  Card settles; restore natural layout and focus the selection.
 * Reduced motion skips directly to the selected screen.
 */
(() => {
  const TIMING = {
    detailsFadeEnd: 100,     // Original details disappear.
    cardCollapseStart: 60,   // Begin the card height transition.
    summaryRevealStart: 160, // Reveal the selected answer.
    summaryRevealEnd: 340,   // Finish the summary entrance.
    cardCollapseEnd: 420,    // Restore intrinsic height.
  };
  const CARD = { easing: 'cubic-bezier(.22, 1, .36, 1)' };
  const DETAILS = { exitOffset: -4, easing: 'ease-out' };
  const SUMMARY = { enterOffset: 4, easing: CARD.easing };

  const card = document.querySelector('#approval-card');
  const button = document.querySelector('#allow-once');
  const pending = card.querySelector('.request-pending');
  const conversation = document.querySelector('.conversation');
  const template = document.querySelector('#selected-approval-template');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let stage = 0;
  let selected;
  let animations = [];
  let scrollFrame;

  function setStage(next) {
    stage = next;
    card.dataset.stage = String(next);
  }

  function finish() {
    if (stage === 0 || stage === 3) return;
    setStage(3);
    cancelAnimationFrame(scrollFrame);
    animations.forEach(animation => animation.cancel());
    animations = [];
    pending.remove();
    selected.removeAttribute('aria-hidden');
    card.style.height = '';
    conversation.style.minHeight = '';
    card.removeAttribute('aria-busy');
    card.setAttribute('aria-labelledby', 'selected-request-title');
    card.setAttribute('aria-describedby', 'selected-answer');
    card.tabIndex = -1;
    card.focus({ preventScroll: true });
    window.removeEventListener('resize', finish);
    reducedMotion.removeEventListener('change', onMotionChange);
  }

  function onMotionChange() {
    if (reducedMotion.matches) finish();
  }

  function keepSelectionInView(startScroll, targetScroll) {
    if (startScroll === targetScroll) return;
    const startTime = performance.now();
    function step(now) {
      if (stage === 3) return;
      const progress = Math.min(1, (now - startTime) / TIMING.summaryRevealEnd);
      const eased = 1 - (1 - progress) ** 3;
      window.scrollTo(0, startScroll + (targetScroll - startScroll) * eased);
      if (progress < 1) scrollFrame = requestAnimationFrame(step);
    }
    scrollFrame = requestAnimationFrame(step);
  }

  button.addEventListener('click', async () => {
    if (stage !== 0) return;
    const startHeight = card.getBoundingClientRect().height;
    const conversationHeight = conversation.getBoundingClientRect().height;
    const minimumConversationHeight = parseFloat(getComputedStyle(conversation).minHeight);
    const documentHeight = document.documentElement.scrollHeight;
    const startScroll = window.scrollY;
    button.disabled = true;
    card.style.height = `${startHeight}px`;
    conversation.style.minHeight = `${conversationHeight}px`;
    setStage(1);
    card.setAttribute('aria-busy', 'true');
    pending.inert = true;
    selected = template.content.firstElementChild.cloneNode(true);
    selected.setAttribute('aria-hidden', 'true');
    card.append(selected);

    if (reducedMotion.matches || typeof card.animate !== 'function') {
      finish();
      return;
    }

    const style = getComputedStyle(card);
    const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const targetHeight = selected.getBoundingClientRect().height + border;
    const targetConversationHeight = Math.max(minimumConversationHeight, conversationHeight - (startHeight - targetHeight));
    const targetScroll = Math.min(startScroll, Math.max(0, documentHeight - (conversationHeight - targetConversationHeight) - window.innerHeight));
    window.addEventListener('resize', finish);
    reducedMotion.addEventListener('change', onMotionChange);
    setStage(2);
    animations = [
      pending.animate([
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: `translateY(${DETAILS.exitOffset}px)` },
      ], { duration: TIMING.detailsFadeEnd, easing: DETAILS.easing, fill: 'both' }),
      card.animate([{ height: `${startHeight}px` }, { height: `${targetHeight}px` }], {
        delay: TIMING.cardCollapseStart,
        duration: TIMING.cardCollapseEnd - TIMING.cardCollapseStart,
        easing: CARD.easing,
        fill: 'both',
      }),
      conversation.animate([{ minHeight: `${conversationHeight}px` }, { minHeight: `${targetConversationHeight}px` }], {
        delay: TIMING.cardCollapseStart,
        duration: TIMING.cardCollapseEnd - TIMING.cardCollapseStart,
        easing: CARD.easing,
        fill: 'both',
      }),
      selected.animate([
        { opacity: 0, transform: `translateY(${SUMMARY.enterOffset}px)` },
        { opacity: 1, transform: 'translateY(0)' },
      ], {
        delay: TIMING.summaryRevealStart,
        duration: TIMING.summaryRevealEnd - TIMING.summaryRevealStart,
        easing: SUMMARY.easing,
        fill: 'both',
      }),
    ];
    keepSelectionInView(startScroll, targetScroll);
    await Promise.allSettled(animations.map(animation => animation.finished));
    finish();
  });
})();
