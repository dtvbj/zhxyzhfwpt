globalThis.Campus = globalThis.Campus || {};
Campus.Seed = (() => {

const P = {
  navy:['#1D4A8C','#2B62B4'], deep:['#152F5C','#1D4A8C'], teal:['#2C8C7C','#49B39E'],
  gold:['#B8862F','#D8AE5F'], plum:['#5B4E9B','#8578C4'], rust:['#B4553F','#D08467'],
  slate:['#3F5A78','#6C8AA8'], forest:['#2F6B4E','#6FA085'], sand:['#8A6B48','#C6A47A']
};
const ICON = { '书籍':'i-book', '数码':'i-device', '生活用品':'i-life', '其他':'i-star' };

const ITEMS = [
  { id:'i1', cat:'书籍', title:'高等数学（第七版）上册', price:12, orig:45.8, cond:'九成新', spot:'图书馆西门', seller:'李知远', dept:'数学学院 · 大二', c:P.forest, note:'第二章有几处铅笔标注，其余干净。', circ:3 },
  { id:'i2', cat:'数码', title:'罗技 M170 无线鼠标', price:35, orig:89, cond:'九成新', spot:'3 号宿舍楼', seller:'阿依', dept:'计算机学院 · 大三', c:P.slate, note:'换了静音鼠标，这个闲置。电池仓完好。' },
  { id:'i3', cat:'书籍', title:'考研数学一 · 复习全书', price:25, orig:89, cond:'七成新', spot:'二教自习室', seller:'陈拾', dept:'信息管理学院 · 大二', c:P.sand, note:'刷过一遍，错题标记完整。' },
  { id:'i4', cat:'生活用品', title:'宿舍小风扇（可夹床头）', price:15, orig:39, cond:'全新', spot:'东苑餐厅', seller:'苏晚', dept:'外国语学院 · 大一', c:P.teal, note:'买重了，塑封没拆。' },
  { id:'i5', cat:'书籍', title:'数据结构（C 语言版）', price:15, orig:42, cond:'九成新', spot:'图书馆南门', seller:'周见山', dept:'计算机学院 · 大四', c:P.navy, note:'配套习题册一起送，不单出。', circ:4 },
  { id:'i6', cat:'数码', title:'Kindle Paperwhite 4', price:260, orig:998, cond:'八成新', spot:'沁湖旁', seller:'林小满', dept:'文学院 · 大三', c:P.plum, note:'屏幕无划痕，送原装保护套。' },
  { id:'i7', cat:'生活用品', title:'LED 护眼台灯', price:25, orig:79, cond:'九成新', spot:'20 号宿舍楼', seller:'高野', dept:'航空宇航学院 · 大二', c:P.gold, note:'三档调光，功能正常。' },
  { id:'i8', cat:'书籍', title:'大学英语四级真题（2025 版）', price:10, orig:49.8, cond:'全新', spot:'一食堂门口', seller:'许一诺', dept:'商学院 · 大一', c:P.rust, note:'买重了，塑封未拆。' },
  { id:'i9', cat:'数码', title:'小米蓝牙耳机 Air2 SE', price:55, orig:169, cond:'八成新', spot:'南门快递点', seller:'沈迟', dept:'电子信息学院 · 大三', c:P.deep, note:'左右声道正常，充电盒有使用痕迹。' },
  { id:'i10', cat:'生活用品', title:'24 寸行李箱', price:80, orig:299, cond:'九成新', spot:'15 号宿舍楼', seller:'唐未', dept:'材料学院 · 研一', c:P.slate, note:'毕业出，轮子顺滑。' }
];

const LOST = [
  { id:'l1', type:'失物', title:'校园卡一张', time:'今天 09:20', spot:'01 教学楼 3 楼', desc:'蓝色卡套，卡面有姓名「张」。\n\n放在 01 教学楼 A 座 305 自习室后排，可能被保洁收走。', contact:'张同学', st:'待认领' },
  { id:'l2', type:'失物', title:'蓝色保温杯', time:'昨天 18:40', spot:'沁湖东侧长椅', desc:'500ml 不锈钢，杯身有贴纸。', contact:'匿名', st:'寻找中' },
  { id:'l3', type:'失物', title:'AirPods 右耳', time:'10-27 12:10', spot:'西苑餐厅 2 楼', desc:'右耳单只，左耳还在。', contact:'李同学', st:'寻找中' },
  { id:'l4', type:'拾物', title:'一串钥匙（4 把）', time:'今天 08:05', spot:'图书馆 3 楼', desc:'带一个蓝色门禁扣，已交图书馆服务台。', contact:'图书馆服务台', st:'已上交' },
  { id:'l5', type:'拾物', title:'黑色雨伞', time:'昨天 19:30', spot:'东苑餐厅门口', desc:'长柄自动伞，伞柄有磨损。', contact:'王同学', st:'待认领' },
  { id:'l6', type:'拾物', title:'身份证一张', time:'10-27 16:20', spot:'南门快递点', desc:'请凭姓名与尾号到快递点核对领取。', contact:'快递点', st:'待认领' }
];

const ACTS = [
  { id:'a1', day:'31', mon:'10月', title:'航空文化节 · 航模展演', by:'航模协会', src:'社团活动', time:'10-31 14:00', spot:'中心广场', tag:'报名中', joined:68, limit:120,
    desc:'航模队现场飞行表演，含固定翼与多旋翼展示，可近距离体验模拟器。想上手飞的同学可以带自己的遥控器来。' },
  { id:'a2', day:'01', mon:'11月', title:'周六开封一日游 · 拼车 4 缺 2', by:'陈拾 · 信息管理学院', src:'拼车出行', time:'11-01 08:00', spot:'北门集合', tag:'还差 2 人', joined:2, limit:4,
    desc:'已订好车，往返人均 35 元。上午清明上河园、中午鼓楼小吃，晚上 7 点前回学校。不抽烟、能准时就行。' },
  { id:'a3', day:'每', mon:'周三', title:'沁湖夜跑', by:'夜跑社团', src:'社团活动', time:'每周三 19:30', spot:'沁湖环道', tag:'自由参加', joined:36, limit:0,
    desc:'环湖 3 公里，配速自由，集合点在沁湖石碑。跑完可以一起去东苑喝豆浆。' },
  { id:'a4', day:'03', mon:'11月', title:'3v3 篮球友谊赛 · 招队友', by:'阿依 · 计算机学院', src:'自发比赛', time:'11-03 16:00', spot:'西苑篮球场', tag:'招 3 人', joined:3, limit:6,
    desc:'和邻班约了一场 3v3，缺一个能投三分的。输赢都请喝饮料，主要是想打一场。' }
];

const HELPS = [
  { id:'h1', kind:'学习搭子', title:'考研数学一 找搭子', dept:'信息管理学院 · 大二', need:'图书馆 4 楼 · 每晚 19:00–22:00', desc:'已经刷完一轮，想找人一起对答案、互相讲题。数学基础还行，可以带你过一遍线代。', st:'2 人申请' },
  { id:'h2', kind:'技能互助', title:'想学 PS，可用 Python 或剪辑交换', dept:'计算机学院 · 大三', need:'线上 / 面授均可', desc:'会 Python 爬虫和 Pr 剪辑，想学 PS 修图和基础排版，可以每周换 2 小时。', st:'寻找中' },
  { id:'h3', kind:'调查问卷', title:'校园二手书交易习惯（8 题）', dept:'信息管理学院 · 陈拾', need:'3 分钟 · 匿名', desc:'课程作业用的小调研：你多久买一次二手书、能接受什么价位、会不会因为「流转次数」而更愿意买。结果只用于课程报告，不收集个人身份信息。', st:'已有 46 人填写', mins:3, joins:46, gift:'抽 3 人送奶茶', bonus:'+30', qs:8 },
  { id:'h4', kind:'调查问卷', title:'你最想在校园里增加什么服务', dept:'学生会生活部', need:'2 分钟 · 5 题', desc:'食堂、快递、自习空间、运动场地……你的选择会直接影响下一轮服务改造，结果会公示。', st:'已有 128 人填写', mins:2, joins:128, gift:'参与即得文创贴纸', bonus:'+20', qs:5 },
  { id:'h5', kind:'学习搭子', title:'雅思口语 每周两次对练', dept:'外国语学院 · 大一', need:'线上 · 晚上', desc:'目标 6.5，想找同样在备考的同学，互相纠音、过题库。', st:'1 人申请' }
];


const messages = [
  { id:'m1', kind:'sys', title:'发布成功，等待审核', text:'你发布的「高等数学（第七版）上册」已提交审核，通常 10 分钟内完成。审核通过后会出现在集市的「书籍」分类里。', time:'5 分钟前', read:false },
  { id:'m2', kind:'user', title:'李知远 回复了你', text:'书还在的，今晚 19:00 我在图书馆西门等你，到了给我发个消息。', time:'20 分钟前', read:false },
  { id:'m3', kind:'act', title:'活动提醒：周六开封一日游', text:'你报名的活动明天 08:00 在北门集合，已经满 4 人。人均 35 元，车上现付给发起人。', time:'1 小时前', read:true },
  { id:'m4', kind:'qz', title:'问卷结果已生成', text:'你填写的「校园二手书交易习惯」已有 46 份回答，结果页对参与者开放，可查看价格分布。', time:'昨天', read:true },
  { id:'m5', kind:'lost', title:'你的失物有线索了', text:'有人提交了「校园卡一张」的线索：在 01 教学楼 A 座 305 讲台抽屉里。建议尽快去确认。', time:'昨天', read:true },
  { id:'m6', kind:'sys', title:'欢迎使用校园综合服务平台', text:'书籍、闲置、失物、活动、互助都在这里。发布时记得写清面交地点，校园内当面交易更安全。', time:'3 天前', read:true }
];
const snaps = [
  { id:'s1', src:'assets/snap_p3.jpg', cap:'今天的云很好看，下课路过中轴忍不住拍了一张。', by:'林小满 · 文学院', time:'2 小时前', likes:23 },
  { id:'s2', src:'assets/snap_p2.jpg', cap:'开学第一天，从南门进来看到的就是这条轴线。', by:'陈拾 · 信息管理学院', time:'昨天', likes:41 },
  { id:'s3', src:'assets/snap_p4.jpg', cap:'晚上十点的校门，路灯把校名照得很清楚。', by:'阿依 · 计算机学院', time:'前天', likes:18 }
];
return { palettes: P, icons: ICON, goods: ITEMS, lost: LOST, activities: ACTS, help: HELPS, messages, snaps };
})();
