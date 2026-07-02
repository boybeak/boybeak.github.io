(function() {
  'use strict';

  var body = document.body;
  var toggleBtn = document.getElementById('themeToggle');
  var prismThemeLink = document.getElementById('prism-theme');
  var STORAGE_KEY = 'gplus-theme';

  var PRISM_LIGHT = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.min.css';
  var PRISM_DARK  = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-okaidia.min.css';

  // ---- Theme ----
  var saved = localStorage.getItem(STORAGE_KEY);
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(dark) {
    if (dark) {
      body.classList.add('dark');
      if (prismThemeLink) prismThemeLink.href = PRISM_DARK;
    } else {
      body.classList.remove('dark');
      if (prismThemeLink) prismThemeLink.href = PRISM_LIGHT;
    }
  }

  if (saved) {
    applyTheme(saved === 'dark');
  } else {
    applyTheme(prefersDark);
  }

  function toggleTheme() {
    var isDark = body.classList.contains('dark');
    applyTheme(!isDark);
    localStorage.setItem(STORAGE_KEY, isDark ? 'light' : 'dark');
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches);
    }
  });

  // ---- Horizontal Masonry ----
  var masonry = document.querySelector('.masonry');
  var nextLink = document.querySelector('.next-page-link');
  var sentinel = document.getElementById('scrollSentinel');
  var loader = document.getElementById('scrollLoader');
  var endEl = document.getElementById('scrollEnd');

  if (!masonry || !nextLink || !sentinel) return;

  var loading = false;
  var hasMore = true;

  function getColumnCount() {
    var w = window.innerWidth;
    if (w <= 600) return 1;
    if (w <= 900) return 2;
    return 3;
  }

  function rebuildMasonry() {
    // Collect post cards and time cards (author card stays first child)
    var items = Array.from(masonry.children).filter(function(el) {
      return el.classList.contains('post-card') || el.classList.contains('time-card');
    });
    if (items.length === 0) return;

    var cols = getColumnCount();
    var currentBatch = [];

    function flushBatch() {
      if (currentBatch.length === 0) return;

      var row = document.createElement('div');
      row.className = 'masonry-row';

      var columns = [];
      for (var i = 0; i < cols; i++) {
        var col = document.createElement('div');
        col.className = 'masonry-col';
        columns.push({ el: col, h: 0 });
        row.appendChild(col);
      }

      currentBatch.forEach(function(card) {
        columns.sort(function(a, b) { return a.h - b.h; });
        // Clone the card node to move it
        var clone = card;
        columns[0].el.appendChild(clone);
        // Approximate height for distribution (offsetHeight works after append)
        columns[0].h += clone.offsetHeight || 200;
      });

      currentBatch = [];
      masonry.appendChild(row);
    }

    items.forEach(function(item) {
      if (item.classList.contains('time-card')) {
        flushBatch();
        // Insert time card as full-width divider
        masonry.appendChild(item);
      } else {
        currentBatch.push(item);
      }
    });
    flushBatch();

    // Re-attach sentinel (last child of masonry, outside rows)
    masonry.appendChild(sentinel.parentElement);
  }

  // Initial build
  rebuildMasonry();

  // Rebuild on resize (debounced)
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      // Move cards back to masonry first
      var rows = masonry.querySelectorAll('.masonry-row');
      rows.forEach(function(row) {
        var cards = row.querySelectorAll('.post-card');
        cards.forEach(function(card) {
          masonry.insertBefore(card, row);
        });
        row.remove();
      });
      // Move time cards above sentinel area
      var statusEl = document.querySelector('.infinite-scroll-status');
      var timeCards = masonry.querySelectorAll('.time-card');
      timeCards.forEach(function(tc) {
        if (statusEl) masonry.insertBefore(tc, statusEl);
      });
      rebuildMasonry();
    }, 200);
  });

  // ---- Infinite Scroll ----
  function loadNextPage() {
    if (loading || !hasMore) return;
    loading = true;
    loader.style.display = 'flex';
    endEl.style.display = 'none';

    var url = nextLink.getAttribute('href');
    if (!url) {
      hasMore = false;
      loader.style.display = 'none';
      endEl.style.display = 'block';
      return;
    }

    fetch(url)
      .then(function(res) { return res.text(); })
      .then(function(html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newMasonry = doc.querySelector('.masonry');
        if (!newMasonry) {
          hasMore = false;
          loader.style.display = 'none';
          endEl.style.display = 'block';
          return;
        }

        // Extract cards from fetched page
        var statusEl = document.querySelector('.infinite-scroll-status');
        var cards = newMasonry.querySelectorAll('.post-card, .time-card');
        cards.forEach(function(card) {
          var imported = document.importNode(card, true);
          if (statusEl) {
            masonry.insertBefore(imported, statusEl);
          } else {
            masonry.appendChild(imported);
          }
        });

        // Update next page link
        var newNext = doc.querySelector('.next-page-link');
        if (newNext && newNext.getAttribute('href')) {
          nextLink.setAttribute('href', newNext.getAttribute('href'));
        } else {
          hasMore = false;
        }

        loading = false;
        loader.style.display = 'none';

        if (!hasMore) {
          sentinel.style.display = 'none';
          endEl.style.display = 'block';
        }

        // Rebuild masonry with new cards
        rebuildMasonry();
      })
      .catch(function() {
        loading = false;
        loader.style.display = 'none';
      });
  }

  // Observe sentinel element
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        loadNextPage();
      }
    });
  }, { rootMargin: '300px' });

  observer.observe(sentinel);
})();
