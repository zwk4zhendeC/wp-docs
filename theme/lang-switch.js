// Language Switcher Script
(function() {
    // Detect base path (e.g., '/wp-docs/' or '/' for root)
    const basePath = (() => {
        const path = window.location.pathname;
        // Check if we're in a language subdirectory
        const match = path.match(/^(\/[^/]+)?\/(zh|en)\//);
        return match && match[1] ? match[1] : '';
    })();

    // Get current language from path
    const path = window.location.pathname;
    let currentLang = 'en';
    let currentPage = '/';

    // Remove base path for language detection
    const pathWithoutBase = basePath ? path.replace(new RegExp('^' + basePath), '') : path;

    if (pathWithoutBase.match(/^\/zh\//)) {
        currentLang = 'zh';
        currentPage = pathWithoutBase.replace(/^\/zh\//, '/');
    } else if (pathWithoutBase.match(/^\/en\//)) {
        currentLang = 'en';
        currentPage = pathWithoutBase.replace(/^\/en\//, '/');
    } else {
        currentPage = pathWithoutBase === '/' || pathWithoutBase === '' ? '/index.html' : pathWithoutBase;
    }

    // Build language switcher HTML
    const zhUrl = basePath + '/zh' + currentPage;
    const enUrl = basePath + '/en' + currentPage;

    const switcherHtml = `
        <div class="lang-switcher">
            ${currentLang === 'zh'
                ? '<span class="current">中文</span> | <a href="' + enUrl + '">English</a>'
                : '<a href="' + zhUrl + '">中文</a> | <span class="current">English</span>'
            }
        </div>
    `;

    // Insert switcher after the menu title
    const menuTitle = document.querySelector('.menu-title');
    if (menuTitle && menuTitle.parentNode) {
        menuTitle.parentNode.insertAdjacentHTML('afterend', switcherHtml);
    }
})();
