/* Dimensional, composable Owl artwork for v3 customization.
 * Each editable silhouette is lit independently: a soft rounded head,
 * raised face patch, glass eyes, sculpted beak, and layered feathers.
 * All colors and all 90 feature combinations use the same materials.
 */
(() => {
  'use strict';
  const studio = window.OwlStudioArtwork;
  const defaultColor = '#1E86FC';
  let sequence = 0;

  function tint(hex, amount) {
    return '#' + [1,3,5].map(index => {
      const value = parseInt(hex.slice(index,index + 2),16);
      return Math.round(amount < 0 ? value * (1 + amount) : value + (255 - value) * amount).toString(16).padStart(2,'0');
    }).join('');
  }

  function render(config, color = defaultColor) {
    const state = studio.normalize(config);
    const layers = studio.getLayers(state);
    const primary = /^#[0-9a-f]{6}$/i.test(color) ? color : defaultColor;
    const face = tint(primary,.53);
    const id = 'owl-3d-' + (++sequence);
    const ref = name => `url(#${id}-${name})`;
    const head = layers.head.replaceAll('__PRIMARY__',ref('body'));
    const mask = layers.head.replaceAll('__PRIMARY__','#fff');
    const patch = layers.face.replaceAll('__SECONDARY__',ref('face'));
    const eyes = layers.eyes.replaceAll('#191C1F',ref('eye')).replaceAll('#FFFFFF',ref('white'));
    const beak = layers.beak.replaceAll('#191C1F',ref('beak'));
    const horns = layers.horns.replaceAll('fill="#000000"',`fill="${ref('feather')}"`).replaceAll('stroke="#000000"','stroke="#151a20"');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 68" fill="none" aria-hidden="true" focusable="false" data-owl-renderer="3d" data-owl-head="${state.head}" data-owl-eyes="${state.eyes}" data-owl-goggles="${state.goggles}" data-owl-horns="${state.horns}" data-owl-color="${primary}" style="display:block;overflow:visible">
      <defs>
        <radialGradient id="${id}-body" cx=".30" cy=".22" r=".82">
          <stop stop-color="${tint(primary,.48)}"/>
          <stop offset=".34" stop-color="${tint(primary,.10)}"/>
          <stop offset=".70" stop-color="${primary}"/>
          <stop offset=".90" stop-color="${tint(primary,-.24)}"/>
          <stop offset="1" stop-color="${tint(primary,-.48)}"/>
        </radialGradient>
        <radialGradient id="${id}-face" cx=".32" cy=".24" r=".85">
          <stop stop-color="${tint(face,.38)}"/>
          <stop offset=".55" stop-color="${face}"/>
          <stop offset=".86" stop-color="${tint(face,-.12)}"/>
          <stop offset="1" stop-color="${tint(face,-.27)}"/>
        </radialGradient>
        <radialGradient id="${id}-eye" cx=".31" cy=".24" r=".76">
          <stop stop-color="#66707a"/>
          <stop offset=".22" stop-color="#343b42"/>
          <stop offset=".64" stop-color="#191d22"/>
          <stop offset="1" stop-color="#090c10"/>
        </radialGradient>
        <radialGradient id="${id}-white" cx=".3" cy=".2" r=".9">
          <stop stop-color="#fff"/><stop offset=".65" stop-color="#edf1f5"/><stop offset="1" stop-color="#9aa6b3"/>
        </radialGradient>
        <linearGradient id="${id}-beak" x1="0" y1=".3" x2="1" y2=".6">
          <stop stop-color="#4b535b"/><stop offset=".49" stop-color="#323a42"/>
          <stop offset=".51" stop-color="#151c23"/><stop offset="1" stop-color="#080d13"/>
        </linearGradient>
        <linearGradient id="${id}-feather" x1=".25" y1="0" x2=".65" y2="1">
          <stop stop-color="#626b75"/><stop offset=".28" stop-color="#343e48"/>
          <stop offset=".55" stop-color="#1b242d"/><stop offset="1" stop-color="#080d13"/>
        </linearGradient>
        <filter id="${id}-shadow" x="-30%" y="-30%" width="170%" height="180%" color-interpolation-filters="sRGB">
          <feDropShadow dx=".5" dy="2.1" stdDeviation="1.7" flood-color="#172c45" flood-opacity=".20"/>
        </filter>
        <filter id="${id}-face-depth" x="-20%" y="-20%" width="150%" height="150%" color-interpolation-filters="sRGB">
          <feDropShadow dx=".25" dy=".85" stdDeviation=".7" flood-color="${tint(primary,-.62)}" flood-opacity=".38"/>
        </filter>
        <filter id="${id}-detail-depth" x="-40%" y="-40%" width="190%" height="200%" color-interpolation-filters="sRGB">
          <feDropShadow dx=".2" dy=".6" stdDeviation=".35" flood-color="#122334" flood-opacity=".40"/>
        </filter>
        <filter id="${id}-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="2.8" numOctaves="3" seed="8" result="noise"/>
          <feColorMatrix in="noise" type="saturate" values="0"/>
          <feComponentTransfer>
            <feFuncR type="linear" slope=".16" intercept=".84"/>
            <feFuncG type="linear" slope=".16" intercept=".84"/>
            <feFuncB type="linear" slope=".16" intercept=".84"/>
            <feFuncA type="table" tableValues="1 1"/>
          </feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" result="texture"/>
          <feBlend in="SourceGraphic" in2="texture" mode="multiply"/>
        </filter>
        <clipPath id="${id}-head-clip">${mask}</clipPath>
      </defs>
      <g filter="${ref('shadow')}">
        <g data-owl-part="head" filter="${ref('grain')}">${head}</g>
        <g clip-path="${ref('head-clip')}">
          <g data-owl-part="goggles" filter="${ref('face-depth')}"><g filter="${ref('grain')}">${patch}</g></g>
        </g>
      </g>
      <g data-owl-part="beak" filter="${ref('detail-depth')}">${beak}</g>
      <g data-owl-part="eyes" filter="${ref('detail-depth')}">${eyes}</g>
      <g data-owl-part="horns" filter="${ref('detail-depth')}">${horns}</g>
    </svg>`;
  }

  function renderOption(group, value, color, config = studio.defaults) {
    const key = {heads:'head',eyes:'eyes',goggles:'goggles',horns:'horns'}[group] || 'head';
    return render({...studio.normalize(config),[key]:value},color);
  }

  window.Owl3DArtwork = Object.freeze({options:studio.options,defaults:studio.defaults,defaultColor,normalize:studio.normalize,render,renderOption});
})();
