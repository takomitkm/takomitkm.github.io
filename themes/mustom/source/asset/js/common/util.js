const mobileRegex = /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i;

const getChromeVersion = o => {
  if (/Chrome/i.test(window.navigator.userAgent)) {
    let matches = window.navigator.userAgent.match(/Chrome\/([0-9.]+)/i);
    if (matches.length > 1) {
      return parseInt(matches[1]);
    }
  } else {
    return 0;
  }
};

const delay = (time, callback) => {
  window.setTimeout(callback, time);
};

const run = (DnM, next, final) => {
  DnM(o => { // NEXT
    if (!next) return;
    if (mobileRegex.test(window.navigator.userAgent)) {
      next.mobile && next.mobile(final);
    } else {
      next.desktop && next.desktop(final);
    }
  });
};

const runOnMobile = (mobile) => {
  if (mobileRegex.test(window.navigator.userAgent)) {
    mobile && mobile(window.navigator.userAgent);
  }
};

const runOnDesktop = (desktop) => {
  if (!mobileRegex.test(window.navigator.userAgent)) {
    desktop && desktop(window.navigator.userAgent);
  }
};

const getPageKey = o => {
  let key = '';
  let pathname = window.location.pathname;
  if (/^\/(archives|categories|tags)\//.test(pathname)) {
    key = 'archive';
  } else if (/^(\/|\/index.html)$/.test(pathname)) {
    key = 'home';
  } else {
    let matches = pathname.match(/^\/([a-zA-Z0-9_\-]+)/);
    if (matches.length === 2) {
      key = matches[1];
    }
  }
  return key;
};

const forEach = (array, callback) => {
  if (typeof array === 'object' && array.length) {
    for (let i = 0; i < array.length; i++) {
      if (callback && callback(array[i], i)) {
        break;
      }
    }
  }
};

const forIn = (object, callback) => {
  if (typeof object === 'object') {
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        if (callback && callback(object[key], key)) {
          break;
        }
      }
    }
  }
};

const layoutParts = callback => {
  let target = document.querySelector('meta[name="layout-parts"]');
  if (target) {
    let content = target.getAttribute('content');
    try {
      callback && callback(JSON.parse(content));
    } catch (error) {
      callback && callback([]);
    }
  }
};

/**
 * Decode pass
 * 
 * @param {String} string 
 * @param {Number} seat appid length
 */
function decodePass(string, seat) {
  if (isNaN(seat)) return {
    appid: '',
    appkey: ''
  };
  let result = '';
  let temp = string.split(':');
  if (temp[1]) {
    let even = temp[1].substr(0, parseInt(temp[0])).split('');
    let odd = temp[1].substr(parseInt(temp[0])).split('');
    for (let i = 0; i < temp[1].length; i++) {
      if (i % 2 === 0) {
        result += even.shift();
      } else {
        result += odd.shift();
      }
    }
  }
  return {
    appid: result.substr(0, seat),
    appkey: result.substr(seat)
  };
};

/**
* Google Translate (public, key-free endpoint used by the Chrome in-page translator)
*
* @param {String} query
* @param {String} lang  zh | en | jp
* @param {Function} callback
*/
const googleLangs = { zh: 'zh-CN', en: 'en', jp: 'ja' };

const escapeHtml = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function googleTranslate(query, lang, callback) {
 if (typeof callback != 'function') return false;
 if (typeof query != 'string' || typeof lang != 'string') return callback({ error: '<p class="error">PARAMS ERROR / 参数错误</p>' });
 if (query.length === 0) return callback({ error: '<p class="error">EMPTY QUERY / 空查询</p>' });
 if (query.length > 5000) return callback({ error: '<p class="error">HUGE QUERY / 巨查询</p>' });

 const to = googleLangs[lang] || lang;
 const url = 'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl='
   + encodeURIComponent(to) + '&q=' + encodeURIComponent(query);

 const abort = new AbortController();
 const timer = window.setTimeout(() => abort.abort(), 8000);
 const fail = msg => callback({ error: '<p class="error">TRANSLATE FAILED / 翻译失败：' + msg + '</p>' });

 window.fetch(url, { signal: abort.signal }).then(r => {
   if (!r.ok) throw new Error('HTTP ' + r.status);
   return r.json();
 }).then(data => {
   const text = (Array.isArray(data) ? data : [])
     .map(seg => Array.isArray(seg) && typeof seg[0] === 'string' ? seg[0] : '')
     .join('');
   if (!text) return fail('空响应');
   callback({ result: '<p class="result">RESULT / 翻译结果：</p><p class="content">' + escapeHtml(text) + '</p>' });
 }).catch(e => {
   fail(e && e.name === 'AbortError' ? '超时' : (e && e.message) || '网络不可达');
 }).finally(() => window.clearTimeout(timer));
}

export default {
  delay,
  run,
  runOnMobile,
  runOnDesktop,
  getPageKey,
  forEach,
  forIn,
  layoutParts,
  decodePass,
  googleTranslate,
  getChromeVersion
}