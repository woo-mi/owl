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
  const state = {
    name:'Chief of Staff',
    memory:'Requested a revenue analysis app, report, and slide deck for leadership.',
    personality:'Proactive, thoughtful, and direct. Clear updates and practical next steps.',
    activity:'daily'
  };
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
    return `<div class="profile-file"><div class="profile-file-copy"><strong>${key}.md</strong><span title="${esc(state[key])}">${esc(state[key])}</span></div><button type="button" data-profile-edit="${key}" aria-label="Edit ${key}.md">Edit</button></div>`;
  }
  const channelBadge = connected => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"><path d="${connected ? 'm3.5 8 3 3 6-6' : 'M8 3.5v9M3.5 8h9'}"/></svg>`;
  function render() {
    return `<div class="workspace-profile"><section class="profile-identity" aria-label="Owl identity"><div class="profile-owl"><img src="assets/profile-oct28-owl.png" width="40" height="40" alt=""></div><div class="profile-name"><h3>${esc(state.name)}</h3></div><p class="profile-handle">@woo-mi</p></section><section class="profile-showcase" aria-label="Owl stats and files"><div class="profile-metrics"><div><h4>Owl age</h4><strong>47 days</strong><span>Hatched Sep 5</span></div><div class="profile-metric-divider" aria-hidden="true"></div><div><h4>Tasks done</h4><strong>312</strong><span>18 this week</span></div></div><div class="profile-files">${fileRow('memory')}${fileRow('personality')}</div></section><section class="profile-activity"><div class="profile-section-heading"><h4>Owl activity</h4><div class="profile-activity-tabs" role="tablist" aria-label="Owl activity period">${['daily','weekly','cumulative'].map(mode=>`<button type="button" id="profile-activity-${mode}" role="tab" aria-selected="${state.activity===mode}" aria-controls="profile-activity-chart" tabindex="${state.activity===mode?0:-1}" data-profile-period="${mode}">${mode[0].toUpperCase()+mode.slice(1)}</button>`).join('')}</div></div><div id="profile-activity-chart" role="tabpanel" aria-labelledby="profile-activity-${state.activity}">${activity()}<div class="profile-months" aria-hidden="true">${months.map(month=>`<span>${month}</span>`).join('')}</div></div></section><section class="profile-delegation"><h4>Delegate from</h4><div class="profile-channels">${channels.map(channel=>`<button type="button" class="profile-channel" data-profile-channel="${channel.id}" aria-label="${channel.label}, ${channel.connected?'connected':'connect'}"><span class="profile-channel-tile${channel.connected?' is-connected':''}"><img src="assets/profile-oct28-${channel.id}.png" alt=""><span class="profile-channel-badge" aria-hidden="true">${channelBadge(channel.connected)}</span></span><span>${channel.label}</span></button>`).join('')}</div></section></div>`;
  }
  function handleClick(event, api) {
    const edit = event.target.closest('[data-profile-edit]');
    if(edit) {
      const key=edit.dataset.profileEdit;
      if(!['memory','personality'].includes(key))return;
      const label=`${key}.md`;
      api.showDetail(`Edit ${label}`, `<form class="profile-editor" data-profile-form="${key}"><label for="profile-edit-value">${label}</label><textarea id="profile-edit-value" name="value" required rows="7">${esc(state[key])}</textarea><div><button type="button" class="profile-editor-cancel" data-profile-cancel>Cancel</button><button type="submit" class="profile-editor-save">Save</button></div></form>`,edit);
      document.getElementById('profile-edit-value').focus();
      return;
    }
    if(event.target.closest('[data-profile-cancel]'))return api.back();
    const period=event.target.closest('[data-profile-period]');
    if(period) {
      state.activity=period.dataset.profilePeriod;
      api.rerender('profile');
      document.getElementById(`profile-activity-${state.activity}`).focus({preventScroll:true});
      return;
    }
    const channelButton=event.target.closest('[data-profile-channel]');
    if(channelButton) {
      const channel=channels.find(c=>c.id===channelButton.dataset.profileChannel);
      if(!channel)return;
      api.showDetail(channel.label,`<div class="profile-channel-detail"><img src="assets/profile-oct28-${channel.id}.png" width="32" height="32" alt=""><p>${channel.connected?'Connected to this owl.':'Connect this channel to delegate to your owl.'}</p><button type="button" data-profile-toggle-channel="${channel.id}">${channel.connected?'Disconnect':'Connect'}</button></div>`,channelButton);
      return;
    }
    const toggle=event.target.closest('[data-profile-toggle-channel]');
    if(toggle) {
      const channel=channels.find(c=>c.id===toggle.dataset.profileToggleChannel);
      if(!channel)return;
      channel.connected=!channel.connected;
      api.rerender('profile');api.back();
    }
  }
  function handleSubmit(event, api) {
    const form=event.target.closest('[data-profile-form]');
    if(!form)return;
    event.preventDefault();
    const key=form.dataset.profileForm;
    const value=form.elements.value.value.trim();
    if(!value || !['memory','personality'].includes(key))return;
    state[key]=value;
    api.rerender('profile');api.back();
  }
  window.WorkspaceProfile=Object.freeze({render,handleClick,handleSubmit});
})();
