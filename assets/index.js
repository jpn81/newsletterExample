(async () => {
  const res = await fetch('./articles/manifest.json', { cache: 'no-cache' });
  const items = await res.json();

  // newest → oldest (expects YYYY-MM-DD)
  items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const html = items.map(it => {
    const url = `./article.html?slug=${encodeURIComponent(it.slug)}`;
    const dateHtml = it.date
      ? `<time datetime="${it.date}">${new Date(it.date).toLocaleDateString()}</time>` : '';
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

  document.getElementById('list').innerHTML = html;
})();
