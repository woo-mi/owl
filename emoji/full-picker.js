(() => {
  'use strict';
  const storageKey = 'owl-emoji-pins-v1';
  const panels = new Set();
  let pins = [];
  let dataPromise;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) pins = saved.filter(emoji => emoji && typeof emoji.native === 'string' &&
      emoji.native.length < 32 && typeof emoji.name === 'string' && emoji.name.length < 160 &&
      typeof emoji.unified === 'string').slice(0, 24);
  } catch { /* Pinning still works for this visit when storage is unavailable. */ }

  const loadData = () => dataPromise ||= fetch('vendor/emoji-data-15.json').then(response => {
    if (!response.ok) throw new Error('Emoji data could not be loaded');
    return response.json();
  }).catch(error => { dataPromise = null; throw error; });

  const shadowStyles = `
    :host { width: 100%; height: 100%; min-height: 0; --border-radius: 0; --shadow: none;
      --font-family: Inter, system-ui, sans-serif; --font-size: 14px;
      --rgb-color: 48,48,48; --rgb-accent: 26,150,254; --color-border: #f1f2f4; }
    #root { --padding: 12px; --sidebar-width: 8px; }
    #root > .padding-lr { padding: 0 12px; border-bottom: 1px solid #ececec; }
    #root > .padding-lr .spacer { display: none; }
    .search { height: 46px; display: flex; align-items: center; }
    .search input[type="search"] { height: 46px; padding-left: 24px; border: 0; border-radius: 0;
      box-shadow: none !important; background: #fff; outline: none; font-size: 14px; }
    .search input[type="search"]:focus { box-shadow: inset 0 -2px #1a96fe !important; }
    .search .icon.loupe { left: 0; opacity: .55; }
    .scroll { padding-top: 8px; scrollbar-width: thin; }
    .category > .sticky { padding: 6px 2px; color: #808080; font-size: 13px; font-weight: 400; }
    button[aria-posinset] { font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif; }
    button[aria-posinset]:focus-visible { outline: 2px solid #1a96fe; outline-offset: -2px; border-radius: 10px; }
    button[aria-posinset] .background { background: #f1f2f4; }
    button[data-owl-pinned]::after { content: ''; position: absolute; right: 4px; top: 4px;
      width: 4px; height: 4px; border-radius: 50%; background: #1a96fe; }
  `;

  window.createOwlEmojiLibrary = ({ onSelect, onStatus, onResize }) => {
    const panel = document.createElement('div');
    panel.className = 'emoji-library';
    const pinned = document.createElement('div');
    pinned.className = 'emoji-library-pinned';
    pinned.hidden = true;
    const mount = document.createElement('div');
    mount.className = 'emoji-library-mount';
    const loading = document.createElement('p');
    loading.className = 'emoji-library-loading';
    loading.setAttribute('role', 'status');
    loading.textContent = 'Loading emojis…';
    mount.append(loading);
    const footer = document.createElement('div');
    footer.className = 'emoji-library-footer';
    const preview = document.createElement('span');
    preview.className = 'emoji-library-preview';
    const glyph = document.createElement('span');
    glyph.className = 'emoji-library-glyph';
    glyph.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.className = 'emoji-library-name';
    const pinButton = document.createElement('button');
    pinButton.type = 'button';
    pinButton.className = 'emoji-library-pin';
    preview.append(glyph, name);
    footer.append(preview, pinButton);
    panel.append(pinned, mount, footer);
    let current = { id: 'grinning', name: 'Grinning face', native: '😀', unified: '1F600' };
    let picker;
    let nativeLookup;
    let ready;
    let observer;

    const showPreview = emoji => {
      if (!emoji) return;
      current = emoji;
      glyph.textContent = emoji.native;
      name.textContent = emoji.name;
      name.title = emoji.name;
      const isPinned = pins.some(pin => pin.native === emoji.native);
      pinButton.textContent = isPinned ? 'Unpin' : 'Right-click to pin';
      pinButton.setAttribute('aria-label', `${isPinned ? 'Unpin' : 'Pin'} ${emoji.name}`);
      pinButton.setAttribute('aria-pressed', String(isPinned));
    };
    const togglePin = emoji => {
      const exists = pins.some(pin => pin.native === emoji.native);
      if (!exists && pins.length === 24) return onStatus('You can pin up to 24 emojis. Unpin one to add another.');
      pins = exists ? pins.filter(pin => pin.native !== emoji.native) : [...pins, emoji];
      try { localStorage.setItem(storageKey, JSON.stringify(pins)); } catch { /* Keep session pins. */ }
      panels.forEach(update => update());
      onStatus(`${emoji.name} ${exists ? 'unpinned' : 'pinned'}`);
    };
    const updatePinMarkers = () => {
      if (picker) for (const button of picker.shadowRoot.querySelectorAll('button[aria-posinset]')) {
        button.toggleAttribute('data-owl-pinned', pins.some(pin => pin.native === button.getAttribute('aria-label')));
      }
    };
    const updatePins = () => {
      pinned.replaceChildren();
      pinned.hidden = !pins.length;
      if (pins.length) {
        const label = document.createElement('p');
        label.textContent = 'Pinned';
        const row = document.createElement('div');
        row.className = 'emoji-library-pinned-grid';
        pins.forEach(emoji => {
          const choice = document.createElement('button');
          choice.type = 'button';
          choice.className = 'emoji-library-pinned-option';
          choice.textContent = emoji.native;
          choice.setAttribute('aria-label', emoji.name);
          choice.addEventListener('click', () => onSelect(emoji));
          choice.addEventListener('pointerenter', () => showPreview(emoji));
          choice.addEventListener('focus', () => showPreview(emoji));
          choice.addEventListener('contextmenu', event => { event.preventDefault(); togglePin(emoji); });
          row.append(choice);
        });
        pinned.append(label, row);
      }
      updatePinMarkers();
      showPreview(current);
      onResize();
    };
    panels.add(updatePins);
    pinButton.addEventListener('click', () => togglePin(current));
    const emojiFromEvent = event => {
      const button = event.composedPath().find(node => node instanceof HTMLButtonElement && node.hasAttribute('aria-posinset'));
      return button && nativeLookup?.get(button.getAttribute('aria-label'));
    };
    panel.addEventListener('pointerover', event => showPreview(emojiFromEvent(event)));
    panel.addEventListener('focusin', event => showPreview(emojiFromEvent(event)));
    panel.addEventListener('contextmenu', event => {
      const emoji = emojiFromEvent(event);
      if (emoji) { event.preventDefault(); togglePin(emoji); }
    });

    const initialize = async () => {
      const data = await loadData();
      nativeLookup = new Map(Object.entries(data.emojis).flatMap(([id, emoji]) =>
        emoji.skins.map(skin => [skin.native, { id, name: emoji.name, native: skin.native, unified: skin.unified }])));
      if (!window.EmojiMart) throw new Error('Emoji library could not be loaded');
      picker = new EmojiMart.Picker({
        data, set: 'native', emojiVersion: 15, theme: 'light', autoFocus: false,
        perLine: 8, dynamicWidth: true, emojiSize: 24, emojiButtonSize: 40, emojiButtonRadius: '10px',
        emojiButtonColors: ['#f1f2f4'], navPosition: 'none', previewPosition: 'none',
        searchPosition: 'sticky', skinTonePosition: 'none', maxFrequentRows: 0,
        categories: ['people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols', 'flags'],
        i18n: { search: 'Search emoji', categories: { people: 'Smileys & emotion' } },
        onEmojiSelect: emoji => onSelect(emoji),
      });
      picker.setAttribute('aria-label', 'Search and browse emojis');
      const style = document.createElement('style');
      style.textContent = shadowStyles;
      picker.shadowRoot.append(style);
      await new Promise(resolve => {
        const inspect = () => {
          const search = picker.shadowRoot.querySelector('input[type="search"]');
          if (!search) return;
          search.setAttribute('aria-label', 'Search emoji');
          const selected = picker.shadowRoot.querySelector('button[aria-posinset][aria-selected="true"]');
          if (selected) showPreview(nativeLookup.get(selected.getAttribute('aria-label')));
          updatePinMarkers();
          resolve();
        };
        observer = new MutationObserver(inspect);
        observer.observe(picker.shadowRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
        mount.replaceChildren(picker);
        inspect();
      });
      updatePins();
    };
    showPreview(current);
    return {
      element: panel,
      async open() {
        try {
          if (!ready) ready = initialize();
          await ready;
          if (panel.closest('[hidden]')) return;
          picker.shadowRoot.querySelector('input[type="search"]')?.focus({ preventScroll: true });
          onResize();
        } catch {
          ready = null;
          observer?.disconnect();
          const error = document.createElement('p');
          error.className = 'emoji-library-loading';
          error.textContent = 'Could not load emojis.';
          const retry = document.createElement('button');
          retry.type = 'button';
          retry.textContent = 'Try again';
          retry.addEventListener('click', () => this.open());
          error.append(retry);
          mount.replaceChildren(error);
          onStatus('Could not load emojis. Try again.');
        }
      },
    };
  };
})();
