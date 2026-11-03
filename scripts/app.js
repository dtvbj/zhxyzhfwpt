(() => {
  let adapter;
  try { adapter=window.localStorage; } catch { adapter={getItem(){throw new Error('Storage blocked');},setItem(){throw new Error('Storage blocked');},removeItem(){}}; }
  const storage=Campus.Storage.create(adapter);
  const store=Campus.Store.create(storage);
  const app={store,storage,router:null};
  app.router=Campus.Router.create(window,target => {
    Campus.Publish.flush();
    Campus.UI.run(() => Campus.UI.render(target));
  });
  Campus.App=app;
  Campus.UI.init(app);
  Campus.Publish.init(app);
  Campus.Extras.init(app);
  store.onChange(() => Campus.UI.updateBell());
  app.router.start();
  if (storage.notices.length) {
    const notice=document.createElement('div');notice.className='storage-notice';notice.setAttribute('role','status');notice.textContent=storage.notices.join(' ');
    const close=document.createElement('button');close.textContent='关闭';close.type='button';close.onclick=() => notice.remove();notice.append(close);document.querySelector('#phone').append(notice);
  }
  window.addEventListener('storage',event => {
    if (event.key === Campus.Storage.KEY) Campus.UI.toast('另一个标签页已修改数据，请刷新后继续操作以避免覆盖。');
  });
  document.querySelectorAll('[data-go],[data-pub],[data-back],#mineTabs .tb').forEach(element => {
    if (element.tagName !== 'BUTTON' && element.tagName !== 'A') {element.setAttribute('role','button');element.tabIndex=0;}
  });
  document.addEventListener('keydown',event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[role="button"]')) {event.preventDefault();event.target.click();}
    if (event.key === 'Tab' && document.querySelector('#sheet.show')) {
      const focusable=[...document.querySelector('#sheet').querySelectorAll('input,select,textarea,button')].filter(element => !element.disabled && element.offsetParent);
      const first=focusable[0],last=focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last?.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}
    }
  });
})();
