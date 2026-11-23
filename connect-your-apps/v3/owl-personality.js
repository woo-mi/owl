(() => {
  'use strict';
  const settings = {slack:false, email:false, length:'short', personality:'direct'};
  const identity = {name:"Ayush's Owl", studio:null, color:'#FA70AB'};
  const examples = {
    direct: {
      short:'Tell me what you want to work on. I’ll help you plan the next step.',
      standard:'Tell me what you want to work on. I’ll help you break it down, choose a priority, and plan the next step.',
      detailed:'Tell me what you want to work on. I’ll help you define the goal, break the work into clear steps, and identify what you need. Then we’ll choose the next action.'
    },
    friendly: {
      short:'What would you like to work on? I’m happy to help you find the next step.',
      standard:'What would you like to work on? We can break it down together and make a clear plan for your next step.',
      detailed:'Tell me what you’d like to work on. We’ll look at your goal, break it into manageable steps, and choose a good place to start. I’ll help you keep the plan clear along the way.'
    }
  };
  let host;
  const snapshot = () => ({...settings});
  const choices = (key, items) => items.map(([value,label]) => `<label class="personality-radio"><input type="radio" name="owl-personality-${key}" value="${value}" data-personality-setting="${key}"><span>${label}</span></label>`).join('');
  const deliveryRow = (key, label) => `<div class="personality-delivery-row">
    <div class="personality-delivery-copy"><p class="personality-field-label" id="personality-${key}-label">${label}</p><p class="personality-secondary">e.g. DM to @ayush</p></div>
    <button class="personality-switch" type="button" role="switch" aria-checked="false" aria-labelledby="personality-${key}-label" data-personality-delivery="${key}"><span class="personality-switch-track" aria-hidden="true"><span></span></span></button>
  </div>`;

  function build() {
    host = document.getElementById('personality-view');
    if (!host) return false;
    host.setAttribute('aria-labelledby', 'personality-title');
    host.innerHTML = `<header class="heading">
      <h1 id="personality-title" tabindex="-1">Make your Owl</h1>
      <p>Name it, connect your apps, and choose what it can help with.</p>
    </header>
    <div class="owl-personality-identity">
      <span id="personality-name-pill" class="owl-personality-name-pill"></span>
      <div id="personality-owl-preview" class="owl-personality-preview" role="img" aria-label="Your Owl preview"></div>
    </div>
    <div class="owl-personality-settings">
      <section class="personality-notify" aria-labelledby="personality-notify-title">
        <h2 id="personality-notify-title" class="personality-section-title">Notify</h2>
        <div class="personality-notify-copy"><p class="personality-field-label">Where should I notify you?</p><p class="personality-secondary">Only important updates</p></div>
      </section>
      <section class="personality-delivery" aria-labelledby="personality-delivery-title">
        <h2 id="personality-delivery-title" class="personality-section-title">Delivery</h2>
        ${deliveryRow('slack','Slack')}${deliveryRow('email','Email')}
      </section>
      <section class="personality-replies" aria-labelledby="personality-replies-title">
        <h2 id="personality-replies-title" class="personality-section-title">Reply style</h2>
        <fieldset class="personality-choice-group"><legend class="sr-only">Length</legend>
          <p class="personality-field-label" aria-hidden="true">Length</p>
          <div class="personality-radio-options">${choices('length',[['short','Short'],['standard','Standard'],['detailed','Detailed']])}</div>
        </fieldset>
        <fieldset class="personality-choice-group"><legend class="sr-only">Personality</legend>
          <p class="personality-field-label" aria-hidden="true">Personality</p>
          <div class="personality-radio-options">${choices('personality',[['direct','Direct'],['friendly','Friendly']])}</div>
        </fieldset>
        <div class="personality-example"><p class="personality-example-label">Example reply</p><p id="personality-example-copy" aria-live="polite" aria-atomic="true"></p></div>
      </section>
    </div>
    <div class="footer-spacer"></div>
    <footer class="flow-footer personality-footer">
      <button id="personality-skip" class="footer-action secondary" type="button">Skip for now</button>
      <ol class="progress" aria-label="Setup progress: step 3 of 3"><li aria-label="Step 1 completed"></li><li aria-label="Step 2 completed"></li><li class="is-current" aria-current="step" aria-label="Step 3: Owl preferences"></li></ol>
      <button id="personality-continue" class="footer-action primary" type="button">Continue</button>
    </footer>`;
    host.addEventListener('click', event => {
      const toggle = event.target.closest('[data-personality-delivery]');
      if (toggle) {
        const key = toggle.dataset.personalityDelivery;
        settings[key] = !settings[key];
        toggle.setAttribute('aria-checked', String(settings[key]));
      }
      const action = event.target.closest('#personality-continue, #personality-skip');
      if (action) window.dispatchEvent(new CustomEvent(action.id === 'personality-continue' ? 'owl-personality:save' : 'owl-personality:skip', {detail:snapshot()}));
    });
    host.addEventListener('change', event => {
      const input = event.target.closest('[data-personality-setting]');
      if (!input?.checked) return;
      settings[input.dataset.personalitySetting] = input.value;
      renderExample();
    });
    return true;
  }
  function renderExample() {
    host.querySelector('#personality-example-copy').textContent = examples[settings.personality][settings.length];
  }
  function open({name, studio, color} = {}) {
    if (!host?.isConnected && !build()) return;
    if (typeof name === 'string' && name.trim()) identity.name = name.trim();
    if (studio) identity.studio = window.OwlStudioArtwork.normalize(studio);
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) identity.color = color;
    host.querySelector('#personality-name-pill').textContent = identity.name;
    const preview = host.querySelector('#personality-owl-preview');
    preview.innerHTML = window.OwlStudioArtwork.render(identity.studio || window.OwlStudioArtwork.defaults, identity.color);
    preview.setAttribute('aria-label', `${identity.name} preview`);
    host.querySelectorAll('[data-personality-delivery]').forEach(button => button.setAttribute('aria-checked', String(settings[button.dataset.personalityDelivery])));
    host.querySelectorAll('[data-personality-setting]').forEach(input => { input.checked = settings[input.dataset.personalitySetting] === input.value; });
    renderExample();
  }
  window.OwlPersonality = Object.freeze({open, snapshot});
})();
