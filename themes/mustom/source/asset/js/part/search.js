import part from "../common/part.js";

let tag = 'search';
let element = null;
let setClick = null;
let onsearch = null;
// Pagefind 入口懒加载：首次搜索才 import /pagefind/pagefind.js，
// 索引由 CI 里 npx pagefind --site public 生成；本地 hexo server 没跑索引时会走到 failed
let pagefind = null;
// 连续触发（回车连按）时丢弃过期结果，只渲染最后一次
let seq = 0;
// 弹窗一屏放不下太多条，超出部分读者翻页也用不上；总数在 count 行里给
const RESULT_LIMIT = 10;

const messages = {
  initial: '(..•˘_˘•..)',
  empty: '(╯°Д°)╯︵ ┻━┻',
  failed: '搜索索引没就绪 (；´д｀)'
};

const loadPagefind = async o => {
  if (pagefind === null) {
    try {
      pagefind = await import('/pagefind/pagefind.js');
    } catch (e) {
      // false 表示「试过、没有」，避免每次搜索都重新请求 404
      pagefind = false;
    }
  }
  return pagefind || null;
};

const setup = o => {
  let searchResult = element.querySelector('.p-search-dialog-result');
  let input = element.querySelector('.p-search-dialog-input');
  let button = element.querySelector('.p-search-dialog-button');

  input.onkeydown = e => {
    if (e.code === 'Enter' || e.key === 'Enter') {
      input.blur();
      setClick();
    }
  };

  let message = text => {
    let div = document.createElement('div');
    div.innerText = text;
    div.classList.add('message');
    searchResult.appendChild(div);
  };

  button.removeEventListener('click', setClick);
  setClick = async e => {
    let query = input.value.trim();
    if (query.length <= 0) return;
    let mySeq = ++seq;
    searchResult.innerHTML = '';

    let pf = await loadPagefind();
    if (!pf) {
      message(messages.failed);
      return;
    }

    let res;
    try {
      res = await pf.search(query);
    } catch (err) {
      if (mySeq === seq) message(messages.failed);
      return;
    }
    let items = await Promise.all(res.results.slice(0, RESULT_LIMIT).map(r => r.data()));
    if (mySeq !== seq) return;

    if (res.results.length <= 0) {
      message(messages.empty);
    } else {
      let count = document.createElement('div');
      count.classList.add('count');
      count.innerText = res.results.length > items.length
        ? `共 ${res.results.length} 条，显示前 ${items.length} 条`
        : `共 ${res.results.length} 条`;
      searchResult.appendChild(count);
      items.forEach(item => {
        let title = item.meta && item.meta.title ? item.meta.title : item.url;
        let _item = document.createElement('div');
        let a = document.createElement('a');
        a.href = item.url;
        a.title = title;
        a.innerText = title;
        _item.appendChild(a);
        // excerpt 自带 <mark> 高亮，样式在 search.styl 里与旧版 <strong> 同款
        let p = document.createElement('p');
        p.innerHTML = item.excerpt;
        _item.appendChild(p);
        searchResult.appendChild(_item);
      });
      onsearch && onsearch(query.toLowerCase().split(/[\s\-]+/));
    }
  };
  button.addEventListener('click', setClick);
};

const init = (params, callback) => {
  part(tag, el => {
    element = el;
    document.querySelector(tag) && document.querySelector(tag).replaceWith(element);
    if (params) {
      params.onsearch && (onsearch = params.onsearch);
      setup();
    }
    callback && callback(element);
  });
};

const on = o => {
  if (element) {
    let result = element.querySelector('.p-search-dialog-result');
    let div = document.createElement('div');
    div.innerText = messages.initial;
    div.classList.add('message');
    result.innerHTML = '';
    result.appendChild(div);

    element.classList.add('active');
  }
};

const off = o => {
  if (element) {
    element.classList.remove('active');

    element.querySelector('.p-search-dialog-input').value = '';
  }
};

export default {
  tag,
  init,
  on,
  off
};
