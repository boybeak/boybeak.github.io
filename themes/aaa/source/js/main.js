(function() {
  'use strict';

  var toggleBtn = document.getElementById('themeToggle');
  var body = document.body;
  var prismThemeLink = document.getElementById('prism-theme');
  var STORAGE_KEY = 'zen-theme';

  var PRISM_LIGHT = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.min.css';
  var PRISM_DARK  = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-okaidia.min.css';

  // Load saved preference or system preference
  var saved = localStorage.getItem(STORAGE_KEY);
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (saved === 'dark' || (!saved && prefersDark)) {
    body.classList.add('dark');
    if (prismThemeLink) prismThemeLink.href = PRISM_DARK;
  } else {
    if (prismThemeLink) prismThemeLink.href = PRISM_LIGHT;
  }

  function toggleTheme() {
    if (body.classList.contains('dark')) {
      body.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY, 'light');
      if (prismThemeLink) prismThemeLink.href = PRISM_LIGHT;
    } else {
      body.classList.add('dark');
      localStorage.setItem(STORAGE_KEY, 'dark');
      if (prismThemeLink) prismThemeLink.href = PRISM_DARK;
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }

  // Listen for system theme changes when no explicit preference is saved
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (!localStorage.getItem(STORAGE_KEY)) {
      if (e.matches) {
        body.classList.add('dark');
        if (prismThemeLink) prismThemeLink.href = PRISM_DARK;
      } else {
        body.classList.remove('dark');
        if (prismThemeLink) prismThemeLink.href = PRISM_LIGHT;
      }
    }
  });
})();
