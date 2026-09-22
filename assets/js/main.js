const root = document.documentElement;
const saved = localStorage.getItem('theme');
if (saved) root.dataset.theme = saved;
const btn = document.getElementById('theme-btn');
const sync = function () { if (btn) btn.textContent = root.dataset.theme === 'dark' ? '🌙' : '☀️'; };
sync();
if (btn) btn.addEventListener('click', function () {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', root.dataset.theme); sync();
});

const bar = document.getElementById('progress');
addEventListener('scroll', function () {
  if (bar) {
    const h = document.body.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
  }
  const t = document.getElementById('top');
  if (t) t.classList.toggle('show', scrollY > 400);
}, { passive: true });

const topBtn = document.getElementById('top');
if (topBtn) topBtn.addEventListener('click', function () { scrollTo({ top: 0, behavior: 'smooth' }); });

const q = document.getElementById('q');
const cards = [].slice.call(document.querySelectorAll('#posts .card'));
const empty = document.getElementById('empty');
if (q) q.addEventListener('input', function () {
  const kw = q.value.trim().toLowerCase();
  let n = 0;
  cards.forEach(function (c) {
    const hit = (c.dataset.title || '').toLowerCase().indexOf(kw) > -1 || c.textContent.toLowerCase().indexOf(kw) > -1;
    c.style.display = hit ? '' : 'none';
    if (hit) n++;
  });
  if (empty) empty.hidden = n > 0;
});

cards.forEach(function (el, i) {
  el.style.opacity = '0'; el.style.transform = 'translateY(16px)';
  setTimeout(function () {
    el.style.transition = 'all .5s cubic-bezier(.2,.7,.3,1)';
    el.style.opacity = '1'; el.style.transform = 'none';
  }, 60 * i);
});

const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
