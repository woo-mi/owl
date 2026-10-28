/* Customize your owl — Pen frame DJVFX (add horn). */
(() => {
  'use strict';
  const colors = [
    ['Black','#000000'], ['Brown','#A16C39'], ['Red','#FB2C3F'],
    ['Orange','#FE6A10'], ['Amber','#F69312'], ['Green','#13C16F'],
    ['Teal','#15B8A3'], ['Blue','#1E86FC'], ['Purple','#905AFA'],
    ['Pink','#FA70AB'], ['Gray','#959595']
  ];
  let dialog, draft, onSave, opener, openerKey;
  function restoreOpener() {
    const target = opener?.isConnected ? opener : document.querySelector(`[data-profile-customize="${openerKey}"]`);
    if (document.getElementById('fullscreen-workspace')?.open) target?.focus({preventScroll:true});
  }
  function close({restoreFocus = true} = {}) {
    if (!dialog?.open) return;
    dialog.close();
    onSave = null;
    if (restoreFocus) restoreOpener();
  }
  function updateArtwork() {
    dialog.querySelector('.owl-customizer-preview').innerHTML = window.OwlArtwork.render(draft.variant, draft.color);
    dialog.querySelectorAll('[data-owl-shape]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.owlShape === draft.variant));
      button.innerHTML = window.OwlArtwork.render(button.dataset.owlShape, draft.color);
    });
    dialog.querySelectorAll('[data-owl-color]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.owlColor === draft.color));
    });
  }
  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'owl-customizer';
    dialog.setAttribute('aria-labelledby', 'owl-customizer-title');
    const colorButton = ([name, color]) => `<button type="button" class="owl-customizer-color" data-owl-color="${color}" aria-label="${name}" aria-pressed="false" title="${name}"><span style="background:${color}"></span></button>`;
    dialog.innerHTML = `<form class="owl-customizer-form">
      <header class="owl-customizer-header"><h2 id="owl-customizer-title">Customize your owl</h2><button type="button" class="owl-customizer-close" aria-label="Close customization"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
      <div class="owl-customizer-body">
        <div class="owl-customizer-preview" aria-hidden="true"></div>
        <label class="owl-customizer-name-field"><span>Owl name</span><input name="owlName" maxlength="60" required autocomplete="off"></label>
        <fieldset class="owl-customizer-shapes"><legend>Choose an owl</legend><div class="owl-customizer-grid">${window.OwlArtwork.variants.map(({id,label}) => `<button type="button" class="owl-customizer-shape" data-owl-shape="${id}" aria-label="${label}" aria-pressed="false" title="${label}"></button>`).join('')}</div></fieldset>
        <fieldset class="owl-customizer-colors"><legend class="sr-only">Choose a color</legend><div class="owl-customizer-color-row">${colors.slice(0,6).map(colorButton).join('')}</div><div class="owl-customizer-color-row">${colors.slice(6).map(colorButton).join('')}</div></fieldset>
      </div>
      <footer class="owl-customizer-footer"><button type="button" class="owl-customizer-cancel">Cancel</button><button type="submit" class="owl-customizer-save">Save</button></footer>
    </form>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('click', event => {
      if (event.target.closest('.owl-customizer-close, .owl-customizer-cancel')) { close(); return; }
      const shape = event.target.closest('[data-owl-shape]');
      const color = event.target.closest('[data-owl-color]');
      if (shape) { draft.variant = shape.dataset.owlShape; updateArtwork(); }
      if (color) { draft.color = color.dataset.owlColor; updateArtwork(); }
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
      }
    });
    dialog.addEventListener('keydown', event => { if (event.key === 'Escape') event.stopPropagation(); });
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    const input = dialog.querySelector('input');
    input.addEventListener('input', () => input.setCustomValidity(''));
    dialog.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      const name = input.value.trim();
      if (!name) { input.setCustomValidity('Enter an owl name.'); input.reportValidity(); return; }
      const save = onSave;
      dialog.close();
      onSave = null;
      save?.({...draft, name});
      restoreOpener();
    });
  }
  function open({name, variant, color, trigger, save}) {
    if (document.body.dataset.prototypeView !== 'latest-oct-28') return;
    if (!dialog) build();
    if (dialog.open) return;
    opener = trigger || document.activeElement;
    openerKey = opener?.dataset.profileCustomize || 'avatar';
    draft = {variant:variant || window.OwlArtwork.variants[0].id, color:color || '#FA70AB'};
    onSave = save;
    const input = dialog.querySelector('input');
    input.value = name;
    input.setCustomValidity('');
    updateArtwork();
    dialog.querySelector('.owl-customizer-body').scrollTop = 0;
    dialog.showModal();
    dialog.querySelector('.owl-customizer-close').focus({preventScroll:true});
  }
  window.OwlCustomizer = Object.freeze({open,close});
})();
