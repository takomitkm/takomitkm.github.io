const base = window.LIVE2D_BASE || '/live2d/';

await import(base + 'dist/waifu-tips.js');

window.initWidget({
  waifuPath: base + 'waifu-tips.json',
  cubism2Path: base + 'dist/live2d.min.js',
  tools: ['hitokoto', 'photo', 'info', 'quit'],
  drag: true,
  logLevel: 'warn'
});
