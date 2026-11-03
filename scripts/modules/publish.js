Campus.Publish = (() => {
  const { escape:esc, id, types, route, places, clone } = Campus.Utils;
  let app;
  let model;
  let pendingType;
  let draftTimer;
  const labels={goods:'闲置物品',lost:'失物招领',activities:'校园活动',help:'互助求助'};
  const blankQuestion = () => ({id:id('q'),type:'单选',title:'',required:true,opts:['','','']});
  const options = (values,value) => values.map(option => `<option ${option === value ? 'selected' : ''}>${esc(option)}</option>`).join('');
  const field = (label,name,value='',attributes='') => `<div class="field"><label for="pub-${name}">${esc(label)}</label><input id="pub-${name}" name="${name}" value="${esc(value)}" ${attributes}></div>`;
  function start(type) {
    pendingType=({act:'activities'})[type] || type;
    app.router.go('publish');
  }
  function restore(target) {
    const draft=app.store.data().drafts.publish;
    if (target.id) {
      const post=app.store.get(target.type,target.id);
      if (!post || post.owner !== 'me') return null;
      if (draft?.editId === target.id && draft?.type === target.type) return normalizeModel(draft);
      return {type:target.type,editId:target.id,fields:clone(post),questions:clone(post.questions || [])};
    }
    if (draft && !draft.editId) {
      const restored=normalizeModel(draft);
      if (pendingType) restored.type=pendingType;
      pendingType=null;
      return restored;
    }
    const type=pendingType || 'goods'; pendingType=null;
    return {type,editId:'',fields:{cat:'书籍',cond:'九成新',type:'失物',kind:'学习搭子'},questions:[]};
  }
  function normalizeModel(value) {
    const fields={};
    for (const key of ['title','price','orig','cat','cond','type','kind','spot','time','note','desc','hiddenFeature','gift','limit']) fields[key]=typeof value.fields?.[key] === 'string' || typeof value.fields?.[key] === 'number' ? String(value.fields[key]).slice(0,4000) : '';
    return {type:types.includes(value.type) ? value.type : 'goods',editId:typeof value.editId === 'string' ? value.editId : '',fields,questions:Campus.Storage.questions(value.questions)};
  }
  function sync() {
    const form=document.getElementById('publishForm'); if (!form || !model) return;
    for (const element of form.querySelectorAll('[name]')) model.fields[element.name]=element.value;
    for (const block of form.querySelectorAll('[data-question]')) {
      const question=model.questions.find(entry => entry.id === block.dataset.question);
      if (!question) continue;
      question.title=block.querySelector('[data-qtitle]').value;
      question.type=block.querySelector('[data-qtype]').value;
      question.required=block.querySelector('[data-qrequired]').checked;
      const options=[...block.querySelectorAll('[data-qoption]')];
      if (options.length) question.opts=options.map(element => element.value);
    }
  }
  function saveDraft() {
    clearTimeout(draftTimer);
    if (!model || !document.querySelector('.page.active #publishForm')) return;
    sync();
    try { app.store.draft(clone(model)); document.getElementById('draftStatus').textContent='草稿已保存在本机'; }
    catch (error) { document.getElementById('draftStatus').textContent=error.message; }
  }
  function editor() {
    const {fields,type}=model;
    const ui=Campus.UI;
    let html=`<div class="nav"><button class="back" data-back>${ui.icon('i-left')}</button><span class="nt">${model.editId ? '编辑发布' : '发布校园信息'}</span></div><div class="scroll"><div class="page-head"><h1>${model.editId ? '更新我的发布' : '让校园里的信息流动起来'}</h1><p id="draftStatus">输入后自动保存草稿 · 仅存于本机</p></div><form id="publishForm" class="form" novalidate><div class="field"><label for="publishType">发布类型</label><select id="publishType" ${model.editId ? 'disabled' : ''}>${types.map(value => `<option value="${value}" ${type === value ? 'selected' : ''}>${labels[value]}</option>`).join('')}</select></div>`;
    if (type === 'goods') html+=`<div class="field"><label for="pub-cat">类别</label><select id="pub-cat" name="cat">${options(['书籍','数码','生活用品','其他'],fields.cat)}</select></div>`;
    if (type === 'lost') html+=`<div class="field"><label for="pub-type">失物 / 拾物</label><select id="pub-type" name="type">${options(['失物','拾物'],fields.type)}</select></div>`;
    if (type === 'help') html+=`<div class="field"><label for="pub-kind">互助类型</label><select id="pub-kind" name="kind">${options(['学习搭子','技能互助','调查问卷'],fields.kind)}</select></div>`;
    html+=field('标题（必填）','title',fields.title,'maxlength="100" required');
    if (type === 'goods') html+=field('面交价格（元，必填）','price',fields.price,'type="number" min="0.01" max="1000000" step="0.01" required')+field('原价（选填）','orig',fields.orig,'type="number" min="0" step="0.01"')+`<div class="field"><label for="pub-cond">成色</label><select id="pub-cond" name="cond">${options(['全新','九成新','八成新','七成新','有笔记'],fields.cond)}</select></div>`;
    const survey=type === 'help' && fields.kind === '调查问卷';
    if (!survey) html+=field(type === 'activities' ? '集合地点' : '地点 / 约定','spot',fields.spot,'maxlength="200" list="campusPlaces"')+`<datalist id="campusPlaces">${places.map(place => '<option value="'+esc(place.name)+'">').join('')}</datalist><div class="place-picker">${places.map(place => `<button type="button" data-publish-place="${place.id}">${esc(place.name)}</button>`).join('')}</div>`;
    if (type === 'activities') html+=field('活动时间（必填）','time',fields.time,'maxlength="100" placeholder="例如：2026-11-07 14:00" required')+field('人数上限（0 为不限）','limit',fields.limit || 0,'type="number" min="0" max="10000" step="1"');
    if (type === 'lost') html+=field('丢失 / 拾取时间（必填）','time',fields.time,'maxlength="100" required')+field('非公开核验特征（必填，仅自己可见）','hiddenFeature',fields.hiddenFeature,'maxlength="300" placeholder="如：杯底贴纸上的文字，不会出现在公开说明中" required');
    if (survey) {
      if (!model.questions.length) model.questions.push(blankQuestion());
      html+=field('填写奖励（选填，发起者自行履行）','gift',fields.gift,'maxlength="200"');
      html+='<div class="field"><label>问卷题目（1～5 题）</label><p class="prose">平台积分为每份问卷首次提交 +20；单选、多选至少需要两个不同选项。</p>';
      html+=model.questions.map((question,index) => `<div class="question-editor" data-question="${esc(question.id)}"><div class="action-row"><b>第 ${index+1} 题</b><select data-qtype aria-label="第 ${index+1} 题类型">${options(['单选','多选','填空'],question.type)}</select><button type="button" data-delete-question="${esc(question.id)}">删除</button></div><input data-qtitle value="${esc(question.title)}" maxlength="200" placeholder="题目内容" aria-label="第 ${index+1} 题题干"><label class="check"><input type="checkbox" data-qrequired ${question.required ? 'checked' : ''}>必填</label>${question.type !== '填空' ? question.opts.map((option,optionIndex) => `<input data-qoption value="${esc(option)}" maxlength="120" placeholder="选项 ${optionIndex+1}" aria-label="第 ${index+1} 题选项 ${optionIndex+1}">`).join('') : ''}</div>`).join('');
      html+='<button type="button" id="newQuestion" class="add-q">＋ 添加一道题</button></div>';
    }
    html+=`<div class="field"><label for="pub-description">补充说明</label><textarea id="pub-description" name="desc" maxlength="4000" placeholder="写清时间、特征或参与要求">${esc(fields.desc || fields.note)}</textarea></div><div class="pubcta"><p class="tip">仅在本机保存，不产生真实交易或跨设备通知。</p><button class="btn primary" id="pubBtn" type="submit">${model.editId ? '保存修改' : '确认发布'}</button></div></form></div>`;
    document.querySelector('[data-page="publish"]').innerHTML=html;
  }
  function render(target) {
    model=restore(target);
    if (!model) {document.querySelector('[data-page="publish"]').innerHTML=Campus.UI.empty('无法编辑这条内容','内容不存在，或不是你的发布。')+Campus.UI.button('返回首页','list','data-type="goods"');return;}
    editor();
  }
  function init(application) {
    app=application;
    document.addEventListener('input',event => { if (event.target.closest('#publishForm')) { clearTimeout(draftTimer); draftTimer=setTimeout(saveDraft,300); } });
    document.addEventListener('change',event => {
      if (!event.target.closest('#publishForm')) return;
      sync();
      if (event.target.id === 'publishType') { model.type=event.target.value; editor(); }
      if (event.target.id === 'pub-kind' || event.target.hasAttribute('data-qtype')) editor();
      saveDraft();
    });
    document.addEventListener('click',event => {
      const element=event.target.closest('[data-publish-place],[data-delete-question],#newQuestion');
      if (!element) return;
      Campus.UI.run(() => {
        sync();
        if (element.dataset.publishPlace) { model.fields.spot=places.find(place => place.id === element.dataset.publishPlace).name; }
        if (element.dataset.deleteQuestion) model.questions=model.questions.filter(question => question.id !== element.dataset.deleteQuestion);
        if (element.id === 'newQuestion') { if (model.questions.length>=5) throw new Error('最多 5 道题');model.questions.push(blankQuestion()); }
        editor();saveDraft();
      });
    });
    document.addEventListener('submit',event => {
      if (event.target.id !== 'publishForm') return;
      event.preventDefault();
      clearTimeout(draftTimer);sync();
      Campus.UI.run(() => {
        const fields=model.fields;
        if ((model.type === 'activities' || model.type === 'lost') && !String(fields.time || '').trim()) throw new Error('请填写时间');
        if (model.type === 'activities' && (!Number.isInteger(Number(fields.limit || 0)) || Number(fields.limit || 0) < 0 || Number(fields.limit || 0)>10000)) throw new Error('人数上限须为 0～10000 的整数');
        const postId=app.store.publish(model.type,{...fields,price:Number(fields.price),orig:Number(fields.orig || 0),limit:Number(fields.limit || 0),note:fields.desc || fields.note || '',desc:fields.desc || fields.note || '',need:fields.spot || '约定待补充',src:'学生自发',time:fields.time || '刚刚',day:String(new Date().getDate()),mon:(new Date().getMonth()+1)+'月',questions:model.questions},model.editId);
        const target=route(model.type,postId);
        model=null;
        app.router.go(target.page,target);
        Campus.UI.toast('已保存，可在列表和“我的发布”查看');
      });
    });
    window.addEventListener('pagehide',() => { if (app.router.current().page === 'publish' && model) saveDraft(); });
  }
  return { init,render,start,flush:saveDraft };
})();
