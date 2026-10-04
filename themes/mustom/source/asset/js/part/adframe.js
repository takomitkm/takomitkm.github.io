import part from "../common/part.js";
import api from "../common/api.js";

let tag = 'adframe';
let element = null;

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

    // 原来这里还有一套 localStorage.adFrameState 的开合：整框点开是广告图、
    // 点叉收成圆钮。二维码图标换成随机入口之后，圆钮不再是"打开框"的把手，
    // 收起来就没有地方能再打开，所以整框删了、只留这个圆钮。
    element.querySelector('.p-adframe-random').onclick = e => {
      e.stopPropagation();
      goRandom();
    };

    callback && callback(element);
  });
};

export default {
  tag,
  init
};
