(() => {
  'use strict';
  const byId = id => document.querySelector(`[data-pencil-id="${id}"]`);
  const screen = byId('tWCyO');
  screen.setAttribute('role', 'main');
  screen.setAttribute('aria-label', 'Owl emoji reactions — 1 default');
  byId('nWGqT').setAttribute('role', 'navigation');
  byId('nWGqT').setAttribute('aria-label', 'Main navigation');
  document.querySelectorAll('svg').forEach(svg => svg.setAttribute('aria-hidden', 'true'));
  for (const [id, label] of [
    ['yvOcu', 'Thumbs-up reaction'],
    ['jaw62', 'Eyes reaction'],
    ['Y03sUD', 'Check reaction'],
    ['M2zkA', 'Heart reaction'],
  ]) {
    const badge = byId(id);
    badge.setAttribute('role', 'img');
    badge.setAttribute('aria-label', label);
  }
  const fitPreview = () => screen.style.setProperty('--preview-scale', Math.min(1, window.innerWidth / 1440));
  fitPreview();
  window.addEventListener('resize', fitPreview);
})();
