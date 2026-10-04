'use strict';

/**
 * 时空胶囊 permalink
 *
 * 抄 https://blog.douchi.space/ 的 /time-capsule/YYYYMMDD-slug/ 形态：
 * 文章 front matter 里写 `capsule: maple-pass`，那一段就用 maple-pass；
 * 只写 `capsule: true` 则退回用文件名（slug）。没写 capsule 的文章照旧走
 * posts/:abbrlink/，一条老链接都不动。
 *
 * 挂在 before_post_render 而不是 post_permalink 上：hexo 的 post.path 虚拟属性
 * 把整篇 post 交给 post_permalink 链，内置那条（node_modules/hexo/dist/
 * plugins/filter/post_permalink.js）第一个分支只认 data.__permalink，
 * 而链上后一个过滤器拿到的是上一个返回的字符串、已经看不到文章了。
 * before_post_render 拿到的就是 Post 文档本身（render_post 里
 * post.render(post.full_source, post) 之后才 post.save()），
 * 在这儿写 __permalink 正好赶在路由之前，也不用像 hexo-abbrlink 那样回写源文件。
 */
hexo.extend.filter.register('before_post_render', function (data) {
  if (!data.capsule || data.__permalink) return data;

  var slug = data.capsule === true ? data.slug : String(data.capsule);
  slug = String(slug).replace(/^\/+|\/+$/g, '');
  if (!slug) return data;

  data.__permalink = 'time-capsule/' + data.date.format('YYYYMMDD') + '-' + slug + '/';
  return data;
});
