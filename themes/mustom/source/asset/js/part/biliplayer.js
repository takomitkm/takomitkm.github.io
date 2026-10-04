import part from "../common/part.js";
import ajax from "../common/ajax.js";
import config from "../common/config.js";
import settings from "./settings.js";

let tag = 'biliplayer';
let element = null;
let list = [];
let index = 0;
let countdown = 3;
let ticker = null;
let mounted = false;
let pageLoaded = false;
let armed = false;
let startedAt = 0;
let touched = false;

const SESSION_KEY = 'biliplayer:index';

const readSession = o => {
  try {
    let raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw === null) return null;
    let n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : null;
  } catch (e) {
    return null;
  }
};

const writeSession = n => {
  try {
    window.sessionStorage.setItem(SESSION_KEY, String(n));
  } catch (e) { }
};

const q = sel => element && element.querySelector(sel);

const current = o => list[index];

const srcOf = (item, at) => 'https://player.bilibili.com/player.html?bvid=' + item.bvid +
  '&page=' + (item.page || 1) + '&danmaku=0&high_quality=1&autoplay=1' +
  (at > 0 ? '&t=' + at : '');

const frame = o => {
  let f = q('.p-biliplayer-stage iframe');
  if (!f) {
    f = document.createElement('iframe');
    f.setAttribute('allowfullscreen', 'true');
    f.setAttribute('scrolling', 'no');
    q('.p-biliplayer-stage').insertBefore(f, q('.p-biliplayer-mask'));
  }
  return f;
};

const mask = mode => {
  let el = q('.p-biliplayer-mask');
  ['counting', 'manual', 'waiting'].forEach(c => el.classList.remove(c));
  mode && el.classList.add(mode);
  mode ? el.classList.remove('HIDE') : el.classList.add('HIDE');
};

const render = o => {
  let item = current();
  if (!item) return;
  q('.p-biliplayer-now').innerText = item.title;
};

// 播放器不会往父窗口发任何消息，外层既拿不到 ended 也拿不到暂停和进度。
// 早期版本在这里放过一个「本地截止时间一到就 step(1)」的看门狗来模拟
// ended 自动换片，代价是：用户在 iframe 里点了暂停外层并不知情，时间一到
// 照样切下一首带着声音播——暂停就白点了。要「暂停即停」就只能不做自动
// 换片：播完的处置交给播放器自己的结束画面，换片走 PREV/NEXT 按钮。

// 顶层文档一旦有过真实交互，之后新挂的 B 站 iframe 就是有声音的（实测）；
// 没有交互时浏览器按自动播放策略静音起播，任何站点代码都绕不过去。
// 所以这里不做按钮：静音挂载时挂一个一次性手势监听，页面被点下第一下的
// 瞬间用 &t= 原位重挂，把已经听到的进度接上。
// 但用户已经碰过播放器（比如先点了暂停）就不能再重挂——重挂等于
// autoplay=1 强行续播。iframe 一被点过焦点就会离开顶层窗口，blur 记一笔，
// 碰过就只解除监听、什么都不动。
const audible = o => navigator.userActivation ? !!navigator.userActivation.hasBeenActive : true;

const onTouched = o => {
  touched = true;
};

const onGesture = o => {
  window.removeEventListener('pointerdown', onGesture, true);
  window.removeEventListener('keydown', onGesture, true);
  window.removeEventListener('blur', onTouched);
  armed = false;
  if (!touched && mounted) play(elapsed());
};

const armGesture = o => {
  if (armed || audible()) return;
  armed = true;
  touched = false;
  window.addEventListener('pointerdown', onGesture, true);
  window.addEventListener('keydown', onGesture, true);
  window.addEventListener('blur', onTouched);
};

const elapsed = o => mounted ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0;

const play = at => {
  let item = current();
  if (!item || !element) return;
  window.clearInterval(ticker);
  ticker = null;
  let from = Math.min(Number(at) || 0, Math.max(0, (item.duration || 0) - 2));
  frame().src = srcOf(item, from);
  startedAt = Date.now() - from * 1000;
  mounted = true;
  mask(null);
  render();
  armGesture();
};

const stop = o => {
  let f = q('.p-biliplayer-stage iframe');
  f && f.remove();
  window.clearInterval(ticker);
  ticker = null;
  if (armed) {
    window.removeEventListener('pointerdown', onGesture, true);
    window.removeEventListener('keydown', onGesture, true);
    window.removeEventListener('blur', onTouched);
    armed = false;
  }
  mounted = false;
  mask('manual');
};

const begin = o => {
  let left = countdown;
  mask('counting');
  q('.p-biliplayer-num').innerText = left;
  ticker = window.setInterval(o => {
    left -= 1;
    if (left <= 0) {
      window.clearInterval(ticker);
      ticker = null;
      play();
      return;
    }
    q('.p-biliplayer-num').innerText = left;
  }, 1000);
};

const step = delta => {
  if (!list.length) return;
  index = (index + delta + list.length) % list.length;
  writeSession(index);
  mounted ? play() : render();
};

const enabled = o => config.has('autoplay') ? !!config.get('autoplay') : true;

const start = o => {
  if (!element || !list.length || mounted || ticker) return;
  enabled() ? begin() : stop();
};

const ready = o => {
  pageLoaded = true;
  start();
};

const pick = o => {
  let saved = readSession();
  if (saved !== null && saved < list.length) {
    index = saved;
  } else {
    index = Math.floor(Math.random() * list.length);
    writeSession(index);
  }
};

// 设置里的"隐藏播放器"直接走这里。flag 是"要藏起来"的意思，所以
// false（默认）是显示。
const hidden = flag => {
  if (!element) return;
  // 手机版播放器是接在 .p-hitokoto 里那张图的原位上的，藏起来就得把图
  // 还回去，否则面板底部空一块（CSS 靠 .p-hitokoto-restored 判断）
  let panel = element.closest('.p-hitokoto');
  panel && panel.classList.toggle('p-hitokoto-restored', flag);
  if (flag) {
    stop();
    element.classList.add('HIDE');
  } else {
    element.classList.remove('HIDE');
  }
};

const wire = o => {
  q('.p-biliplayer-cancel').onclick = o => settings.set('autoplay', false, true);
  q('.p-biliplayer-start').onclick = o => settings.set('autoplay', true, true);
  q('.p-biliplayer-prev').onclick = o => step(-1);
  q('.p-biliplayer-next').onclick = o => step(1);
  q('.p-biliplayer-off').onclick = o => hidden(true);
};

const init = (params, callback) => {
  part(tag, el => {
    element = el;
    callback && callback(element);
    countdown = Number(el.getAttribute('data-countdown')) || 3;
    wire();
    ajax({
      url: el.getAttribute('data-playlist'),
      method: 'get',
      dataType: 'json',
      success(data) {
        list = (data && data.items) || [];
        if (!list.length) {
          element.classList.add('HIDE');
          return;
        }
        pick();
        render();
        pageLoaded ? start() : mask('waiting');
      },
      error() {
        element.classList.add('HIDE');
      }
    });
  });
};

export default {
  tag,
  init,
  play,
  stop,
  hidden,
  enabled,
  ready
};
