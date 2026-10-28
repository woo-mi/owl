/* Profile frame xJiXZ. Artwork and daily activity cells come from the Pen source. */
(() => {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cells = [
    '0000000000000000000000000000000000000000000000001111',
    '0000000000000000000000000000000000000000000100112112',
    '0000000000000000000000000000000000000000000000032132',
    '0000000000000000000000000000000000000000000000021145',
    '0000000000000000000000000000000000000000000000114225',
    '0000000000000000000000000000000000000000000000124225',
    '0000000000000000000000000000000000000000000000111125'
  ].map(row => [...row].map(Number));
  const palette = ['#F3F3F3','#D1E5FD','#79B3F9','#3A83F7','#1F4E94','#FFFFFF'];
  const months = ['Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct'];
  const channels = [
    {id:'slack',label:'Slack',connected:true}, {id:'teams',label:'Teams',connected:true},
    {id:'imessage',label:'iMessage',connected:true}, {id:'whatsapp',label:'WhatsApp',connected:false},
    {id:'phone',label:'Phone',connected:false}
  ];
  const initialState = {
    name:'Chief of Staff',
    memory:'Requested a revenue analysis app, report, and slide deck for leadership.',
    personality:'Proactive, thoughtful, and direct. Clear updates and practical next steps.',
    activity:'daily',
    variant:null,
    color:null,
    studio:null
  };
  const states = {v1:{...initialState},v2:{...initialState}};
  const activeVariant = () => window.MVPVersions.getVariant();
  let state = states[activeVariant()];
  const artwork = () => state.studio ? window.OwlStudioArtwork.render(state.studio,state.color) : window.OwlArtwork.render(state.variant,state.color);
  const headerName = document.querySelector('#chief-profile .agent-profile-name');
  const headerMark = document.querySelector('#chief-profile .agent-profile-mark');
  const originalName = headerName?.textContent;
  const originalMark = headerMark?.innerHTML;
  function syncIdentity() {
    state = states[activeVariant()];
    if (!headerName || !headerMark) return;
    const active = document.body.dataset.prototypeView === 'latest-oct-28' && (state.variant || state.studio);
    headerName.textContent = active ? state.name : originalName;
    headerMark.innerHTML = active ? artwork() : originalMark;
    const trigger = document.getElementById('chief-profile');
    trigger.setAttribute('aria-label', `${trigger.getAttribute('aria-expanded') === 'true' ? 'Close' : 'Open'} ${headerName.textContent} workspace`);
    document.querySelector('.fsw-composer textarea')?.setAttribute('aria-label', `Message ${headerName.textContent} in workspace`);
    if (active) {
      const artwork = headerMark.querySelector('svg');
      artwork.style.width = '100%';
      artwork.style.height = '100%';
      artwork.style.display = 'block';
    }
  }
  for (const event of ['mvp-view-change','mvp-variant-change','popstate']) window.addEventListener(event, () => {
    state = states[activeVariant()];
    queueMicrotask(syncIdentity);
  });
  function activity() {
    if (state.activity === 'daily') {
      return `<div class="profile-calendar" role="img" aria-label="Daily Owl activity, November through October">${cells.map(row => `<div class="profile-calendar-row">${row.map(level => `<span style="background:${palette[level]}" title="${level === 5 ? 'Upcoming day' : `Activity level ${level}`}" aria-hidden="true"></span>`).join('')}</div>`).join('')}</div>`;
    }
    const weeks = Array.from({length:52}, (_, i) => cells.reduce((sum,row)=>sum+(row[i]===5?0:row[i]),0));
    if (state.activity === 'weekly') {
      const max = Math.max(...weeks,1);
      return `<div class="profile-weekly" role="img" aria-label="Weekly Owl activity, November through October">${weeks.map(level=>`<span style="height:${Math.max(3,80*level/max)}px;background:${level?'#3A83F7':'#F3F3F3'}" aria-hidden="true"></span>`).join('')}</div>`;
    }
    let total=0;
    const accumulated=weeks.map(value=>total+=value);
    const points=accumulated.map((value,i)=>`${i*612/51},${80-value/Math.max(total,1)*76}`).join(' ');
    return `<svg class="profile-cumulative" viewBox="0 0 613 82" preserveAspectRatio="none" role="img" aria-label="Cumulative Owl activity, November through October"><path d="M0 80H613" stroke="#f3f3f3"/><polyline points="${points}" fill="none" stroke="#3A83F7" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
  }
  function fileRow(key) {
    return `<div class="profile-file"><div class="profile-file-copy"><strong>${key}.md</strong><span title="${esc(state[key])}">${esc(state[key])}</span></div><span class="profile-file-edit-label">Edit</span></div>`;
  }
  const channelBadge = connected => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"><path d="${connected ? 'm3.5 8 3 3 6-6' : 'M8 3.5v9M3.5 8h9'}"/></svg>`;
  function render() {
    state = states[activeVariant()];
    return `<div class="workspace-profile"><section class="profile-identity" aria-label="Owl identity"><button type="button" class="profile-owl" data-profile-customize="avatar" aria-label="Customize your owl">${(state.variant || state.studio) ? artwork() : '<img src="assets/profile-oct28-owl.png" width="40" height="40" alt="">'}<span class="profile-owl-hover-badge" aria-hidden="true"><img src="assets/central-icons/pencil-1.5.svg" width="16" height="16" alt=""></span></button><div class="profile-name"><h3>${esc(state.name)}</h3><button type="button" class="profile-name-edit" data-profile-customize="edit" aria-label="Edit owl"><img src="assets/central-icons/pencil-1.5.svg" width="16" height="16" alt=""></button></div><p class="profile-handle">@woo-mi</p></section><section class="profile-showcase" aria-label="Owl stats and files"><div class="profile-metrics"><div><h4>Owl age</h4><strong>47 days</strong><span>Hatched Sep 5</span></div><div class="profile-metric-divider" aria-hidden="true"></div><div><h4>Tasks done</h4><strong>312</strong><span>18 this week</span></div></div><div class="profile-files">${fileRow('memory')}${fileRow('personality')}</div></section><section class="profile-activity"><div class="profile-section-heading"><h4>Owl activity</h4><div class="profile-activity-tabs" role="tablist" aria-label="Owl activity period">${['daily','weekly','cumulative'].map(mode=>`<button type="button" id="profile-activity-${mode}" role="tab" aria-selected="${state.activity===mode}" aria-controls="profile-activity-chart" tabindex="${state.activity===mode?0:-1}" data-profile-period="${mode}">${mode[0].toUpperCase()+mode.slice(1)}</button>`).join('')}</div></div><div id="profile-activity-chart" role="tabpanel" aria-labelledby="profile-activity-${state.activity}">${activity()}<div class="profile-months" aria-hidden="true">${months.map(month=>`<span>${month}</span>`).join('')}</div></div></section><section class="profile-delegation"><h4>Delegate from</h4><div class="profile-channels">${channels.map(channel=>`<div class="profile-channel" data-profile-channel="${channel.id}" role="img" aria-label="${channel.label}, ${channel.connected?'connected':'not connected'}"><span class="profile-channel-tile${channel.connected?' is-connected':''}"><img src="assets/profile-oct28-${channel.id}.png" alt=""><span class="profile-channel-badge" aria-hidden="true">${channelBadge(channel.connected)}</span></span><span>${channel.label}</span></div>`).join('')}</div></section></div>`;
  }
  function handleClick(event, api) {
    const customize=event.target.closest('[data-profile-customize]');
    if(customize) {
      const customizer = activeVariant()==='v2' ? window.OwlStudio : window.OwlCustomizer;
      customizer.open({
        name:state.name, variant:state.variant, studio:state.studio, color:state.color, trigger:customize,
        save:identity=>{
          Object.assign(state,identity);
          syncIdentity();
          api.rerender('profile');
          api.announce('Owl updated');
        }
      });
      return;
    }
    const period=event.target.closest('[data-profile-period]');
    if(period) {
      state.activity=period.dataset.profilePeriod;
      api.rerender('profile');
      document.getElementById(`profile-activity-${state.activity}`).focus({preventScroll:true});
      return;
    }
  }
  window.WorkspaceProfile=Object.freeze({render,handleClick});
})();
