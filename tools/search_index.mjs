// 把 /api/posts/*.json 里的正文注入构建产物，供 pagefind 索引。
//
// 背景：Mustom 的正文不在静态 HTML 里——文章页只有外壳，内容由浏览器从 /api 拉取渲染。
// pagefind 只认静态 HTML，所以构建期要把正文「喂」给它：
//   1. posts/<id>/index.html 末尾注入一个隐藏的 data-pagefind-body 块（标题 + 正文 HTML）；
//      只要页面里存在 data-pagefind-body，pagefind 就只索引这些块，菜单/侧栏噪音自动排除；
//   2. 其余页面（首页/归档/标签/分类/关于/live）打上 data-pagefind-ignore，
//      它们的内容是文章的重复（列表摘要）或纯客户端渲染，索引只会添乱。
// 幂等：重复运行不会二次注入。pagefind 不解析 CSS，display:none 的内容照常进索引。
//
// 用法：node tools/search_index.mjs public   （CI 里用 node）
//       deno run -A tools/search_index.mjs public   （本机没有 node）
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const siteDir = process.argv[2] || "public";
const apiDir = join(siteDir, "api", "posts");

const walkIndexPages = dir => {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...walkIndexPages(p));
    else if (name.name === "index.html") out.push(p);
  }
  return out;
};

const pages = walkIndexPages(siteDir);
let injected = 0;
let ignored = 0;

for (const page of pages) {
  let html = readFileSync(page, "utf8");
  if (html.includes("data-pagefind-body") || html.includes("data-pagefind-ignore")) continue;

  const m = page.match(/[/\\]posts[/\\]([^/\\]+)[/\\]index\.html$/);
  const apiFile = m ? join(apiDir, `${m[1]}.json`) : null;
  if (m && apiFile && existsSync(apiFile)) {
    const post = JSON.parse(readFileSync(apiFile, "utf8"));
    const block =
      `<div data-pagefind-body style="display:none">` +
      `<h1>${post.title}</h1>${post.content || post.excerpt || ""}</div>`;
    html = html.replace("</body>", `${block}</body>`);
    injected++;
  } else {
    html = html.replace("<body", "<body data-pagefind-ignore ");
    ignored++;
  }
  writeFileSync(page, html);
}

console.log(`search_index: ${injected} posts indexed, ${ignored} pages ignored`);
