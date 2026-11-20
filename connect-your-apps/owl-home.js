(() => {
  'use strict';

  let host;
  let owlName = "Ayush's Owl";

  function build() {
    host = document.getElementById('home-view');
    if (!host) return false;
    host.innerHTML = `<img class="owl-home-image" src="assets/owl-soft-preview.png" alt="Soft pink Owl" width="600" height="600" draggable="false">
      <h1 id="home-title" tabindex="-1"></h1>
      <a class="owl-home-chat" href="../reply-ux-pattern/">Start chat</a>`;
    return true;
  }

  function open({name} = {}) {
    if (!host?.isConnected && !build()) return;
    if (typeof name === 'string' && name.trim()) owlName = name.trim();
    host.querySelector('#home-title').textContent = owlName;
  }

  window.OwlHome = Object.freeze({open});
})();
