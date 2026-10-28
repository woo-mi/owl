/* V2 customization: Pen frames 2d-1, 2d-2, 2d-3 and 2d-4. */
(() => {
  'use strict';
  const tabs = [
    {id:'heads',key:'head',label:'Heads',guidance:'Choose a head style.'},
    {id:'eyes',key:'eyes',label:'Eyes',guidance:'Choose an eye style.'},
    {id:'goggles',key:'goggles',label:'Goggle',guidance:'Choose a goggle style.'},
    {id:'horns',key:'horns',label:'Horn',guidance:'Choose a horn style.'}
  ];
  const colors = [
    ['Pink','#FA70AB'], ['Orchid','#DD6ADC'], ['Purple','#A25BFF'],
    ['Blue','#4678FF'], ['Sky','#02B1FF'], ['Teal','#03BB9F'],
    ['Lime','#B6D80D'], ['Yellow','#FFCC39'], ['Coral','#FF8066']
  ];
  let dialog, draft, currentTab, opener, openerKey, onSave;
  function restoreFocus() {
    const target = opener?.isConnected ? opener : document.querySelector(`[data-profile-customize="${openerKey}"]`);
    if (document.getElementById('fullscreen-workspace')?.open) target?.focus({preventScroll:true});
  }
  function close({restoreFocus: shouldRestore = true} = {}) {
    if (!dialog?.open) return;
    dialog.close();
    onSave = null;
    if (shouldRestore) restoreFocus();
  }
  function render() {
    const tab = tabs.find(item => item.id === currentTab);
    const art = window.OwlStudioArtwork;
    dialog.dataset.studioTab = currentTab;
    dialog.querySelectorAll('[data-studio-tab]').forEach(button => {
      const selected = button.dataset.studioTab === currentTab;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    dialog.querySelector('.owl-studio-guidance').textContent = tab.guidance;
    const choices = dialog.querySelector('.owl-studio-options');
    choices.setAttribute('aria-labelledby', `owl-studio-tab-${currentTab}`);
    choices.innerHTML = art.options[currentTab].map(({id,label}) => `<button type="button" class="owl-studio-option" data-studio-option="${id}" aria-pressed="${draft.studio[tab.key]===id}" aria-label="${label}"><span class="owl-studio-option-art" aria-hidden="true">${art.renderOption(currentTab,id,draft.color)}</span><span class="owl-studio-option-label">${label}</span></button>`).join('');
    dialog.querySelector('.owl-studio-palette').hidden = currentTab !== 'heads';
    dialog.querySelectorAll('[data-studio-color]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.studioColor === draft.color)));
    dialog.querySelector('.owl-studio-preview').innerHTML = art.render(draft.studio,draft.color);
    dialog.querySelector('.owl-studio-name').textContent = draft.name;
  }
  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'owl-studio';
    dialog.setAttribute('aria-labelledby','owl-studio-title');
    dialog.innerHTML = `<div class="owl-studio-editor">
      <div class="owl-studio-tabs" role="tablist" aria-label="Customize owl features">${tabs.map(tab=>`<button type="button" id="owl-studio-tab-${tab.id}" role="tab" data-studio-tab="${tab.id}" aria-controls="owl-studio-options" aria-selected="false" tabindex="-1">${tab.label}</button>`).join('')}</div>
      <h2 id="owl-studio-title">Customize your owl</h2>
      <p class="owl-studio-guidance" id="owl-studio-guidance"></p>
      <div class="owl-studio-options" id="owl-studio-options" role="tabpanel" aria-describedby="owl-studio-guidance"></div>
      <div class="owl-studio-palette" role="group" aria-label="Owl color">${colors.map(([label,color])=>`<button type="button" class="owl-studio-color" data-studio-color="${color}" aria-label="${label}" aria-pressed="false" title="${label}"><span style="background:${color}"></span></button>`).join('')}</div>
    </div>
    <aside class="owl-studio-preview-panel" aria-label="Owl preview"><h3 class="owl-studio-name"></h3><div class="owl-studio-preview" aria-hidden="true"></div><button type="button" class="owl-studio-save">Save</button></aside>
    <button type="button" class="owl-studio-close" aria-label="Close customization"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('click',event=>{
      if (event.target.closest('.owl-studio-close')) { close(); return; }
      const tab = event.target.closest('button[data-studio-tab]');
      if (tab) { currentTab=tab.dataset.studioTab; render(); return; }
      const option = event.target.closest('[data-studio-option]');
      if (option) {
        const id = option.dataset.studioOption;
        draft.studio[tabs.find(tab=>tab.id===currentTab).key] = id;
        render();
        dialog.querySelector(`[data-studio-option="${id}"]`).focus({preventScroll:true});
        return;
      }
      const color = event.target.closest('[data-studio-color]');
      if (color) { draft.color=color.dataset.studioColor; render(); return; }
      if (event.target.closest('.owl-studio-save')) {
        const save=onSave;
        dialog.close();
        onSave=null;
        save?.({name:draft.name,color:draft.color,studio:{...draft.studio},variant:null});
        restoreFocus();
        return;
      }
      if (event.target===dialog) {
        const rect=dialog.getBoundingClientRect();
        if (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom) close();
      }
    });
    dialog.addEventListener('keydown',event=>{
      if (event.key==='Escape') event.stopPropagation();
      const tab=event.target.closest('button[data-studio-tab]');
      if (!tab || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const index=tabs.findIndex(item=>item.id===currentTab);
      const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      currentTab=tabs[next].id;
      render();
      dialog.querySelector(`[data-studio-tab="${currentTab}"]`).focus({preventScroll:true});
    });
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  }
  function open({name,studio,color,trigger,save}) {
    if (document.body.dataset.prototypeView!=='latest-oct-28' || window.MVPVersions.getVariant()!=='v2') return;
    if (!dialog) build();
    if (dialog.open) return;
    opener=trigger||document.activeElement;
    openerKey=opener?.dataset.profileCustomize||'avatar';
    onSave=save;
    draft={name,color:color||'#FA70AB',studio:{...window.OwlStudioArtwork.defaults,...studio}};
    currentTab='heads';
    render();
    dialog.showModal();
    dialog.querySelector('.owl-studio-editor').scrollTop=0;
    dialog.querySelector('[data-studio-tab="heads"]').focus({preventScroll:true});
  }
  window.OwlStudio=Object.freeze({open,close});
})();
