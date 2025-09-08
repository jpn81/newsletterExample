(async () => {
  const res = await fetch('./articles/manifest.json', { cache: 'no-cache' });
  const items = await res.json();
  items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const $list = document.getElementById('list');
  const $search = document.getElementById('nl-search'); // ← updated

  const render = (rows) => {
    $list.innerHTML = rows.map(it => {
      const url = `./article.html?slug=${encodeURIComponent(it.slug)}`;
      const dateHtml = it.date ? `<time datetime="${it.date}">${new Date(it.date).toLocaleDateString()}</time>` : '';
      const catsHtml = (it.categories || []).map(c => `<span class="pill">${c}</span>`).join(' ');
      return `
        <article class="card" role="listitem">
          <img class="thumb" src="${it.image}" alt="${it.imageAlt || ''}">
          <div>
            <h2 class="title">${it.title}</h2>
            <div class="meta">${dateHtml} ${catsHtml}</div>
            <p class="excerpt">${it.excerpt || ''}</p>
            <a class="btn" href="${url}">Read more</a>
          </div>
        </article>
      `;
    }).join('');
  };

  render(items);

  if ($search) {
    $search.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) return render(items);
      const filtered = items.filter(it => {
        const hay = [
          it.title || '',
          it.excerpt || '',
          ...(it.categories || [])
        ].join(' ').toLowerCase();
        return hay.includes(q);
      });
      render(filtered);
    });
  }
})();
