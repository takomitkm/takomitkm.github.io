---
title: Markdown 渲染自检
categories:
  - 测试
tags:
  - Markdown
mathjax: false
abbrlink: 682070878
date: 2026-09-27 09:20:00
---

留在这里当排版回归用：改主题或换渲染器之后重看这一页就知道有没有坏。

## 列表与嵌套

- 一级项
  - 二级项
  - 二级项（带 `行内代码`）
- 有序：

1. 第一步
2. 第二步

## 引用与代码块

> 这是一段引用。
> 第二行。

```python
def fib(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

```bash
export PATH="/s/apps/llm/node/node-v22.20.0-win-x64:$PATH"
hexo server
```

## 表格

| 项目 | 值 | 说明 |
| --- | --- | --- |
| 断点 | 991px | ShiftNav 只在窄屏出现 |
| 看板娘尺寸 | 800x800 canvas | 由 `waifu.css` 控制显示大小 |
| 模型 | haruto | Live2D Cubism 2 |

## 其它

分割线、删除线 ~~划掉~~、脚注式的行内链接 <https://github.com>、以及一个长段落用于检查正文宽度与换行：中文与 English 混排时候字距会不会突变，等宽数字 0123456789 在对齐上是否表现正常，以及标点挤压在移动端小屏上的观感。

<!-- more -->
