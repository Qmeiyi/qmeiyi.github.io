# 强美伊｜个人主页

这是强美伊的学术、开源与创业个人主页，基于 Astro 构建并通过 GitHub Pages 发布。

- 线上地址：<https://qmeiyi.github.io/>
- GitHub：<https://github.com/Qmeiyi>
- Google Scholar：<https://scholar.google.com/citations?user=8g78CmwAAAAJ&hl=zh-CN>

## 本地运行

需要 Node.js 22.13+ 与 pnpm 11+。

```bash
pnpm install
pnpm dev
```

浏览器打开 <http://localhost:4321/>。

## 内容维护

| 内容 | 文件 |
| --- | --- |
| 姓名、简介、链接和首页配置 | `site.config.ts` |
| 近期动态 | `src/data/news.yml` |
| 首页经历、教育和荣誉 | `src/data/about.yml` |
| 论文 | `src/data/publications.bib` |
| 首页项目 | `src/content/projects/` |
| 头像和图标 | `public/` |

## 构建与发布

```bash
pnpm test
pnpm astro check
pnpm build
```

推送到 `main` 分支后，`.github/workflows/deploy-pages.yml` 会自动构建并发布到 GitHub Pages。

网站采用单页履历结构，首页完整展示个人信息；`/researches` 是唯一独立内容页，用于论文列表。

## 致谢

页面基于 MIT 许可的 [Scholar Pages](https://github.com/jxpeng98/astro-theme-scholars) 修改，内容结构参考了 [haolpku.github.io](https://haolpku.github.io/)。原始许可见 `LICENSE`。
