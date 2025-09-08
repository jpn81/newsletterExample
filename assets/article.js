(function () {
  const qs = new URLSearchParams(location.search);
  const slug = qs.get('slug');

  const showError = (msg) => {
    const box = document.getElementById('err');
    if (box) { box.textContent = msg; box.style.display = 'block'; }
    console.error(msg);
  };

  if (!slug) {
    showError('Missing ?slug=… in the URL');
    return;
  }

  const jsonUrl = `articles/${encodeURIComponent(slug)}/article.json`;

  fetch(`${jsonUrl}`, { cache: 'no-cache' })
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load ${jsonUrl} (${res.status})`);
      return res.json();
    })
    .then(data => {
      // Title + breadcrumb
      const title = data.title || 'Article';
      document.title = title;
      const h1 = document.getElementById('title');
      if (h1) h1.textContent = title;
      const crumb = document.getElementById('crumb-current');
      if (crumb) crumb.textContent = title;

      // Meta
      if (data.date) {
        const d = new Date(data.date);
        const t = document.getElementById('date');
        if (t) {
          t.textContent = d.toLocaleDateString();
          t.setAttribute('datetime', data.date);
        }
      }
      const cats = document.getElementById('cats');
      if (cats) cats.innerHTML = (data.categories || []).map(c => `<span>• ${c}</span>`).join(' ');

      // Hero
      const hero = document.getElementById('hero');
      if (hero) {
        hero.src = data.hero?.image || '';
        hero.alt = data.hero?.alt || '';
      }

      // Body blocks
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

      const content = document.getElementById('content');
      if (content) content.innerHTML = html;

      // Show the article
      const art = document.getElementById('article');
      if (art) art.hidden = false;
    })
    .catch(err => {
      showError(err.message);
    });
})();
