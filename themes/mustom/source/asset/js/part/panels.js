import part from "../common/part.js";

let tag = 'panels';
let element = null;

const scale = (items, box) => {
  // 同一个面板里按条数分配字号和透明度：最多的最大最实，最小的最小最淡
  let maxLen = 0;
  items.forEach(item => {
    if (item.count > maxLen) maxLen = item.count;
  });
  let minLen = maxLen;
  items.forEach(item => {
    if (item.count < minLen) minLen = item.count;
  });
  let len = maxLen - minLen;
  items.forEach(item => {
    let size = parseFloat(((item.count - minLen) / len).toFixed(2));
    let a = document.createElement('a');
    a.innerText = item.name;
    a.href = item.url;
    a.style.fontSize = (1 + 0.5 * size) + 'em';
    a.style.opacity = 0.5 + 0.5 * size;
    box.appendChild(a);
  });
};

// 抽屉里那份是同一块面板的第二个副本（手机端看抽屉、桌面端看右栏），
// 两边都要填，part() 只认第一个元素，所以这里自己把每个副本都处理一遍。
const fill = (root, categories, tags) => {
  let box = root.querySelector('[data-key="categories"] .p-panel-items');
  categories && box && scale(categories, box);
  box = root.querySelector('[data-key="tags"] .p-panel-items');
  tags && box && scale(tags, box);
};

const init = (params, callback) => {
  part(tag, el => {
    element = el;
    document.querySelectorAll(`.p-${tag}`).forEach(dom => {
      dom.classList.remove('HIDE');
      if (params && params.categories && params.tags) {
        fill(dom, params.categories, params.tags);
      }
    });
    callback && callback(element);
  });
};

export default {
  tag,
  init
};
