/* The for-dev feature interactions, arranged for the onboarding design. */
(() => {
  'use strict';
  const screen = document.querySelector('#appearance-view');
  const art = window.Owl3DArtwork;
  const optionArt = window.OwlStudioArtwork;
  const tabs = [
    {id:'heads',key:'head',label:'Heads',guidance:'Choose a head style.'},
    {id:'eyes',key:'eyes',label:'Eyes',guidance:'Choose an eye style.'},
    {id:'goggles',key:'goggles',label:'Goggle',guidance:'Choose a goggle style.'},
    {id:'horns',key:'horns',label:'Horn',guidance:'Choose a horn style.'}
  ];
  const colors = [
    ['Brown','#A16C39'],['Red','#FB2C3F'],
    ['Orange','#FE6A10'],['Amber','#F69312'],['Green','#13C16F'],
    ['Teal','#15B8A3'],['Blue','#1E86FC'],['Purple','#905AFA'],
    ['Pink','#FA70AB']
  ];
  const defaultColor = '#1E86FC';
  const nameButton = screen.querySelector('#appearance-edit-name');
  const nameInput = screen.querySelector('#appearance-name');
  const nameError = screen.querySelector('#appearance-name-error');
  let draft, original, currentTab = 'heads', editingName = false;
  const copy = value => ({name:value.name,color:value.color,studio:{...value.studio}});
  screen.querySelector('.owl-appearance-tabs').innerHTML = tabs.map(tab => `<button type="button" id="appearance-tab-${tab.id}" role="tab" data-appearance-tab="${tab.id}" aria-controls="appearance-options" aria-selected="false" tabindex="-1">${tab.label}</button>`).join('');
  const colorButton = ([label,color]) => `<button type="button" class="owl-appearance-color" data-appearance-color="${color}" aria-label="${label}" aria-pressed="false" title="${label}"><span style="background:${color}"></span></button>`;
  screen.querySelector('.owl-appearance-palette').innerHTML = [colors.slice(0,6),colors.slice(6)].map(row => `<div class="owl-appearance-color-row">${row.map(colorButton).join('')}</div>`).join('');

  function renderName() {
    nameButton.textContent = draft.name;
    nameButton.hidden = editingName;
    nameInput.hidden = !editingName;
  }
  function clearNameError() {
    nameInput.removeAttribute('aria-invalid');
    nameInput.removeAttribute('aria-describedby');
    nameError.hidden = true;
  }
  function finishName({cancel = false, focus = false} = {}) {
    if (!editingName) return true;
    const name = nameInput.value.trim();
    if (!cancel && !name) {
      nameInput.setAttribute('aria-invalid','true');
      nameInput.setAttribute('aria-describedby','appearance-name-error');
      nameError.hidden = false;
      if (focus) nameInput.focus({preventScroll:true});
      return false;
    }
    if (!cancel) draft.name = name;
    editingName = false;
    clearNameError();
    renderName();
    if (focus) nameButton.focus({preventScroll:true});
    return true;
  }
  function render() {
    const tab = tabs.find(item => item.id === currentTab);
    screen.dataset.appearanceTab = currentTab;
    screen.querySelectorAll('[data-appearance-tab]').forEach(button => {
      const selected = button.dataset.appearanceTab === currentTab;
      button.setAttribute('aria-selected',String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    screen.querySelector('#appearance-guidance').textContent = tab.guidance;
    const choices = screen.querySelector('.owl-appearance-options');
    choices.setAttribute('aria-labelledby',`appearance-tab-${currentTab}`);
    choices.innerHTML = art.options[currentTab].map(({id,label}) => `<button type="button" class="owl-appearance-option" data-appearance-option="${id}" aria-pressed="${draft.studio[tab.key]===id}" aria-label="${label}"><span class="owl-appearance-option-art" aria-hidden="true">${optionArt.renderOption(currentTab,id,draft.color)}</span><span class="owl-appearance-option-label">${label}</span></button>`).join('');
    screen.querySelector('.owl-appearance-palette').hidden = currentTab !== 'heads';
    screen.querySelectorAll('[data-appearance-color]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.appearanceColor === draft.color)));
    const preview = screen.querySelector('.owl-appearance-preview');
    preview.innerHTML = art.render(draft.studio,draft.color);
    const colorName = colors.find(([,color]) => color === draft.color)?.[0] || 'Blue';
    preview.setAttribute('aria-label',`${colorName} Owl: ${tabs.map(item => art.options[item.id].find(option => option.id === draft.studio[item.key]).label + ' ' + item.label.toLowerCase()).join(', ')}`);
    renderName();
    window.dispatchEvent(new CustomEvent('owl-appearance:change',{detail:copy(draft)}));
  }
  function open({name,studio,color} = {}) {
    draft = {name:name?.trim() || "Ayush's Owl",color:colors.some(([,value]) => value === color) ? color : defaultColor,studio:art.normalize(studio)};
    original = copy(draft);
    currentTab = 'heads';
    editingName = false;
    clearNameError();
    render();
  }
  screen.addEventListener('click',event => {
    if (event.target.closest('#appearance-edit-name')) {
      editingName = true;
      nameInput.value = draft.name;
      clearNameError();
      renderName();
      nameInput.focus({preventScroll:true});
      nameInput.select();
      return;
    }
    const tab = event.target.closest('button[data-appearance-tab]');
    if (tab) { currentTab = tab.dataset.appearanceTab;render();return; }
    const option = event.target.closest('[data-appearance-option]');
    if (option) {
      const id = option.dataset.appearanceOption;
      draft.studio[tabs.find(item => item.id === currentTab).key] = id;
      render();
      screen.querySelector(`[data-appearance-option="${id}"]`).focus({preventScroll:true});
      return;
    }
    const color = event.target.closest('[data-appearance-color]');
    if (color) { draft.color = color.dataset.appearanceColor;render();return; }
    if (event.target.closest('#appearance-continue')) {
      if (!finishName({focus:true})) return;
      window.dispatchEvent(new CustomEvent('owl-appearance:save',{detail:copy(draft)}));
    }
    if (event.target.closest('#appearance-skip')) {
      window.dispatchEvent(new CustomEvent('owl-appearance:save',{detail:copy(original)}));
    }
  });
  screen.addEventListener('keydown',event => {
    if (event.target === nameInput && !event.isComposing && ['Enter','Escape'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      finishName({cancel:event.key==='Escape',focus:true});
      return;
    }
    const tab = event.target.closest('button[data-appearance-tab]');
    if (!tab || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const index = tabs.findIndex(item => item.id === currentTab);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    currentTab = tabs[next].id;
    render();
    screen.querySelector(`[data-appearance-tab="${currentTab}"]`).focus({preventScroll:true});
  });
  nameInput.addEventListener('input',clearNameError);
  nameInput.addEventListener('blur',() => finishName());
  window.OwlAppearance = Object.freeze({open});
})();
