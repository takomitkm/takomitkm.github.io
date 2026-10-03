---
title: 关于
layout: page
name: about
parts:
  - page
---

00後荖婀侇👵嬡挖墳🪏芣婫圜❎️柈荖崬湤👺兲殘黨🤡莋息紊亂🕰️🇨🇳渔籿📍²⁴/₇萭惟蛧偅喥畩攋🌐狆妏楛掱🀄睚眦😈Νέμεσις⚖️φιλοσοφία🏛️法古

avatar: 
Desmos r=1+\sin(6\theta)+\sin(10\theta)+\sin(300\theta)+\sin(2000\theta)

介里系tkm用 Hexo 搭滴个人站：主题 Mustom，右下角看板娘来自 live2d-widget，`/live/` 系窝滴b站歌单。


💛 ｡*+୨୧ 关于我 ୨୧+*｡💛
🐣 <span id="abBorn"></span>
24岁，是学生，但是马上要18岁了哦（等到那天再来编辑这个！）下半年开始学业会变繁忙，但我会努力抽出时间来和大家见面的！🥹
我是个自来熟，就算是第一次见面也一定会给予你好像相处了三年好朋友那样的热情😋💓请不要被我吓到！如果在交谈方面有什么幼稚的话语的话，就请原谅我一下吧🥺🥺我会努力变成大人的！
身高：<span id="abHeight"></span>cm 但是还可以长😎
<span id="abRule1" class="about-rule" data-fill="‧*˚̩͙*‧₊̊‧*˚̩͙̩͙*‧₊̊‧*˚̩͙*‧₊̥‧*˚̩͙*‧₊̊‧*˚̩͙̩͙*‧₊̊‧*˚̩͙*‧₊̥‧*˚̩͙*‧₊̊‧*˚̩͙̩͙*‧₊̊‧*˚̩͙*‧"></span>
喜欢的颜色：🎀柔和的粉色和白色黑色🦓
喜欢的味道：🍋酸味和甜味🍬我是番茄鸡蛋激推，与番茄鸡蛋有关的一切都喜欢！爱吃醋😋跟我拍拖不用担心我突然想吃酸的因为本来就想吃🤤嘻嘻

喜欢的二次元作品：摇曳百合/1999/东方/后面忘了。。。。
大概是最喜欢的一些🥰社恐死宅😨一般无法在阳光下见到我
我推！！！：京子、魔理沙

喜欢做的事：打电动打电动打电动（重要的事情说三遍！)
MBTI：infp-t 5w4
<span id="abRule2" class="about-rule" data-fill="°. ☪︎* 。.:*・° ✰.。.:*・° ✰.。.:*"></span>
到这里差不多就介绍完了🥰
每个粉丝都是我的朋友，无论是线上还是线下，如果你喜欢我，那我也喜欢你💓对所有人都是真心换真心，请相信我会好好对待你的这份感情
不会拉黑黑粉🤓黑名单只留给我不喜欢的人不留给不喜欢我的人
我是一个很无趣也很欠的人，对自己的信心永远是0%，也相信你只要愿意去了解我就一定会讨厌这样独一无二的我哦😈💕另外，希望在有一天可以在地府见到生前喜欢我的宝宝🥰
如果做好准备了，就请和我签订永远喜欢我的契约吧！(♡ >𖥦<⸝⸝)

｡*+୨୧ 感谢你看到这里 ୨୧+*｡

站点源码和构建流程见 [建站流程](/posts/2659281223/) 那篇。

<style>
.p-page{position:relative;z-index:0}
.about-stamp{position:absolute;z-index:-1;top:2.5em;right:1.5em;width:50%;aspect-ratio:1/1;pointer-events:none;opacity:.3;background:no-repeat right top/100% 100% url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20100'%3E%3Ccircle%20cx='50'%20cy='50'%20r='46'%20fill='none'%20stroke='%23ff3300'%20stroke-width='3'/%3E%3Ctext%20x='50'%20y='50'%20fill='%23ff3300'%20font-family='serif'%20font-size='60'%20font-weight='700'%20text-anchor='middle'%20dominant-baseline='central'%3E%E5%81%B7%3C/text%3E%3C/svg%3E")}
.about-rule{display:inline-block;max-width:100%;white-space:nowrap;overflow:hidden;vertical-align:bottom}
</style>
<div class="about-stamp"></div>

<script>
(function () {
  var now = new Date();
  var born = new Date(now.getTime());
  born.setFullYear(now.getFullYear() - 17);
  var b = document.getElementById('abBorn');
  if (b) b.textContent = born.getFullYear() + '年' + (born.getMonth() + 1) + '月' + born.getDate() + '日';
  var h = document.getElementById('abHeight');
  if (h) h.textContent = 160 + now.getHours();

  var rules = ['abRule1', 'abRule2'].map(function (id) { return document.getElementById(id); })
    .filter(function (el) { return el; });
  if (!rules.length) return;
  var host = rules[0].parentNode;

  function fill() {
    var probe = document.createElement('span');
    probe.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;white-space:nowrap';
    document.body.appendChild(probe);
    rules.forEach(function (el) {
      var tile = el.getAttribute('data-fill');
      var cs = getComputedStyle(el);
      probe.style.fontFamily = cs.fontFamily;
      probe.style.fontSize = cs.fontSize;
      probe.style.fontWeight = cs.fontWeight;
      probe.style.fontStyle = cs.fontStyle;
      probe.style.letterSpacing = cs.letterSpacing;
      probe.textContent = tile;
      var unit = probe.getBoundingClientRect().width;
      var room = host.clientWidth;
      if (!(unit > 0) || !(room > 0)) return;
      var text = tile.repeat(Math.ceil(room / unit) + 1);
      if (el.textContent !== text) el.textContent = text;
    });
    probe.remove();
  }

  if ('ResizeObserver' in window) {
    new ResizeObserver(fill).observe(host);
  } else {
    window.addEventListener('resize', fill);
    fill();
  }
})();
</script>
