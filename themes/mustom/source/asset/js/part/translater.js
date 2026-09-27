import part from "../common/part.js";
import util from "../common/util.js";

let tag = 'translater';
let element = null;
let onstart = null;
let onended = null;
let onpick = null;
let to = 'zh';

const langs = {
  zh: '.p-translater-bar-zh',
  en: '.p-translater-bar-en',
  jp: '.p-translater-bar-jp'
};

const data = {
  isInside: false,
  isPathIn: (path, el) => {
    let flag = false;
    if (path) {
      for (let i = 0; i < path.length; i++) {
        if (path[i] === el) {
          flag = true;
          break;
        }
      }
    }
    return flag;
  },
  setMousedown: null,
  setMouseup: null
};

const setContent = (show, content) => {
  if (element) {
    let translaterResult = element.querySelector('.p-translater-result');
    if (show) {
      translaterResult.style.display = 'block';
      translaterResult.innerHTML = content;
      element.classList.add('active');
    } else {
      translaterResult.style.display = 'none';
      translaterResult.innerHTML = '';
      element.classList.remove('active');
    }
  }
};

const markTo = () => {
  Object.keys(langs).forEach(key => {
    let el = element.querySelector(langs[key]);
    key === to ? el.classList.add('default') : el.classList.remove('default');
  });
};

const setup = o => {
  let target = document.querySelector('.m-main');

  target.removeEventListener('mousedown', data.setMousedown);
  data.setMousedown = function (e) {
    data.isInside = true;
    setContent(false);
    let epath = e.path || (e.composedPath && e.composedPath());
    if (!data.isPathIn(epath, element)) {
      window.getSelection().empty();
    }
  };
  target.addEventListener('mousedown', data.setMousedown);

  document.removeEventListener('mouseup', data.setMouseup);
  data.setMouseup = function (e) {
    let query = window.getSelection().toString().trim();
    if (data.isInside && query.length > 0) {
      let epath = e.path || (e.composedPath && e.composedPath());
      let rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
      element.classList.add('moved');
      element.style.transform = 'translateY(' + (window.scrollY + rect.y + rect.height - element.offsetTop + 16) + 'px)'; // set offset to target e.g. 8px
      if (data.isPathIn(epath, element.querySelector('.p-translater-bar-copy')) && query.length > 0) {
        if (document.execCommand('copy')) {
          setContent(true, '<p>Copied! 复制成功！</p>');
        }
      } else {
        let hit = Object.keys(langs).find(key => data.isPathIn(epath, element.querySelector(langs[key])));
        if (!hit && data.isPathIn(epath, element.querySelector('.p-translater-bar-to'))) hit = to;
        if (!hit) {
          setContent(false);
        } else {
          to = hit;
          markTo();
          onpick && onpick(hit);
          onstart && onstart(element);
          util.googleTranslate(query, hit, (result) => {
            onended && onended(element);
            if (result.error) {
              setContent(true, result.error);
            } else if (result.result) {
              setContent(true, result.result);
            }
          });
        }
      }
    } else {
      element.classList.remove('moved');
      element.style.transform = 'translateY(0)';
      setContent(false);
    }
    data.isInside = false;
  };
  document.addEventListener('mouseup', data.setMouseup);

  markTo();
};

const init = (params, callback) => {
  part(tag, el => {
    element = el;
    document.querySelector(tag) && document.querySelector(tag).replaceWith(element);
    if (params) {
      params.onstart && (onstart = params.onstart);
      params.onended && (onended = params.onended);
      params.onpick && (onpick = params.onpick);
      if (typeof params.lang === 'string' && langs[params.lang]) to = params.lang;
      setup();
    }
    callback && callback(element);
  });
};

export default {
  tag,
  init
};