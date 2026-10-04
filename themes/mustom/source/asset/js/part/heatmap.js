import part from "../common/part.js";
import api from "../common/api.js";

/**
 * heatmap Part
 *
 * 侧栏日历热力图：一格 = 一天，颜色 = 当天全站发文字数（千字）。
 * 做法取自 https://blog.douchi.space/hugo-blog-heatmap/ ，
 * 差别是他用 Go 模板在解析时把数据写进脚本，这里改成从 /api/posts.json 取，
 * 因为本站正文数据本来就只存在于那份 JSON 里。
 *
 * 桌面端只画 .m-aside 里那一份，手机端只画 .m-drawer 里那一份，
 * 两份靠 CSS 媒体查询互斥；part() 只认第一个元素，所以这里按 panels.js
 * 的老办法把每个副本都过一遍，宽为 0 的（当前被隐藏的那份）跳过。
 */

let tag = 'heatmap';
let element = null;

const CDN = 'https://cdn.jsdelivr.net/npm/echarts@5.3.0/dist/echarts.min.js';

let store = new Map();
let loading = null;

const ready = () => {
  if (window.echarts) return Promise.resolve(window.echarts);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      let script = document.createElement('script');
      script.src = CDN;
      script.onload = () => resolve(window.echarts);
      script.onerror = () => {
        loading = null;
        reject(new Error(CDN));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
};

const cssVar = name =>
  window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const unit = () => {
  let holder = document.querySelector('.p-heatmap-unit');
  return holder ? holder.textContent : '';
};

const group = list => {
  let result = new Map();
  list.forEach(item => {
    if (!item || !item.date) return;
    let day = result.get(item.date) || { chars: 0, posts: [] };
    day.chars += item.chars || 0;
    day.posts.push(item);
    result.set(item.date, day);
  });
  return result;
};

// 面板宽度决定画几个月：一格约 8px，一周约 48px，最少 3 个月最多 12 个月。
// 起点还要回退到所在那一周的周日：echarts 的日历是一列一周、一行一星期，
// 起点落在周中时第一行（周日那行）的第一个格子会空着，整行看着就往右挪了一格
const rangeOf = width => {
  let months = Math.max(3, Math.min(12, Math.floor(width / 48)));
  let end = new Date();
  let start = new Date();
  start.setMonth(start.getMonth() - months);
  start.setDate(start.getDate() - start.getDay());
  let fmt = d => window.echarts.format.formatTime('yyyy-MM-dd', d);
  return [fmt(start), fmt(end)];
};

const option = box => {
  let days = [];
  let top = 1;
  store.forEach((day, key) => {
    let value = Number((day.chars / 1000).toFixed(1));
    if (value > top) top = value;
    days.push([key, value]);
  });
  return {
    tooltip: {
      hideDelay: 1000,
      enterable: true,
      formatter: p => {
        let day = store.get(p.data[0]);
        if (!day) return p.data[0];
        let lines = [p.data[0]];
        day.posts.forEach(post => {
          lines.push('<a href="' + post.url + '" target="_blank">' + post.title +
            ' | ' + (post.chars / 1000).toFixed(1) + ' ' + unit() + '</a>');
        });
        return lines.join('<br>');
      }
    },
    // 教程版是 showLabel:true + itemGap:20，那是给他 600px 宽的示例容器写的；
    // 侧栏面板只有 254px，四条带数字区间图例会溢出左边界。他线上那份打包脚本
    // 里同样是把整个 visualMap 收起来（show:false），分档颜色照常生效，
    // 具体数字交给 tooltip，所以这里跟线上版本对齐而不是跟教程对齐。
    visualMap: {
      min: 0,
      max: Math.ceil(top),
      type: 'piecewise',
      orient: 'horizontal',
      left: 'center',
      top: 2,
      splitNumber: 4,
      show: false,
      text: [unit(), ''],
      inRange: { color: ['#7aa8744c', '#7AA874'] }
    },
    calendar: {
      top: 24,
      left: 6,
      right: 6,
      cellSize: ['auto', 12],
      range: rangeOf(box.clientWidth),
      itemStyle: {
        color: cssVar('--color-clear') || '#F1F1F1',
        borderWidth: 2.5,
        borderColor: cssVar('--color-background') || '#FFFFFF'
      },
      yearLabel: { show: false },
      dayLabel: { show: false },
      monthLabel: { show: true, fontSize: 10, color: cssVar('--color-text') },
      splitLine: { lineStyle: { color: 'rgba(0, 0, 0, 0)' } }
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: days
    }
  };
};

const draw = () => {
  if (!window.echarts) return;
  document.querySelectorAll('.p-heatmap-chart').forEach(box => {
    if (!box.clientWidth) return;
    let chart = box.__heatmap || window.echarts.init(box);
    box.__heatmap = chart;
    chart.setOption(option(box), true);
    chart.off('click');
    chart.on('click', params => {
      if (params.componentType !== 'series') return;
      let day = store.get(params.data[0]);
      if (day && day.posts.length) {
        window.open(day.posts[0].url, '_blank').focus();
      }
    });
  });
};

let timer = null;
const redraw = () => {
  window.clearTimeout(timer);
  timer = window.setTimeout(draw, 200);
};

const init = (params, callback) => {
  part(tag, el => {
    element = el;
    document.querySelectorAll(`.p-${tag}`).forEach(dom => {
      dom.classList.remove('HIDE');
    });

    // 出处注释：桌面靠 :hover/:focus，触屏靠这条 click 切 .on，
    // 和页脚那三个气泡同一套做法
    document.querySelectorAll(`.p-${tag}-caption`).forEach(caption => {
      caption.addEventListener('click', () => {
        let opened = caption.classList.contains('on');
        document.querySelectorAll(`.p-${tag}-caption.on`)
          .forEach(o => o.classList.remove('on'));
        !opened && caption.classList.add('on');
      });
    });

    api('posts', pdata => {
      store = group(pdata || []);
      ready().then(draw).catch(err => {
        console.error(err);
      });
      callback && callback(element);
    });

    window.addEventListener('resize', redraw);
    // 皮肤和夜间模式改的是 :root 上的 class，颜色是从 CSS 变量现读的，
    // 所以换挡之后要重画一次，不然格子会停在旧底色上
    window.MutationObserver && new window.MutationObserver(redraw)
      .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  });
};

export default {
  tag,
  init,
  update: draw
};
