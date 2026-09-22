# Felix 的小站

> 梦幻流光静态博客 · 零依赖、零构建，直接部署到 GitHub Pages。

## 特性
- 🖱️ **全局指针流光拖尾**：鼠标 / 手指划过留下渐变星尘光带（Canvas 2D，空闲自动停帧省电）
- ✨ 梦幻视觉：极光光球 + 星野闪烁 + 彩虹渐变文字 + 玻璃拟态
- 🌗 暗 / 亮主题切换（localStorage 记忆）
- 🔍 首页实时搜索过滤
- 📊 顶部阅读进度条 + 回到顶部
- 📱 响应式，手机 / 平板 / 桌面自适应（触摸也触发流光）
- ♿ 尊重 `prefers-reduced-motion`：系统开启「减少动态」时自动关闭拖尾

## 部署
```bash
git init && git add . && git commit -m "init blog"
git branch -M main
git remote add origin https://github.com/JM-919/jm-919.github.io.git
git push -u origin main
```
Settings → Pages → Source: **Deploy from a branch** / **main** / **/ (root)**。

## 个性化
```bash
bash personalize.sh "Felix 的小站" "记录代码与折腾的小站" "Felix" "JM-919" "xyxf13@gmail.com"
```

## 目录
```
index.html   archive.html   about.html
posts/       assets/css/style.css
assets/js/main.js     assets/js/dream.js
```

当前站点：**Felix 的小站** · 作者 **Felix** · [JM-919](https://github.com/JM-919) · xyxf13@gmail.com
