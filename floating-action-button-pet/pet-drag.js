(() => {
  'use strict';

  const pet = document.querySelector('.pet-fab');
  if (!pet) return;

  const storageKey = 'owl:floating-action-button-pet:position:v1';
  const dragThreshold = 5;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let position = null;
  let drag = null;
  let suppressClick = false;

  function bounds() {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    const marginX = Math.min(12, Math.max(0, (width - pet.offsetWidth) / 2));
    const marginY = Math.min(12, Math.max(0, (height - pet.offsetHeight) / 2));
    return {
      minX: marginX,
      minY: marginY,
      maxX: Math.max(marginX, width - pet.offsetWidth - marginX),
      maxY: Math.max(marginY, height - pet.offsetHeight - marginY),
    };
  }

  function place(x, y) {
    const b = bounds();
    x = clamp(x, b.minX, b.maxX);
    y = clamp(y, b.minY, b.maxY);
    pet.style.left = `${x}px`;
    pet.style.top = `${y}px`;
    pet.style.right = 'auto';
    pet.style.bottom = 'auto';
    position = {
      x: (x - b.minX) / (b.maxX - b.minX || 1),
      y: (y - b.minY) / (b.maxY - b.minY || 1),
    };
  }

  function restore() {
    if (position) {
      const b = bounds();
      place(b.minX + position.x * (b.maxX - b.minX),
        b.minY + position.y * (b.maxY - b.minY));
    } else {
      ['left', 'top', 'right', 'bottom'].forEach(property => pet.style.removeProperty(property));
    }
  }

  function remember() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(position));
    } catch (_) {
      // Moving the pet still works when browser storage is unavailable.
    }
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      position = { x: clamp(saved.x, 0, 1), y: clamp(saved.y, 0, 1) };
      restore();
    }
  } catch (_) {
    // An absent or invalid saved position uses the design's default corner.
  }

  function move(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.clientX;
    const dy = event.clientY - drag.clientY;
    if (!drag.moved && Math.hypot(dx, dy) < dragThreshold) return;
    if (!drag.moved) {
      drag.moved = true;
      pet.classList.add('is-dragging');
      pet.focus({ preventScroll: true });
    }
    event.preventDefault();
    place(drag.left + dx, drag.top + dy);
  }

  function finish(cancelled) {
    if (!drag) return;
    const ended = drag;
    drag = null;
    suppressClick = ended.moved;
    pet.classList.remove('is-dragging');
    if (cancelled) {
      position = ended.previousPosition;
      restore();
    } else if (ended.moved) {
      remember();
    }
    if (pet.hasPointerCapture(ended.pointerId)) pet.releasePointerCapture(ended.pointerId);
  }

  pet.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || drag) return;
    suppressClick = false;
    const rect = pet.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      left: rect.left,
      top: rect.top,
      previousPosition: position && { ...position },
      moved: false,
    };
    pet.setPointerCapture(event.pointerId);
  });
  pet.addEventListener('pointermove', move);
  pet.addEventListener('pointerup', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    move(event);
    finish(false);
  });
  pet.addEventListener('pointercancel', event => {
    if (drag && event.pointerId === drag.pointerId) finish(true);
  });
  pet.addEventListener('lostpointercapture', event => {
    if (drag && event.pointerId === drag.pointerId) finish(true);
  });
  pet.addEventListener('dragstart', event => event.preventDefault());
  pet.addEventListener('click', event => {
    // A completed drag can synthesize a click; a fresh press or keyboard click can open Owls.
    if (suppressClick && event.detail !== 0) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }
  }, true);

  const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  pet.addEventListener('keydown', event => {
    const direction = directions[event.key];
    if (!direction || event.altKey || event.ctrlKey || event.metaKey || drag) return;
    event.preventDefault();
    const rect = pet.getBoundingClientRect();
    const step = event.shiftKey ? 40 : 10;
    place(rect.left + direction[0] * step, rect.top + direction[1] * step);
    remember();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drag) {
      event.preventDefault();
      finish(true);
    }
  });
  window.addEventListener('blur', () => finish(true));
  window.addEventListener('resize', () => {
    finish(true);
    restore();
  });
})();
