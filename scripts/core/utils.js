Campus.Utils = (() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[character]);
  const text = (value, maximum = 4000) => typeof value === 'string' ? value.slice(0, maximum) : '';
  const number = (value, maximum = 1000000) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(maximum, Number(value))) : 0;
  const image = value => typeof value === 'string' && (/^data:image\/(jpeg|png|webp);base64,[a-z\d+/=]+$/i.test(value) || /^assets\/[a-z\d_./-]+\.(jpg|jpeg|png|webp)$/i.test(value)) ? value : '';
  const clone = value => JSON.parse(JSON.stringify(value));
  const id = prefix => prefix + '-' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
  const places = [
    { id:'library', name:'图书馆', aliases:'自习 图书馆西门 图书馆南门', x:44.5, y:45 },
    { id:'lake', name:'沁湖', aliases:'湖畔 沁湖环道', x:57.5, y:46 },
    { id:'west-canteen', name:'西苑餐厅', aliases:'一食堂 西苑', x:19, y:66 },
    { id:'east-canteen', name:'东苑餐厅', aliases:'东苑 食堂', x:54.5, y:65 },
    { id:'north', name:'北门', aliases:'平安大道', x:35.8, y:9 },
    { id:'south', name:'南门', aliases:'相济路 快递点', x:50, y:80 },
    { id:'west', name:'西门', aliases:'文苑西路', x:8, y:46 },
    { id:'east', name:'东门', aliases:'龙子湖西路', x:93, y:38 },
    { id:'plaza', name:'中心广场', aliases:'广场 中轴', x:36, y:69 }
  ];
  const types = ['goods', 'lost', 'activities', 'help'];
  const labels = { goods:'闲置', lost:'失物招领', activities:'活动', help:'互助' };
  const route = (type, postId) => ({ page:({ goods:'item', lost:'lostdetail', activities:'actdetail', help:'helpdetail' })[type], id:postId });
  return { escape, text, number, image, clone, id, places, types, labels, route };
})();
