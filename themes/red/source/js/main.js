(function() {
  'use strict';
  var toggleBtn = document.getElementById('themeToggle');
  var body = document.body;
  var prismLink = document.getElementById('prism-theme');
  var KEY = 'red-theme';
  var L = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.min.css';
  var D = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-tomorrow.min.css';

  var saved = localStorage.getItem(KEY);
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (saved === 'dark' || (!saved && prefersDark)) {
    body.classList.add('dark');
    if (prismLink) prismLink.href = D;
  }

  function toggleTheme() {
    if (body.classList.contains('dark')) {
      body.classList.remove('dark');
      localStorage.setItem(KEY, 'light');
      if (prismLink) prismLink.href = L;
    } else {
      body.classList.add('dark');
      localStorage.setItem(KEY, 'dark');
      if (prismLink) prismLink.href = D;
    }
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (!localStorage.getItem(KEY)) {
      if (e.matches) { body.classList.add('dark'); if (prismLink) prismLink.href = D; }
      else { body.classList.remove('dark'); if (prismLink) prismLink.href = L; }
    }
  });
})();
