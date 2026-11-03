Campus.Storage = (() => {
  const { text, number, image, clone, types } = Campus.Utils;
  const KEY = 'campus_v21';
  const VERSION = 1;
  const statuses = ['active','closed','completed'];
  const validId = value => typeof value === 'string' && /^[a-z\d_-]{1,120}$/i.test(value) && !['__proto__','constructor','prototype'].includes(value);
  const array = value => Array.isArray(value) ? value.slice(0, 1000) : [];
  const unique = list => [...new Map(list.map(item => [item.id, item])).values()];
  const defaultUser = () => ({ name:'陈拾', college:'信息管理学院', major:'信息管理与信息系统', avatar:'', color:'#1D4A8C' });
  function questions(value) {
    return unique(array(value).slice(0,5).filter(question => question && validId(question.id)).map(question => ({
      id:question.id, title:text(question.title,200), type:['单选','多选','填空'].includes(question.type) ? question.type : '单选',
      required:question.required !== false, opts:array(question.opts).slice(0,8).map(option => text(option,120))
    })));
  }
  function post(value) {
    const result = {};
    for (const key of ['title','cat','cond','spot','seller','dept','note','type','desc','contact','time','day','mon','by','src','tag','kind','need','gift','st']) result[key] = text(value[key], key === 'desc' || key === 'note' ? 4000 : 200);
    for (const key of ['price','orig','limit','joined','joins','mins','circ']) result[key] = number(value[key]);
    result.id = value.id;
    result.owner = value.owner === 'me' ? 'me' : 'seed';
    result.status = statuses.includes(value.status) ? value.status : 'active';
    result.createdAt = number(value.createdAt, Number.MAX_SAFE_INTEGER);
    result.updatedAt = number(value.updatedAt, Number.MAX_SAFE_INTEGER);
    result.hiddenFeature = text(value.hiddenFeature,300);
    result.questions = questions(value.questions);
    result.c = ['#1D4A8C','#2B62B4'];
    return result;
  }
  function defaults() {
    return {
      version:VERSION, user:defaultUser(), custom:Object.fromEntries(types.map(type => [type,[]])), overrides:Object.fromEntries(types.map(type => [type,{}])),
      favorites:[], participations:[], applications:[], responses:[], messages:[], readMessages:[], snaps:[],
      ledger:[{ id:'initial', ref:'initial', amount:320, reason:'原型初始积分（迁移基数）', at:0 }], drafts:{}, updatedAt:0
    };
  }
  function normalize(source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('存储格式不正确');
    if (source.version !== VERSION) throw new Error('存储版本不受支持');
    const output = defaults();
    const user = source.user || {};
    output.user = { name:text(user.name,12) || '陈拾', college:text(user.college,80), major:text(user.major,80), avatar:image(user.avatar), color:/^#[a-f\d]{6}$/i.test(user.color) ? user.color : '#1D4A8C' };
    for (const type of types) {
      output.custom[type] = unique(array(source.custom?.[type]).filter(value => value && validId(value.id)).map(value => ({ ...post(value), owner:'me' })));
      const changes = source.overrides?.[type];
      if (changes && typeof changes === 'object') for (const [postId, value] of Object.entries(changes).slice(0,1000)) if (validId(postId) && value && typeof value === 'object') output.overrides[type][postId] = post({ ...value, id:postId });
    }
    output.favorites = unique(array(source.favorites).filter(value => value && types.includes(value.type) && validId(value.postId)).map(value => ({ id:value.type + ':' + value.postId, type:value.type, postId:value.postId, title:text(value.title,200) })));
    output.participations = unique(array(source.participations).filter(value => value && validId(value.id) && types.includes(value.type) && validId(value.postId)).map(value => ({
      id:value.id, type:value.type, postId:value.postId, title:text(value.title,200), status:text(value.status,30), at:number(value.at,Number.MAX_SAFE_INTEGER), note:text(value.note,500)
    })));
    output.applications = unique(array(source.applications).filter(value => value && validId(value.id) && ['lost','help'].includes(value.type) && validId(value.postId)).map(value => ({
      id:value.id, type:value.type, postId:value.postId, applicant:'me', status:['pending','approved','rejected'].includes(value.status) ? value.status : 'pending',
      feature:text(value.feature,300), time:text(value.time,100), spot:text(value.spot,200), note:text(value.note,1000), at:number(value.at,Number.MAX_SAFE_INTEGER)
    })));
    output.responses = unique(array(source.responses).filter(value => value && validId(value.id) && validId(value.postId)).map(value => ({
      id:value.id, postId:value.postId, at:number(value.at,Number.MAX_SAFE_INTEGER), answers:Object.fromEntries(Object.entries(value.answers && typeof value.answers === 'object' ? value.answers : {}).filter(([key]) => validId(key)).slice(0,5).map(([key, answer]) => [key, Array.isArray(answer) ? answer.slice(0,8).map(option => text(option,120)) : text(answer,2000)]))
    })));
    output.messages = unique(array(source.messages).filter(value => value && validId(value.id)).map(value => ({ id:value.id, title:text(value.title,200), text:text(value.text,1500), read:!!value.read, at:number(value.at,Number.MAX_SAFE_INTEGER), target:cleanTarget(value.target), kind:'sys' })));
    output.readMessages = [...new Set(array(source.readMessages).filter(validId))];
    output.snaps = unique(array(source.snaps).filter(value => value && validId(value.id) && image(value.src)).map(value => ({ id:value.id, src:image(value.src), cap:text(value.cap,40), by:text(value.by,100), time:text(value.time,50), likes:number(value.likes), at:number(value.at,Number.MAX_SAFE_INTEGER) })));
    output.ledger = unique(array(source.ledger).filter(value => value && validId(value.id) && typeof value.ref === 'string' && Number.isFinite(value.amount)).map(value => ({ id:value.id, ref:text(value.ref,180), amount:Math.round(Math.max(-1000,Math.min(1000,value.amount))), reason:text(value.reason,200), at:number(value.at,Number.MAX_SAFE_INTEGER) })));
    if (!output.ledger.some(entry => entry.ref === 'initial')) output.ledger.unshift(defaults().ledger[0]);
    const seenRefs = new Set();
    output.ledger = output.ledger.filter(entry => !seenRefs.has(entry.ref) && seenRefs.add(entry.ref));
    if (source.drafts && typeof source.drafts === 'object') output.drafts = Object.fromEntries(Object.entries(source.drafts).filter(([key,value]) => /^[a-z\d_-]+$/i.test(key) && value && typeof value === 'object').slice(0,20));
    output.updatedAt = number(source.updatedAt,Number.MAX_SAFE_INTEGER);
    return output;
  }
  function cleanTarget(value) {
    const pages = ['home','market','campus','help','mine','item','lost','lostdetail','acts','actdetail','helpdetail','profile','msg','snaps','map','points'];
    return value && pages.includes(value.page) ? { page:value.page, ...(validId(value.id) ? { id:value.id } : {}) } : { page:'home' };
  }
  function create(adapter) {
    const notices = [];
    let blocked = false;
    let expectedPrimary = null;
    function read(key) {
      try { return adapter.getItem(key); } catch { blocked = true; notices.push('浏览器不允许读取本地数据，当前为只读预览；请允许本站存储后重试。'); return null; }
    }
    function load() {
      const raw = read(KEY);
      expectedPrimary = raw;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Number(parsed?.version) > VERSION) { blocked = true; notices.push('检测到更新版本数据，已停止写入以保护原数据。'); return defaults(); }
          return normalize(parsed);
        } catch {
          try { adapter.setItem(KEY + '.recovery', raw); } catch {}
          const backup = read(KEY + '.backup');
          if (backup) try { const restored=normalize(JSON.parse(backup)); notices.push('本地数据损坏，已从上次备份恢复。原数据保留在恢复副本中。'); return restored; } catch {}
          notices.push('本地数据损坏，已加载初始内容；可用的旧版资料和照片将尝试迁移。');
        }
      }
      const output = defaults();
      const oldUser = read('campus_user');
      const oldSnaps = read('campus_snaps');
      if (oldUser) try { output.user={ ...output.user,...JSON.parse(oldUser) }; } catch { notices.push('旧版个人资料格式损坏，已保留原始存储。'); }
      if (oldSnaps) try { const parsed=JSON.parse(oldSnaps); if (!Array.isArray(parsed)) throw new Error(); output.snaps=parsed; } catch { notices.push('旧版随拍格式损坏，已保留原始存储。'); }
      const normalized = normalize(output);
      return normalized;
    }
    function save(value) {
      if (blocked) throw new Error('本地存储不可用，修改尚未保存。请允许本站存储后重试。');
      const serialized = JSON.stringify(value);
      try {
        const previous = adapter.getItem(KEY);
        if (previous !== expectedPrimary) throw new Error('CONFLICT');
        if (previous) try { normalize(JSON.parse(previous)); adapter.setItem(KEY + '.backup',previous); } catch {}
        adapter.setItem(KEY, serialized);
        expectedPrimary = serialized;
      } catch (error) {
        if (error?.message === 'CONFLICT') throw new Error('另一个标签页已修改数据。本次未覆盖，请刷新后重试。');
        throw new Error(error?.name === 'QuotaExceededError' ? '本机存储容量不足，操作未保存。请减少随拍图片，或先备份并清理本站数据。' : '无法保存本地数据，操作未生效。请检查浏览器存储设置。');
      }
    }
    function reset() {
      const output=defaults(); save(output);
      for (const key of ['campus_user','campus_snaps',KEY + '.backup',KEY + '.recovery']) try { adapter.removeItem(key); } catch {}
      return output;
    }
    return { load, save, reset, notices };
  }
  return { KEY, VERSION, create, defaults, normalize, questions };
})();
