# takomitkm.github.io

Hexo 8 + 主题 Mustom（fork 在 `themes/mustom`）+ 自托管 live2d-widget 看板娘 + ShiftNav 抽屉菜单。构建部署走 GitHub Actions（`.github/workflows/deploy.yml`），推 `main` 即上线。

本地跑：

```bash
export PATH="/s/apps/llm/node/node-v22.20.0-win-x64:$PATH"   # 便携版 Node，未装进系统
cd /s/apps/llm/agentwork/blog
npm install            # 首次
hexo server            # http://localhost:4000
```

`source/` 下非 md 文件原样拷进站点根目录，看板娘与 ShiftNav 的资源就放在 `source/live2d`、`source/shiftnav`。
