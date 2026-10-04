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
let watcher = null;
let mounted = false;
let pageLoaded = false;
let armed = false;
let startedAt = 0;
let deadline = 0;
let touched = false;
let touchPoll = null;

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

// 播放器不会往父窗口发任何消息，外层既拿不到 ended 也拿不到暂停和进度，
// 自动换片只能认一个本地截止时间，并用短周期 interval 去对表：后台标签页
// 的定时器会被浏览器钳制，一次性 setTimeout 可能被整体推迟，对表则最坏只迟到
// 一个 tick。
// 截止时间只对「没人碰过播放器」的视频生效：用户在 iframe 里点过暂停/进度/
// 音量之后，播放状态外层就不可知了，这时候宁可不切，也不能在人家暂停的
// 时候突然接下一首——pause 即停，换片交回给 PREV/NEXT。
const watch = o => {
  window.clearInterval(watcher);
  watcher = null;
  if (!deadline) return;
  watcher = window.setInterval(o => {
    if (Date.now() < deadline) return;
    window.clearInterval(watcher);
    watcher = null;
    touched || step(1);
  }, 2000);
};

// 「碰过播放器」的判定：点击落在 iframe 里时父窗口收不到任何事件——焦点
// 仍在本窗口的子框架树内，window 连 blur 都不触发——但浏览器会把
// document.activeElement 切成那个 iframe 元素，低频轮询盯住它即可。
// 不挑输入设备，触屏点一下也算；切标签页、点地址栏不动 activeElement，不算。
const trackTouch = on => {
  window.clearInterval(touchPoll);
  touchPoll = null;
  if (!on) return;
  touchPoll = window.setInterval(o => {
    const f = q('.p-biliplayer-stage iframe');
    if (f && document.activeElement === f) touched = true;
  }, 400);
};

// 顶层文档一旦有过真实交互，之后新挂的 B 站 iframe 就是有声音的（实测）；
// 没有交互时浏览器按自动播放策略静音起播，任何站点代码都绕不过去。
// 所以这里不做按钮：静音挂载时挂一个一次性手势监听，页面被点下第一下的
// 瞬间用 &t= 原位重挂，把已经听到的进度接上。
// 用户碰过播放器（比如点了暂停）时跳过重挂：重挂就是 autoplay=1 强行续播，
// 会把人家点的暂停覆盖掉。
const audible = o => navigator.userActivation ? !!navigator.userActivation.hasBeenActive : true;

const onGesture = o => {
  window.removeEventListener('pointerdown', onGesture, true);
  window.removeEventListener('keydown', onGesture, true);
  armed = false;
  if (!touched && mounted) play(elapsed());
};

const armGesture = o => {
  if (armed || audible()) return;
  armed = true;
  window.addEventListener('pointerdown', onGesture, true);
  window.addEventListener('keydown', onGesture, true);
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
  deadline = item.duration ? Date.now() + (item.duration - from) * 1000 + 4000 : 0;
  touched = false; // 新挂的一曲重新算「碰过没有」
  mounted = true;
  mask(null);
  render();
  trackTouch(true);
  watch();
  armGesture();
};

const stop = o => {
  let f = q('.p-biliplayer-stage iframe');
  f && f.remove();
  window.clearInterval(ticker);
  ticker = null;
  window.clearInterval(watcher);
  watcher = null;
  deadline = 0;
  trackTouch(false);
  if (armed) {
    window.removeEventListener('pointerdown', onGesture, true);
    window.removeEventListener('keydown', onGesture, true);
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
