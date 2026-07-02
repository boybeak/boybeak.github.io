(function() {
  'use strict';

  var toggleBtn = document.getElementById('themeToggle');
  var body = document.body;
  var prismThemeLink = document.getElementById('prism-theme');
  var STORAGE_KEY = 'pixel-theme';

  var PRISM_LIGHT = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.min.css';
  var PRISM_DARK  = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-tomorrow.min.css';

  function updateToggleIcon() {
    if (!toggleBtn) return;
    var icon = toggleBtn.querySelector('.toggle-icon');
    if (!icon) return;
    icon.textContent = body.classList.contains('dark') ? '[ ]' : '[*]';
  }

  var saved = localStorage.getItem(STORAGE_KEY);
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (saved === 'dark' || (!saved && prefersDark)) {
    body.classList.add('dark');
    if (prismThemeLink) prismThemeLink.href = PRISM_DARK;
  } else {
    if (prismThemeLink) prismThemeLink.href = PRISM_LIGHT;
  }
  updateToggleIcon();

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
    updateToggleIcon();
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (!localStorage.getItem(STORAGE_KEY)) {
      if (e.matches) {
        body.classList.add('dark');
        if (prismThemeLink) prismThemeLink.href = PRISM_DARK;
      } else {
        body.classList.remove('dark');
        if (prismThemeLink) prismThemeLink.href = PRISM_LIGHT;
      }
      updateToggleIcon();
    }
  });

  // Typewriter entrance animation
  document.addEventListener('DOMContentLoaded', function() {
    var items = document.querySelectorAll('.post-item');
    items.forEach(function(item, index) {
      item.style.opacity = '0';
      setTimeout(function() {
        item.style.opacity = '1';
      }, 100 * index);
    });
  });
})();
