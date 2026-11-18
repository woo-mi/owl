/*
 * SELECTION TRANSITION STORYBOARD
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

  const conversation = document.querySelector('.conversation');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function createTransition(card, template, headingId, answerId, renderAnswer = (target, answer) => { target.textContent = answer; }) {
    const pending = card.querySelector('.request-pending');
    let stage = 0;
    let selected;
    let animations = [];
    let scrollFrame;

    function setStage(next) {
      stage = next;
      card.dataset.stage = String(next);
    }

    function finish(restoreFocus = true) {
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
      card.setAttribute('aria-labelledby', headingId);
      card.setAttribute('aria-describedby', answerId);
      card.tabIndex = -1;
      const focusStayedInCard = card.contains(document.activeElement) || document.activeElement === document.body;
      if (restoreFocus && focusStayedInCard && !card.closest('[hidden]')) card.focus({ preventScroll: true });
      window.removeEventListener('resize', onResize);
      reducedMotion.removeEventListener('change', onMotionChange);
    }

    function onResize() { finish(); }

    window.addEventListener('ui-version-will-change', () => finish(false));

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

    return async function selectAnswer(answer) {
      if (stage !== 0 || !answer || card.closest('[hidden]')) return;
      const startHeight = card.getBoundingClientRect().height;
      const conversationHeight = conversation.getBoundingClientRect().height;
      const minimumConversationHeight = parseFloat(getComputedStyle(conversation).minHeight);
      const documentHeight = document.documentElement.scrollHeight;
      const startScroll = window.scrollY;
      pending.querySelectorAll('button, input').forEach(control => { control.disabled = true; });
      card.style.height = `${startHeight}px`;
      conversation.style.minHeight = `${conversationHeight}px`;
      setStage(1);
      card.setAttribute('aria-busy', 'true');
      pending.inert = true;
      selected = template.content.firstElementChild.cloneNode(true);
      renderAnswer(selected.querySelector('[data-selected-answer]'), answer);
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
      window.addEventListener('resize', onResize);
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
    };
  }

  const approve = createTransition(
    document.querySelector('#approval-card'),
    document.querySelector('#selected-approval-template'),
    'selected-request-title', 'selected-answer'
  );
  document.querySelector('#allow-once').addEventListener('click', () => approve('Allow once'));

  const clarify = createTransition(
    document.querySelector('#clarification-card'),
    document.querySelector('#selected-clarification-template'),
    'selected-clarification-question', 'selected-clarification-answer'
  );
  const form = document.querySelector('#clarification-form');
  const custom = form.querySelector('#clarification-custom');
  const actions = form.querySelector('.clarification-actions');
  const submit = actions.querySelector('button');
  form.querySelectorAll('[data-answer]').forEach(option => {
    option.addEventListener('click', () => clarify(option.dataset.answer));
  });
  custom.addEventListener('input', () => {
    actions.hidden = !custom.value.trim();
    submit.disabled = actions.hidden;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    clarify(custom.value.trim());
  });

  const multiForm = document.querySelector('#multi-select-form');
  const choices = [...multiForm.querySelectorAll('[data-multi-choice]')];
  const multiCustom = multiForm.querySelector('#multi-custom');
  const customToggle = multiForm.querySelector('.multi-custom-toggle');
  const customRow = multiForm.querySelector('.multi-custom-row');
  const multiActions = multiForm.querySelector('.multi-actions');
  const multiSubmit = multiActions.querySelector('button');

  const selectMultiple = createTransition(
    document.querySelector('#multi-select-card'),
    document.querySelector('#selected-multi-template'),
    'selected-multi-question', 'selected-multi-answers',
    (target, answers) => {
      answers.forEach(answer => {
        const item = document.createElement('div');
        item.className = 'multi-selected-answer';
        const letter = document.createElement('span');
        letter.className = 'multi-letter';
        letter.textContent = answer.letter;
        const copy = document.createElement('div');
        copy.className = 'multi-selected-copy';
        const label = document.createElement('span');
        label.textContent = answer.label;
        copy.append(label);
        if (answer.custom) {
          const cue = document.createElement('span');
          cue.className = 'multi-custom-cue';
          cue.textContent = 'Custom answer';
          copy.append(cue);
        }
        item.append(letter, copy);
        target.append(item);
      });
    }
  );

  function selectedAnswers() {
    const answers = choices.filter(choice => choice.getAttribute('aria-pressed') === 'true')
      .map(choice => ({ letter: choice.dataset.multiChoice, label: choice.dataset.answer }));
    const customText = multiCustom.value.trim();
    if (customText && customToggle.getAttribute('aria-pressed') === 'true') {
      answers.push({ letter: 'E', label: customText, custom: true });
    }
    return answers;
  }

  function updateMultiForm() {
    customRow.classList.toggle('has-value', Boolean(multiCustom.value.trim()));
    multiActions.hidden = selectedAnswers().length === 0;
    multiSubmit.disabled = multiActions.hidden;
  }

  choices.forEach(choice => {
    choice.addEventListener('click', () => {
      choice.setAttribute('aria-pressed', String(choice.getAttribute('aria-pressed') !== 'true'));
      updateMultiForm();
    });
  });
  customToggle.addEventListener('click', () => {
    if (!multiCustom.value.trim()) {
      multiCustom.focus();
      return;
    }
    customToggle.setAttribute('aria-pressed', String(customToggle.getAttribute('aria-pressed') !== 'true'));
    updateMultiForm();
  });
  multiCustom.addEventListener('input', () => {
    customToggle.setAttribute('aria-pressed', String(Boolean(multiCustom.value.trim())));
    updateMultiForm();
  });
  multiForm.addEventListener('submit', event => {
    event.preventDefault();
    const answers = selectedAnswers();
    if (answers.length) selectMultiple(answers);
  });
})();
