(() => {
  'use strict';
  const find = name => document.querySelector(`[data-pencil-name="${name}"]`);
  const screen = find('owl affordance');
  const coach = find('Coach mark · Owls spotlight');
  const owlDestination = '../ftux/';

  // Preserve the exported design while giving its two actions native semantics.
  function action(node, tag, label) {
    const element = document.createElement(tag);
    for (const attribute of node.attributes) element.setAttribute(attribute.name, attribute.value);
    element.append(...node.childNodes);
    element.setAttribute('aria-label', label);
    if (tag === 'button') element.type = 'button';
    else element.href = owlDestination;
    node.replaceWith(element);
    return element;
  }

  const targets = [...document.querySelectorAll('[data-pencil-name="Owls navigation target"]')];
  // The Pen frame includes a highlighted overlay above the rail's original icon.
  // Keep one visible, focusable target and preserve the overlay's exact appearance.
  targets.slice(0, -1).forEach(target => target.remove());
  const owlLink = action(targets.at(-1), 'a', 'Open Owls');
  owlLink.title = 'Owls';
  action(find('Open Owls button'), 'a', 'Open Owls');
  const dismissButton = action(find('Not now button'), 'button', 'Not now');
  coach.setAttribute('role', 'region');
  coach.setAttribute('aria-label', 'Meet your Owl');
  find('Navigation rail').setAttribute('aria-label', 'Main navigation');

  function dismiss() {
    coach.hidden = true;
    screen.classList.add('coach-dismissed');
    owlLink.focus({ preventScroll: true });
  }
  dismissButton.addEventListener('click', dismiss);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !coach.hidden) dismiss();
  });
})();
