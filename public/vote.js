let orangeId = null;
let username = '';
let password = '';
let currentOrange = null;

// Get orange ID from URL
function getOrangeId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('orange');
}

// Check if already logged in
function checkAuth() {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('auth='));
    const usernameCookie = cookies.find(c => c.trim().startsWith('username='));

    if (authCookie && usernameCookie) {
        password = authCookie.split('=')[1];
        username = usernameCookie.split('=')[1];
        return true;
    }
    return false;
}

// Login
async function login() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    username = usernameInput.value.trim();
    password = passwordInput.value;

    if (!username) {
        showMessage('loginMessage', 'Username is required', 'error');
        return;
    }

    if (!password) {
        showMessage('loginMessage', 'Password is required', 'error');
        return;
    }

    // Test password by trying to make a request
    try {
        const response = await fetch('/api/oranges');

        if (response.ok) {
            // Set cookies
            document.cookie = `auth=${password}; max-age=${30 * 24 * 60 * 60}; path=/`;
            document.cookie = `username=${username}; max-age=${30 * 24 * 60 * 60}; path=/`;

            showMessage('loginMessage', 'Login successful!', 'success');

            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('voteSection').classList.remove('hidden');

            // Load user's current vote if exists
            loadCurrentVote();
        }
    } catch (error) {
        showMessage('loginMessage', 'Login failed', 'error');
        console.error('Login error:', error);
    }
}

// Load orange data
async function loadOrange() {
    try {
        const response = await fetch(`/api/oranges/${orangeId}`);

        if (!response.ok) {
            throw new Error('Orange not found');
        }

        currentOrange = await response.json();

        // Set page title
        document.getElementById('pageTitle').textContent = currentOrange.name;

        // Display orange info
        document.getElementById('orangeName').textContent = currentOrange.name;
        document.getElementById('orangeStore').textContent = currentOrange.store || '';
        document.getElementById('orangeDescription').textContent = currentOrange.description || '';

        // Display image if available
        const imageDiv = document.getElementById('orangeImage');
        if (currentOrange.image_url) {
            imageDiv.innerHTML = `<img src="${currentOrange.image_url}" alt="${currentOrange.name}">`;
        } else {
            imageDiv.textContent = '🍊';
        }

        document.getElementById('orangeDisplay').classList.remove('hidden');
    } catch (error) {
        alert('Error loading orange: ' + error.message);
        console.error('Load error:', error);
    }
}

// Load current vote for this user/orange
async function loadCurrentVote() {
    if (!currentOrange || !currentOrange.votes) return;

    const userVote = currentOrange.votes.find(v => v.username === username);

    if (userVote) {
        const currentVoteDiv = document.getElementById('currentVote');
        currentVoteDiv.textContent = `Your current vote: ${userVote.tier}`;
        currentVoteDiv.classList.remove('hidden');
    }
}

// Submit vote
async function vote(tier) {
    if (!username || !password) {
        document.getElementById('voteSection').classList.add('hidden');
        document.getElementById('loginSection').classList.remove('hidden');
        return;
    }

    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orangeId: orangeId,
                username: username,
                tier: tier,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                showMessage('voteMessage', 'Invalid password. Please log in again.', 'error');
                document.getElementById('voteSection').classList.add('hidden');
                document.getElementById('loginSection').classList.remove('hidden');
                return;
            }
            throw new Error(data.error || 'Failed to submit vote');
        }

        showMessage('voteMessage', `Vote submitted: ${tier}!`, 'success');

        // Update current vote display
        const currentVoteDiv = document.getElementById('currentVote');
        currentVoteDiv.textContent = `Your current vote: ${tier}`;
        currentVoteDiv.classList.remove('hidden');
    } catch (error) {
        showMessage('voteMessage', error.message, 'error');
        console.error('Vote error:', error);
    }
}

// Show message
function showMessage(elementId, message, type) {
    const messageDiv = document.getElementById(elementId);
    messageDiv.innerHTML = `<div class="message ${type}">${message}</div>`;

    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 3000);
}

// Initialize
async function init() {
    orangeId = getOrangeId();

    if (!orangeId) {
        alert('No orange specified. Please use ?orange=ID in the URL');
        return;
    }

    await loadOrange();

    if (checkAuth()) {
        document.getElementById('voteSection').classList.remove('hidden');
        loadCurrentVote();
    } else {
        document.getElementById('loginSection').classList.remove('hidden');
    }
}

init();
