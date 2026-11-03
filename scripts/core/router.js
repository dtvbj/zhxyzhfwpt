Campus.Router = (() => {
  const patterns = { home:'home',market:'market',campus:'campus',help:'help',mine:'mine',lost:'lost',acts:'activities',profile:'profile',msg:'messages',snaps:'snaps',map:'map',publish:'publish',search:'search',points:'points',item:'goods',lostdetail:'lost',actdetail:'activities',helpdetail:'help' };
  const details = { goods:'item',lost:'lostdetail',activities:'actdetail',help:'helpdetail' };
  function encode(target) {
    const base=patterns[target.page] || 'home';
    if (['item','lostdetail','actdetail','helpdetail','map'].includes(target.page) && target.id) return '#/'+base+'/'+encodeURIComponent(target.id);
    if (target.page === 'publish' && target.id) return '#/publish/'+encodeURIComponent(target.type)+'/'+encodeURIComponent(target.id);
    return '#/'+base;
  }
  function decode(hash) {
    if (/^#page=/.test(hash)) { const page=hash.slice(6); return {page:patterns[page] ? page : 'home'}; }
    let parts;
    try { parts=hash.replace(/^#\/?/,'').split('/').map(decodeURIComponent); } catch { return {page:'home',invalid:true}; }
    const [base,postId]=parts;
    if (details[base] && postId) return {page:details[base],id:postId};
    if (base === 'map' && postId) return {page:'map',id:postId};
    if (base === 'publish' && parts[2]) return {page:'publish',type:parts[1],id:parts[2]};
    const simple=Object.keys(patterns).find(page => !['item','lostdetail','actdetail','helpdetail'].includes(page) && patterns[page] === base);
    return {page:simple || 'home',invalid:!simple && !!base};
  }
  function create(host,onRoute) {
    let route=decode(host.location.hash);
    function refresh() { route=decode(host.location.hash); onRoute({...route}); }
    host.addEventListener('hashchange',refresh);
    return {
      start() { host.history.replaceState({campus:true},'',encode(route)); refresh(); },
      go(page,options={}) { const hash=encode({page,...options}); if (host.location.hash === hash) refresh(); else host.location.hash=hash; },
      back() { if (host.history.length>1) host.history.back(); else this.go('home'); },
      current() { return {...route}; }
    };
  }
  return { encode,decode,create };
})();
