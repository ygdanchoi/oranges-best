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
                <span class="dropdown-chevron">▼</span>
            </button>
            <div id="dropdown-content" class="dropdown-content">
                <a href="/tierlist.html" class="dropdown-header">
                    <span>View Tierlist</span>
                </a>
                <div class="dropdown-items" id="menu-content">
                    <div class="menu-loading">Loading...</div>
                </div>
                <div class="dropdown-footer">
                    <button id="logout-btn" class="logout-btn" onclick="logout()" style="display: none;">Logout</button>
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
        return '🍊 Orange Tierlist Alignment Sync II';
    } else if (path.includes('admin')) {
        return '🍊 Orange Admin Panel';
    } else if (path.includes('vote')) {
        // Try to get the orange name from the page if available
        const orangeName = document.getElementById('pageTitle')?.textContent || 'Orange';
        return `🍊 ${orangeName}`;
    }

    return '🍊 Orange';
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
        updateLogoutButton();
    } else {
        dropdown.classList.remove('open');
        overlay.classList.remove('open');
        btn.classList.remove('open');
    }
}

// Check if user is logged in and show/hide logout button
function updateLogoutButton() {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('auth='));
    const logoutBtn = document.getElementById('logout-btn');

    if (authCookie && logoutBtn) {
        logoutBtn.style.display = 'block';
    } else if (logoutBtn) {
        logoutBtn.style.display = 'none';
    }
}

// Render menu content
function renderMenuContent() {
    const content = document.getElementById('menu-content');

    if (menuOranges.length === 0) {
        content.innerHTML = '<div class="menu-empty">No oranges available</div>';
        return;
    }

    content.innerHTML = menuOranges.map(orange => {
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
