(async () => {
  // Load manifest
  const res = await fetch('./articles/manifest.json', { cache: 'no-cache' });
  const items = await res.json();

  // newest → oldest (expects YYYY-MM-DD)
  items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Helpers
  const getTags = (it) => {
    // Support either "tags" or "categories" from manifest items
    const arr = (it.tags && Array.isArray(it.tags) ? it.tags : (it.categories || []));
    // Normalize / trim
    return arr.map(t => String(t).trim()).filter(Boolean);
  };

  // Build the unique tag set present in manifest
  const tagSet = new Set();
  for (const it of items) getTags(it).forEach(t => tagSet.add(t));
  const allTags = Array.from(tagSet).sort((a,b)=> a.localeCompare(b, undefined, {sensitivity:'base'}));

  // DOM
  const $list   = document.getElementById('list');
  const $empty  = document.getElementById('nl-empty');
  const $search = document.getElementById('nl-search');
  const $tags   = document.getElementById('nl-tags');
  const $clear  = document.getElementById('nl-clear');

  // State
  const state = {
    q: '',
    selected: new Set(), // selected tags (OR logic)
  };

  // Render cards
  const renderList = (rows) => {
    if (!rows.length) {
      $list.innerHTML = '';
      $empty.hidden = false;
      return;
    }
    $empty.hidden = true;

    $list.innerHTML = rows.map(it => {
      const url = `./article.html?slug=${encodeURIComponent(it.slug)}`;
      const dateHtml = it.date ? `<time datetime="${it.date}">${new Date(it.date).toLocaleDateString()}</time>` : '';
      const tagsHtml = getTags(it).map(c => `<span class="pill">${c}</span>`).join(' ');
      return `
        <article class="card" role="listitem">
          <img class="thumb" src="${it.image}" alt="${it.imageAlt || ''}">
          <div>
            <h2 class="title">${it.title}</h2>
            <div class="meta">${dateHtml} ${tagsHtml}</div>
            <p class="excerpt">${it.excerpt || ''}</p>
            <a class="btn" href="${url}">Read more</a>
          </div>
        </article>
      `;
    }).join('');
  };

  // Apply filters
  const apply = () => {
    const q = state.q.toLowerCase().trim();
    const sel = state.selected;

    const filtered = items.filter(it => {
      // Search
      const hay = [
        it.title || '',
        it.excerpt || '',
        ...getTags(it)
      ].join(' ').toLowerCase();
      const matchesSearch = !q || hay.includes(q);

      // Tags (OR logic: at least one selected tag must be present)
      if (sel.size === 0) return matchesSearch;

      const itemTagsLower = new Set(getTags(it).map(t => t.toLowerCase()));
      const hasAny = Array.from(sel).some(t => itemTagsLower.has(t.toLowerCase()));
      return matchesSearch && hasAny;
    });

    // Clear button visibility
    $clear.hidden = !(state.q || state.selected.size);

    renderList(filtered);
  };

  // Build tag pills
  if ($tags) {
    $tags.innerHTML = allTags.map(tag =>
      `<button type="button" class="tag" data-tag="${encodeURIComponent(tag)}" aria-pressed="false">${tag}</button>`
    ).join('');

    $tags.addEventListener('click', (e) => {
      const btn = e.target.closest('.tag');
      if (!btn) return;
      const tag = decodeURIComponent(btn.dataset.tag || '');
      if (!tag) return;

      const isActive = btn.classList.toggle('active');
      btn.setAttribute('aria-pressed', String(isActive));

      if (isActive) state.selected.add(tag);
      else state.selected.delete(tag);

      apply();
    });
  }

  // Search wiring
  if ($search) {
    const onInput = () => { state.q = $search.value || ''; apply(); };
    $search.addEventListener('input', onInput);

    // Support ?q= and ?tags=a,b,c in URL
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const tagsParam = params.get('tags'); // comma-separated

    if (q) {
      $search.value = q;
      state.q = q;
    }
    if (tagsParam && $tags) {
      const ask = new Set(tagsParam.split(',').map(s => s.trim()).filter(Boolean));
      // Activate any matching pills
      [...$tags.querySelectorAll('.tag')].forEach(btn => {
        const t = decodeURIComponent(btn.dataset.tag || '');
        if (ask.has(t)) {
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          state.selected.add(t);
        }
      });
    }
  }

  // Clear all
  if ($clear) {
    $clear.addEventListener('click', () => {
      state.q = '';
      state.selected.clear();
      if ($search) $search.value = '';
      if ($tags) {
        $tags.querySelectorAll('.tag.active').forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('aria-pressed', 'false');
        });
      }
      apply();
      // Optional: clean query params
      if (history.replaceState) history.replaceState({}, '', './');
    });
  }

  // Initial render
  renderList(items);
  // Apply once in case URL params set filters
  apply();
})();
