'use strict';

/**
 * Render .tpl files with ejs engine
 */

var ejs = require('ejs');
var fs = require('fs');
var path = require('path');

module.exports = function (data) {
  let posts = this.locals.get('posts').sort('-date').filter(post => post.published);
  let pages = this.locals.get('pages');
  let root = this.config.root;

  let apiUrls = ['site', 'posts', 'tags', 'categories', 'search'].map(kind => `${root}api/${kind}.json`)
    .concat(posts.map(post => `${root}api/posts/${post.abbrlink}.json`))
    .concat(pages.filter(page => page.name && page.path.split('/').length !== 1)
      .map(page => `${root}api/pages/${page.name.replace(/[^a-zA-Z0-9]/ig, '-')}.json`));

  let partDir = path.join(this.theme.base, 'source', 'asset', 'part');
  let partUrls = fs.readdirSync(partDir).filter(f => f.endsWith('.ejs')).map(f => `${root}asset/part/${f.slice(0, -'.ejs'.length)}.html`);

  return ejs.render(data.text, {
    precacheUrls: [root].concat(posts.map(post => root + post.path)).concat(pages.map(page => root + page.path)).concat(apiUrls).concat(partUrls),
    opts: this.theme.config.serviceWorker.opts || {},
    routes: this.theme.config.serviceWorker.routes
  });
};
