# ZY驿站

纯静态、零依赖的个人技术博客：原生 HTML / CSS / JavaScript 手写，无框架、无第三方构建链。
样式、脚本、文章数据与全部插画**内联进页面**，每个 HTML 都是自包含单文件，可直接部署到
GitHub Pages 或任意静态托管。

线上地址：<https://felixdsh2.eu.cc>

## 特性

- **全屏水墨 Banner**：自绘云海仙山 SVG（淡月 + 三重远山 + 云带 + 仙鹤）+ 打字机副标题 + 圆形按钮
- **文章卡片**：程序生成的水墨山水封面 + 双剑剑光 + 描金内框 + 墨底分类角标，摘要 / 日期 / 字数 / 阅读时长 / 标签
- **文章页顶图**：19×19 木色围棋盘对弈画面（39 道格线 + 9 星位 + 14~20 颗黑白子），按文章序号取种子，每篇棋形不同
- **标签墙 / 分类墙 / 归档时间轴**：构建期直出 HTML，禁用 JS 或离线也完整可见
- **搜索弹窗**：全站文章实时检索（标题 / 摘要 / 标签 / 分类），回车与点击均可跳转
- **侧栏抽屉 + 桌面固定侧栏**：首页 / 标签 / 分类 / 归档 / 关于 / 留言板 / 友链 / GitHub，单字篆意标记
- **昼夜主题**：墨夜与宣纸两套，localStorage 记忆，全套镜像配色
- **氛围特效**：墨雪（canvas，≤42 片）与墨迹拖尾常开，尊重系统「减少动态效果」自动关闭
- 阅读进度条、上一篇 / 下一篇、回到顶部
- 页脚：站点运行时间实时滴答 / 浏览量 / 访客数
- 评论区：utterances（挂在 GitHub Issues 上，按 `pathname` 归属）
- 全站 `noindex` + `robots.txt` 禁止收录

## 目录结构

```
index.html               首页（Banner + 分类筛选 + 卡片列表）
archive.html             归档时间轴
tags.html                标签墙
categories.html          分类墙
about.html               关于
contact.html             留言板
friends.html             友情链接
sitemap.xml              站点地图
robots.txt               全站禁止收录
posts.json               文章数据（构建期产物，页面运行时不依赖）
posts/*.html             文章页（每篇一个自包含单文件）

assets/css/style.css     全部样式（构建时内联进页面）
assets/js/app.js         全部脚本（构建时内联进页面）

build_lib.js             页面模板库（head / 顶栏 / 侧栏 / Banner / 页脚 / 弹窗 / 文章页）
build_posts.js           Markdown → 文章页 + posts.json
build_site.js            生成首页 / 归档 / 标签 / 分类 / 关于 / 留言板 / 友链 / sitemap
ink_cover.js             7 套水墨山水封面（内联 SVG，程序生成）
board_cover.js           围棋盘文章顶图 + cssUri() 转义工具
deploy_github.js         用 GitHub Contents API 发布（自动比对远端，增量上传/删除）
devserver.js             本地预览服务器
.slugmap.json            线上路径映射：老文章 URL 永不变化（评论与计数不失效）
.buildstamp              每次构建的版本戳，写进所有站内链接的 ?v=
```

## 本地预览

```bash
node devserver.js 8152
# 浏览器打开 http://127.0.0.1:8152/
```

## 发布新文章

```bash
# 1) 把 .md 放进 /storage/emulated/0/MD文件
node build_posts.js "/storage/emulated/0/MD文件" .
node build_site.js

# 2) 上传（令牌只从环境变量读，不落盘）
GH_TOKEN=xxxxx node deploy_github.js
```

构建是**预渲染**的：`.nojekyll` 关闭 Jekyll，直接上传 `.md` 不会生成页面 —— 首页 / 归档 / 标签 /
分类 / sitemap 都是构建期产物，必须走上面的两步。

### md 的两种开头

1. **纯 Markdown**：首行的 `# 标题` 作为文章标题，日期取文件修改时间；
2. **Jekyll front matter**（现成草稿常见，推荐）：

```markdown
---
title: "Win11 + WSL2 + Ubuntu 24.04：DeepSeek Harness 插件折腾记"
date: 2026-09-27 10:00:00 +0800
categories: [开发环境, Windows]
tags: [Win11, WSL2, Ubuntu24.04]
description: "首页卡片上的摘要"
---

正文……
```

构建器会把 `title / date / categories / tags / description` 取成文章元数据（标题、日期、分类取第一项、
标签最多 3 个、摘要），`permalink` `layout` 这类键忽略；Jekyll 的 `<!--more-->` 摘要标记直接丢掉 ——
都不会被渲染进正文。

### 文章 URL 为什么不会变

`p-0N-xxx` 是文章的永久路径，评论与浏览量都按 `pathname` 归属。构建时 slug 映射从**三处**合并
（`.slugmap.json` → `posts.json` → 现存 `posts/*.html` 文件名，先到先得、绝不覆盖），构建结束后
**写回 `.slugmap.json`**，并删掉不再使用的陈旧文章页。

这样新增文章不会再按目录顺序"抢号"把已上线文章挤成新编号（踩过一次：新文章抢走 `p-09`，
把 ZY影视 顶到 `p-10`，老链接直接失效）。

## 文章配图

图片按 Markdown 标准写法即可，**本地图片由构建自动处理**，不需要手改 HTML、也不需要单独上传：

- **小图（≤ 400KB）**：内联成 data URI，文章页保持单文件自包含；
- **大图（> 400KB）**：自动复制到 `assets/img/` 并以 `../assets/img/…` 引用，构建日志会写明
  `配图改为外链（xxxKB > 400KB）`，页面体积不受影响，`deploy_github.js` 会把图片一起上传。

```markdown
独占一行（推荐）：变成描金相框插图 + 楷体图注
![图 1 · 协议交互时序](shot-01.png)

指定宽度：
![图 2 · 控制流对比](diagram.svg =60%)

行内小图：
日志见 ![](icon.png 120px) 这一段。

网络图片（原样引用，不内联）：
![图 3 · 官方文档](https://example.com/doc.png)
```

- **图片放哪里**：与 md 同一目录，或 md 目录下的 `img/`、`images/` 子目录；也支持 `assets/img/`。
  构建日志会打印 `配图 N 张（内联 M，xxKB）`；文件缺失时原样保留相对路径并给出 `! 配图未找到` 提示。
- **宽度写法**：`=60%` 或 `320px`（写在地址后面、括号内）。
- **图注**：方括号里的文字即图注，留空则只出图不出图注。
- **体积**：内联后 base64 约 +33%，所以超过 400KB 的图一律走外链模式，避免单页被撑到几 MB。
- **也可以手动外链**：把图直接放进 `assets/img/`，在 md 里用相对路径引用即可，deploy 会一并上传。

## 构建管线

| 步骤 | 做什么 |
|---|---|
| `build_posts.js` | 读取 md → 自写转换器转 HTML → 套 `postPage` 模板 → 写 `posts/*.html` 与 `posts.json`；同时写入 `.buildstamp` |
| `build_site.js` | 读 `posts.json` → 生成首页卡片、归档、标签墙、分类墙、关于、留言板、友链、sitemap |
| `deploy_github.js` | GitHub Contents API 逐文件比对 sha，只上传变化文件；远端多余文件删除 |
| `ink_cover.js` / `board_cover.js` | 生成卡片封面与文章顶图的内联 SVG data URI |

## 设计规范

**四色体系**：宣纸 `#f5f2ea` · 墨 `#23201a` · 朱砂 `#9d2933` · 描金 `#b08d57`（青碧 `#4f7d78` 用于链接）。

| 部位 | 处理 |
|---|---|
| 顶栏 | 实心墨底 + 宣纸白字 + 描金下边线，站名加粗、字距 .18em |
| Banner | 画框式：山水图独立成 3px 墨框 + 9px 硬投影的画片 |
| 卡片 | 3px 墨框 + 10px 描金硬投影，悬停换朱砂硬投影 |
| 按钮 / 胶囊 | 2px 方角墨边，选中朱砂实底白字 |
| 正文块 | 3px 墨框，h2 前 6px 朱砂竖条 + 2px 墨下划线 |
| 表格 | 2px 墨边，表头墨底白字 |
| 侧栏 | 顶部实心墨块 + 单字方牌，激活项 5px 朱砂左条 |
| 页脚 | 实心墨底浅字 + 描金双线压顶 |
| 印章 | 方角 + 3px 硬投影（钤印质感），单字 **Z** |
| 整体 | 字号 16.5、行高 2.0，圆角统一为 **0**（方正稳当） |

字体：标题楷体（STKaiti / KaiTi），正文宋体；界面图标全部是 `stroke: currentColor` 的内联 SVG，
**零彩色 emoji**（文章正文里的 ✅/❌/⚠ 在构建时规整为单色 ✓/✗/!）。

## 命名规则

| 位置 | 用哪个 |
|---|---|
| 浏览器标题 / 顶栏品牌 / 侧栏与关于页标题 | **ZY驿站**（顶栏前挂印章 Z） |
| 卡片作者 / 文章页「作者 ZY」/ 主页脚版权 | **ZY** |
| 印章（顶栏小印 / Banner 大印 / favicon） | **Z** |
| 域名 / GitHub / 邮箱 | felixdsh2.eu.cc · JM-919 · xyxf13@gmail.com |

## 工程记录

### 1. 自写 Markdown → HTML 转换器

支持围栏与缩进代码块、表格、有序/无序列表、引用、行内代码与加粗，代码块按语言做关键字 /
字符串 / 数字 / 注释着色（`.k` `.s` `.n` `.c`），不引入任何第三方依赖。

### 2. SVG data URI 里的括号必须转义

封面与横幅 SVG 内部有 `url(#渐变)`，而 `encodeURIComponent` **不转义 `( ) '`**。这样的 data URI
放进 CSS 的 `url(...)` 时，**第一个 `)` 就把地址截断**，图片静默不加载（表现为文章顶图空白、
卡片只剩底纹）。修复：统一走 `cssUri()`（`board_cover.js`），把 `( ) '` 转成 `%28 %29 %27`；
Banner、favicon、卡片封面、文章顶图全部改用它，14 个 data URI 已逐个校验合法可渲染。

### 3. 深色模式「保险丝」

水墨配色最初只写了浅色一套，深色下正文 / 引用 / 代码几乎不可见。处理方式：样式表末尾追加
深色覆盖层，对每个内容选择器用 `!important` 强制高对比（55 条），并把 15 组关键配色逐一算过
对比度，全部 ≥5.0；深色下另有一套浅色剑、浅字深底的完整镜像。

### 4. 构建版本戳：每次部署都换缓存键

GitHub Pages 给 HTML 的缓存是 `max-age=600`，刚部署完访客可能仍拿到上一版页面。做法：
`build_posts.js` 开头写入 `.buildstamp`，`build_lib.js` 读取它并给**所有站内链接**加上
`?v=<戳>`（首页、归档、标签墙、卡片、上下篇、标签胶囊，含 JS 动态渲染的链接）。
评论与计数按 `pathname` 归属，不受 query 影响。

### 5. URL 稳定与正文绑定

`.slugmap.json` 保存线上实际路径，构建时优先复用同名文章的编号，**老文章 URL 永不变化**，
评论与浏览量不会失联。正文在按 md 生成时**与文章对象一一绑定**后统一写回，
不按文件下标做二次配对 —— 顺序与编号不一致时那样会串文。

### 6. 正文里的字面量 `<br>`

段落拼接若写成 `inline(para.join('<br>'))`，会先插标签再转义，每一处换行都变成可见的 `<br>`
文字。正确写法是先逐行转义再插真换行（`para.map(inline).join('<br>')`），另外把作者手写的
`<br>` / `</br>` 统一折叠成空行。

### 7. 卡片封面宽度

封面在网格里若带 `aspect-ratio`，会被锁成固定像素宽、右侧留白。改为 `width:100%;aspect-ratio:auto`，
实测撑满整卡。

### 8. 搜索弹窗

弹窗用 `.search-modal[hidden]{display:none!important}` 加内联 `display` 双保险，
避免 `display:grid` 覆盖 `[hidden]` 导致弹窗常驻遮住整页、链接点不动。

## 内容规范（写作 · 配图 · 提交）

站内文章一律以**独立完成的工程文档**呈现：只写事实、数据、结论与实现，不出现任何对话式表述
——不引用他人反馈、不复述需求来源、不用「你 / 您」指代读者。文章配图按上一节自动内联，
页面保持单文件自包含。

> **长期规则**：无论以后再上传任何新的 md 文档，全部遵循由你独立完成，取消所有对话式内容，
> 你自己修改自己上传，记得清理无效文件。

一次完整的发布流程：

```bash
# 1) 新 md 放进 /storage/emulated/0/MD文件/（配图放同目录 img/）
cd /storage/emulated/0/脚本/github-blog

# 2) 构建（会打印每篇的字数 / 代码块 / 表格 / 配图内联情况，并给缺失图片告警）
node build_posts.js "/storage/emulated/0/MD文件" . && node build_site.js

# 3) 部署（自动比对远端 sha，只传变化的文件）
GH_TOKEN=xxxxx node deploy_github.js
```

提交前自检：

| 检查项 | 要求 |
|---|---|
| 对话式内容 | 0 处（无「你 / 您」，无反馈复述） |
| 配图 | 构建日志出现 `配图 N 张（内联 M，xxKB）`，无 `! 配图未找到` |
| 无效文件 | 构建残留（`.cssbak` 等）、临时脚本、远端多余文件已清理 |
| 页面 | 首页卡片 / 归档 / 标签 / 分类数量与 posts.json 一致，老文章路径不变 |

## 评论区

评论区使用 **utterances**，评论存成 GitHub issue，按文章路径（`pathname`）归属，主题随站点昼夜切换。

- **看评论**：任何人可看
- **发评论**：需用 GitHub 账号登录（防垃圾）
- 依赖：仓库启用 Issues（Discussions 亦可），并在仓库上安装 utterances App

## 访问统计

页脚接入不蒜子（busuanzi）统计站点浏览量、访客数与单篇阅读量。取不到数据时显示 `—`，
不显示任何本机假数字。

## 部署

```bash
GH_TOKEN=<classic token, repo 权限> node deploy_github.js
```

脚本会列出「上传 / 删除 / 跳过」三类结果，令牌只从环境变量或 `.blogbuild/tok`（chmod 600）读取，
不写入仓库、不落日志。

## 声明

站内文章均为个人对公开样本的技术研究与记录；站点已设置 `noindex` 与 `robots.txt` 全站禁止收录。
