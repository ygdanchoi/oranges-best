// Shared hamburger menu component

let menuOpen = false;
let menuOranges = [];
let menuUsername = '';

// Get username from cookies
function getMenuUsername() {
    const cookies = document.cookie.split(';');
    const usernameCookie = cookies.find(c => c.trim().startsWith('username='));
    return usernameCookie ? usernameCookie.split('=')[1] : '';
}

// Load oranges for menu with vote data
async function loadMenuOranges() {
    try {
        // Use tierlist API to get vote information
        const response = await fetch('/api/tierlist');
        menuOranges = await response.json();
        menuUsername = getMenuUsername();
    } catch (error) {
        console.error('Error loading menu oranges:', error);
    }
}

// Create dropdown menu
function createHamburgerMenu() {
    // Get page title
    const pageTitle = getPageTitle();

    const menuHTML = `
        <div class="dropdown-menu-container">
            <button id="dropdown-btn" class="dropdown-btn" onclick="toggleMenu()">
                <span class="dropdown-icon">☰</span>
                <span class="dropdown-label">${escapeHtmlMenu(pageTitle)}</span>
            </button>
            <div id="dropdown-content" class="dropdown-content">
                <a href="/tierlist.html" class="dropdown-header">
                    <span>View Orange Tierlist</span>
                </a>
                <div class="dropdown-items" id="menu-content">
                    <div class="menu-loading">Loading...</div>
                </div>
            </div>
        </div>
        <div id="dropdown-overlay" class="dropdown-overlay" onclick="toggleMenu()"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', menuHTML);
}

// Get page title based on current page
function getPageTitle() {
    const path = window.location.pathname;

    if (path.includes('tierlist')) {
        return 'Orange Tierlist Alignment Sync';
    } else if (path.includes('admin')) {
        return 'Orange Admin Panel';
    } else if (path.includes('vote')) {
        // Try to get the orange name from the page if available
        const orangeName = document.getElementById('pageTitle')?.textContent || 'Orange';
        return `${orangeName}`;
    }

    return '';
}

// Toggle menu
function toggleMenu() {
    menuOpen = !menuOpen;
    const dropdown = document.getElementById('dropdown-content');
    const overlay = document.getElementById('dropdown-overlay');
    const btn = document.getElementById('dropdown-btn');

    if (menuOpen) {
        dropdown.classList.add('open');
        overlay.classList.add('open');
        btn.classList.add('open');
        renderMenuContent();
    } else {
        dropdown.classList.remove('open');
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

    let itemsHTML = menuOranges.map(orange => {
        // Find user's vote if logged in
        let userVoteTier = null;
        if (menuUsername && orange.votes && orange.votes.length > 0) {
            const userVote = orange.votes.find(vote => vote.username === menuUsername);
            if (userVote) {
                userVoteTier = userVote.tier;
            }
        }

        // Create vote indicator - badge if voted, placeholder if not
        const voteIndicator = userVoteTier ? `
            <div class="menu-tier-badge tier-${userVoteTier}"></div>
        ` : `
            <div class="menu-tier-placeholder"></div>
        `;

        return `
            <a href="/vote.html?orange=${orange.id}" class="menu-item">
                ${voteIndicator}
                <div class="menu-item-name">${escapeHtmlMenu(orange.name)}</div>
            </a>
        `;
    }).join('');

    // Add logout option if logged in
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('auth='));
    if (authCookie) {
        itemsHTML += `
            <button onclick="logout()" class="menu-item logout-item">
                <div style="font-size: 1.5rem; flex-shrink: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">👋</div>
                <div class="menu-item-name">Logout</div>
            </button>
        `;
    }

    content.innerHTML = itemsHTML;
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
    try {
        await loadMenuOranges();
    } catch (error) {
        console.error('Error loading menu oranges:', error);
        // Continue anyway so other scripts can load
    }
}

// Auto-initialize
initHamburgerMenu();
