/* MVP Animated's iMessage pacing, adapted to the interactive FTUX conversation. */
(() => {
  'use strict';
  const TIMING = Object.freeze({first:900, hold:700, typingMin:1300, typingMax:1700,
    character:1.2, card:1000, entrance:360, reactionDelay:850, reactionEntrance:650,
    reactionHold:1500, reply:2000});

  function create({messages, scroll, motion, onReveal, scrollToNode}) {
    let sequence;
    let timer;
    let pending;
    let follow = true;
    let lastTop = scroll.scrollTop;
    const queue = [];
    const animations = new Set();
    const typing = document.createElement('div');
    typing.className = 'ftux-typing';
    typing.setAttribute('role', 'status');
    typing.setAttribute('aria-label', 'Owl is typing');
    typing.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';

    function schedule(run, delay) {
      clearTimeout(timer);
      pending = {run, delay};
      if (document.hidden) return;
      timer = setTimeout(() => { pending = undefined; run(); }, delay);
    }
    function animate(node, frames, options) {
      if (motion.matches) return;
      const animation = node.animate(frames, options);
      animations.add(animation);
      animation.onfinish = () => animations.delete(animation);
    }
    function enter(node) {
      const origin = node.matches('.ftux-user-turn') ? 'bottom right' : 'bottom left';
      animate(node, [
        {opacity:0, transform:'translateY(14px) scale(.96)', transformOrigin:origin},
        {opacity:1, transform:'translateY(-1px) scale(1.005)', offset:.8, transformOrigin:origin},
        {opacity:1, transform:'translateY(0) scale(1)', transformOrigin:origin}
      ], {duration:TIMING.entrance, easing:'cubic-bezier(.22, 1, .36, 1)'});
    }
    function followNode(node) {
      if (follow) scrollToNode(node, {shouldFollow:() => follow});
    }
    function clear() {
      clearTimeout(timer);
      pending = undefined;
      typing.remove();
      animations.forEach(animation => animation.cancel());
      animations.clear();
      sequence = undefined;
      queue.length = 0;
      delete messages.dataset.ftuxPlayback;
      scroll.classList.remove('is-ftux-playback');
    }
    function finish() {
      const rest = [...(sequence?.nodes.slice(sequence.index) || []), ...queue.flatMap(item => item.nodes)];
      const reactions = [...(sequence?.reactions || []), ...rest.flatMap(node => [...node.querySelectorAll('.ftux-reaction')])];
      clear();
      rest.forEach(node => { node.hidden = false; onReveal(node); });
      reactions.forEach(node => { node.hidden = false; });
    }
    function complete() {
      const waiting = queue.splice(0);
      finish();
      if (waiting.length) {
        const first = waiting.shift();
        play(first.nodes, first.options);
        queue.push(...waiting);
      }
    }
    function next() {
      if (!sequence) return;
      if (sequence.index >= sequence.nodes.length) { complete(); return; }
      const node = sequence.nodes[sequence.index];
      if (node.matches('.ftux-bubble')) {
        node.before(typing);
        followNode(typing);
      }
      const delay = sequence.index === 0 ? sequence.firstDelay : node.matches('.ftux-bubble')
        ? Math.min(TIMING.typingMax, TIMING.typingMin + node.textContent.trim().length * TIMING.character)
        : TIMING.card;
      schedule(reveal, delay);
    }
    function reveal() {
      if (!sequence) return;
      const node = sequence.nodes[sequence.index++];
      typing.remove();
      node.hidden = false;
      enter(node);
      onReveal(node);
      followNode(node);
      const reactions = [...node.querySelectorAll('.ftux-reaction')];
      if (reactions.length) {
        schedule(() => {
          reactions.forEach(reaction => {
            reaction.hidden = false;
            animate(reaction, [
              {opacity:0, transform:'translateY(8px) scale(.22) rotate(-14deg)'},
              {opacity:1, transform:'translateY(-2px) scale(1.22) rotate(8deg)', offset:.46},
              {opacity:1, transform:'translateY(0) scale(.94) rotate(-4deg)', offset:.72},
              {opacity:1, transform:'translateY(0) scale(1) rotate(0deg)'}
            ], {duration:TIMING.reactionEntrance, easing:'cubic-bezier(.22, .7, .35, 1)'});
          });
          schedule(next, TIMING.reactionEntrance + TIMING.reactionHold);
        }, TIMING.reactionDelay);
      } else if (sequence.reply && sequence.index === 1) {
        const reply = sequence.nodes[sequence.index];
        if (reply) { reply.before(typing); followNode(typing); schedule(reveal, TIMING.reply); }
        else complete();
      } else schedule(next, TIMING.hold);
    }
    function play(nodes, options = {}) {
      nodes = Array.from(nodes);
      if (!nodes.length) return;
      const {immediateFirst = false, firstDelay = TIMING.first, reply = false,
        resetFollow = true, scrollOnReducedMotion = false, enqueue = false} = options;
      if (enqueue && sequence && !motion.matches) {
        nodes.forEach(node => { node.hidden = true; });
        queue.push({nodes, options});
        return;
      }
      finish();
      if (resetFollow) follow = true;
      lastTop = scroll.scrollTop;
      if (motion.matches) {
        nodes.forEach(node => { node.hidden = false; onReveal(node); });
        if (scrollOnReducedMotion) followNode(nodes.at(-1));
        return;
      }
      const reactions = nodes.flatMap(node => [...node.querySelectorAll('.ftux-reaction')]);
      sequence = {nodes, reactions, index:0, firstDelay, reply};
      nodes.forEach(node => { node.hidden = true; });
      reactions.forEach(node => { node.hidden = true; });
      messages.dataset.ftuxPlayback = 'playing';
      scroll.classList.add('is-ftux-playback');
      if (immediateFirst) reveal();
      else next();
    }
    function stopFollowing() {
      if (follow) scroll.scrollTo({top:scroll.scrollTop, behavior:'instant'});
      follow = false;
    }
    scroll.addEventListener('scroll', () => {
      const top = scroll.scrollTop;
      if (top < lastTop - 2) stopFollowing();
      else if (top > lastTop && scroll.scrollHeight - scroll.clientHeight - top < 4) follow = true;
      lastTop = top;
    }, {passive:true});
    scroll.addEventListener('wheel', event => { if (event.deltaY < 0) stopFollowing(); }, {passive:true});
    let touchY;
    scroll.addEventListener('touchstart', event => { touchY = event.touches[0]?.clientY; }, {passive:true});
    scroll.addEventListener('touchmove', event => {
      const y = event.touches[0]?.clientY;
      if (y > touchY + 2) stopFollowing();
      touchY = y;
    }, {passive:true});
    window.addEventListener('mvp-workspace-open', finish);
    motion.addEventListener('change', () => { if (motion.matches) finish(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearTimeout(timer);
        animations.forEach(animation => animation.pause());
      } else {
        animations.forEach(animation => animation.play());
        if (pending) schedule(pending.run, pending.delay);
      }
    });
    return Object.freeze({play, finish, cancel:clear, stopFollowing});
  }
  window.FTUXPlayback = Object.freeze({create});
})();
