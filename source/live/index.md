---
title: 直播间
layout: page
name: live
parts:
  - page
---

常驻轮播位。线路表和播放源都留空，改这一页就能接上。

<style>
.lr-stage{position:relative;display:flex;align-items:center;justify-content:center;width:100%;aspect-ratio:16/9;background:#000;color:#fff;overflow:hidden}
.lr-stage video{width:100%;height:100%;object-fit:contain;background:#000}
.lr-ph{position:absolute;top:0;right:0;bottom:0;left:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.3em;text-align:center}
.lr-ph-title{font-size:1.1em;letter-spacing:.08em}
.lr-ph-copy{font-size:.82em;opacity:.6}
.lr-clock{margin-top:.6em;font-variant-numeric:tabular-nums}
.lr-clock b{font-size:2.1em;font-weight:400;letter-spacing:.05em}
.lr-clock i{display:block;font-style:normal;font-size:.8em;opacity:.55}
.lr-badge{position:absolute;top:.7em;left:.7em;display:inline-flex;align-items:center;gap:.45em;padding:.12em .6em;background:var(--color-link);color:#fff;font-size:.78em;letter-spacing:.14em}
.lr-badge[hidden]{display:none}
.lr-badge em{width:.5em;height:.5em;border-radius:50%;background:#fff;animation:lr-pulse 1.2s infinite}
@keyframes lr-pulse{50%{opacity:.15}}
.lr-bar{display:flex;align-items:center;justify-content:space-between;gap:1em;padding:.7em 0;border-top:1px solid var(--color-post-ending)}
.lr-bar select{padding:.3em .5em;background:var(--color-clear);color:var(--color-text);border:1px solid var(--color-post-ending);font:inherit}
.lr-like{display:inline-flex;align-items:center;gap:.5em;padding:.3em 1em;background:none;border:1px solid var(--color-post-ending);color:var(--color-text);font:inherit;cursor:pointer}
.lr-like:hover{border-color:var(--color-link);color:var(--color-link)}
.lr-note{font-size:.82em;opacity:.6}
</style>
<div class="lr">
  <div class="lr-stage">
    <video id="lrVideo" playsinline controls preload="metadata"></video>
    <div class="lr-ph" id="lrPh">
      <p class="lr-ph-title" id="lrStatus">视频源未配置</p>
      <p class="lr-ph-copy">地址写在本页脚本第一行的 routes 数组里，一条算一个线路</p>
      <p class="lr-clock"><b id="lrTime">--:--:--</b><i id="lrDate"></i></p>
    </div>
    <span class="lr-badge" id="lrBadge" hidden><em></em>LIVE</span>
  </div>
  <div class="lr-bar">
    <select id="lrRoute" aria-label="线路"></select>
    <button class="lr-like" id="lrLike" type="button"><i class="fas fa-heart fa-fw"></i><span id="lrLikeN">0</span></button>
  </div>
  <p class="lr-note">点赞数只写进你自己浏览器的 localStorage，没有服务端计数；聊天室要常驻 WebSocket，静态托管上做不了。</p>
</div>
<script>
(function () {
  var routes = [];
  var video = document.getElementById('lrVideo');
  var ph = document.getElementById('lrPh');
  var badge = document.getElementById('lrBadge');
  var status = document.getElementById('lrStatus');
  var routeSel = document.getElementById('lrRoute');
  var timeEl = document.getElementById('lrTime');
  var dateEl = document.getElementById('lrDate');
  var likeBtn = document.getElementById('lrLike');
  var likeN = document.getElementById('lrLikeN');
  var KEY = 'live-room-likes';
  var hls = null;
  var pad = function (n) {
    return String(n).length < 2 ? '0' + n : '' + n;
  };
  var tick = function () {
    var d = new Date();
    timeEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    dateEl.textContent = d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate());
  };
  var hide = function () {
    ph.style.display = 'none';
    badge.hidden = false;
  };
  var show = function (msg) {
    ph.style.display = '';
    badge.hidden = true;
    status.textContent = msg;
  };
  var play = function (src) {
    if (hls) {
      hls.destroy();
      hls = null;
    }
    video.pause();
    video.removeAttribute('src');
    if (!src) {
      show('视频源未配置');
      return;
    }
    show('正在接入…');
    var nativeHls = video.canPlayType('application/vnd.apple.mpegurl');
    if (/\.m3u8(\?|$)/i.test(src) && !nativeHls) {
      import('https://esm.sh/hls.js@1.5.17').then(function (mod) {
        var Hls = mod.default;
        if (!Hls.isSupported()) {
          show('浏览器不支持 HLS');
          return;
        }
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, function (e, data) {
          if (data.fatal) show('拉流失败：' + data.details);
        });
      }).catch(function () {
        show('hls.js 加载失败');
      });
    } else {
      video.src = src;
      video.load();
    }
  };
  tick();
  window.setInterval(tick, 1000);
  video.addEventListener('canplay', function () {
    if (video.paused) show('已就绪，点播放');
  });
  video.addEventListener('playing', hide);
  video.addEventListener('error', function () {
    show('播放失败，检查线路地址');
  });
  if (!routes.length) {
    var none = document.createElement('option');
    none.textContent = '未配置线路';
    routeSel.append(none);
    routeSel.disabled = true;
  } else {
    routes.forEach(function (src, i) {
      var opt = document.createElement('option');
      opt.value = src;
      opt.textContent = '线路 ' + (i + 1);
      routeSel.append(opt);
    });
    routeSel.addEventListener('change', function () {
      play(routeSel.value);
    });
    play(routes[0]);
  }
  likeN.textContent = localStorage.getItem(KEY) || '0';
  likeBtn.addEventListener('click', function () {
    var n = Number(localStorage.getItem(KEY) || 0) + 1;
    localStorage.setItem(KEY, n);
    likeN.textContent = n;
  });
})();
</script>
