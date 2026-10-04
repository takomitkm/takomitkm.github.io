'use strict';

var pagination = require('hexo-pagination');

var toc = require('../../toc');

var headingNumbers = require('../../heading-numbers');

var $min2read = require('../../../helper/$min2read');

var $word4post = require('../../../helper/$word4post');

var $word4site = require('../../../helper/$word4site');

var $encode = require('../../../helper/$encode');

var $gallery = require('../../../helper/$gallery');

var $count = require('../../../helper/$count');

// 参照 Hugo 的 CJK 默认值：400 字/分钟，字数一律按千位小数显示
function hintOf(content) {
  var counted = $count(content);
  var chars = counted.zh + counted.en;
  return {
    chars: chars,
    hintWord: (chars / 1000).toFixed(2) + 'k',
    hintMinute: Math.max(1, Math.floor(chars / 400))
  };
}

function filterHTMLTags(str) {
  return str ? str
    .replace(/\r?\n|\r/g, '')
    .replace(/<img[^>]*>(<br>)*/g, '') : null
}

var ENTITIES = {
  nbsp: ' ', enbsp: ' ',ensp: ' ', emsp: ' ', thinp: ' ',
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  mdash: '—', ndash: '–', hellip: '…', middot: '·',
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’'
};

function preview(str, limit) {
  var max = Number(limit) > 0 ? Number(limit) : 500;
  var text = String(str || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d+);/g, function (all, code) { return String.fromCharCode(Number(code)); })
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, function (all, name) {
      var key = name.replace('#x', 'x').toLowerCase();
      return ENTITIES[key] === undefined ? all : ENTITIES[key];
    })
    .replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (text.length <= max) return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text.slice(0, max).replace(/\s+$/, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '......';
}
function fetchCovers(str) {
  var temp,
    imgURLs = [],
    rex = /<img[^>]+src="?([^"\s]+)"(.*)>/g;
  while (temp = rex.exec(str)) {
    imgURLs.push(temp[1]);
  }
  return imgURLs.length > 0 ? imgURLs : null;
}
function fetchCover(str) {
  var covers = fetchCovers(str)
  return covers ? covers[0] : null;
}

module.exports = function (cfg, site, hexo) {

  // cfg.root 已经带尾斜杠，而 front matter 里给了 permalink 的文章
  // （hexo 的 __permalink 分支）path 又带头斜杠，直接相加会拼出
  // //开头的地址——浏览器把它当协议相对 URL 去解析主机名，点开 404。
  // 时空胶囊那套 front-matter 开关已经删了，但 hexo 自己仍认 permalink，
  // 所以这条防护留着。
  var urlOf = function (p) {
    return String(cfg.root).replace(/\/+$/, '') + '/' + String(p).replace(/^\/+/, '');
  };

  var restful = {
    site: true,
    posts_props: {
      title: true,
      slug: true,
      date: true,
      updated: true,
      cover: true,
      path: true,
      excerpt: true,
      content: false,
      categories: true,
      tags: true
    },
    categories: true,
    use_category_slug: false,
    tags: true,
    use_tag_slug: false,
    post: true,
    pages: true,
  },

    posts = site.posts.sort('-date').filter(function (post) {
      return post.published;
    }),

    posts_props = (function () {
      var props = restful.posts_props;

      return function (name, val) {
        return props[name] ? (typeof val === 'function' ? val() : val) : null;
      }
    })(),

    postMap = function (post) {
      return {
        title: posts_props('title', post.title),
        slug: posts_props('slug', post.slug),
        date: posts_props('date', post.date.format('YYYY-MM-DD')),
        updated: posts_props('updated', post.updated.format('YYYY-MM-DD')),
        path: posts_props('path', 'api/posts/' + post.abbrlink + '.json'),
        excerpt: posts_props('excerpt', preview(post.excerpt || post.content, cfg.excerpt_chars)),
        cover: posts_props('cover', post.cover || fetchCover(post.content)),
        content: posts_props('content', post.content),
        min2read: $min2read(post.content),
        word4post: $word4post(post.content),
        url: urlOf(post.path),
        categories: posts_props('categories', function () {
          return post.categories.map(function (cat) {
            const name = (
              restful.use_category_slug && cat.slug
            ) ? cat.slug : cat.name;
            return {
              name: name,
              path: 'api/categories/' + name + '.json',
              url: urlOf(cat.path)
            };
          });
        }),
        tags: posts_props('tags', function () {
          return post.tags.map(function (tag) {
            const name = (
              restful.use_tag_slug && tag.slug
            ) ? tag.slug : tag.name;
            return {
              name: name,
              path: 'api/tags/' + name + '.json',
              url: urlOf(tag.path)
            };
          });
        })
      };
    },

    cateReduce = function (cates, kind) {
      return cates.reduce(function (result, item) {
        if (!item.length) return result;

        let use_slug = null;
        switch (kind) {
          case 'categories':
            use_slug = restful.use_category_slug;
            break;
          case 'tags':
            use_slug = restful.use_tag_slug;
            break;
        }

        const name = (use_slug && item.slug) ? item.slug : item.name;

        return result.concat(pagination(item.path, posts, {
          perPage: 0,
          data: {
            name: name,
            url: urlOf(item.path),
            path: 'api/' + kind + '/' + item.slug + '.json',
            postlist: item.posts.sort('-date').filter(function (post) {
              return post.published;
            }).map(postMap)
          }

        }));
      }, []);
    },

    catesMap = function (item) {
      return {
        name: item.data.name,
        url: item.data.url,
        path: item.data.path,
        count: item.data.postlist.length
      };
    },

    cateMap = function (item) {
      var itemData = item.data;
      return {
        path: itemData.path,
        data: JSON.stringify({
          name: itemData.name,
          postlist: itemData.postlist
        })
      };
    },

    apiData = [];


  if (restful.site) {
    // Encode baidu translate
    let encodeBaiduTranslate = {
      pass: '',
      pointer: ''
    };
    let baidu_translate = cfg.baidu_translate;
    if (baidu_translate && baidu_translate.appid && baidu_translate.appkey) {
      let appidLen = (baidu_translate.appid + '').length;
      let appkeyLen = (baidu_translate.appkey + '').length;
      if (appidLen && appkeyLen) { // Something there...
        encodeBaiduTranslate.pass = $encode(baidu_translate.appid + '', baidu_translate.appkey + '');
        encodeBaiduTranslate.pointer = appidLen;
      }
    }
    // Encode valine
    let encodeValine = {
      pass: '',
      pointer: ''
    };
    let valine = cfg.valine;
    if (valine && valine.appid && valine.appkey) {
      let appidLen = (valine.appid + '').length;
      let appkeyLen = (valine.appkey + '').length;
      if (appidLen && appkeyLen) { // Something there...
        encodeValine.pass = $encode(valine.appid + '', valine.appkey + '');
        encodeValine.pointer = appidLen;
      }
    }
    apiData.push({
      path: 'api/site.json',
      data: JSON.stringify({
        word4site: $word4site(site),
        numOfPosts: posts.length,
        numOfCategories: site.categories.length,
        numOfTags: site.tags.length,
        abbrMatch: (o => {
          let result = {};
          posts.forEach(function (post) {
            result[post.abbrlink] = post.title;
          });
          return result;
        })(),
        menus: cfg.menus,
        baidu_translate: encodeBaiduTranslate,
        valine: encodeValine,
        swPath: `${cfg.serviceWorker.path}?t=${Date.now()}`
      })
    });
  }

  if (restful.categories) {

    var cates = cateReduce(site.categories, 'categories');

    if (!!cates.length) {
      apiData.push({
        path: 'api/categories.json',
        data: JSON.stringify(cates.map(catesMap))
      });

      apiData = apiData.concat(cates.map(cateMap));
    } else {
      apiData.push({
        path: 'api/categories.json',
        data: JSON.stringify([])
      });
    }

  }

  if (restful.tags) {
    var tags = cateReduce(site.tags, 'tags');

    if (tags.length) {
      apiData.push({
        path: 'api/tags.json',
        data: JSON.stringify(tags.map(catesMap))
      });

      apiData = apiData.concat(tags.map(cateMap));
    } else {
      apiData.push({
        path: 'api/tags.json',
        data: JSON.stringify([])
      });
    }

  }

  var postlist = posts.map(function (post) {
    return {
      title: posts_props('title', post.title),
      slug: posts_props('slug', post.slug),
      date: posts_props('date', post.date.format('YYYY-MM-DD')),
      updated: posts_props('updated', post.updated.format('YYYY-MM-DD')),
      path: posts_props('path', 'api/posts/' + post.abbrlink + '.json'),
      excerpt: posts_props('excerpt', preview(post.excerpt || post.content, cfg.excerpt_chars)),
      cover: posts_props('cover', post.cover || fetchCover(post.content)),
      ...hintOf(post.content),
      url: urlOf(post.path),
      abbrlink: post.abbrlink,
      categories: posts_props('categories', function () {
        return post.categories.map(function (cat) {
          const name = (
            restful.use_category_slug && cat.slug
          ) ? cat.slug : cat.name;
          return {
            name: name,
            path: 'api/categories/' + name + '.json',
            url: urlOf(cat.path)
          };
        });
      }),
      tags: posts_props('tags', function () {
        return post.tags.map(function (tag) {
          const name = (
            restful.use_tag_slug && tag.slug
          ) ? tag.slug : tag.name;
          return {
            name: name,
            path: 'api/tags/' + name + '.json',
            url: urlOf(tag.path)
          };
        });
      })
    };
  });

  apiData.push({
    path: 'api/posts.json',
    data: JSON.stringify(postlist)
  });

  var searchlist = posts.map(function (post) {
    return {
      title: post.title,
      url: urlOf(post.path),
      content: post._content,
      categories: post.categories.map(function (cat) {
        return cat.name;
      }),
      tags: post.tags.map(function (tag) {
        return tag.name;
      })
    };
  });

  apiData.push({
    path: 'api/search.json',
    data: JSON.stringify(searchlist)
  });

  apiData.push({
    path: 'gallery/content.json',
    data: JSON.stringify($gallery(hexo.source_dir + 'gallery'))
  });

  if (cfg.manifest) {
    apiData.push({
      path: 'manifest.json',
      data: JSON.stringify(cfg.manifest)
    });
  }

  if (restful.post) {
    apiData = apiData.concat(posts.map(function (post) {
      var path = 'api/posts/' + post.abbrlink + '.json';
      var numbered = headingNumbers(post.content);
      return {
        path: path,
        data: JSON.stringify({
          title: post.title,
          slug: post.slug,
          date: post.date.format('YYYY-MM-DD'),
          updated: post.updated.format('YYYY-MM-DD'),
          comments: post.comments,
          path: path,
          excerpt: filterHTMLTags(post.excerpt),
          cover: fetchCover(post.content),
          covers: fetchCovers(post.content),
          content: numbered,
          url: urlOf(post.path),
          min2read: $min2read(post.content),
          word4post: $word4post(post.content),
          ...hintOf(post.content),
          prev_post: post.prev ? (o => {
            return {
              title: post.prev.title,
              url: urlOf(post.prev.path)
            };
          })() : null,
          next_post: post.next ? (o => {
            return {
              title: post.next.title,
              url: urlOf(post.next.path)
            };
          })() : null,
          toc: toc(numbered),
          categories: post.categories.map(function (cat) {
            return {
              name: cat.name,
              path: 'api/categories/' + cat.name + '.json',
              url: urlOf(cat.path)
            };
          }),
          tags: post.tags.map(function (tag) {
            return {
              name: tag.name,
              path: 'api/tags/' + tag.name + '.json',
              url: urlOf(tag.path)
            };
          })
        })
      };
    }));
  }

  if (restful.pages) {
    apiData = apiData.concat(site.pages.data.map(function (page) {
      if (page.path.split('/').length !== 1 && page.name) {
        var safename = page.name.replace(/[^a-zA-Z0-9]/ig, '-');
        var path = 'api/pages/' + safename + '.json';
  
        return {
          path: path,
          data: JSON.stringify({
            title: page.title,
            path: path,
            url: urlOf(page.path),
            content: page.content
          })
        };
      } else {
        return {};
      }
    }));
  }

  return apiData;
};