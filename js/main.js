(function() {
  const toggleBtn = document.getElementById('themeToggle');
  const body = document.body;
  const prismThemeLink = document.getElementById('prism-theme');
  const STORAGE_KEY = 'theme-preference';
  const PRISM_LIGHT_THEME = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.min.css';
  const PRISM_DARK_THEME = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-okaidia.min.css';

  const savedTheme = localStorage.getItem(STORAGE_KEY);
  if (savedTheme === 'night') {
    body.classList.add('night-mode');
    if (prismThemeLink) {
      prismThemeLink.href = PRISM_DARK_THEME;
    }
  } else {
    if (prismThemeLink) {
      prismThemeLink.href = PRISM_LIGHT_THEME;
    }
  }

  function toggleTheme() {
    if (body.classList.contains('night-mode')) {
      body.classList.remove('night-mode');
      localStorage.setItem(STORAGE_KEY, 'day');
      if (prismThemeLink) {
        prismThemeLink.href = PRISM_LIGHT_THEME;
      }
    } else {
      body.classList.add('night-mode');
      localStorage.setItem(STORAGE_KEY, 'night');
      if (prismThemeLink) {
        prismThemeLink.href = PRISM_DARK_THEME;
      }
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }
})();