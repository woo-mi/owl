(() => {
  'use strict';
  const find = name => document.querySelector(`[data-pencil-name="${name}"]`);
  const coach = find('Owl affordance1');
  const targets = [...document.querySelectorAll('[data-pencil-name="Owls navigation target"]')];
  const gotIt = find('Got it — outlined button');
  if (!coach || !gotIt || !targets.length) return;

  // Keep the exported Pen artwork while giving the actions native semantics.
  function action(node, tag, label) {
    const element = document.createElement(tag);
    for (const attribute of node.attributes) element.setAttribute(attribute.name, attribute.value);
    element.append(...node.childNodes);
    element.setAttribute('aria-label', label);
    if (tag === 'button') element.type = 'button';
    else element.href = '../ftux/';
    node.replaceWith(element);
    return element;
  }

  // The design includes a second Owl icon as a highlight above the rail.
  targets.slice(0, -1).forEach(target => target.remove());
  const owlLink = action(targets.at(-1), 'a', 'Open Owls');
  owlLink.title = 'Owls';
  const dismissButton = action(gotIt, 'button', 'Got it');
  const title = find('Organization move title');
  const description = find('Organization move explanation');
  title.id = 'owl-coach-title';
  description.id = 'owl-coach-description';
  coach.setAttribute('role', 'region');
  coach.setAttribute('aria-labelledby', title.id);
  coach.setAttribute('aria-describedby', description.id);
  find('Search home content').setAttribute('role', 'main');
  find('Navigation rail').setAttribute('role', 'navigation');
  find('Navigation rail').setAttribute('aria-label', 'Main navigation');
  document.querySelectorAll('svg').forEach(svg => svg.setAttribute('aria-hidden', 'true'));

  function dismiss() {
    coach.hidden = true;
    owlLink.focus({ preventScroll: true });
  }
  dismissButton.addEventListener('click', dismiss);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !coach.hidden) dismiss();
  });
})();
