# takomitkm.github.io

Hexo 8 + 主题 Mustom（fork 在 `themes/mustom`）+ 自托管 live2d-widget 看板娘 + ShiftNav 抽屉菜单。构建部署走 GitHub Actions（`.github/workflows/deploy.yml`），推 `main` 即上线。

本地跑（运行时是 Deno，本机没有 Node）：

```bash
cd /s/apps/llm/agentwork/blog
alias hexo='deno run -A npm:hexo'
hexo server            # http://localhost:4000
```

`node_modules/` 由 npm 预装，Deno 直接读；不要在这里跑 `deno install`（会把依赖裁剪坏，细节见《写作与本地预览命令》那篇）。完整备份在仓库同级 `_bak/blog_node_modules_npm.tar.gz`。

`source/` 下非 md 文件原样拷进站点根目录，看板娘与 ShiftNav 的资源就放在 `source/live2d`、`source/shiftnav`。
