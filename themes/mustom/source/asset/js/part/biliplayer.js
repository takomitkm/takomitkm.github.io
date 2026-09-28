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
let startedAt = 0;
let deadline = 0;

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
  syncSound();
};

// 播放器不会往父窗口发任何消息，外层既拿不到 ended 也拿不到进度。
// 这里只认一个本地截止时间，并用短周期 interval 去对表：后台标签页的
// 定时器会被浏览器钳制，一次性 setTimeout 可能被整体推迟，对表则最坏只迟到
// 一个 tick。
const watch = o => {
  window.clearInterval(watcher);
  watcher = null;
  if (!deadline) return;
  watcher = window.setInterval(o => {
    if (Date.now() < deadline) return;
    window.clearInterval(watcher);
    watcher = null;
    step(1);
  }, 2000);
};

// 顶层文档一旦有过真实交互，之后新挂的 B 站 iframe 就是有声音的（实测）；
// 没有交互时浏览器按自动播放策略静音起播。所以"要不要给开启声音按钮"
// 直接看 userActivation，不需要去猜 iframe 里的状态（跨域也读不到）。
const audible = o => navigator.userActivation ? !!navigator.userActivation.hasBeenActive : true;

const syncSound = o => {
  let b = q('.p-biliplayer-sound');
  b && b.classList.toggle('HIDE', !mounted || audible());
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
  mounted = true;
  mask(null);
  render();
  watch();
};

const stop = o => {
  let f = q('.p-biliplayer-stage iframe');
  f && f.remove();
  window.clearInterval(ticker);
  ticker = null;
  window.clearInterval(watcher);
  watcher = null;
  mounted = false;
  deadline = 0;
  mask('manual');
  syncSound();
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

const wire = o => {
  q('.p-biliplayer-cancel').onclick = o => settings.set('autoplay', false, true);
  q('.p-biliplayer-start').onclick = o => settings.set('autoplay', true, true);
  q('.p-biliplayer-sound').onclick = o => play(elapsed());
  q('.p-biliplayer-prev').onclick = o => step(-1);
  q('.p-biliplayer-next').onclick = o => step(1);
  q('.p-biliplayer-off').onclick = o => { stop(); element.classList.add('HIDE'); };
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
  enabled,
  ready
};
