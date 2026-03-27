let socket;
let orangesData = [];

// Load tierlist data
async function loadTierlist() {
    try {
        const response = await fetch('/api/tierlist');
        orangesData = await response.json();

        renderTierlist();

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('tierlist').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading tierlist:', error);
        document.getElementById('loading').textContent = 'Error loading tierlist';
    }
}

// Get vote range (min and max tiers)
function getVoteRange(votes) {
    if (!votes || votes.length === 0) return null;

    const tierOrder = ['F', 'D', 'C', 'B', 'A', 'S'];
    // Extract tier from vote objects
    const tiers = votes.map(v => v.tier || v);
    const tierValues = tiers.map(t => tierOrder.indexOf(t));
    const min = Math.min(...tierValues);
    const max = Math.max(...tierValues);

    if (min === max) {
        return tierOrder[min];
    }
    return `${tierOrder[min]}-${tierOrder[max]}`;
}

// Format vote breakdown for tooltip
function formatVoteBreakdown(voteCounts) {
    if (!voteCounts || Object.keys(voteCounts).length === 0) return '';

    const tiers = ['S', 'A', 'B', 'C', 'D', 'F'];
    const breakdown = tiers
        .filter(tier => voteCounts[tier])
        .map(tier => `${tier}: ${voteCounts[tier]}`)
        .join(', ');

    return breakdown;
}

// Render tierlist
function renderTierlist() {
    const tiers = ['S', 'A', 'B', 'C', 'D', 'F'];

    tiers.forEach(tier => {
        const tierContent = document.getElementById(`tier-${tier}`);
        const orangesInTier = orangesData
            .filter(o => o.tier === tier)
            .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

        if (orangesInTier.length === 0) {
            tierContent.innerHTML = '';
            tierContent.classList.add('empty');
        } else {
            tierContent.classList.remove('empty');
            tierContent.innerHTML = orangesInTier.map(orange => {
                const voteRange = getVoteRange(orange.votes);
                const voteBreakdown = formatVoteBreakdown(orange.voteCounts);

                return `
                    <div class="orange-card" onclick="window.location.href='/vote.html?orange=${orange.id}'" title="${voteBreakdown}">
                        <div class="orange-card-name">${escapeHtml(orange.name)}</div>
                        <div class="orange-card-votes">${orange.voteCount} ${orange.voteCount === 1 ? 'vote' : 'votes'}${voteRange ? ` (${voteRange})` : ''}</div>
                    </div>
                `;
            }).join('');
            applyAnimationDelays(tierContent);
        }
    });

    // Render unvoted oranges
    const unvotedContent = document.getElementById('tier-unvoted');
    if (unvotedContent) {
        const unvotedOranges = orangesData
            .filter(o => !o.tier)
            .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

        const unvotedRow = unvotedContent.closest('.tier-row');
        if (unvotedOranges.length === 0) {
            unvotedContent.innerHTML = '';
            unvotedContent.classList.add('empty');
            if (unvotedRow) unvotedRow.classList.add('hidden');
        } else {
            unvotedContent.classList.remove('empty');
            if (unvotedRow) unvotedRow.classList.remove('hidden');
            unvotedContent.innerHTML = unvotedOranges.map(orange => {
                const voteRange = getVoteRange(orange.votes);
                const voteBreakdown = formatVoteBreakdown(orange.voteCounts);

                return `
                    <div class="orange-card" onclick="window.location.href='/vote.html?orange=${orange.id}'" title="${voteBreakdown}">
                        <div class="orange-card-name">${escapeHtml(orange.name)}</div>
                        <div class="orange-card-votes">${orange.voteCount} ${orange.voteCount === 1 ? 'vote' : 'votes'}${voteRange ? ` (${voteRange})` : ''}</div>
                    </div>
                `;
            }).join('');
            applyAnimationDelays(unvotedContent);
        }
    }
}

// Apply staggered animation delays to cards in a tier
function applyAnimationDelays(tierContent) {
    const cards = tierContent.querySelectorAll('.orange-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `0s, ${index * 0.25}s`;
    });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Setup WebSocket for real-time updates
function setupWebSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to WebSocket');
    });

    socket.on('voteUpdate', (data) => {
        console.log('Vote update received:', data);
        // Reload tierlist when a vote is submitted
        loadTierlist();
    });

    socket.on('orangeCreated', (data) => {
        console.log('Orange created:', data);
        loadTierlist();
    });

    socket.on('orangeUpdated', (data) => {
        console.log('Orange updated:', data);
        loadTierlist();
    });

    socket.on('orangeDeleted', (data) => {
        console.log('Orange deleted:', data);
        loadTierlist();
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
    });
}

// Initialize
async function init() {
    await loadTierlist();
    setupWebSocket();
}

init();
