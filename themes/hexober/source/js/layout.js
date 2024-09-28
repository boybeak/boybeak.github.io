function onPageReady() {
    const appbarNavBtn = document.getElementById('appbarNavBtn')
    if (appbarNavBtn) {
        appbarNavBtn.onclick = () => {
            document.getElementById('mainDrawer').toggle()
        }
    }
    const authorAvatar = document.getElementById('authorAvatar')
    
    if (authorAvatar) {
        const colorThief = new ColorThief();
        const authorContainer = document.getElementById('authorContainer')
        if (authorAvatar.complete) {
            const color = colorThief.getColor(authorAvatar)
            const rgbColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            authorContainer.style.backgroundColor = rgbColor
        } else {
            authorAvatar.addEventListener('load', function () {
                const color = colorThief.getColor(authorAvatar)
                const rgbColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                authorContainer.style.backgroundColor = rgbColor
            })
        }
    }

    const mainPage = document.getElementById('mainPage')
    const themeToggleBtn = document.getElementById('themeToggleBtn')
    if (themeToggleBtn) {
        // TODO
    }

    manageTheme()
}

function manageTheme() {
    function loadTheme() {
        const theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';
        console.log('loadTheme theme=', theme)
        switch (theme) {
            case 'dark':
                document.getElementById('theme-light').disabled = true;
                document.getElementById('theme-dark').disabled = false;
                break
            default:
                document.getElementById('theme-dark').disabled = true;
                document.getElementById('theme-light').disabled = false;
                break
        }
    }
    
    // 页面加载时检测并加载合适的主题
    window.addEventListener('load', loadTheme);

    // 如果用户在浏览器中切换主题模式，自动切换CSS
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', loadTheme);
}

function gotoPage(page) {
    if (page == 1) {
        window.location.href = window.location.origin
        return
    }
    window.location.href = window.location.origin + '/page/' + page
}