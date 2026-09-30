import storage from "./storage.js";

const isMobile = /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i.test(window.navigator.userAgent);

const isChinese = /^(zh)/i.test(window.navigator.browserLanguage || window.navigator.language || 'zh');

const saved = storage.get('config') || {};

const config = Object.assign({
  closeDrawer: isMobile,
  closeAside: false,
  skin: 'default',
  langshift: !isChinese,
  night: false,
  transfigure: false,
  hideplayer: false,
  autoplay: false,
  translater: 'zh'
}, saved);

const get = key => {
  return config[key];
};

// set() persists the whole merged object, so 'config' cannot tell a chosen value from a default.
// Every set() is a visitor action (boot-time application goes through get() only), so the keys
// written are recorded separately and has() answers "did the visitor choose this before".
const chosen = storage.get('configChosen') || [];

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