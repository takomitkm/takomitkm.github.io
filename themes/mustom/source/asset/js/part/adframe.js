import part from "../common/part.js";
import api from "../common/api.js";
import storage from "../common/storage.js";

let tag = 'adframe';
let element = null;

const stateKey = 'adFrameState';
const isClose = storage.get(stateKey) || false;

/**
 * 随机文章入口
 *
 * 清单不另建：/api/posts.json 本来就是全站文章的 url 索引，点了才取一条。
 * 链接尾上 ?utm_source=random 的写法取自
 * https://blog.douchi.space/hugo-random-post/ （他在构建期把整份数组写进脚本，
 * 这里改成运行时取，因为本站的数据只存在于那份 JSON 里）。
 */
const goRandom = () => {
  api('posts', data => {
    if (!data || !data.length) return;
    let post = data[Math.floor(Math.random() * data.length)];
    window.location.href = post.url + '?utm_source=random';
  });
};

const init = (params, callback) => {
  part(tag, el => {
    element = el;
    document.querySelector(tag) && document.querySelector(tag).replaceWith(element);

    if (isClose) {
      element.classList.add('close');
    }
    element.onclick = e => {
      if (element.classList.contains('close')) {
        element.classList.remove('close');
        storage.set(stateKey, false);
      } else {
        element.classList.add('close');
        storage.set(stateKey, true);
      }
    };
    // 圆钮只负责随机，点它不该顺带把广告框开关一次
    let random = element.querySelector('.p-adframe-random');
    random && (random.onclick = e => {
      e.stopPropagation();
      goRandom();
    });

    callback && callback(element);
  });
};

export default {
  tag,
  init
};