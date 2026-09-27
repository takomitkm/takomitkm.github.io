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
let startedAt = 0;
let elapsed = 0;
let mounted = false;
let activated = false;
let pageLoaded = false;

const q = sel => element && element.querySelector(sel);

const current = o => list[index];

const active = o => navigator.userActivation
  ? navigator.userActivation.hasBeenActive
  : activated;

const srcOf = item => {
  let url = 'https://player.bilibili.com/player.html?bvid=' + item.bvid +
    '&page=' + (item.page || 1) + '&danmaku=0&high_quality=1&autoplay=1';
  if (elapsed > 2) url += '&t=' + Math.floor(elapsed);
  return url;
};

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

const play = o => {
  let item = current();
  if (!item || !element) return;
  window.clearInterval(ticker);
  ticker = null;
  frame().src = srcOf(item);
  mounted = true;
  startedAt = Date.now();
  mask(null);
  q('.p-biliplayer-sound').classList.toggle('HIDE', active());
  render();
};

const stop = o => {
  let f = q('.p-biliplayer-stage iframe');
  f && f.remove();
  window.clearInterval(ticker);
  ticker = null;
  mounted = false;
  elapsed = 0;
  mask('manual');
  q('.p-biliplayer-sound').classList.add('HIDE');
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
  elapsed = 0;
  mounted ? play() : render();
};

const resume = o => {
  if (mounted) elapsed = (Date.now() - startedAt) / 1000;
  play();
};

const mark = o => {
  activated = true;
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

const wire = o => {
  q('.p-biliplayer-cancel').onclick = o => settings.set('autoplay', false, true);
  q('.p-biliplayer-start').onclick = o => settings.set('autoplay', true, true);
  q('.p-biliplayer-sound').onclick = o => { mark(); resume(); };
  q('.p-biliplayer-prev').onclick = o => step(-1);
  q('.p-biliplayer-next').onclick = o => step(1);
  q('.p-biliplayer-off').onclick = o => { stop(); element.classList.add('HIDE'); };
};

const init = (params, callback) => {
  part(tag, el => {
    element = el;
    callback && callback(element);
    countdown = Number(el.getAttribute('data-countdown')) || 3;
    index = Number(el.getAttribute('data-index')) || 0;
    document.addEventListener('pointerdown', mark, true);
    document.addEventListener('keydown', mark, true);
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
        if (index >= list.length) index = 0;
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
