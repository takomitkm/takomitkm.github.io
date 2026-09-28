const arg = k => {
  const i = Deno.args.indexOf(k);
  return i >= 0 ? Number(Deno.args[i + 1]) : null;
};
const OVER = arg('--over') ?? 600;
const FILE = Deno.args.find((a, i) => !a.startsWith('--') && i !== Deno.args.indexOf('--over') + 1) ||
  'S:/apps/llm/agentwork/blog/source/data/bili-playlist.json';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0';

const view = async bvid => {
  const r = await fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + bvid, {
    headers: { 'user-agent': UA, 'referer': 'https://www.bilibili.com/' }
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  if (j.code !== 0) throw new Error('code ' + j.code);
  return j.data;
};

const doc = JSON.parse(await Deno.readTextFile(FILE));
const targets = doc.items.map((x, i) => ({ ...x, i })).filter(x => x.duration > OVER);
console.log('file', FILE, 'items', doc.items.length, 'to check', targets.length, 'threshold', OVER);

let fixed = 0, failed = 0;
for (const t of targets) {
  try {
    const d = await view(t.bvid);
    const pages = d.pages || [];
    const p = pages.find(x => x.page === (t.page || 1)) || pages[(t.page || 1) - 1];
    if (!p) {
      console.log('SKIP', t.bvid, 'no page', t.page, 'of', pages.length);
      continue;
    }
    if (p.duration !== t.duration) {
      console.log('FIX ', t.bvid, 'P' + p.page, t.duration, '->', p.duration,
        pages.length > 1 ? '(' + pages.length + 'P 合集)' : '');
      doc.items[t.i].duration = p.duration;
      fixed++;
    } else {
      console.log('OK  ', t.bvid, p.duration);
    }
  } catch (e) {
    console.log('FAIL', t.bvid, e.message);
    failed++;
  }
  await new Promise(r => setTimeout(r, 250));
}

doc.fixed_at = new Date().toISOString();
await Deno.writeTextFile(FILE, JSON.stringify(doc, null, 1));
console.log('WROTE', FILE, 'fixed', fixed, 'failed', failed);
