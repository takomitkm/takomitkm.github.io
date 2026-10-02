'use strict';

const { tocObj } = require('hexo-util');

function build(list) {
  const last = [0, 0, 0, 0, 0, 0];
  const out = [];
  let root = 0;
  for (const el of list) {
    const level = el.level;
    last[level - 1]++;
    for (let i = level; i <= 5; i++) last[i] = 0;
    if (!root) root = level;
    const parts = [];
    for (let i = root - 1; i < level; i++) parts.push(last[i]);
    out.push(parts.join('.'));
  }
  return out;
}

module.exports = function (str, options = {}) {
  options = Object.assign({ min_depth: 1, max_depth: 6 }, options);

  const list = tocObj(str, {
    min_depth: options.min_depth,
    max_depth: options.max_depth
  });

  if (!list.length) return str;

  const labels = build(list, options);
  const re = new RegExp('<h([' + options.min_depth + '-' + options.max_depth + '])(?=[\\s>])', 'g');

  let i = 0;
  const out = str.replace(re, function (tag) {
    const label = labels[i++];
    return label === undefined ? tag : tag + ' data-num="' + label + '"';
  });

  if (i !== labels.length) {
    console.warn('[mustom] heading numbering skipped: ' + i + ' tags / ' + labels.length + ' toc entries');
    return str;
  }

  return out;
};
