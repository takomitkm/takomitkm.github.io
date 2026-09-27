import part from "../common/part.js";

let tag = 'footer';
let element = null;

const init = (params, callback) => {
  part(tag, el => {
    element = el;
    document.querySelector(tag) && document.querySelector(tag).replaceWith(element);
    callback && callback(element);
  });
};

const update = data => {
  if (!element) return;
  data.site_wd !== undefined && (element.querySelector('.p-footer-wd').innerText = data.site_wd);
};

export default {
  tag,
  init,
  update
};