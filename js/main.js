(function() {
  const toggleBtn = document.getElementById('themeToggle');
  const body = document.body;
  const STORAGE_KEY = 'theme-preference';

  const savedTheme = localStorage.getItem(STORAGE_KEY);
  if (savedTheme === 'night') {
    body.classList.add('night-mode');
  }

  function toggleTheme() {
    if (body.classList.contains('night-mode')) {
      body.classList.remove('night-mode');
      localStorage.setItem(STORAGE_KEY, 'day');
    } else {
      body.classList.add('night-mode');
      localStorage.setItem(STORAGE_KEY, 'night');
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }
})();