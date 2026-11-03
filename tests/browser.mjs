import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try {playwright=require('playwright');} catch {
  const bundled=process.env.PLAYWRIGHT_MODULE || path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  playwright=require(bundled);
}
const base=process.env.TEST_URL || 'http://' + ['127','0','0','1'].join('.') + ':4173';
const installedChrome=path.join(process.env.PROGRAMFILES || 'C:/Program Files','Google/Chrome/Application/chrome.exe');
const executable=process.env.CHROME_PATH || (fs.existsSync(installedChrome) ? installedChrome : undefined);
const browser=await playwright.chromium.launch({executablePath:executable,headless:true});
const errors=[];
const report=[];
const artifacts=path.resolve(import.meta.dirname,'../test-results');
fs.mkdirSync(artifacts,{recursive:true});
async function check(name,action) {await action();report.push(name);console.log('PASS '+name);}
async function ready(page,url='/') {await page.goto(base+url);await page.waitForFunction(() => globalThis.Campus?.App?.router);}
const context=await browser.newContext({viewport:{width:1280,height:960}});
const page=await context.newPage();
page.on('pageerror',error => errors.push(error.message));
page.on('console',message => {if (message.type()==='error' && !message.text().includes('404')) errors.push(message.text());});
try {
  await check('桌面首页与静态资源',async () => {
    await ready(page);
    assert.equal(await page.title(),'校园综合服务平台 · 交互原型 v2.1');
    await page.locator('[data-page="home"].active').waitFor();
    assert.equal(await page.locator('#homeCards .card').count(),4);
    assert.ok(await page.locator('#homeCards .card').first().isVisible());
    await page.screenshot({path:path.join(artifacts,'desktop-home.png'),fullPage:true});
  });
  await check('收藏 / 取消收藏与刷新统计',async () => {
    await ready(page,'/#/goods/i1');
    await page.locator('#itemCta [data-action="favorite"]').click();
    await page.reload();
    assert.equal(await page.locator('#itemCta [data-action="favorite"]').textContent(),'取消收藏');
    await ready(page,'/#/mine');
    assert.equal(await page.locator('.stats b').nth(1).textContent(),'1');
    await page.locator('#mineTabs [data-tab="fav"]').click();
    await page.locator('.saved-row > [data-action="favorite"]').click();
    assert.equal(await page.locator('.stats b').nth(1).textContent(),'0');
  });
  await check('发布表单校验、草稿恢复与五类发布',async () => {
    await ready(page,'/#/publish');
    await page.locator('#pub-title').fill('不丢失的草稿');
    await page.locator('#pubBtn').click();
    assert.equal(await page.locator('#pub-title').inputValue(),'不丢失的草稿');
    await page.waitForTimeout(400);
    await page.reload();
    assert.equal(await page.locator('#pub-title').inputValue(),'不丢失的草稿');
    const cases=[['goods','浏览器测试闲置'],['lost','浏览器测试失物'],['activities','浏览器测试活动'],['help','浏览器测试搭子'],['survey','浏览器测试问卷']];
    for (const [type,title] of cases) {
      await ready(page,'/#/publish');
      await page.locator('#publishType').selectOption(type==='survey' ? 'help' : type);
      if (type==='survey') await page.locator('#pub-kind').selectOption('调查问卷');
      await page.locator('#pub-title').fill(title);
      if (type==='goods') await page.locator('#pub-price').fill('18.50');
      if (type==='lost') {await page.locator('#pub-time').fill('今天 12:00');await page.locator('#pub-hiddenFeature').fill('非公开编号 ZUA-772');}
      if (type==='activities') {await page.locator('#pub-time').fill('2026-11-07 14:00');await page.locator('#pub-limit').fill('10');}
      if (type==='survey') {
        await page.locator('[data-qtitle]').fill('你更喜欢什么？');
        await page.locator('[data-qoption]').nth(0).fill('图书馆');
        await page.locator('[data-qoption]').nth(1).fill('沁湖');
      }
      await page.locator('#pubBtn').click();
      await page.waitForFunction(() => location.hash!=='#/publish');
      const hash=new URL(page.url()).hash;
      await page.reload();
      assert.equal(new URL(page.url()).hash,hash);
      assert.equal(await page.locator('.page.active .detail-heading h1').textContent(),title);
      assert.ok(await page.locator('.page.active [data-action="edit"]').first().isVisible());
    }
    await ready(page,'/#/mine');
    for (const [,title] of cases) assert.ok((await page.locator('#mineList').textContent()).includes(title));
  });
  await check('编辑、下架与消息定位',async () => {
    await page.locator('#mineList [data-open="goods"]').filter({hasText:'浏览器测试闲置'}).click();
    await page.locator('#itemBody [data-action="edit"]').click();
    await page.locator('#pub-title').fill('修改后的闲置');
    await page.locator('#pubBtn').click();
    await page.locator('#itemBody [data-status="closed"]').click();
    assert.ok((await page.locator('#itemBody').textContent()).includes('已下架'));
    await page.reload();
    assert.equal(await page.locator('#itemBody h1').textContent(),'修改后的闲置');
    await ready(page,'/#/messages');
    await page.locator('#msgList [data-message]').first().click();
    assert.ok(new URL(page.url()).hash.startsWith('#/goods/'));
    await ready(page,'/#/messages');await page.locator('#msgAllRead').click();await page.reload();
    assert.equal(await page.locator('#msgList .dot').count(),0);
  });
  await check('活动报名、互助申请与积分流水',async () => {
    await ready(page,'/#/activities/a1');await page.locator('#actCta [data-action="join"]').click();await page.reload();
    assert.equal(await page.locator('#actCta [data-action="cancel"]').textContent(),'取消报名');
    await ready(page,'/#/help/h1');await page.locator('#helpCta [data-action="join"]').click();
    await ready(page,'/#/mine');await page.locator('#mineTabs [data-tab="join"]').click();
    const text=await page.locator('#mineList').textContent();assert.ok(text.includes('航空文化节'));assert.ok(text.includes('考研数学'));
    await page.locator('.pt').click();assert.ok((await page.locator('.page.active').textContent()).includes('首次报名'));
  });
  await check('失物特征提交后保持待核验',async () => {
    await ready(page,'/#/lost/l5');await page.locator('#lostCta [data-action="claim"]').click();
    await page.locator('#claimFeature').fill('伞柄上有姓名贴');await page.locator('#claimTime').fill('昨天');await page.locator('#claimSpot').fill('东苑餐厅');
    await page.locator('#claimForm button[type="submit"]').click();await page.reload();
    assert.ok((await page.locator('#lostBody').textContent()).includes('待核验'));
    assert.ok(!(await page.locator('#lostBody').textContent()).includes('非公开编号 ZUA-772'));
  });
  await check('问卷必填验证、提交、结果与防重复',async () => {
    await ready(page,'/#/help/h3');await page.locator('#surveyForm button').click();
    assert.ok(await page.locator('#surveyForm').isVisible());
    await page.locator('input[name="q1"]').first().check();await page.locator('input[name="q2"]').first().check();
    await page.locator('textarea[name="q3"]').fill('<img src=x onerror="window.injected=true">');
    await page.locator('#surveyForm button').click();await page.reload();
    assert.equal(await page.locator('#surveyForm').count(),0);
    assert.ok((await page.locator('#helpBody').textContent()).includes('已提交 1 份'));
    assert.equal(await page.evaluate(() => window.injected),undefined);
    assert.ok((await page.locator('#helpBody .answer').textContent()).includes('<img'));
  });
  await check('全局搜索五类结果与空状态',async () => {
    await ready(page);await page.locator('.searchbar').click();
    await page.locator('#globalSearch').fill('图书馆');await page.locator('#searchForm button').click();
    assert.ok((await page.locator('#searchResults').textContent()).includes('校园地点'));
    await page.locator('#globalSearch').fill('不存在的ABCXYZ');await page.locator('#searchForm button').click();assert.ok((await page.locator('#searchResults').textContent()).includes('没有找到'));
    await ready(page,'/#/goods/missing');assert.ok((await page.locator('#itemBody').textContent()).includes('不存在'));
  });
  await check('地图标签定位、发布地点选择与前进后退',async () => {
    await ready(page,'/#/map');await page.locator('[data-map-place="library"]').click();
    await page.waitForFunction(() => document.querySelector('#mapMarker')?.textContent === '图书馆');
    assert.equal(new URL(page.url()).hash,'#/map/library');assert.equal(await page.locator('#mapMarker').textContent(),'图书馆');
    assert.equal(await page.locator('#mapMarker').isVisible(),true);
    await page.goBack();await page.waitForURL('**/#/map');await page.goForward();await page.waitForURL('**/#/map/library');
    await ready(page,'/#/publish');await page.locator('#publishType').selectOption('goods');await page.locator('[data-publish-place="lake"]').click();assert.equal(await page.locator('#pub-spot').inputValue(),'沁湖');
  });
  await check('资料保存、输入安全与图片上传刷新',async () => {
    await ready(page,'/#/profile');await page.locator('#profileName').fill('<b>同学</b>');await page.locator('#profileCollege').fill('测试学院');
    await page.locator('#avatarFile').setInputFiles(path.resolve(import.meta.dirname,'../assets/emblem.png'));
    await page.waitForFunction(() => document.querySelector('#profileAvatar img')?.src.startsWith('data:'));
    await page.locator('#profileForm button').click();await page.reload();assert.equal(await page.locator('#profileName').inputValue(),'<b>同学</b>');
    await ready(page,'/#/snaps');await page.locator('#snapAdd').click();await page.locator('#snapUpload').setInputFiles(path.resolve(import.meta.dirname,'../assets/snap_p2.jpg'));
    await page.waitForFunction(() => document.querySelector('#snapPreview img'));
    await page.locator('#snapCaption').fill('<script>window.injected=true</script>');await page.locator('#snapForm button').click();await page.reload();
    assert.ok((await page.locator('#snapGrid').textContent()).includes('<script>'));assert.equal(await page.evaluate(() => window.injected),undefined);
  });
  await check('手机竖屏、横屏、无横向溢出及全屏外壳',async () => {
    for (const viewport of [{width:390,height:844},{width:844,height:390},{width:320,height:640}]) {
      await page.setViewportSize(viewport);await ready(page,'/#/market');
      const dimensions=await page.evaluate(() => ({screen:innerWidth,body:document.documentElement.scrollWidth,phone:document.getElementById('phone').getBoundingClientRect().width}));
      assert.ok(dimensions.body <= dimensions.screen+1);
      if (viewport.width<=560) assert.equal(Math.round(dimensions.phone),viewport.width);
      assert.ok(await page.locator('.page.active .fab').isVisible());
    }
    await page.setViewportSize({width:390,height:844});await ready(page);await page.screenshot({path:path.join(artifacts,'mobile-home.png'),fullPage:true});
  });
  await check('损坏数据与旧资料迁移可启动',async () => {
    const isolated=await browser.newContext();const other=await isolated.newPage();other.on('pageerror',error => errors.push(error.message));
    await ready(other);
    await other.evaluate(() => {localStorage.setItem(Campus.Storage.KEY,'broken-json');localStorage.setItem('campus_user',JSON.stringify({name:'迁移同学',college:'旧学院'}));localStorage.setItem('campus_snaps','{}');});
    await other.reload();assert.equal(await other.evaluate(() => Campus.App.store.data().user.name),'迁移同学');assert.ok(await other.locator('.storage-notice').isVisible());
    await isolated.close();
  });
  await check('真实触控设备横竖屏完整铺满',async () => {
    const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2});
    const touchPage=await mobile.newPage();touchPage.on('pageerror',error => errors.push(error.message));
    await ready(touchPage);
    assert.equal(Math.round(await touchPage.locator('#phone').evaluate(element => element.getBoundingClientRect().width)),844);
    await touchPage.setViewportSize({width:390,height:844});await ready(touchPage,'/#/activities/a4');
    assert.ok(await touchPage.locator('#actCta').isVisible());
    await mobile.close();
  });
  await check('存储容量失败提示、不丢表单和数据',async () => {
    await ready(page,'/#/publish');await page.locator('#publishType').selectOption('goods');await page.locator('#pub-title').fill('容量测试商品');await page.locator('#pub-price').fill('10');
    const before=await page.evaluate(() => Campus.App.store.data().custom.goods.length);
    await page.evaluate(() => {window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError');};});
    await page.locator('#pubBtn').click();
    assert.equal(await page.locator('#pub-title').inputValue(),'容量测试商品');assert.ok((await page.locator('#toastEl').textContent()).includes('容量不足'));
    assert.equal(await page.evaluate(() => Campus.App.store.data().custom.goods.length),before);
    await page.evaluate(() => {Storage.prototype.setItem=window.originalSetItem;});
  });
  await check('一键重置清除用户数据并恢复初始内容',async () => {
    await ready(page,'/#/mine');await page.locator('[data-action="reset"]').click();await page.locator('[data-action="confirm-reset"]').click();await page.reload();
    const result=await page.evaluate(() => ({user:Campus.App.store.data().user.name,posts:Campus.App.store.data().custom.goods.length,snaps:Campus.App.store.data().snaps.length,points:Campus.App.store.points()}));
    assert.deepEqual(result,{user:'陈拾',posts:0,snaps:0,points:320});
  });
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(artifacts,'browser-report.json'),JSON.stringify({passed:report,errors},null,2));
  console.log('Browser checks passed: '+report.length);
} catch(error) {
  await page.screenshot({path:path.join(artifacts,'failure.png'),fullPage:true});
  console.error('Browser errors:',errors);
  throw error;
} finally {await browser.close();}
