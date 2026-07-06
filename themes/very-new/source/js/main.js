// Theme toggle
(function() {
    var STORAGE_KEY = 'blog-theme';
    var html = document.documentElement;
    var btn = document.getElementById('themeToggle');

    function getTheme() {
        return localStorage.getItem(STORAGE_KEY);
    }

    function setTheme(theme) {
        localStorage.setItem(STORAGE_KEY, theme);
    }

    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        updateIcon(theme);
    }

    function updateIcon(theme) {
        if (!btn) return;
        btn.innerHTML = theme === 'dark' ? '&#9789;' : '&#9788;';
    }

    // Toggle between light and dark
    function toggle() {
        var current = html.getAttribute('data-theme');
        var next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        setTheme(next);
    }

    // Init: saved > system > light
    var saved = getTheme();
    if (saved) {
        applyTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
        setTheme('dark');
    } else {
        applyTheme('light');
        setTheme('light');
    }

    // Listen for system changes (only when no manual override)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!getTheme()) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    if (btn) {
        btn.addEventListener('click', toggle);
    }
})();
