Campus.UI = (() => {
  const { escape:esc, labels, route, image } = Campus.Utils;
  const $ = (selector,root=document) => root.querySelector(selector);
  const $$ = (selector,root=document) => [...root.querySelectorAll(selector)];
  let app;
  let toastTimer;
  const filters = { market:'全部',lost:'全部',help:'全部',mine:'pub' };
  const names = {active:'发布中',closed:'已下架 / 关闭',completed:'已完成'};
  const icon = name => `<svg class="icon sm" aria-hidden="true"><use href="#${name}"/></svg>`;
  const empty = (title,detail='') => `<div class="empty"><b>${esc(title)}</b><p>${esc(detail)}</p></div>`;
  const button = (label,action,extra='',style='ghost') => `<button type="button" class="btn ${style}" data-action="${action}" ${extra}>${esc(label)}</button>`;
  function toast(message) {
    $('#toastEl').textContent=message;
    $('#toastEl').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(() => $('#toastEl').classList.remove('show'),3500);
  }
  function run(action) { try { return action(); } catch (error) { toast(error.message || '操作失败，请重试'); return undefined; } }
  function openSheet(html) {
    $('#sheet').innerHTML='<div class="grab"></div>'+html+button('关闭','close-sheet');
    $('#sheet').classList.add('show'); $('#mask').classList.add('show');
    $('#sheet').setAttribute('role','dialog'); $('#sheet').setAttribute('aria-modal','true');
    $('#sheet').querySelector('input,textarea,button')?.focus();
  }
  function closeSheet() { $('#sheet').classList.remove('show'); $('#mask').classList.remove('show'); }
  function success(title,description,target) {
    $('#okTitle').textContent=title; $('#okDesc').textContent=description;
    $('#okMain').textContent='去看看'; $('#okSecond').textContent='继续浏览';
    $('#okMain').onclick=() => { $('#success').classList.remove('show'); app.router.go(target.page,target); };
    $('#okSecond').onclick=() => $('#success').classList.remove('show');
    $('#success').classList.add('show');
  }
  function tile(post,small=false) {
    const palette=Campus.Seed.palettes[({书籍:'forest',数码:'slate',生活用品:'teal'})[post.cat] || 'navy'];
    return `<div class="tile ${small ? 'compact' : ''}" style="--c1:${palette[0]};--c2:${palette[1]}"><span class="cat">${esc(post.cat || '校园')}</span><span class="ti">${icon(Campus.Seed.icons[post.cat] || 'i-campus')}</span></div>`;
  }
  function card(post) {
    return `<button class="card" data-open="goods" data-id="${esc(post.id)}">${tile(post)}<div class="bt">${esc(post.title)}</div><div class="bm">${esc(post.cond)} · ${esc(post.spot)}</div><div class="bp"><span class="price">¥${esc(post.price)}<s>¥${esc(post.orig)}</s></span></div></button>`;
  }
  function row(type,post,meta) {
    const badge=type === 'goods' ? post.cat : type === 'lost' ? post.postKind || post.type : type === 'help' ? post.kind : post.src || '活动';
    const description=meta || (type === 'goods' ? post.cond+' · '+post.spot : type === 'activities' ? post.time+' · '+post.spot : type === 'lost' ? post.spot+' · '+post.time : post.need || post.dept);
    return `<button class="row-card" data-open="${type}" data-id="${esc(post.id)}">${tile(post,true)}<div class="rc-b"><div class="rc-t">${esc(post.title)}</div><div class="rc-s"><span class="pill ${type === 'lost' ? 'gold' : 'navy'}">${esc(badge)}</span>${esc(names[post.status] || '')}</div><div class="rc-f"><span class="rc-spot">${esc(description)}</span>${type === 'goods' ? '<span class="price">¥'+esc(post.price)+'</span>' : icon('i-right')}</div></div></button>`;
  }
  const chips = (name,values) => values.map(value => `<button class="chip ${filters[name] === value ? 'on' : ''}" data-filter="${name}" data-value="${esc(value)}">${esc(value)}</button>`).join('');
  function home() {
    const goods=app.store.visible('goods');
    $('#homeCards').innerHTML=goods.slice(0,4).map(card).join('') || empty('还没有闲置','发布一件闲置，让资源流动起来。');
    $('#homeFeed').innerHTML=['activities','lost','help'].map(type => {
      const post=app.store.visible(type)[0];
      return post ? row(type,post) : '';
    }).join('');
    const own=app.store.mine();
    const values=[own.filter(post => post.type === 'goods' && post.cat === '书籍').length,own.filter(post => post.type === 'goods' && post.status === 'completed').length,own.filter(post => post.type === 'lost' && post.status === 'completed').length];
    const captions=['本机书籍发布','已完成流转','已确认找回'];
    $$('.hstats > div').forEach((element,index) => { element.innerHTML='<b>'+values[index]+'</b>'+captions[index]; });
  }
  function market() {
    $('#marketChips').innerHTML=chips('market',['全部','书籍','数码','生活用品','其他']);
    const posts=app.store.visible('goods').filter(post => filters.market === '全部' || post.cat === filters.market);
    $('#marketList').innerHTML=posts.map(post => row('goods',post)).join('') || empty('这个分类还没有闲置','试试其他分类，或者发布第一件。');
  }
  function campus() {
    const activities=app.store.visible('activities'),lost=app.store.visible('lost');
    $('#campusActs').innerHTML=activities.slice(0,2).map(post => row('activities',post)).join('') || empty('暂无活动');
    $('#campusLost').innerHTML=lost.slice(0,3).map(post => row('lost',post)).join('') || empty('暂无失物信息');
    $('.entry2 .e-d').textContent='失物 '+lost.filter(post => post.type === '失物').length+' · 拾物 '+lost.filter(post => post.type === '拾物').length;
    $$('.entry2 .e-d')[1].textContent=activities.length+' 场活动';
  }
  function lost() {
    $('#lostChips').innerHTML=chips('lost',['全部','失物','拾物']);
    $('#lostList').innerHTML=app.store.visible('lost').filter(post => filters.lost === '全部' || post.type === filters.lost).map(post => row('lost',post)).join('') || empty('暂无此类信息');
  }
  function activities() { $('#actsList').innerHTML=app.store.visible('activities').map(post => row('activities',post)).join('') || empty('还没有活动','可以发起一次校园活动。'); }
  function help() {
    $('#helpChips').innerHTML=chips('help',['全部','学习搭子','技能互助','调查问卷']);
    $('#helpList').innerHTML=app.store.visible('help').filter(post => filters.help === '全部' || post.kind === filters.help).map(post => row('help',post)).join('') || empty('暂时没有这类互助');
  }
  const block = (title,html) => `<div class="block"><h3>${esc(title)}</h3>${html}</div>`;
  const pair = (name,value) => `<div class="kv"><span>${esc(name)}</span><b>${esc(value)}</b></div>`;
  function favoriteButton(type,post) { return button(app.store.favoriteOf(type,post.id) ? '取消收藏' : '收藏','favorite',`data-type="${type}" data-id="${esc(post.id)}"`); }
  function management(type,post) {
    const extra=`data-type="${type}" data-id="${esc(post.id)}"`;
    return block('管理我的发布',`<div class="action-row">${button('编辑','edit',extra)}${button(post.status === 'active' ? '下架 / 关闭' : '重新发布','status',extra+` data-status="${post.status === 'active' ? 'closed' : 'active'}"`)}${post.status !== 'completed' ? button(type === 'lost' ? '确认找回 / 归还' : '标记已完成','status',extra+' data-status="completed"') : ''}</div>`);
  }
  function detail(type,postId) {
    const config={goods:['itemBody','itemCta'],lost:['lostBody','lostCta'],activities:['actBody','actCta'],help:['helpBody','helpCta']}[type];
    const body=$('#'+config[0]),cta=$('#'+config[1]);
    const post=app.store.get(type,postId);
    if (!post) { body.innerHTML=empty('这条内容不存在或已失效','请返回列表重新选择。'); cta.innerHTML=button('返回列表','list',`data-type="${type}"`); return; }
    const own=post.owner === 'me';
    const active=post.status === 'active';
    let html=`<div class="detail-heading"><span class="pill ${active ? 'teal' : 'gold'}">${esc(names[post.status])}</span><h1>${esc(post.title)}</h1><p>${esc(post.seller || post.by || post.contact || post.dept || '校园同学')} · ${post.createdAt ? new Date(post.createdAt).toLocaleDateString('zh-CN') : '初始示例'}</p></div>`;
    if (type === 'goods') {
      html=`<div class="dhero" style="--c1:#2F6B4E;--c2:#6FA085"><span class="bigicon">${icon(Campus.Seed.icons[post.cat] || 'i-book')}</span><span class="tagline">${esc(post.cat)} · ${esc(post.cond)}</span></div>`+html;
      html+=block('面交信息',pair('价格','¥'+post.price)+pair('成色',post.cond)+pair('地点',post.spot)+pair('方式','校园线下面交'))+block('卖家说明','<p class="prose">'+esc(post.note)+'</p>');
    } else if (type === 'activities') {
      const count=app.store.activityCount(post);
      html+=block('时间与地点',pair('活动时间',post.time)+pair('集合地点',post.spot)+pair('报名人数',count+' / '+(post.limit || '不限')))+block('活动说明','<p class="prose">'+esc(post.desc)+'</p>');
    } else if (type === 'lost') {
      html+=block('物品信息',pair('类型',post.type)+pair('时间',post.time)+pair('地点',post.spot))+block('公开说明','<p class="prose">'+esc(post.desc)+'</p>');
      html+=block('认领核验','<p class="prose">请提供非公开特征、时间和地点，由发布者核对后确认。申请提交后不会直接标记为已找回。</p>');
      if (own) {
        html+=block('仅发布者可见的核验特征','<p class="prose">'+esc(post.hiddenFeature || '旧版示例无隐藏特征，请补充')+'</p>');
        const applications=app.store.data().applications.filter(entry => entry.type === 'lost' && entry.postId === postId);
        html+=block('认领 / 线索申请',applications.map(entry => `<div class="application"><p>${esc(entry.feature)}</p><small>${esc(entry.time)} · ${esc(entry.spot)}</small><p>${esc(entry.note)}</p><span class="pill gold">${({pending:'待核验',approved:'已通过',rejected:'已拒绝'})[entry.status]}</span>${entry.status === 'pending' ? button('核对后通过','review',`data-id="${esc(entry.id)}" data-approved="true"`)+button('拒绝','review',`data-id="${esc(entry.id)}" data-approved="false"`) : ''}</div>`).join('') || '<p class="prose">暂无申请。本版仅保存同一浏览器内的数据。</p>');
      }
    } else {
      html+=block('说明','<p class="prose">'+esc(post.desc)+'</p>');
      if (post.kind === '调查问卷') {
        html+=block('问卷信息',pair('题目',(post.questions || []).length+' 题')+pair('奖励','提交后 +20 积分（每份仅一次）')+pair('发起者奖励',post.gift || '无')+pair('隐私','答案仅保存在本机，不上传'));
        html+=Campus.Extras.surveyHTML(post);
      } else html+=block('约定与形式',pair('类型',post.kind)+pair('约定',post.need));
    }
    const participation=app.store.participation(type,postId);
    if (participation) html+=block('我的参与',pair('状态',participation.status)+pair('约定',participation.note || '无')+(participation.status !== '已提交' && participation.status !== '已取消' ? button('取消参与','cancel',`data-type="${type}" data-id="${esc(postId)}"`) : ''));
    if (own) html+=management(type,post);
    if (own && type === 'help' && post.kind !== '调查问卷') {
      html+=block('加入申请',app.store.data().applications.filter(entry => entry.type === 'help' && entry.postId === postId).map(entry => `<div class="application"><p>${esc(entry.note)}</p><span>${esc(entry.status)}</span>${entry.status === 'pending' ? button('通过','review',`data-id="${esc(entry.id)}" data-approved="true"`)+button('拒绝','review',`data-id="${esc(entry.id)}" data-approved="false"`) : ''}</div>`).join('') || '<p class="prose">暂无申请。</p>');
    }
    body.innerHTML=html+'<p class="tip local-tip">纯前端本机记录 · 不会向其他设备发送申请</p>';
    const attributes=`data-type="${type}" data-id="${esc(postId)}"`;
    let action='';
    if (own) action=button('编辑我的发布','edit',attributes,'primary');
    else if (!active) action='<span class="inactive-note">内容已关闭，暂不可参与</span>';
    else if (type === 'goods') action=button(participation && participation.status !== '已取消' ? '查看联系记录' : '联系卖家','contact',attributes,'primary');
    else if (type === 'lost') action=button(participation && participation.status !== '已取消' ? '查看核验申请' : post.type === '失物' ? '提供线索' : '申请认领','claim',attributes,'primary');
    else if (type === 'activities') {
      const joined=participation?.status === '已报名',full=post.limit && app.store.activityCount(post) >= post.limit;
      action=joined ? button('取消报名','cancel',attributes,'primary') : full ? '<span class="inactive-note">名额已满</span>' : button('报名参加','join',attributes,'primary');
    } else if (post.kind === '调查问卷') action=button('查看问卷与结果','scroll-survey',attributes,'primary');
    else action=button(participation && participation.status !== '已取消' ? '查看申请记录' : '申请加入','join',attributes,'primary');
    cta.innerHTML=favoriteButton(type,post)+action;
  }
  function paintAvatar(element,user) {
    element.style.background=user.color;
    element.replaceChildren();
    if (image(user.avatar)) { const avatar=document.createElement('img'); avatar.src=image(user.avatar); avatar.alt='我的头像'; element.append(avatar); }
    else element.textContent=user.name.slice(0,1);
  }
  function mine() {
    const data=app.store.data(),posts=app.store.mine();
    $('#meName').textContent=data.user.name; $('#meSub').textContent=data.user.college+' · '+data.user.major;
    paintAvatar($('#meAv'),data.user);
    $('#statPub').textContent=posts.length; $('#statJoin').textContent=data.participations.filter(entry => entry.status !== '已取消').length;
    $$('.stats b')[1].textContent=data.favorites.length;
    $('#ptNum').textContent=app.store.points(); $('#ptBar').style.width=Math.max(0,Math.min(100,app.store.points()/5))+'%';
    $('.pt .hint').textContent=app.store.points() >= 500 ? '已达到「共读伙伴」积分条件' : '再得 '+(500-app.store.points())+' 分解锁「共读伙伴」';
    $('.pt .r').textContent='查看积分流水'; $('.pt').setAttribute('data-action','points'); $('.pt').tabIndex=0; $('.pt').setAttribute('role','button');
    $('.badges').innerHTML=app.store.badges().map(badge => `<div class="bg ${badge.got ? '' : 'lock'}"><div class="bi">${esc(badge.name.slice(0,1))}</div><div class="t">${esc(badge.name)}</div><span class="d">${badge.got ? '已获得' : esc(badge.detail)}</span></div>`).join('');
    $$('#mineTabs .tb').forEach(tab => tab.classList.toggle('on',tab.dataset.tab === filters.mine));
    let html='';
    if (filters.mine === 'pub') html=posts.map(post => row(post.type,post,names[post.status])).join('');
    if (filters.mine === 'fav') html=data.favorites.map(entry => {
      const post=app.store.get(entry.type,entry.postId);
      return `<div class="saved-row">${post ? row(entry.type,post,post.status === 'active' ? undefined : '内容已失效') : empty(entry.title,'内容已不存在')}${button('取消收藏','favorite',`data-type="${entry.type}" data-id="${esc(entry.postId)}"`)}</div>`;
    }).join('');
    if (filters.mine === 'join') html=data.participations.map(entry => {
      const post=app.store.get(entry.type,entry.postId);
      return post ? row(entry.type,post,entry.status+(post.status !== 'active' ? ' · 内容已关闭' : '')+(entry.note ? ' · '+entry.note : '')) : empty(entry.title,'参与内容已失效');
    }).join('');
    $('#mineList').innerHTML=(html || empty('还没有记录','去发布、收藏或参与一条校园信息吧。'))+`<div class="action-row">${button('积分流水','points')}${button('重置演示数据','reset')}</div><p class="tip">重置会清空本机发布、照片、资料和操作记录。</p>`;
  }
  function messages() {
    const list=app.store.messages();
    $('#msgList').innerHTML=list.map(message => `<button class="msg-item ${message.read ? 'read' : ''}" data-message="${esc(message.id)}"><span class="mi">${icon('i-bell')}</span><div><div class="mt">${esc(message.title)}</div><div class="md">${esc(message.text)}</div><div class="mtime">${message.at ? new Date(message.at).toLocaleString('zh-CN') : esc(message.time || '示例通知')}</div></div>${message.read ? '' : '<span class="dot"></span>'}</button>`).join('') || empty('还没有消息');
  }
  function updateBell() { const count=app.store.messages().filter(message => !message.read).length; $('#bellDot').textContent=count; $('#bellDot').classList.toggle('hide',count === 0); }
  function search() {
    const page=$('[data-page="search"]');
    if (!$('#globalSearch')) page.innerHTML=`<div class="nav"><button class="back" data-back>${icon('i-left')}</button><span class="nt">搜索校园</span></div><form id="searchForm" class="global-search"><input id="globalSearch" maxlength="100" placeholder="搜索闲置、失物、活动、互助、地点" aria-label="搜索关键词"><button class="btn primary">搜索</button></form><div class="scroll"><div id="searchResults" class="list"></div></div>`;
    const keyword=$('#globalSearch').value.trim();
    const results=app.store.search(keyword);
    $('#searchResults').innerHTML=!keyword ? empty('搜一搜校园里的信息','支持闲置、失物、活动、互助和地点。') : results.length ? results.map(result => `<button class="row-card" data-result-page="${result.target.page}" data-id="${esc(result.target.id)}"><div class="rc-b"><span class="pill navy">${esc(labels[result.type] || '校园地点')}</span><div class="rc-t">${esc(result.title)}</div><p class="prose">${esc(result.description.slice(0,100))}</p></div>${icon('i-right')}</button>`).join('') : empty('没有找到相关信息','试试更短的关键词，例如“图书馆”或“数学”。');
  }
  function points() {
    $('[data-page="points"]').innerHTML=`<div class="nav"><button class="back" data-back>${icon('i-left')}</button><span class="nt">循环积分流水</span></div><div class="scroll pad"><div class="detail-heading"><h1>${app.store.points()} 分</h1><p>每笔积分均有来源，相同行为不会重复奖励。</p></div>${app.store.data().ledger.map(entry => `<div class="point-entry"><div><b>${esc(entry.reason)}</b><small>${entry.at ? new Date(entry.at).toLocaleString('zh-CN') : '旧版初始积分'}</small></div><strong>${entry.amount >= 0 ? '+' : ''}${entry.amount}</strong></div>`).join('')}</div>`;
  }
  function render(target) {
    closeSheet(); $('#success').classList.remove('show');
    $$('.page').forEach(page => page.classList.toggle('active',page.dataset.page === target.page));
    $$('.tab').forEach(tab => tab.classList.toggle('on',tab.dataset.go === target.page));
    $('#tabbar').classList.toggle('hide',!['home','market','campus','help','mine'].includes(target.page));
    const renderers={home,market,campus,lost,acts:activities,help,mine,msg:messages,search,points};
    if (renderers[target.page]) renderers[target.page]();
    const type={item:'goods',lostdetail:'lost',actdetail:'activities',helpdetail:'help'}[target.page];
    if (type) detail(type,target.id);
    if (target.page === 'publish') Campus.Publish.render(target);
    if (['profile','snaps','map'].includes(target.page)) Campus.Extras.render(target);
    $('.page.active .scroll')?.scrollTo(0,0);
    updateBell();
  }
  function init(application) {
    app=application;
    for (const page of ['search','points']) { const section=document.createElement('section'); section.className='page'; section.dataset.page=page; $('#app').append(section); }
    $('.searchbar').dataset.go='search';
    $('#bellBtn').onclick=() => app.router.go('msg');
    $('#msgAllRead').onclick=() => run(() => { app.store.readMessages(); messages(); updateBell(); });
    $('#mask').onclick=closeSheet;
    document.addEventListener('submit',event => { if (event.target.id === 'searchForm') {event.preventDefault(); search();} });
    document.addEventListener('click',event => {
      const element=event.target.closest('[data-go],[data-pub],[data-open],[data-back],[data-filter],[data-action],[data-message],[data-result-page],#mineTabs .tb');
      if (!element) return;
      run(() => {
        if (element.dataset.go) return app.router.go(element.dataset.go);
        if (element.hasAttribute('data-pub')) return Campus.Publish.start(element.dataset.pub);
        if (element.hasAttribute('data-back')) return app.router.back();
        if (element.dataset.open) { const target=route(element.dataset.open,element.dataset.id); return app.router.go(target.page,target); }
        if (element.dataset.resultPage) return app.router.go(element.dataset.resultPage,{id:element.dataset.id});
        if (element.dataset.filter) { filters[element.dataset.filter]=element.dataset.value; return render(app.router.current()); }
        if (element.closest('#mineTabs')) { filters.mine=element.dataset.tab; return mine(); }
        if (element.dataset.message) { const message=app.store.messages().find(entry => entry.id === element.dataset.message); app.store.readMessages(message.id); return app.router.go(message.target.page,message.target); }
        const {action,type,id:postId}=element.dataset;
        if (action === 'close-sheet') return closeSheet();
        if (action === 'favorite') {app.store.favorite(type,postId); render(app.router.current()); return;}
        if (action === 'edit') return app.router.go('publish',{type,id:postId});
        if (action === 'status') {app.store.setStatus(type,postId,element.dataset.status); render(app.router.current()); return;}
        if (action === 'cancel') {app.store.cancel(type,postId); render(app.router.current()); return;}
        if (action === 'list') return app.router.go(({goods:'market',lost:'lost',activities:'acts',help:'help'})[type]);
        if (action === 'points') return app.router.go('points');
        if (action === 'review') {app.store.review(postId,element.dataset.approved === 'true');render(app.router.current());return;}
        if (action === 'reset') return openSheet('<h3>重置演示数据</h3><p class="prose">这会清空本机资料、发布、照片、收藏和参与，恢复初始演示内容。此操作不可撤销。</p>'+button('确认清空并重置','confirm-reset','','primary'));
        if (action === 'confirm-reset') {app.store.reset();filters.mine='pub';app.router.go('home');return;}
        if (action === 'join') {const post=app.store.get(type,postId),entry=app.store.participation(type,postId); if (entry && entry.status !== '已取消') return toast('当前状态：'+entry.status); app.store.join(type,postId,post.need || post.time || ''); render(app.router.current()); toast(type === 'activities' ? '报名成功，已加入我的参与' : '申请已保存在本机，等待确认'); return;}
        if (action === 'contact') return Campus.Extras.contact(postId);
        if (action === 'claim') return Campus.Extras.claim(postId);
        if (action === 'scroll-survey') return $('#surveySection')?.scrollIntoView({behavior:'smooth'});
      });
    });
    document.addEventListener('keydown',event => { if (event.key === 'Escape') {closeSheet();$('#success').classList.remove('show');$$('.egg.show').forEach(layer => layer.classList.remove('show'));} });
    document.addEventListener('error',event => {
      if (event.target instanceof HTMLImageElement) { const replacement=document.createElement('span');replacement.className='image-fallback';replacement.textContent='图片无法加载';event.target.replaceWith(replacement); }
    },true);
  }
  return { init,render,toast,run,openSheet,closeSheet,success,empty,button,block,pair,icon,$,$$,updateBell,paintAvatar };
})();
