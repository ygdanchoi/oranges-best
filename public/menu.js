// Shared hamburger menu component

let menuOpen = false;
let menuOranges = [];

// Load oranges for menu
async function loadMenuOranges() {
    try {
        const response = await fetch('/api/oranges');
        menuOranges = await response.json();
    } catch (error) {
        console.error('Error loading menu oranges:', error);
    }
}

// Create hamburger menu
function createHamburgerMenu() {
    const menuHTML = `
        <div id="hamburger-btn" class="hamburger-btn" onclick="toggleMenu()">
            <div class="hamburger-line"></div>
            <div class="hamburger-line"></div>
            <div class="hamburger-line"></div>
        </div>
        <div id="hamburger-menu" class="hamburger-menu">
            <div class="menu-header">
                <h3>🍊 All Oranges</h3>
                <button class="menu-close" onclick="toggleMenu()">✕</button>
            </div>
            <div class="menu-content" id="menu-content">
                <div class="menu-loading">Loading...</div>
            </div>
            <div class="menu-footer">
                <a href="/tierlist.html" class="menu-link">View Tierlist</a>
                <button class="logout-btn" onclick="logout()">Logout</button>
            </div>
        </div>
        <div id="menu-overlay" class="menu-overlay" onclick="toggleMenu()"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', menuHTML);
}

// Toggle menu
function toggleMenu() {
    menuOpen = !menuOpen;
    const menu = document.getElementById('hamburger-menu');
    const overlay = document.getElementById('menu-overlay');
    const btn = document.getElementById('hamburger-btn');

    if (menuOpen) {
        menu.classList.add('open');
        overlay.classList.add('open');
        btn.classList.add('open');
        renderMenuContent();
    } else {
        menu.classList.remove('open');
        overlay.classList.remove('open');
        btn.classList.remove('open');
    }
}

// Render menu content
function renderMenuContent() {
    const content = document.getElementById('menu-content');

    if (menuOranges.length === 0) {
        content.innerHTML = '<div class="menu-empty">No oranges available</div>';
        return;
    }

    content.innerHTML = menuOranges.map(orange => `
        <a href="/vote.html?orange=${orange.id}" class="menu-item">
            <div class="menu-item-name">${escapeHtmlMenu(orange.name)}</div>
            ${orange.store ? `<div class="menu-item-store">${escapeHtmlMenu(orange.store)}</div>` : ''}
        </a>
    `).join('');
}

// Logout
function logout() {
    // Clear cookies
    document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Reload page
    window.location.reload();
}

// Escape HTML for menu
function escapeHtmlMenu(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize menu
async function initHamburgerMenu() {
    createHamburgerMenu();
    await loadMenuOranges();
}

// Auto-initialize
initHamburgerMenu();
