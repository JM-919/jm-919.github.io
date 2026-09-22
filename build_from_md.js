#!/usr/bin/env node
/* build_from_md.js —— 把 Markdown 目录批量转成梦幻主题静态文章页，并重建首页/归档
   用法: node build_from_md.js [MD目录] [博客目录] */
const fs = require('fs'), path = require('path');
const MDDIR = process.argv[2] || '/storage/emulated/0/MD文件';
const BLOG  = process.argv[3] || '/storage/emulated/0/脚本/github-blog';
const POSTDIR = path.join(BLOG, 'posts');

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => esc(s).replace(/"/g, '&quot;');
const plain = s => s.replace(/[*`_>#\[\]()]/g, '').replace(/\s+/g, ' ').trim();

/* ---------- 内联 ---------- */
function inline(text) {
  const codes = [];
  text = text.replace(/`([^`]+)`/g, function (m, c) { codes.push(c); return '@@' + (codes.length - 1) + '@@'; });
  text = esc(text);
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  text = text.replace(/(^|[^\w])_([^_\n]+)_/g, '$1<em>$2</em>');
  text = text.replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  text = text.replace(/@@(\d+)@@/g, function (m, i) { return '<code>' + esc(codes[+i]) + '</code>'; });
  return text;
}

/* ---------- 语法高亮 ---------- */
const KW = {
  c: /^(void|int|char|unsigned|signed|short|long|float|double|const|static|struct|union|enum|typedef|return|if|else|for|while|do|switch|case|break|continue|goto|sizeof|extern|register|volatile|inline|uint8_t|uint16_t|uint32_t|uint64_t|int8_t|int16_t|int32_t|int64_t|size_t|bool|true|false|NULL|define|ifdef|ifndef|endif|pragma)$/,
  js: /^(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|delete|typeof|instanceof|in|of|class|extends|super|this|null|undefined|true|false|async|await|yield|try|catch|finally|throw|import|export|default|from|static|get|set)$/,
  py: /^(def|return|if|elif|else|for|while|break|continue|import|from|as|class|try|except|finally|raise|with|lambda|global|nonlocal|pass|None|True|False|and|or|not|in|is|assert|yield|async|await|self)$/,
  sh: /^(if|then|fi|else|elif|for|while|do|done|case|esac|function|return|exit|echo|cd|ls|export|set|local|readonly|source|eval|exec|trap|shift|printf|cat|grep|sed|awk|chmod|cp|mv|rm|mkdir|npm|node|git|python|python3|java|adb|frida)$/
};
function highlight(code, lang) {
  const key = /^(c|cpp|cc|h|hpp)$/.test(lang) ? 'c'
    : /^(js|javascript|json|ts|typescript)$/.test(lang) ? 'js'
    : /^(py|python)$/.test(lang) ? 'py'
    : /^(sh|bash|shell|zsh|console|cmd)$/.test(lang) ? 'sh' : null;
  const kw = key ? KW[key] : null;
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(0[xX][0-9a-fA-F]+|\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;
  let out = '', i = 0, m;
  while ((m = re.exec(code)) !== null) {
    if (m.index > i) out += esc(code.slice(i, m.index));
    const t = m[0];
    if (m[1]) out += '<span class="c">' + esc(t) + '</span>';
    else if (m[2]) out += '<span class="s">' + esc(t) + '</span>';
    else if (m[3]) out += '<span class="n">' + esc(t) + '</span>';
    else if (m[4] && kw && kw.test(t)) out += '<span class="k">' + esc(t) + '</span>';
    else out += esc(t);
    i = m.index + t.length;
  }
  out += esc(code.slice(i));
  return out;
}

const figOpen = '<figure class="code';
const figTail = '"><figcaption>';
const figBody = '</figcaption><pre><code>';
const figClose = '</code></pre></figure>';

/* ---------- Markdown → HTML ---------- */
function mdToHtml(src, ctx) {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0, para = [], firstH1 = true;
  const flush = function () { if (para.length) { out.push('<p>' + inline(para.join('<br>')) + '</p>'); para = []; } };

  while (i < lines.length) {
    const line = lines[i];

    // 围栏代码块
    const fm = line.match(/^\s*([`~]{3,})\s*([A-Za-z0-9+#._-]*)\s*$/);
    if (fm) {
      flush();
      const fence = fm[1][0], lang = (fm[2] || '').toLowerCase();
      const buf = []; i++;
      let closed = false;
      while (i < lines.length) {
        if (new RegExp('^\\s*\\' + fence + '{3,}\\s*$').test(lines[i])) { closed = true; i++; break; }
        buf.push(lines[i]); i++;
      }
      let code = buf.join('\n');
      if (!closed) {
        const ls = code.split('\n');
        let cut = ls.length;
        for (let k = ls.length - 1; k >= 0; k--) {
          if (/[\u4e00-\u9fff]{4,}/.test(ls[k]) && !/[;{}#]\s*$/.test(ls[k].trim())) cut = k; else break;
        }
        code = ls.slice(0, cut).join('\n');
      }
      ctx.blocks++;
      out.push(figOpen + (lang ? ' lang-' + lang : '') + figTail + (lang || 'text') + figBody + highlight(code, lang) + figClose);
      continue;
    }

    // 表格
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      flush();
      const parseRow = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
      const head = parseRow(line);
      const aligns = parseRow(lines[i + 1]).map(s => /^:-+:$/.test(s) ? 'center' : /-+:$/.test(s) ? 'right' : '');
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(parseRow(lines[i])); i++; }
      ctx.tables++;
      let t = '<div class="table-wrap"><table><thead><tr>';
      head.forEach((c, k) => { t += '<th' + (aligns[k] ? ' style="text-align:' + aligns[k] + '"' : '') + '>' + inline(c) + '</th>'; });
      t += '</tr></thead><tbody>';
      rows.forEach(r => {
        t += '<tr>';
        for (let k = 0; k < head.length; k++) t += '<td' + (aligns[k] ? ' style="text-align:' + aligns[k] + '"' : '') + '>' + inline(r[k] || '') + '</td>';
        t += '</tr>';
      });
      t += '</tbody></table></div>';
      out.push(t);
      continue;
    }

    // 标题
    const hm = line.match(/^(#{1,6})\s+(.*)$/);
    if (hm) {
      flush();
      const lvl = hm[1].length;
      if (lvl === 1) {
        if (firstH1) { firstH1 = false; ctx.title = ctx.title || plain(hm[2]); i++; continue; }
        out.push('<h2>' + inline(hm[2]) + '</h2>');
      } else if (lvl === 2) {
        out.push('<h2>' + inline(hm[2]) + '</h2>');
      } else {
        out.push('<h' + Math.min(lvl, 6) + '>' + inline(hm[2]) + '</h' + Math.min(lvl, 6) + '>');
      }
      i++; continue;
    }

    // 横线
    if (/^\s*([-*_])\s*\1\s*\1[\s-*_]*$/.test(line)) { flush(); out.push('<hr>'); i++; continue; }

    // 引用
    if (/^\s*>/.test(line)) {
      flush();
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
      out.push('<blockquote>' + buf.map(l => l.trim() === '' ? '' : inline(l)).join('<br>') + '</blockquote>');
      continue;
    }

    // 列表
    const lm = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    if (lm) {
      flush();
      const ordered = /\d/.test(lm[2]);
      const items = [];
      let lastBlank = false;
      while (i < lines.length) {
        const l = lines[i];
        const m2 = l.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
        if (m2) { items.push({ depth: m2[1].length >= 2 ? 1 : 0, txt: m2[3] }); lastBlank = false; i++; continue; }
        if (/^\s+\S/.test(l) && items.length && !/^\s{4,}\S/.test(l)) { items[items.length - 1].txt += ' ' + l.trim(); i++; continue; }
        if (l.trim() === '' && i + 1 < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i + 1])) { lastBlank = true; i++; continue; }
        break;
      }
      const tag = ordered ? 'ol' : 'ul';
      let h = '<' + tag + '>', depth = 0;
      items.forEach(it => {
        while (depth < it.depth) { h += '<' + tag + '>'; depth++; }
        while (depth > it.depth) { h += '</' + tag + '>'; depth--; }
        h += '<li>' + inline(it.txt) + '</li>';
      });
      while (depth-- > 0) h += '</' + tag + '>';
      h += '</' + tag + '>';
      out.push(h); continue;
    }

    // 缩进代码块
    if (/^ {4,}\S/.test(line)) {
      const prev = out.length ? out[out.length - 1] : '';
      const lastWasItem = /<li>/.test(prev) || /<(ul|ol)>$/.test(prev);
      if (!lastWasItem) {
        flush();
        const buf = [];
        while (i < lines.length && (/^ {4,}\S/.test(lines[i]) || lines[i].trim() === '')) { buf.push(lines[i].replace(/^ {4}/, '')); i++; }
        while (buf.length && buf[buf.length - 1].trim() === '') buf.pop();
        ctx.blocks++;
        out.push(figOpen + figTail + 'text' + figBody + esc(buf.join('\n')) + figClose);
        continue;
      }
    }

    if (line.trim() === '') { flush(); i++; continue; }

    para.push(line.trim());
    i++;
  }
  flush();
  return out.join('\n');
}

/* ---------- 文章页模板 ---------- */
function page(o) {
  const meta = o.date + ' · ' + o.readMins + ' 分钟 · ' + o.blocks + ' 段代码 · ' + o.tables + ' 张表格';
  return '<!DOCTYPE html>\n<html lang="zh-CN" data-theme="dark">\n<head>\n' +
  '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
  '<title>' + escAttr(o.title) + ' · Felix</title>\n' +
  '<meta name="description" content="' + escAttr(o.desc) + '">\n' +
  '<meta name="theme-color" content="#0b0716">
<meta name="robots" content="noindex, nofollow, noarchive">\n' +
  '<link rel="stylesheet" href="../assets/css/style.css">\n' +
  '<link rel="icon" type="image/svg+xml" href="../favicon.svg">\n</head>\n<body>\n' +
  '<div class="progress" id="progress"></div>\n<div class="aurora"></div>\n<div class="stars"></div>\n<canvas id="dream-canvas"></canvas>\n' +
  '<header class="nav glass">\n  <a class="brand" href="../"><span>Felix</span></a>\n  <nav>\n' +
  '    <a href="../">首页</a>\n    <a href="../archive.html">归档</a>\n    <a href="../about.html">关于</a>\n' +
  '    <button id="theme-btn" class="icon-btn" aria-label="切换主题">🌙</button>\n  </nav>\n</header>\n' +
  '<main><article class="post">\n<a class="back" href="../">← 返回首页</a>\n' +
  '<h1>' + inline(o.title) + '</h1>\n' +
  '<p class="meta" style="color:var(--muted)">' + meta + '</p>\n' +
  o.body + '\n</article></main>\n' +
  '<footer class="footer"><p>© <span id="year"></span> Felix · Powered by GitHub Pages</p></footer>\n' +
  '<button id="top" class="icon-btn top" aria-label="回到顶部">↑</button>\n' +
  '<script src="../assets/js/main.js"></script>\n<script src="../assets/js/dream.js"></script>\n</body>\n</html>\n';
}

/* ---------- 主流程 ---------- */
fs.mkdirSync(POSTDIR, { recursive: true });
const srcFiles = fs.readdirSync(MDDIR).filter(f => /\.md$/i.test(f));
const PALETTE = [['#a78bfa','#67e8f9'],['#f0abfc','#c4b5fd'],['#7dd3fc','#a78bfa'],['#fbcfe8','#f0abfc'],['#5eead4','#818cf8'],['#fcd34d','#fb7185'],['#c4b5fd','#f9a8d4']];
const ICONS = ['🧩','🗝️','🛡️','🩺','🎯','📦','⚙️'];
const posts = [];

srcFiles.forEach((f, idx) => {
  const full = path.join(MDDIR, f);
  const raw = fs.readFileSync(full, 'utf8');
  const stat = fs.statSync(full);
  const base = f.replace(/\.md$/i, '');
  const slug = 'p-' + String(idx + 1).padStart(2, '0') + '-' + base.replace(/[\\/:*?"<>|\s]+/g, '-');
  const ctx = { title: '', blocks: 0, tables: 0 };
  const body = mdToHtml(raw, ctx);
  if (!ctx.title) ctx.title = plain(base);
  const chars = raw.length;
  const readMins = Math.max(1, Math.round(chars / 480));
  const date = stat.mtime.toISOString().slice(0, 10);
  let desc = '';
  const pm = body.match(/<p>([\s\S]*?)<\/p>/);
  if (pm) desc = plain(pm[1].replace(/<[^>]+>/g, ''));
  if (desc.length > 76) desc = desc.slice(0, 76) + '…';
  if (!desc) desc = ctx.title;
  const tags = [];
  const nm = base + ' ' + ctx.title;
  if (/授权|注册|license|keygen|算法|激活/i.test(nm)) tags.push('#授权算法');
  if (/补丁|去更新|修改|MOD/i.test(nm)) tags.push('#补丁改造');
  if (/解剖|分析|逆向|报告|日志/i.test(nm)) tags.push('#逆向分析');
  if (/Android|apk|dex|smali/i.test(raw.slice(0, 5000))) tags.push('#Android');
  if (!tags.length) tags.push('#笔记');

  fs.writeFileSync(path.join(POSTDIR, slug + '.html'), page({ title: ctx.title, desc: desc, body: body, date: date, readMins: readMins, blocks: ctx.blocks, tables: ctx.tables }), 'utf8');
  fs.copyFileSync(full, path.join(POSTDIR, base + '.md'));
  posts.push({ slug, base, title: ctx.title, desc, date, readMins, chars, blocks: ctx.blocks, tables: ctx.tables, cover: PALETTE[idx % PALETTE.length], icon: ICONS[idx % ICONS.length], tags: tags.slice(0, 3) });
  console.log('OK  ' + slug + '.html   ' + ctx.title + '   (' + (chars / 1024).toFixed(0) + 'KB · ' + ctx.blocks + ' 代码块 · ' + ctx.tables + ' 表格)');
});

const sorted = posts.slice().sort((a, b) => b.date.localeCompare(a.date));

const idxPath = path.join(BLOG, 'index.html');
let idx = fs.readFileSync(idxPath, 'utf8');
const cards = sorted.map(p =>
  '    <a class="card glass" href="./posts/' + p.slug + '.html" data-title="' + escAttr(p.title) + '" data-tags="' + escAttr(p.tags.join(' ')) + '">\n' +
  '      <div class="card-cover" style="--g1:' + p.cover[0] + ';--g2:' + p.cover[1] + '">' + p.icon + '</div>\n' +
  '      <div class="card-body">\n' +
  '        <h2>' + esc(p.title) + '</h2>\n' +
  '        <p>' + esc(p.desc) + '</p>\n' +
  '        <div class="meta"><time>' + p.date + '</time><span>·</span><span>' + p.readMins + ' 分钟</span><span>·</span><span>' + p.chars + ' 字</span></div>\n' +
  '      </div>\n    </a>').join('\n');
const beforeCards = idx;
idx = idx.replace(/(<section class="grid" id="posts">\n)[\s\S]*?(\n  <\/section>)/, '$1' + cards + '$2');
if (idx === beforeCards) console.log('WARN 首页卡片区未替换（正则未命中）');
const tagSet = [];
posts.forEach(p => p.tags.forEach(t => { if (tagSet.indexOf(t) < 0) tagSet.push(t); }));
idx = idx.replace(/<div class="tags">[\s\S]*?<\/div>/, '<div class="tags">' + tagSet.slice(0, 6).map(t => '<span class="chip">' + t + '</span>').join('') + '</div>');
idx = idx.replace(/<p class="hero-sub">[^<]*<\/p>/, '<p class="hero-sub">梦幻流光 · 已收录 ' + posts.length + ' 篇技术笔记</p>');
fs.writeFileSync(idxPath, idx, 'utf8');

const arcPath = path.join(BLOG, 'archive.html');
let arc = fs.readFileSync(arcPath, 'utf8');
const lis = sorted.map(p =>
  '      <li style="padding:12px 0;border-bottom:1px solid var(--line)"><time style="color:var(--muted)">' + p.date + '</time> · <a href="./posts/' + p.slug + '.html">' + esc(p.title) + '</a> <span style="color:var(--muted);font-size:13px">（' + p.readMins + ' 分钟）</span></li>').join('\n');
const beforeArc = arc;
arc = arc.replace(/(<ul style="list-style:none;padding:0">\n)[\s\S]*?(\n    <\/ul>)/, '$1' + lis + '$2');
if (arc === beforeArc) console.log('WARN 归档列表未替换（正则未命中）');
arc = arc.replace(/<p class="hero-sub">[^<]*<\/p>/, '<p class="hero-sub">共 ' + posts.length + ' 篇 ✦ 按时间排列</p>');
fs.writeFileSync(arcPath, arc, 'utf8');

fs.writeFileSync(path.join(POSTDIR, '_manifest.json'), JSON.stringify(posts, null, 2), 'utf8');
console.log('\n完成：' + posts.length + ' 篇文章 → ' + POSTDIR);
