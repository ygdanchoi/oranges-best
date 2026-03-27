let orangeId = null;
let username = '';
let password = '';
let currentOrange = null;

// Lens flare effect state
let lensFlareCanvas = null;
let lensFlareCtx = null;
let lensFlareAnimFrame = null;
let activeLensFlares = [];

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

        document.title = `Orange Tierlist Alignment Sync - ${currentOrange.name}`;

        // Update dropdown button title
        const dropdownLabel = document.querySelector('.dropdown-label');
        if (dropdownLabel) {
            dropdownLabel.textContent = `${currentOrange.name}`;
        }

        // Display orange info
        document.getElementById('orangeDescription').textContent = currentOrange.description || '';
        document.getElementById('orangeStore').textContent = currentOrange.store || '';

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
        highlightVotedButton(userVote.tier);
    }
}

// Highlight the voted button
function highlightVotedButton(tier) {
    // Remove previous highlights
    document.querySelectorAll('.tier-btn').forEach(btn => {
        btn.classList.remove('voted');
    });

    // Add highlight to voted button
    const votedBtn = document.querySelector(`.tier-btn.tier-${tier}`);
    if (votedBtn) {
        votedBtn.classList.add('voted');
    }
}

// Lens flare effect
function playLensFlareEffect(buttonEl) {
    const rect = buttonEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    lensFlareCanvas.width = window.innerWidth;
    lensFlareCanvas.height = window.innerHeight;

    activeLensFlares.push({ startTime: Date.now(), x, y, duration: 500 });
    if (activeLensFlares.length > 2) activeLensFlares.shift();

    if (!lensFlareAnimFrame) animateLensFlare();
}

function animateLensFlare() {
    const now = Date.now();
    lensFlareCtx.clearRect(0, 0, lensFlareCanvas.width, lensFlareCanvas.height);
    lensFlareCtx.globalCompositeOperation = 'screen';

    activeLensFlares = activeLensFlares.filter(effect => {
        const elapsed = now - effect.startTime;
        const progress = Math.min(elapsed / effect.duration, 1);
        if (progress >= 1) return false;
        drawLensFlare(effect.x, effect.y, progress);
        return true;
    });

    if (activeLensFlares.length > 0) {
        lensFlareAnimFrame = requestAnimationFrame(animateLensFlare);
    } else {
        lensFlareAnimFrame = null;
        lensFlareCtx.clearRect(0, 0, lensFlareCanvas.width, lensFlareCanvas.height);
    }
}

function drawLensFlare(x, y, progress) {
    const maxDim = Math.max(lensFlareCanvas.width, lensFlareCanvas.height);

    // Expanding bubble
    const ringEase = progress * progress;
    const ringRadius = ringEase * maxDim * 1.2;
    const bubble = lensFlareCtx.createRadialGradient(x, y, 0, x, y, ringRadius);
    bubble.addColorStop(0, `rgba(255, 255, 255, ${(1 - progress) * 0.15})`);
    bubble.addColorStop(0.7, `rgba(235, 215, 255, ${(1 - progress) * 0.1})`);
    bubble.addColorStop(1, `rgba(235, 215, 255, 0)`);
    lensFlareCtx.fillStyle = bubble;
    lensFlareCtx.beginPath();
    lensFlareCtx.arc(x, y, ringRadius, 0, Math.PI * 2);
    lensFlareCtx.fill();

    for (let pass = 0; pass < 2; pass++) {
        lensFlareCtx.strokeStyle = `rgba(235, 215, 255, ${(1 - progress) * 0.6})`;
        lensFlareCtx.lineWidth = 12;
        lensFlareCtx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        lensFlareCtx.shadowBlur = 40;
        lensFlareCtx.beginPath();
        lensFlareCtx.arc(x, y, ringRadius, 0, Math.PI * 2);
        lensFlareCtx.stroke();
    }

    // Six rotating spokes
    const spokeLength = progress < 0.5
        ? (progress * 2) * maxDim * 0.8
        : ((1 - progress) * 2) * maxDim * 0.8;
    const rotation = progress * Math.PI * 0.6;

    lensFlareCtx.strokeStyle = `rgba(235, 215, 255, 0.4)`;
    lensFlareCtx.lineWidth = 10;
    lensFlareCtx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    lensFlareCtx.shadowBlur = 20;

    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i + rotation;
        lensFlareCtx.beginPath();
        lensFlareCtx.moveTo(x, y);
        lensFlareCtx.lineTo(x + Math.cos(angle) * spokeLength, y + Math.sin(angle) * spokeLength);
        lensFlareCtx.stroke();
    }

    // Eight-point sparkle star
    let starSize;
    if (progress < 0.2) {
        starSize = (progress / 0.2) * 140;
    } else if (progress < 0.8) {
        starSize = 140;
    } else {
        starSize = ((1 - progress) / 0.2) * 140;
    }

    lensFlareCtx.fillStyle = `rgba(255, 255, 255, 0.8)`;
    lensFlareCtx.shadowColor = 'rgba(255, 255, 255, 1)';
    lensFlareCtx.shadowBlur = 8;

    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(angle => {
        drawSparklePoint(x, y, angle, starSize, 1);
    });
    [Math.PI / 4, Math.PI * 3 / 4, Math.PI * 5 / 4, Math.PI * 7 / 4].forEach(angle => {
        drawSparklePoint(x, y, angle, starSize * 0.7, 0.5);
    });
}

function drawSparklePoint(cx, cy, angle, length, opacity) {
    lensFlareCtx.save();
    lensFlareCtx.translate(cx, cy);
    lensFlareCtx.rotate(angle);
    lensFlareCtx.globalAlpha = opacity;
    lensFlareCtx.beginPath();
    lensFlareCtx.moveTo(length, 0);
    lensFlareCtx.lineTo(length * 0.1, length * 0.08);
    lensFlareCtx.lineTo(0, 0);
    lensFlareCtx.lineTo(length * 0.1, -length * 0.08);
    lensFlareCtx.closePath();
    lensFlareCtx.fill();
    lensFlareCtx.restore();
}

// Submit vote
async function vote(tier, buttonEl) {
    if (!username || !password) {
        document.getElementById('voteSection').classList.add('hidden');
        document.getElementById('loginSection').classList.remove('hidden');
        return;
    }

    const isVoted = buttonEl && buttonEl.classList.contains('voted');

    try {
        if (isVoted) {
            const response = await fetch('/api/vote', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orangeId, username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to remove vote');
            }

            document.querySelectorAll('.tier-btn').forEach(btn => btn.classList.remove('voted'));
            if (buttonEl) playLensFlareEffect(buttonEl);
        } else {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orangeId, username, tier, password })
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

            highlightVotedButton(tier);
            if (buttonEl) playLensFlareEffect(buttonEl);
        }
    } catch (error) {
        showMessage('voteMessage', error.message, 'error');
        console.error('Vote error:', error);
    }
}

// Show message
function showMessage(elementId, message, type) {
    // For vote messages, show as toast at bottom
    if (elementId === 'voteMessage') {
        // Remove any existing toast
        const existingToast = document.querySelector('.message');
        if (existingToast) {
            existingToast.remove();
        }

        // Create and show new toast
        const toast = document.createElement('div');
        toast.className = `message ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    } else {
        // For login messages, show inline
        const messageDiv = document.getElementById(elementId);
        messageDiv.innerHTML = `<div style="padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; text-align: center; font-weight: 500; background: ${type === 'success' ? '#d4edda' : '#f8d7da'}; color: ${type === 'success' ? '#155724' : '#721c24'};">${message}</div>`;

        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    }
}

// Initialize
async function init() {
    lensFlareCanvas = document.getElementById('lens-flare-canvas');
    lensFlareCtx = lensFlareCanvas.getContext('2d');

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
