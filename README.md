# PH_BLOG_TITLE

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
git remote add origin https://github.com/TARGET_USER/TARGET_USER.github.io.git
git push -u origin main
```
Settings → Pages → Source: main / (root)。

## 个性化
全局替换占位符：PH_BLOG_TITLE、PH_BLOG_DESC、ROLE_A、TARGET_USER、EMAIL@example.com。

## 目录
index.html / archive.html / about.html / posts/ / assets/css/style.css / assets/js/main.js
