(() => {
  const dialog = document.querySelector('#data-connect-dialog');
  const picker = document.querySelector('#ui-version-picker');
  const menu = picker.querySelector('[role="menu"]');
  const reopen = document.querySelector('#open-data-connect');
  const result = document.querySelector('#data-connect-result');
  const title = document.querySelector('#data-connect-title');
  const pickerHome = document.createComment('Version selector home');
  picker.before(pickerHome);

  function close({ restoreFocus = true } = {}) {
    if (dialog.open) dialog.close();
    pickerHome.after(picker);
    document.body.classList.remove('data-dialog-open');
    if (restoreFocus) reopen.focus({ preventScroll: true });
    window.dispatchEvent(new Event('resize'));
  }

  function open() {
    if (dialog.open) return;
    dialog.append(picker);
    picker.classList.remove('is-docked');
    document.body.classList.add('data-dialog-open');
    dialog.showModal();
    title.focus({ preventScroll: true });
    window.dispatchEvent(new Event('resize'));
  }

  reopen.addEventListener('click', open);
  dialog.querySelectorAll('[data-close-data-connect]').forEach(button => {
    button.addEventListener('click', () => close());
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !dialog.open || !menu.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    close();
  }, true);
  document.querySelector('#continue-data-connect').addEventListener('click', () => {
    result.textContent = 'Continue to Google Calendar selected.';
    close();
  });
  window.addEventListener('ui-version-will-change', () => close({ restoreFocus: false }));
  window.addEventListener('ui-version-change', event => {
    if (event.detail.version === 'data-connect-modal') open();
  });
})();
