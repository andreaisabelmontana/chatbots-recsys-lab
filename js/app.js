/* App bootstrapping: build TOC, smooth scroll, scroll-spy, then init all viz. */
(function () {
  // Build TOC from sections that carry data-title
  const toc = document.querySelector('#toc');
  const sections = [...document.querySelectorAll('section[data-title]')];
  sections.forEach(s => {
    const a = document.createElement('a');
    a.href = '#' + s.id;
    a.textContent = s.dataset.title;
    a.onclick = e => {
      e.preventDefault();
      document.querySelector('#' + s.id).scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + s.id);
    };
    toc.appendChild(a);
  });

  // Scroll-spy
  const links = [...toc.querySelectorAll('a')];
  const byId = {};
  links.forEach(l => byId[l.getAttribute('href').slice(1)] = l);
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = byId[e.target.id];
        if (a) a.classList.add('active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
  sections.forEach(s => io.observe(s));

  // Init all visualisations once DOM + Chart.js + KaTeX are ready
  function start() {
    if (!window.Chart) return setTimeout(start, 60);
    try { window.RECSYS_INIT(); }
    catch (e) { console.error('viz init error', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
