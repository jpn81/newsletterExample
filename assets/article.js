(async () => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  if (!slug) {
    document.querySelector('main').innerHTML = '<p>Missing ?slug=…</p>';
    return;
  }

  const res = await fetch(`./articles/${encodeURIComponent(slug)}/article.json`, { cache: 'no-cache' });
  const data = await res.json();

  document.title = data.title || 'Article';
  document.getElementById('title').textContent = data.title || 'Untitled';

  // NEW: breadcrumb current
const crumb = document.getElementById('crumb-current');
if (crumb) crumb.textContent = data.title || 'Article';

  if (data.date) {
    const t = document.getElementById('date');
    t.textContent = new Date(data.date).toLocaleDateString();
    t.setAttribute('datetime', data.date);
  }
  document.getElementById('cats').innerHTML =
    (data.categories || []).map(c => `<span>• ${c}</span>`).join(' ');

  const hero = document.getElementById('hero');
  hero.src = data.hero?.image || '';
  hero.alt = data.hero?.alt || '';

  const blocks = data.body || [];
  const html = blocks.map(b => {
    switch (b.type) {
      case 'p':  return `<p>${b.text || ''}</p>`;
      case 'h2': return `<h2>${b.text || ''}</h2>`;
      case 'h3': return `<h3>${b.text || ''}</h3>`;
      case 'blockquote': return `<blockquote>${b.text || ''}</blockquote>`;
      case 'ul': return `<ul>${(b.items || []).map(i => `<li>${i}</li>`).join('')}</ul>`;
      case 'ol': return `<ol>${(b.items || []).map(i => `<li>${i}</li>`).join('')}</ol>`;
      case 'img': {
        const cap = b.caption ? `<figcaption>${b.caption}</figcaption>` : '';
        return `<figure class="inline-img"><img src="${b.src || ''}" alt="${b.alt || ''}">${cap}</figure>`;
      }
      case 'code': {
        const code = (b.code || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
        const lang = b.lang || '';
        return `<pre aria-label="${lang} code"><code>${code}</code></pre>`;
      }
      default: return '';
    }
  }).join('');

  document.getElementById('content').innerHTML = html;
  document.getElementById('article').hidden = false;
})();
