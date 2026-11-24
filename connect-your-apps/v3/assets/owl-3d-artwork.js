/* Plush Owl customization. The default previews use the existing Soft Owl
 * PNGs directly. Alternate faces compose matching plush head layers with
 * the original Owl's eye, beak, feather, and fur textures.
 */
(() => {
  'use strict';
  const studio = window.OwlStudioArtwork;
  const defaultColor = '#1E86FC';
  const SOURCE = 'assets/owl-soft-blue.png';
  const HEADS = {
    round:{none:SOURCE,feathered:'assets/owl-soft-round-feathered-blue.png'},
    rounded:{none:'assets/owl-soft-rounded-blue.png',feathered:'assets/owl-soft-rounded-feathered-blue.png'},
    arch:{none:'assets/owl-soft-arch-blue.png',feathered:'assets/owl-soft-arch-feathered-blue.png'}
  };
  const COLORS = {
    '#A16C39':'hue-rotate(178.2deg) saturate(.506) brightness(.956)',
    '#FB2C3F':'hue-rotate(136.6deg) saturate(1.908) brightness(1.042)',
    '#FE6A10':'hue-rotate(166.6deg) saturate(.988) brightness(1.102)',
    '#F69312':'hue-rotate(-174.3deg) saturate(.886) brightness(1.304)',
    '#13C16F':'hue-rotate(-66.6deg) saturate(.872) brightness(1.172)',
    '#15B8A3':'hue-rotate(-47.1deg) saturate(.858) brightness(1.152)',
    '#1E86FC':'none',
    '#905AFA':'hue-rotate(41.1deg) saturate(1.378) brightness(.982)',
    '#FA70AB':'hue-rotate(114deg) saturate(.594) brightness(1.26)',
    '#959595':'grayscale(1) brightness(1.2)'
  };
  let sequence = 0;
  const image = (src,extra = '') => `<image href="${src}" width="68" height="68" ${extra}/>`;

  function render(config, color = defaultColor) {
    const state = studio.normalize(config);
    const primary = typeof color === 'string' && Object.hasOwn(COLORS,color.toUpperCase()) ? color.toUpperCase() : defaultColor;
    const id = 'owl-plush-' + (++sequence);
    const ref = name => `url(#${id}-${name})`;
    const attributes = `data-owl-renderer="3d" data-owl-material="plush" data-owl-head="${state.head}" data-owl-eyes="${state.eyes}" data-owl-goggles="${state.goggles}" data-owl-horns="${state.horns}" data-owl-color="${primary}"`;
    const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 68" fill="none" aria-hidden="true" focusable="false" ${attributes} style="display:block;overflow:visible"><g style="filter:${COLORS[primary]}">${body}</g></svg>`;

    // Keep the approved artwork pixel-for-pixel for its original features.
    if (state.eyes === 'solid' && state.goggles === 'classic') {
      return wrap(image(HEADS[state.head][state.horns],'data-owl-part="complete"'));
    }

    const blank = `assets/owl-soft-${state.head}-blank-blue.png`;
    const layers = studio.getLayers(state);
    const faceMask = layers.face.replaceAll('__SECONDARY__','#fff');
    const pupil = (x,y,size=10.4) => `<svg x="${x}" y="${y}" width="${size}" height="${size * 1.03}" viewBox="290 500 192 198" overflow="hidden"><image href="${SOURCE}" width="1254" height="1254" filter="${ref('dark-parts')}"/></svg>`;
    const solidEyes = pupil(15.55,27.2) + pupil(41.9,27.2);
    const ringEyes = [20.75,47.1].map(cx => `<circle cx="${cx}" cy="32.55" r="5.3" fill="${ref('eye-white')}" filter="${ref('depth')}"/>${pupil(cx-2.8,29.7,5.6)}`).join('');
    // Keep the original mirrored Squared contours and head-specific fit.
    const squaredEyes = `<g filter="${ref('depth')}">${layers.eyes.replaceAll('#191C1F',ref('eye-fur'))}</g>`;
    const eyes = {solid:solidEyes,ring:ringEyes,squared:squaredEyes}[state.eyes];
    const face = state.goggles === 'none' ? '' : `<g clip-path="${ref('face-clip')}" data-owl-part="goggles">${image(blank,`filter="${ref('face-fur')}"`)}</g>`;
    const beak = `<svg x="30.4" y="40.2" width="6.6" height="10.7" viewBox="560 742 122 197" overflow="hidden"><image href="${SOURCE}" width="1254" height="1254" filter="${ref('dark-parts')}"/></svg>`;
    const horns = state.horns === 'none' ? '' : `<g clip-path="${ref('horn-clip')}">${image(HEADS[state.head].feathered,`filter="${ref('dark-parts')}"`)}</g>`;
    return wrap(`<defs>
      <filter id="${id}-dark-parts" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 -5 0 2" result="dark"/>
        <feComposite in="dark" in2="SourceGraphic" operator="in"/>
      </filter>
      <filter id="${id}-face-fur" color-interpolation-filters="sRGB">
        <feComponentTransfer>
          <feFuncR type="linear" slope=".6" intercept=".4"/>
          <feFuncG type="linear" slope=".6" intercept=".4"/>
          <feFuncB type="linear" slope=".6" intercept=".4"/>
        </feComponentTransfer>
      </filter>
      <filter id="${id}-depth" x="-30%" y="-30%" width="170%" height="180%" color-interpolation-filters="sRGB">
        <feDropShadow dx=".1" dy=".35" stdDeviation=".25" flood-color="#18202a" flood-opacity=".25"/>
      </filter>
      <radialGradient id="${id}-eye-white" cx=".3" cy=".25" r=".8"><stop stop-color="#fff"/><stop offset=".7" stop-color="#e2e6eb"/><stop offset="1" stop-color="#99a4b0"/></radialGradient>
      <pattern id="${id}-eye-fur" width="1" height="1" patternContentUnits="objectBoundingBox" viewBox="325 535 110 115" preserveAspectRatio="none"><image href="${SOURCE}" width="1254" height="1254"/></pattern>
      <clipPath id="${id}-face-clip">${faceMask}</clipPath>
      <clipPath id="${id}-horn-clip"><rect width="68" height="27"/></clipPath>
    </defs>
      <g data-owl-part="head">${image(blank)}</g>
      ${face}
      <g data-owl-part="eyes">${eyes}</g>
      <g data-owl-part="beak">${beak}</g>
      <g data-owl-part="horns">${horns}</g>`);
  }
  function renderOption(group, value, color, config = studio.defaults) {
    const key = {heads:'head',eyes:'eyes',goggles:'goggles',horns:'horns'}[group] || 'head';
    return render({...studio.normalize(config),[key]:value},color);
  }
  window.Owl3DArtwork = Object.freeze({options:studio.options,defaults:studio.defaults,defaultColor,normalize:studio.normalize,render,renderOption});
})();
