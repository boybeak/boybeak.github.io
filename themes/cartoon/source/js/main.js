(function() {
  'use strict';

  var toggleBtn = document.getElementById('themeToggle');
  var body = document.body;
  var prismThemeLink = document.getElementById('prism-theme');
  var STORAGE_KEY = 'cartoon-theme';

  var PRISM_LIGHT = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.min.css';
  var PRISM_DARK  = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-okaidia.min.css';

  // Load saved preference or system preference
  var saved = localStorage.getItem(STORAGE_KEY);
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function updateToggleIcon() {
    if (!toggleBtn) return;
    var icon = toggleBtn.querySelector('.toggle-icon');
    if (!icon) return;
    icon.textContent = body.classList.contains('dark') ? '🌙' : '🌞';
  }

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
      updateToggleIcon();
    }
  });

  // Add playful entrance animation to post items
  document.addEventListener('DOMContentLoaded', function() {
    var items = document.querySelectorAll('.post-item');
    items.forEach(function(item, index) {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      setTimeout(function() {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, 80 * index);
    });
  });
})();
