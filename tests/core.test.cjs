const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(initial = {}) {
  const context = vm.createContext({ console, crypto:require('node:crypto').webcrypto });
  for (const name of ['data/seed','core/utils','core/storage','core/store','core/router']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts',name+'.js'),'utf8'),context);
  const saved = new Map(Object.entries(initial));
  const adapter = {getItem:key => saved.get(key) || null,setItem:(key,value) => saved.set(key,value),removeItem:key => saved.delete(key)};
  const storage = context.Campus.Storage.create(adapter);
  const store = context.Campus.Store.create(storage);
  return {context,saved,adapter,storage,store,reload:() => context.Campus.Store.create(context.Campus.Storage.create(adapter))};
}
const goods = {title:'测试商品',cat:'书籍',price:12.5,orig:20,cond:'九成新',spot:'图书馆',note:'测试'};
test('所有发布类型持久化、我的发布与消息同步', () => {
  const env=setup();
  const ids=[
    ['goods',env.store.publish('goods',goods)],
    ['lost',env.store.publish('lost',{title:'测试拾物',type:'拾物',hiddenFeature:'杯底编号',time:'今天',spot:'图书馆'})],
    ['activities',env.store.publish('activities',{title:'测试活动',time:'周六',spot:'中心广场',limit:4})],
    ['help',env.store.publish('help',{title:'测试搭子',kind:'学习搭子',need:'图书馆'})]
  ];
  const restored=env.reload();
  for (const [type,postId] of ids) {assert.equal(restored.get(type,postId).owner,'me');assert.ok(restored.mine().some(post => post.id===postId));assert.ok(restored.messages().some(message => message.target.id===postId));}
  assert.equal(restored.points(),330);
});
test('编辑、关闭、重新发布及安全失效',() => {
  const env=setup(),postId=env.store.publish('goods',goods);
  env.store.publish('goods',{...goods,title:'修改标题'},postId);
  env.store.setStatus('goods',postId,'closed');
  assert.ok(!env.store.visible('goods').some(post => post.id===postId));
  env.store.setStatus('goods',postId,'active');
  assert.equal(env.reload().get('goods',postId).title,'修改标题');
  assert.throws(() => env.store.setStatus('goods','i1','closed'));
  assert.equal(env.store.get('goods','not-found'),undefined);
});
test('收藏、参与、消息已读、积分不会重复',() => {
  const env=setup();
  env.store.favorite('goods','i1');assert.equal(env.reload().data().favorites.length,1);
  env.store.favorite('goods','i1');assert.equal(env.reload().data().favorites.length,0);
  env.store.join('activities','a1');assert.throws(() => env.store.join('activities','a1'));
  env.store.join('help','h1');
  assert.equal(env.reload().data().participations.length,2);
  assert.equal(env.store.points(),330);
  env.store.cancel('activities','a1');assert.equal(env.store.points(),320);
  env.store.join('activities','a1');assert.equal(env.store.points(),320);
  env.store.readMessages();assert.ok(env.reload().messages().every(message => message.read));
});
test('问卷必填、多选校验、结果、去重、积分及刷新',() => {
  const env=setup();
  assert.throws(() => env.store.submitSurvey('h3',{q1:'每月一次',q2:[]}));
  assert.throws(() => env.store.submitSurvey('h3',{q1:'不存在',q2:['价格']}));
  env.store.submitSurvey('h3',{q1:'每月一次',q2:['价格','便利程度'],q3:'<img src=x onerror=alert(1)>'});
  assert.equal(env.reload().surveyResults('h3').length,1);
  assert.equal(env.store.points(),340);
  assert.throws(() => env.store.submitSurvey('h3',{q1:'每月一次',q2:['价格']}));
  assert.equal(env.store.points(),340);
  assert.equal(env.store.participation('help','h3').status,'已提交');
});
test('失物认领必须填写特征，不直接完成',() => {
  const env=setup();
  assert.throws(() => env.store.claim('l5',{feature:'',time:'昨天',spot:'东苑'}));
  env.store.claim('l5',{feature:'伞柄姓名贴',time:'昨天',spot:'东苑'});
  assert.equal(env.reload().data().applications[0].status,'pending');
  assert.equal(env.store.get('lost','l5').status,'active');
  assert.throws(() => env.store.claim('l5',{feature:'重复',time:'昨天',spot:'东苑'}));
});
test('存储容量不足时回滚整个操作',() => {
  const env=setup(),before=JSON.stringify(env.store.data());
  env.adapter.setItem=() => {const error=new Error('full');error.name='QuotaExceededError';throw error;};
  assert.throws(() => env.store.publish('goods',goods),/容量不足/);
  assert.equal(JSON.stringify(env.store.data()),before);
});
test('旧版个人资料与有效照片迁移，不改写旧键',() => {
  const oldUser=JSON.stringify({name:'旧用户',college:'测试学院',avatar:'javascript:alert(1)'});
  const photo='data:image/jpeg;base64,/9j/';
  const env=setup({campus_user:oldUser,campus_snaps:JSON.stringify([{id:'u123',src:photo,cap:'照片',by:'旧用户'}])});
  assert.equal(env.store.data().user.name,'旧用户');assert.equal(env.store.data().user.avatar,'');assert.equal(env.store.data().snaps.length,1);
  env.store.favorite('goods','i1');assert.equal(env.reload().data().user.name,'旧用户');assert.equal(env.saved.get('campus_user'),oldUser);
});
test('损坏数据、错误字段和较新版本不会导致白屏',() => {
  const baseline=setup(),key=baseline.context.Campus.Storage.KEY;
  const corrupt=setup({[key]:'not json',campus_snaps:'{}'});assert.equal(corrupt.store.visible('goods').length,11);
  assert.ok(corrupt.storage.notices.length);
  const invalid=baseline.context.Campus.Storage.defaults();invalid.custom.goods=[null,{}];invalid.snaps={};invalid.user={name:42};
  const env=setup({[key]:JSON.stringify(invalid)});assert.equal(env.store.data().user.name,'陈拾');
  const future=setup({[key]:JSON.stringify({version:99})});assert.throws(() => future.store.favorite('goods','i1'));assert.equal(JSON.parse(future.saved.get(key)).version,99);
});
test('备份恢复与重置，不重新导入旧数据',() => {
  const env=setup();env.store.publish('goods',goods);env.store.favorite('goods','i1');
  const key=env.context.Campus.Storage.KEY;env.saved.set(key,'{');
  const restored=env.reload();assert.equal(restored.data().custom.goods.length,1);
  env.saved.set('campus_user',JSON.stringify({name:'旧用户'}));restored.reset();
  assert.equal(env.reload().data().user.name,'陈拾');assert.equal(env.reload().data().custom.goods.length,0);assert.equal(env.reload().points(),320);
});
test('详情深链接和旧版地址解析',() => {
  const {context}=setup(),router=context.Campus.Router;
  for (const [page,postId] of [['item','i1'],['lostdetail','l5'],['actdetail','a1'],['helpdetail','h3']]) {
    const restored=router.decode(router.encode({page,id:postId}));assert.equal(restored.page,page);assert.equal(restored.id,postId);
  }
  assert.equal(router.decode('#page=market').page,'market');assert.equal(router.decode('#/%E0%A4%A').page,'home');
  assert.equal(router.decode('#/unknown').page,'home');
});
test('全局搜索五类内容与安全转义',() => {
  const env=setup();
  for (const keyword of ['高等数学','黑色雨伞','航模','考研','图书馆']) assert.ok(env.store.search(keyword).length,keyword);
  assert.ok(env.store.search('图书馆').some(result => result.type==='place'));
  assert.equal(env.context.Campus.Utils.escape('<script>"&\''),'&lt;script&gt;&quot;&amp;&#39;');
  assert.equal(env.context.Campus.Utils.image('javascript:alert(1)'), '');
});
test('多个标签页并发写入不会覆盖新数据',() => {
  const env=setup(),other=env.reload();
  env.store.publish('goods',goods);
  assert.throws(() => other.favorite('goods','i1'),/另一个标签页/);
  assert.equal(env.reload().data().custom.goods.length,1);
});
test('失物申请须由发布者核验，完成奖励仅一次',() => {
  const env=setup();
  const postId=env.store.publish('lost',{title:'测试拾物',type:'拾物',time:'今天',hiddenFeature:'隐藏编号'});
  assert.throws(() => env.store.setStatus('lost',postId,'completed'),/核对/);
  const snapshot=env.store.data();
  snapshot.applications.push({id:'inbound',type:'lost',postId,status:'pending',feature:'隐藏编号',time:'今天',spot:'图书馆',note:'',at:0});
  env.adapter.setItem(env.context.Campus.Storage.KEY,JSON.stringify(snapshot));
  const restored=env.reload();
  restored.review('inbound',true);assert.equal(restored.data().applications[0].status,'approved');
  restored.setStatus('lost',postId,'completed');assert.equal(restored.points(),380);
  restored.setStatus('lost',postId,'completed');assert.equal(restored.points(),380);
});
test('有回答的问卷不能悄悄改变题目',() => {
  const env=setup();
  const questions=[{id:'custom-q1',title:'选择',type:'单选',required:true,opts:['A','B']}];
  const postId=env.store.publish('help',{title:'问卷',kind:'调查问卷',questions});
  env.store.submitSurvey(postId,{'custom-q1':'A'});
  assert.throws(() => env.store.publish('help',{title:'问卷',kind:'调查问卷',questions:[{...questions[0],title:'不同的题'}]},postId),/不能更改题目/);
  env.store.publish('help',{title:'只修改标题',kind:'调查问卷',questions},postId);
  assert.equal(env.reload().surveyResults(postId).length,1);
});
