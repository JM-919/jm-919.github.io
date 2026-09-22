# 秋秋小窝

零依赖、可直接部署到 GitHub Pages 的静态博客。

## 特性
- 暗/亮主题切换（localStorage 记忆）
- 首页实时搜索过滤
- 顶部阅读进度条 + 回到顶部
- 玻璃拟态 + 极光渐变背景 + 卡片入场动画
- 响应式，手机 / 平板 / 桌面自适应
- 无框架、无构建，纯 HTML/CSS/JS

## 部署
```bash
git init && git add . && git commit -m "init blog"
git branch -M main
git remote add origin https://github.com/JM-919/jm-919.github.io.git
git push -u origin main
```
Settings → Pages → Source: main / (root)。

## 个性化
本地一键替换（站名 / 描述 / 作者名 / GitHub 用户名 / 邮箱）：

```bash
bash personalize.sh "秋秋小窝" "记录代码、折腾与灵感的小站" "秋秋" "JM-919" "xyxf13@gmail.com"
```

当前站点：**秋秋小窝** · 作者 **秋秋** · 账号 [JM-919](https://github.com/JM-919) · xyxf13@gmail.com

## 目录
index.html / archive.html / about.html / posts/ / assets/css/style.css / assets/js/main.js
