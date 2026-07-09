(function() {
  const STORAGE_KEY_THEME = 'theme-preference';
  const STORAGE_KEY_LEFT = 'panorama-left-visible';
  const PRISM_LIGHT_THEME = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.min.css';
  const PRISM_DARK_THEME = 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-okaidia.min.css';

  const body = document.body;
  const prismThemeLink = document.getElementById('prism-theme');
  const themeToggle = document.getElementById('themeToggle');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const leftPanel = document.getElementById('leftPanel');
  const centerPanel = document.getElementById('centerPanel');

  // --- Theme ---
  function applyTheme(isNight) {
    if (isNight) {
      body.classList.add('night-mode');
      if (prismThemeLink) prismThemeLink.href = PRISM_DARK_THEME;
    } else {
      body.classList.remove('night-mode');
      if (prismThemeLink) prismThemeLink.href = PRISM_LIGHT_THEME;
    }
    updateThemeIcon(isNight);
  }

  function updateThemeIcon(isNight) {
    if (!themeToggle) return;
    var icon = themeToggle.querySelector('.material-icons');
    if (icon) {
      icon.textContent = isNight ? 'light_mode' : 'dark_mode';
    }
  }

  var savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
  applyTheme(savedTheme === 'night');

  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      var night = !body.classList.contains('night-mode');
      applyTheme(night);
      localStorage.setItem(STORAGE_KEY_THEME, night ? 'night' : 'day');
    });
  }

  // --- Sidebar Toggle ---
  var leftVisible = localStorage.getItem(STORAGE_KEY_LEFT) !== 'hidden';

  function isMobile() {
    return window.innerWidth < 900;
  }

  function updateSidebarIcon(pathname) {
    if (!sidebarToggle) return;
    var icon = sidebarToggle.querySelector('.material-icons');
    if (icon) {
      if (!pathname) pathname = window.location.pathname;
      var isHome = pathname === '/' || pathname === '/index.html' || pathname === '';
      if (isHome) {
        icon.textContent = leftVisible ? 'menu_open' : 'menu';
      } else {
        icon.textContent = 'arrow_back';
      }
    }
  }

  // Create overlay
  var overlay = document.createElement('div');
  overlay.id = 'leftPanelOverlay';
  overlay.className = 'left-panel-overlay';
  document.body.appendChild(overlay);

  function showLeftPanel() {
    if (!leftPanel || !centerPanel) return;
    if (isMobile()) {
      leftPanel.style.transform = 'translateX(0)';
      leftPanel.style.zIndex = '150';
      overlay.classList.add('active');
    } else {
      leftPanel.classList.remove('left-hidden');
      centerPanel.classList.remove('left-collapsed');
    }
    leftVisible = true;
    updateSidebarIcon();
  }

  function hideLeftPanel() {
    if (!leftPanel || !centerPanel) return;
    if (isMobile()) {
      leftPanel.style.transform = '';
      leftPanel.style.zIndex = '100';
      overlay.classList.remove('active');
    } else {
      leftPanel.classList.add('left-hidden');
      centerPanel.classList.add('left-collapsed');
    }
    leftVisible = false;
    updateSidebarIcon();
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      var icon = sidebarToggle.querySelector('.material-icons');
      if (icon && icon.textContent === 'arrow_back') {
        loadContent('/');
        return;
      }
      if (leftVisible) {
        hideLeftPanel();
      } else {
        showLeftPanel();
      }
      localStorage.setItem(STORAGE_KEY_LEFT, leftVisible ? 'visible' : 'hidden');
    });
  }

  overlay.addEventListener('click', function() {
    hideLeftPanel();
    localStorage.setItem(STORAGE_KEY_LEFT, 'hidden');
  });

  function initLayout() {
    var isNarrow = window.innerWidth < 900;

    if (isNarrow) {
      if (leftVisible) {
        showLeftPanel();
      } else {
        hideLeftPanel();
      }
    } else {
      if (leftVisible) {
        showLeftPanel();
      } else {
        hideLeftPanel();
      }
    }
  }

  initLayout();
  window.addEventListener('resize', initLayout);

  body.classList.remove('no-transitions');

  // Swipe to close on mobile
  var touchStartX = 0;
  if (leftPanel) {
    leftPanel.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    leftPanel.addEventListener('touchmove', function(e) {
      var diff = touchStartX - e.touches[0].clientX;
      if (diff > 60 && isMobile() && leftVisible) {
        hideLeftPanel();
        localStorage.setItem(STORAGE_KEY_LEFT, 'hidden');
      }
    }, { passive: true });
  }

  // --- Active nav items ---
  function updateActiveNav(path) {
    // Toolbar nav links
    var toolbarLinks = document.querySelectorAll('.toolbar-nav-link');
    toolbarLinks.forEach(function(link) {
      var href = link.getAttribute('href');
      if (href) {
        var linkPath = new URL(href, window.location.origin).pathname;
        link.classList.toggle('active', path === linkPath || (linkPath !== '/' && path.startsWith(linkPath)));
      }
    });
  }

  // --- PJAX: local content refresh without full page reload ---
  var contentEl = document.querySelector('.center-content');
  if (!contentEl) contentEl = document.querySelector('.center-panel');

  // Re-initialize content-specific scripts
  function initContentScripts() {
    // Mermaid
    if (typeof mermaid !== 'undefined') {
      var codeBlocks = document.querySelectorAll('pre code[class*="mermaid"]');
      codeBlocks.forEach(function(block) {
        var mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'mermaid';
        mermaidDiv.textContent = block.textContent;
        block.parentNode.replaceWith(mermaidDiv);
      });
      mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    }

    // Prism
    if (typeof Prism !== 'undefined') {
      Prism.highlightAll();
    }
  }

  function loadContent(url, pushState) {
    if (pushState === undefined) pushState = true;

    fetch(url)
      .then(function(res) {
        if (!res.ok) throw new Error('Network error');
        return res.text();
      })
      .then(function(html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');

        // Update title
        document.title = doc.title;

        // Extract new content
        var newContent = doc.querySelector('.center-content');
        if (!newContent) newContent = doc.querySelector('.center-panel');
        if (!newContent) throw new Error('No content found');

        // Replace content
        if (contentEl) {
          contentEl.innerHTML = newContent.innerHTML;
        }

        // Update active nav
        var pathname = new URL(url, window.location.origin).pathname;
        updateActiveNav(pathname);
        updateSidebarIcon(pathname);

        // Push history
        if (pushState) {
          history.pushState({ url: url }, '', url);
        }

        // Re-init scripts
        initContentScripts();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'instant' });
      })
      .catch(function(err) {
        console.error('PJAX error:', err);
        window.location.href = url;
      });
  }

  // Intercept all same-origin link clicks
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href) return;

    // Skip external links, anchors, download links, new-window links
    if (link.hostname !== window.location.hostname) return;
    if (link.getAttribute('target') === '_blank') return;
    if (link.hasAttribute('download')) return;
    if (href === '#' || href.startsWith('#')) return;
    // Skip atom.xml, rss, mailto etc
    if (/^(mailto|javascript|atom\.xml|rss)/.test(href)) return;

    e.preventDefault();
    loadContent(href);
  });

  // Handle browser back/forward
  window.addEventListener('popstate', function(e) {
    if (e.state && e.state.url) {
      loadContent(e.state.url, false);
    }
  });

  // Initial active nav
  updateActiveNav(window.location.pathname);
})();
