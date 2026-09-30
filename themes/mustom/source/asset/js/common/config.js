import storage from "./storage.js";

const isMobile = /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i.test(window.navigator.userAgent);

const isChinese = /^(zh)/i.test(window.navigator.browserLanguage || window.navigator.language || 'zh');

const defaults = {
  closeDrawer: isMobile,
  closeAside: false,
  skin: 'default',
  langshift: !isChinese,
  night: false,
  transfigure: false,
  hideplayer: false,
  autoplay: false,
  translater: 'zh'
};

// Object.assign(defaults, saved) 会把 saved 里 defaults 没有的键原样并进来，
// 而 set() 每次都把整个合并结果写回 storage——于是改过名的旧键（例如 2026-09-30
// 之前的 lyride/"隐藏歌词"，那个开关早就是空壳）会被一直带着存下去。
// 所以这里只挑默认表里有的键，挑掉了就顺手把 storage 也重写一次，
// 只在真有废键时才写这一次。
const isKnown = key => key in defaults;

const raw = storage.get('config') || {};
const keys = Object.keys(raw).filter(isKnown);
const kept = {};
keys.forEach(key => kept[key] = raw[key]);
if (keys.length !== Object.keys(raw).length) storage.set('config', kept);

const config = Object.assign(defaults, kept);

const get = key => {
  return config[key];
};

// set() persists the whole merged object, so 'config' cannot tell a chosen value from a default.
// Every set() is a visitor action (boot-time application goes through get() only), so the keys
// written are recorded separately and has() answers "did the visitor choose this before".
// 同理，这里面也可能留着已改名的键，同样挑一遍。
const rawChosen = storage.get('configChosen') || [];
const chosen = rawChosen.filter(isKnown);
if (chosen.length !== rawChosen.length) storage.set('configChosen', chosen);

const set = (key, value) => {
  if (Object.keys(config).includes(key)) {
    config[key] = value;
    storage.set('config', config);
    if (chosen.indexOf(key) < 0) {
      chosen.push(key);
      storage.set('configChosen', chosen);
    }
  }
};

const has = key => {
  return chosen.indexOf(key) >= 0;
};

export default {
  get,
  has,
  set
}