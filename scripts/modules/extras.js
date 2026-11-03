Campus.Extras = (() => {
  const {escape:esc,places,image,route}=Campus.Utils;
  let app;
  let avatar='';
  let pickedPhoto='';
  let uploading=false;
  const $=selector => document.querySelector(selector);
  function contact(postId) {
    const post=app.store.get('goods',postId),entry=app.store.participation('goods',postId);
    if (entry && entry.status !== '已取消') return Campus.UI.openSheet('<h3>联系记录</h3><p class="prose">'+esc(entry.note)+'</p><p class="prose">状态：'+esc(entry.status)+'。本版不会向另一位用户实际发送消息。</p>');
    Campus.UI.openSheet(`<h3>联系卖家</h3><p class="prose">${esc(post.title)} · ${esc(post.seller)}<br>联系请求仅保存到本机。</p><form id="contactForm" data-id="${esc(postId)}"><div class="field"><label for="contactSpot">面交地点</label><select id="contactSpot">${places.map(place => `<option ${place.name === post.spot ? 'selected' : ''}>${esc(place.name)}</option>`).join('')}</select></div><div class="field"><label for="contactTime">希望面交时间（必填）</label><input id="contactTime" maxlength="100" placeholder="例如：明天 19:00" required></div><button class="btn primary" type="submit">保存联系请求</button></form>`);
  }
  function claim(postId) {
    const entry=app.store.participation('lost',postId);
    const application=app.store.data().applications.find(value => value.type === 'lost' && value.postId === postId && value.status !== 'rejected');
    if (application && entry && entry.status !== '已取消') return Campus.UI.openSheet('<h3>我的核验申请</h3><p class="prose">状态：'+esc(entry.status)+'</p><p class="prose">我提交的特征：'+esc(application.feature)+'</p><p class="prose">'+esc(application.time)+' · '+esc(application.spot)+'</p>');
    Campus.UI.openSheet(`<h3>提交认领 / 线索申请</h3><p class="prose">请描述只有物主知道的细节。提交后保持“待核验”，由发布者核对后确认。</p><form id="claimForm" data-id="${esc(postId)}"><div class="field"><label for="claimFeature">非公开特征（必填）</label><input id="claimFeature" maxlength="300" required></div><div class="field"><label for="claimTime">丢失 / 发现时间（必填）</label><input id="claimTime" maxlength="100" required></div><div class="field"><label for="claimSpot">丢失 / 发现地点（必填）</label><input id="claimSpot" maxlength="200" required></div><div class="field"><label for="claimNote">补充说明</label><textarea id="claimNote" maxlength="1000"></textarea></div><button class="btn primary" type="submit">提交核验申请</button></form>`);
  }
  function surveyHTML(post) {
    const responses=app.store.surveyResults(post.id);
    let html='<div class="block" id="surveySection"><h3>填写问卷</h3>';
    if (responses.length) html+='<p class="prose">你已提交过这份问卷，不能重复提交或重复领取积分。</p>';
    else if (post.status !== 'active') html+='<p class="prose">这份问卷已关闭，仍可查看本机统计。</p>';
    else html+=`<form id="surveyForm" data-id="${esc(post.id)}">${(post.questions || []).map((question,index) => `<fieldset class="survey-question"><legend>${index+1}. ${esc(question.title)} ${question.required ? '（必填）' : '（选填）'}</legend>${question.type === '填空' ? `<textarea name="${esc(question.id)}" maxlength="2000" aria-label="${esc(question.title)}"></textarea>` : question.opts.map(option => `<label class="survey-option"><input type="${question.type === '多选' ? 'checkbox' : 'radio'}" name="${esc(question.id)}" value="${esc(option)}">${esc(option)}</label>`).join('')}</fieldset>`).join('')}<button class="btn primary" type="submit">提交问卷 · +20 积分</button></form>`;
    html+='</div><div class="block"><h3>本机结果统计</h3><p class="prose">已提交 '+responses.length+' 份。本统计只包含此浏览器保存的实际回答，不包含初始示例中的历史人数。</p>';
    for (const question of post.questions || []) {
      html+='<div class="result-question"><b>'+esc(question.title)+'</b>';
      if (question.type === '填空') {
        const answers=responses.map(response => response.answers[question.id]).filter(answer => typeof answer === 'string' && answer);
        html+=answers.length ? answers.map(answer => '<p class="prose answer">'+esc(answer)+'</p>').join('') : '<p class="prose">暂无文字回答</p>';
      } else {
        html+=question.opts.map(option => {
          const count=responses.filter(response => Array.isArray(response.answers[question.id]) ? response.answers[question.id].includes(option) : response.answers[question.id] === option).length;
          const percent=responses.length ? Math.round(count/responses.length*100) : 0;
          return `<div class="result-option"><div><span>${esc(option)}</span><b>${count} 票 · ${percent}%</b></div><div class="result-bar"><i style="width:${percent}%"></i></div></div>`;
        }).join('');
      }
      html+='</div>';
    }
    return html+'</div>';
  }
  function profile() {
    const user=app.store.data().user;
    avatar=user.avatar;
    $('[data-page="profile"]').innerHTML=`<div class="nav"><button class="back" data-back>${Campus.UI.icon('i-left')}</button><span class="nt">个人资料</span></div><div class="scroll"><div class="avatar-row"><div class="bigav" id="profileAvatar"></div><div><label class="btn ghost" for="avatarFile">上传头像</label><input type="file" id="avatarFile" accept="image/jpeg,image/png,image/webp" hidden><p class="prose">头像会裁剪为正方形，仅保存在本机。</p></div></div><form id="profileForm" class="form"><div class="field"><label for="profileName">昵称（必填）</label><input id="profileName" maxlength="12" value="${esc(user.name)}" required></div><div class="field"><label for="profileCollege">学院（可选择或输入）</label><input id="profileCollege" maxlength="80" list="collegeList" value="${esc(user.college)}"><datalist id="collegeList">${['商学院','管理工程学院','信息管理学院','航空宇航学院','航空发动机学院','计算机学院','外国语学院','电子信息学院','材料学院'].map(name => '<option value="'+esc(name)+'">').join('')}</datalist></div><div class="field"><label for="profileMajor">专业</label><input id="profileMajor" maxlength="80" value="${esc(user.major)}"></div><div class="field"><label for="profileColor">头像底色</label><input id="profileColor" type="color" value="${esc(user.color)}"></div><p class="prose">资料只保存在本机浏览器，不收集学号与联系方式。</p><button class="btn primary" type="submit">保存个人资料</button></form></div>`;
    Campus.UI.paintAvatar($('#profileAvatar'),user);
  }
  function snaps() {
    const entries=[...app.store.data().snaps,...Campus.Seed.snaps];
    $('#snapGrid').innerHTML=entries.map(snap => `<div class="photo-card"><img src="${esc(image(snap.src))}" alt="${esc(snap.cap)}" loading="lazy"><div class="pc-cap">${esc(snap.cap)}</div><div class="pc-meta"><span>${esc(snap.by)}</span><b>♡ ${Number(snap.likes)||0}</b></div>${snap.id.startsWith('u') ? Campus.UI.button('删除我的照片','remove-snap',`data-id="${esc(snap.id)}"`) : ''}</div>`).join('') || Campus.UI.empty('暂无照片');
  }
  function openSnap() {
    pickedPhoto='';
    Campus.UI.openSheet('<h3>发一张校园随拍</h3><p class="prose">图片会在本机压缩保存，请避免一次上传过多照片。</p><form id="snapForm"><label class="snap-box" id="snapPreview" for="snapUpload">点击选择照片</label><input type="file" id="snapUpload" accept="image/jpeg,image/png,image/webp" hidden><textarea class="snap-cap" id="snapCaption" maxlength="40" placeholder="配一句话，最多 40 字" aria-label="照片配文"></textarea><button class="btn primary" type="submit">发布随拍</button></form>');
  }
  async function readImage(file,maximum,crop=false) {
    if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('请选择 JPEG、PNG 或 WebP 图片');
    if (file.size > 12*1024*1024) throw new Error('图片过大，请选择 12 MB 以下图片');
    const url=URL.createObjectURL(file);
    try {
      const photo=await new Promise((resolve,reject) => { const img=new Image();img.onload=() => resolve(img);img.onerror=() => reject(new Error('图片无法读取，请换一张图片'));img.src=url; });
      if (photo.width*photo.height > 40000000) throw new Error('图片分辨率过高，请先缩小后上传');
      const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
      if (crop) {const side=Math.min(photo.width,photo.height);canvas.width=maximum;canvas.height=maximum;context.drawImage(photo,(photo.width-side)/2,(photo.height-side)/2,side,side,0,0,maximum,maximum);}
      else {const scale=Math.min(1,maximum/Math.max(photo.width,photo.height));canvas.width=Math.round(photo.width*scale);canvas.height=Math.round(photo.height*scale);context.drawImage(photo,0,0,canvas.width,canvas.height);}
      return canvas.toDataURL('image/jpeg',0.72);
    } finally { URL.revokeObjectURL(url); }
  }
  function map(target) {
    $('#poiRow').innerHTML=places.map(place => `<button type="button" data-map-place="${place.id}" class="${target.id === place.id ? 'selected' : ''}">${esc(place.name)}</button>`).join('');
    if (!$('#mapMarker')) {
      const marker=document.createElement('span'); marker.id='mapMarker'; marker.className='map-marker'; marker.hidden=true; $('#mapInner').append(marker);
      $('#mapInner').parentElement.id='mapViewport';
      $('#mapInner').insertAdjacentHTML('afterend','<p class="prose map-selection" id="mapSelection">点击地点标签定位；位置为平面图上的近似标注。</p>');
    }
    const selected=places.find(place => place.id === target.id);
    if (selected) {
      const marker=$('#mapMarker');marker.hidden=false;marker.style.left=selected.x+'%';marker.style.top=selected.y+'%';marker.textContent=selected.name;
      $('#mapInner').classList.add('zoom');
      $('#mapSelection').textContent='已定位：'+selected.name+'（平面图近似位置）';
      requestAnimationFrame(() => {
        const viewport=$('#mapViewport'),mapElement=$('#mapInner');
        viewport.scrollTo({left:mapElement.offsetWidth*selected.x/100-viewport.clientWidth/2,top:mapElement.offsetHeight*selected.y/100-viewport.clientHeight/2,behavior:'smooth'});
      });
    }
  }
  function render(target) { if (target.page === 'profile') profile(); if (target.page === 'snaps') snaps(); if (target.page === 'map') map(target); }
  function init(application) {
    app=application;
    $('#snapAdd').onclick=openSnap;
    let taps=0,timer;
    $('#eggEmblem').onclick=() => {clearTimeout(timer);timer=setTimeout(() => {taps=0;},2200);if (++taps>=5) {taps=0;$('#eggLayer').classList.add('show');}else if (taps === 3) Campus.UI.toast('再点 2 次试试？');};
    $('#eggGo').onclick=() => window.open('https://www.zua.edu.cn','_blank','noopener,noreferrer');
    $('#eggClose').onclick=() => $('#eggLayer').classList.remove('show');
    $('#eggFly').onclick=() => {$('#egg2Title').textContent='去像素校园走一走';$('#egg2Desc').textContent='探索校园地标，收集印章，生成漫游纪念卡。';$('#egg2Go').textContent='进入云端漫游';$('#egg2Layer').classList.add('show');};
    $('#egg2Go').onclick=() => window.open('https://zuaxiaoyuanditu.pages.dev/','_blank','noopener,noreferrer');
    $('#egg2Close').onclick=() => $('#egg2Layer').classList.remove('show');
    $('#mapInner').addEventListener('click',() => $('#mapInner').classList.toggle('zoom'));
    document.addEventListener('click',event => {
      const place=event.target.closest('[data-map-place]'); if (place) app.router.go('map',{id:place.dataset.mapPlace});
      const remove=event.target.closest('[data-action="remove-snap"]');
      if (remove) Campus.UI.openSheet('<h3>删除这张照片？</h3><p class="prose">删除后无法恢复。</p>'+Campus.UI.button('确认删除','confirm-remove-snap',`data-id="${esc(remove.dataset.id)}"`,'primary'));
      const confirm=event.target.closest('[data-action="confirm-remove-snap"]');
      if (confirm) Campus.UI.run(() => {app.store.removeSnap(confirm.dataset.id);Campus.UI.closeSheet();snaps();Campus.UI.toast('照片已删除');});
    });
    document.addEventListener('change',async event => {
      if (!['avatarFile','snapUpload'].includes(event.target.id)) return;
      uploading=true;
      const input=event.target;
      try {
        const value=await readImage(input.files[0],input.id === 'avatarFile' ? 168 : 900,input.id === 'avatarFile');
        if (input.id === 'avatarFile' && $('#profileAvatar')) {avatar=value;Campus.UI.paintAvatar($('#profileAvatar'),{...app.store.data().user,avatar});}
        if (input.id === 'snapUpload' && $('#snapPreview')) {pickedPhoto=value;const preview=document.createElement('img');preview.src=value;preview.alt='随拍预览';$('#snapPreview').replaceChildren(preview);}
      } catch (error) {Campus.UI.toast(error.message);} finally {uploading=false;input.value='';}
    });
    document.addEventListener('submit',event => {
      const form=event.target;
      if (!['contactForm','claimForm','surveyForm','profileForm','snapForm'].includes(form.id)) return;
      event.preventDefault();
      Campus.UI.run(() => {
        if (uploading) throw new Error('图片处理中，请稍候');
        if (form.id === 'contactForm') {const time=$('#contactTime').value.trim();if (!time) throw new Error('请填写面交时间');app.store.join('goods',form.dataset.id,$('#contactSpot').value+' · '+time);Campus.UI.closeSheet();Campus.UI.render(app.router.current());Campus.UI.toast('联系请求已保存到我的参与');}
        if (form.id === 'claimForm') {app.store.claim(form.dataset.id,{feature:$('#claimFeature').value,time:$('#claimTime').value,spot:$('#claimSpot').value,note:$('#claimNote').value});Campus.UI.closeSheet();Campus.UI.render(app.router.current());Campus.UI.toast('申请已记录，等待发布者核验');}
        if (form.id === 'surveyForm') {
          const post=app.store.get('help',form.dataset.id),answers={},fields=new FormData(form);
          for (const question of post.questions) answers[question.id]=question.type === '多选' ? fields.getAll(question.id) : fields.get(question.id) || '';
          app.store.submitSurvey(post.id,answers);Campus.UI.render(app.router.current());Campus.UI.toast('问卷已提交，+20 积分');
        }
        if (form.id === 'profileForm') {app.store.saveUser({name:$('#profileName').value.trim(),college:$('#profileCollege').value.trim(),major:$('#profileMajor').value.trim(),color:$('#profileColor').value,avatar});Campus.UI.toast('个人资料已保存');}
        if (form.id === 'snapForm') {if (!pickedPhoto) throw new Error('请先选择照片');app.store.addSnap({src:pickedPhoto,cap:$('#snapCaption').value.trim()});Campus.UI.closeSheet();snaps();Campus.UI.toast('随拍已保存');}
      });
    });
  }
  return {init,render,contact,claim,surveyHTML};
})();
