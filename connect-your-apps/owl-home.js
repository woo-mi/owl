(() => {
  'use strict';

  let host;
  let owlName = "Ayush's Owl";

  function build() {
    host = document.getElementById('home-view');
    if (!host) return false;
    host.innerHTML = `<img class="owl-home-image" src="assets/owl-soft-preview.png" alt="Soft pink Owl" width="600" height="600" draggable="false">
      <h1 id="home-title" tabindex="-1"></h1>
      <a class="owl-home-chat" href="?step=chat&amp;chatVersion=live">Start chat</a>`;
    host.querySelector('.owl-home-chat').addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('owl-home:start-chat'));
    });
    return true;
  }

  function open({name} = {}) {
    if (!host?.isConnected && !build()) return;
    if (typeof name === 'string' && name.trim()) owlName = name.trim();
    host.querySelector('#home-title').textContent = owlName;
    const chatUrl = new URL(location.href);
    chatUrl.searchParams.set('step', 'chat');
    chatUrl.searchParams.set('chatVersion', 'live');
    host.querySelector('.owl-home-chat').href = chatUrl.pathname + chatUrl.search + chatUrl.hash;
  }

  window.OwlHome = Object.freeze({open});
})();
