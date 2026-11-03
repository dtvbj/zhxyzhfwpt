Campus.Store = (() => {
  const { clone, id, text, number, types, route, places } = Campus.Utils;
  function create(storage, seed = Campus.Seed) {
    let current = storage.load();
    const listeners = new Set();
    const seeds = Object.fromEntries(types.map(type => [type, clone(seed[type]).map(post => ({ ...post, owner:'seed', status:'active', createdAt:0 }))]));
    seeds.goods.find(post => post.id === 'i3').owner = 'me';
    seeds.goods.push(
      { ...seeds.goods[0], id:'i11', owner:'me', title:'数字图像处理（第三版）', price:18, seller:'陈拾', note:'已约定面交，演示发布记录。' },
      { ...seeds.goods[0], id:'i12', owner:'me', title:'大学英语写作教程', price:6, status:'completed', seller:'陈拾', note:'已完成面交，演示发布记录。' }
    );
    for (const post of seeds.help.filter(post => post.kind === '调查问卷')) {
      post.questions = [
        { id:'q1', type:'单选', title:post.id === 'h3' ? '你购买二手书的频率是？' : '你最希望优先改善哪一项服务？', required:true, opts:post.id === 'h3' ? ['每月一次','每学期一次','很少购买'] : ['自习空间','食堂服务','快递服务'] },
        { id:'q2', type:'多选', title:'你最在意哪些方面？', required:true, opts:['价格','便利程度','信息真实性'] },
        { id:'q3', type:'填空', title:'还有什么建议？', required:false, opts:[] }
      ];
      post.qs=3;
      post.mins=2;
      post.title=post.title.replace(/（\d+ 题）/,'（3 题）');
    }
    const seedMessages = seed.messages.map((message,index) => ({ ...message, at:0, target:[route('goods','i3'),route('goods','i1'),route('activities','a2'),route('help','h3'),route('lost','l1'),{page:'home'}][index] }));
    function data() { return clone(current); }
    function emit() { for (const listener of listeners) listener(); }
    function transaction(action) {
      const draft=clone(current);
      const result=action(draft);
      draft.updatedAt=Date.now();
      const normalized=Campus.Storage.normalize(draft);
      storage.save(normalized);
      current=normalized;
      emit();
      return result;
    }
    function all(type, state=current) {
      if (!types.includes(type)) return [];
      return [...state.custom[type], ...seeds[type].filter(post => !state.custom[type].some(custom => custom.id === post.id)).map(post => ({ ...post,...state.overrides[type][post.id] }))].map(clone);
    }
    const get = (type, postId) => all(type).find(post => post.id === postId);
    const visible = type => all(type).filter(post => post.status === 'active');
    const mine = () => types.flatMap(type => all(type).filter(post => post.owner === 'me').map(post => ({...post,postKind:post.type,type})));
    const participation = (type,postId) => clone(current.participations.find(entry => entry.type === type && entry.postId === postId) || null);
    function message(draft,title,body,target) { draft.messages.unshift({id:id('m'),title,text:body,target,read:false,at:Date.now()}); }
    function award(draft,ref,amount,reason) {
      if (!draft.ledger.some(entry => entry.ref === ref)) draft.ledger.unshift({id:id('pt'),ref,amount,reason,at:Date.now()});
    }
    function requireActive(type,postId) {
      const post=get(type,postId);
      if (!post || post.status !== 'active') throw new Error('内容已下架、关闭或不存在。');
      return post;
    }
    function changePost(draft,type,post) {
      const position=draft.custom[type].findIndex(entry => entry.id === post.id);
      if (position >= 0) draft.custom[type][position]=post;
      else draft.overrides[type][post.id]=post;
    }
    function upsertParticipation(draft,type,post,status,note='') {
      let entry=draft.participations.find(row => row.type === type && row.postId === post.id);
      if (!entry) { entry={id:id('join'),type,postId:post.id,title:post.title,at:Date.now()}; draft.participations.unshift(entry); }
      Object.assign(entry,{status,note,title:post.title});
    }
    function validate(type,payload) {
      if (!types.includes(type)) throw new Error('不支持的发布类型');
      const post={...payload,title:text(payload.title,100).trim()};
      if (!post.title) throw new Error('请填写标题');
      if (type === 'goods' && (!Number.isFinite(Number(post.price)) || Number(post.price) <= 0 || Number(post.price)>1000000)) throw new Error('价格须在 0.01～1000000 元之间');
      if (type === 'lost' && !text(post.hiddenFeature,300).trim()) throw new Error('请填写用于核验的非公开特征');
      if (type === 'help' && post.kind === '调查问卷') {
        if (!Array.isArray(post.questions) || !post.questions.length || post.questions.length > 5) throw new Error('问卷需要 1～5 道题');
        post.questions=Campus.Storage.questions(post.questions);
        for (const question of post.questions) {
          if (!question.title.trim()) throw new Error('每一道题都需要题干');
          question.opts=question.opts.map(option => option.trim()).filter(Boolean);
          if (question.type !== '填空' && (question.opts.length < 2 || new Set(question.opts).size !== question.opts.length)) throw new Error('选择题至少需要两个不同的非空选项');
        }
      }
      return post;
    }
    function publish(type,payload,editId) {
      const input=validate(type,payload);
      const previous=editId ? get(type,editId) : null;
      if (editId && (!previous || previous.owner !== 'me')) throw new Error('只能编辑自己的发布');
      if (editId && current.responses.some(response => response.postId === editId)) {
        if (JSON.stringify(previous.questions) !== JSON.stringify(input.questions)) throw new Error('已有回答的问卷不能更改题目，可修改标题和说明');
      }
      return transaction(draft => {
        const user=draft.user;
        const post={...previous,...input,id:editId || id('post'),owner:'me',status:previous?.status || 'active',createdAt:previous?.createdAt || Date.now(),updatedAt:Date.now(),seller:user.name,contact:user.name,by:user.name + ' · ' + user.college,dept:user.college + ' · ' + user.major,c:seed.palettes.navy};
        if (!editId) draft.custom[type].unshift(post); else changePost(draft,type,post);
        message(draft,editId ? '内容已更新' : '发布成功', '「'+post.title+'」已保存到本机，可在对应列表和“我的发布”查看。',route(type,post.id));
        if (!editId) award(draft,'publish-first',10,'首次发布校园信息');
        delete draft.drafts.publish;
        return post.id;
      });
    }
    function setStatus(type,postId,status) {
      const post=get(type,postId);
      if (!post || post.owner !== 'me' || !['active','closed','completed'].includes(status)) throw new Error('无权修改此内容');
      if (type === 'lost' && status === 'completed' && !current.applications.some(application => application.postId === postId && application.status === 'approved')) throw new Error('请先核对并通过一条认领或线索申请，再确认找回或归还');
      transaction(draft => {
        changePost(draft,type,{...post,status,updatedAt:Date.now()});
        message(draft,'发布状态已更新','「'+post.title+'」'+({active:'已重新发布',closed:'已下架 / 关闭',completed:'已确认完成'})[status],route(type,postId));
        if (status === 'completed') award(draft,'complete:'+type+':'+postId,type === 'lost' ? 50 : 20,type === 'lost' ? '确认失物找回 / 归还' : '确认完成：'+post.title);
      });
    }
    function favorite(type,postId) {
      const post=get(type,postId); if (!post && !current.favorites.some(entry => entry.type === type && entry.postId === postId)) throw new Error('内容不存在');
      transaction(draft => {
        const index=draft.favorites.findIndex(entry => entry.type === type && entry.postId === postId);
        if (index>=0) draft.favorites.splice(index,1);
        else draft.favorites.unshift({id:type+':'+postId,type,postId,title:post.title});
      });
    }
    function join(type,postId,note='') {
      const post=requireActive(type,postId);
      if (post.owner === 'me') throw new Error('这是你自己的发布，请到管理页面查看');
      if (type === 'help' && post.kind === '调查问卷') throw new Error('请填写问卷后提交');
      const previous=participation(type,postId);
      if (previous && previous.status !== '已取消') throw new Error('你已经参与过这条内容');
      const count=post.joined + (previous?.status === '已报名' ? 1 : 0);
      if (type === 'activities' && post.limit && count >= post.limit) throw new Error('报名名额已满');
      transaction(draft => {
        const status=type === 'activities' ? '已报名' : type === 'help' ? '待确认' : '联系请求已记录';
        upsertParticipation(draft,type,post,status,text(note,500));
        if (type === 'help') draft.applications.unshift({id:id('application'),type,postId,applicant:'me',status:'pending',feature:'',time:'',spot:post.need,note,at:Date.now()});
        message(draft,type === 'activities' ? '报名成功' : '申请已记录', '「'+post.title+'」已加入“我的参与”。'+(type !== 'activities' ? '当前为本机记录，尚未发送给其他设备。' : ''),route(type,postId));
        if (type === 'activities') award(draft,'join:'+postId,10,'首次报名：'+post.title);
      });
    }
    function cancel(type,postId) {
      const entry=participation(type,postId);
      if (!entry || entry.status === '已提交' || entry.status === '已取消') throw new Error('当前记录不能取消');
      transaction(draft => {
        upsertParticipation(draft,type,{id:postId,title:entry.title},'已取消',entry.note);
        for (const application of draft.applications.filter(application => application.type === type && application.postId === postId && application.status === 'pending')) application.status='rejected';
        message(draft,'参与已取消','你已取消「'+entry.title+'」的参与。',route(type,postId));
        const reward=draft.ledger.find(row => row.ref === 'join:'+postId);
        if (reward) award(draft,'cancel:'+postId,-reward.amount,'取消报名，撤回报名积分');
      });
    }
    function claim(postId,fields) {
      const post=requireActive('lost',postId);
      if (post.owner === 'me') throw new Error('不能认领自己发布的物品');
      if (!text(fields.feature,300).trim() || !text(fields.time,100).trim() || !text(fields.spot,200).trim()) throw new Error('请填写非公开特征、时间和地点');
      if (current.applications.some(entry => entry.type === 'lost' && entry.postId === postId && entry.status !== 'rejected')) throw new Error('申请已提交，请等待核验');
      transaction(draft => {
        draft.applications.unshift({id:id('claim'),type:'lost',postId,applicant:'me',status:'pending',feature:fields.feature,time:fields.time,spot:fields.spot,note:fields.note || '',at:Date.now()});
        upsertParticipation(draft,'lost',post,'待核验');
        message(draft,'认领 / 线索申请已记录','「'+post.title+'」需要发布者核对特征后确认，尚未完成认领。',route('lost',postId));
      });
    }
    function review(applicationId,approved) {
      const application=current.applications.find(entry => entry.id === applicationId);
      const post=application && get(application.type,application.postId);
      if (!post || post.owner !== 'me' || application.status !== 'pending') throw new Error('只能核验自己发布内容的待处理申请');
      transaction(draft => {
        draft.applications.find(entry => entry.id === applicationId).status=approved ? 'approved' : 'rejected';
        upsertParticipation(draft,application.type,post,approved ? '已通过核验' : '未通过核验');
        message(draft,'申请核验结果','「'+post.title+'」'+(approved ? '已通过核验，等待线下交接确认。' : '未通过核验。'),route(application.type,post.id));
      });
    }
    function submitSurvey(postId,answers) {
      const post=requireActive('help',postId);
      if (post.kind !== '调查问卷') throw new Error('这不是问卷');
      if (current.responses.some(response => response.postId === postId)) throw new Error('你已经提交过这份问卷');
      const clean={};
      for (const question of post.questions || []) {
        const value=answers[question.id];
        if (question.type === '多选') {
          const selected=[...new Set(Array.isArray(value) ? value : [])];
          if (selected.some(option => !question.opts.includes(option))) throw new Error('包含无效选项');
          if (question.required && !selected.length) throw new Error('请完成必填题：'+question.title);
          clean[question.id]=selected;
        } else {
          const answer=text(value,2000).trim();
          if (question.required && !answer) throw new Error('请完成必填题：'+question.title);
          if (question.type === '单选' && answer && !question.opts.includes(answer)) throw new Error('包含无效选项');
          clean[question.id]=answer;
        }
      }
      transaction(draft => {
        draft.responses.unshift({id:id('response'),postId,answers:clean,at:Date.now()});
        upsertParticipation(draft,'help',post,'已提交');
        award(draft,'survey:'+postId,20,'提交问卷：'+post.title);
        message(draft,'问卷提交成功','「'+post.title+'」的回答已保存在本机，获得 20 积分。',route('help',postId));
      });
    }
    function messages() { return [...current.messages,...seedMessages.map(message => ({...message,read:message.read || current.readMessages.includes(message.id)}))].map(clone); }
    function readMessages(messageId) {
      transaction(draft => {
        for (const message of draft.messages) if (!messageId || message.id === messageId) message.read=true;
        for (const message of seedMessages) if (!messageId || message.id === messageId) if (!draft.readMessages.includes(message.id)) draft.readMessages.push(message.id);
      });
    }
    function saveUser(fields) {
      if (!text(fields.name,12).trim()) throw new Error('请填写昵称');
      transaction(draft => { draft.user={...draft.user,...fields}; award(draft,'profile',10,'完善个人资料'); });
    }
    function addSnap(fields) {
      if (!Campus.Utils.image(fields.src)) throw new Error('请选择有效图片');
      transaction(draft => { draft.snaps.unshift({id:id('u'),src:fields.src,cap:text(fields.cap,40) || '校园随手一拍',by:draft.user.name+' · '+draft.user.college,time:'刚刚',likes:0,at:Date.now()}); });
    }
    function search(keyword) {
      const words=text(keyword,100).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      if (!words.length) return [];
      const results=types.flatMap(type => visible(type).map(post => ({type,id:post.id,title:post.title,description:post.desc || post.note || post.need || post.spot || '',target:route(type,post.id)})));
      results.push(...places.map(place => ({type:'place',id:place.id,title:place.name,description:place.aliases,target:{page:'map',id:place.id}})));
      return results.filter(result => words.every(word => (result.title+' '+result.description).toLocaleLowerCase().includes(word))).sort((left,right) => Number(right.title.includes(keyword))-Number(left.title.includes(keyword)));
    }
    function badges() {
      const posts=mine(), points=current.ledger.reduce((sum,row) => sum+row.amount,0);
      return [
        { name:'初读者', got:posts.some(post => post.type === 'goods' && post.cat === '书籍'), detail:'发布一本书籍' },
        { name:'传递者', got:posts.some(post => post.type === 'goods' && post.status === 'completed'), detail:'完成一次闲置流转' },
        { name:'共读伙伴', got:points>=500, detail:'累计达到 500 积分' }
      ];
    }
    function reset() { current=storage.reset(); emit(); }
    return {
      data, all, get, visible, mine, publish, setStatus, favorite, participation, join, cancel, claim, review, submitSurvey, messages, readMessages, saveUser, addSnap, search, badges, reset,
      onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      draft(value) { transaction(state => { state.drafts.publish=value; }); },
      removeSnap(snapId) { transaction(state => { state.snaps=state.snaps.filter(snap => snap.id !== snapId); }); },
      points() { return current.ledger.reduce((sum,row) => sum+row.amount,0); },
      surveyResults(postId) { return clone(current.responses.filter(response => response.postId === postId)); },
      favoriteOf(type,postId) { return current.favorites.some(entry => entry.type === type && entry.postId === postId); },
      activityCount(post) { return number(post.joined) + (participation('activities',post.id)?.status === '已报名' ? 1 : 0); }
    };
  }
  return { create };
})();
