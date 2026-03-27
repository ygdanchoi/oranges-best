let password = '';
let editingOrangeId = null;

// Check if already logged in via cookie
function checkAuth() {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('auth='));

    if (authCookie) {
        password = authCookie.split('=')[1];
        showAdminPanel();
        loadOranges();
    }
}

// Login
function login() {
    const passwordInput = document.getElementById('password');
    password = passwordInput.value;

    if (!password) {
        showMessage('loginMessage', 'Password is required', 'error');
        return;
    }

    // Set auth cookie
    document.cookie = `auth=${password}; max-age=${30 * 24 * 60 * 60}; path=/`;

    showMessage('loginMessage', 'Login successful!', 'success');
    setTimeout(() => {
        showAdminPanel();
        loadOranges();
    }, 500);
}

// Show admin panel
function showAdminPanel() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('addSection').classList.remove('hidden');
    document.getElementById('listSection').classList.remove('hidden');
}

// Add orange
async function addOrange() {
    const name = document.getElementById('name').value;
    const store = document.getElementById('store').value;
    const description = document.getElementById('description').value;
    const imageUrl = document.getElementById('imageUrl').value;

    if (!name) {
        showMessage('addMessage', 'Name is required', 'error');
        return;
    }

    try {
        const response = await fetch('/api/admin/oranges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                store,
                description,
                imageUrl,
                password
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to add orange');
        }

        showMessage('addMessage', 'Orange added successfully!', 'success');

        // Clear form
        document.getElementById('name').value = '';
        document.getElementById('store').value = '';
        document.getElementById('description').value = '';
        document.getElementById('imageUrl').value = '';

        // Reload list
        loadOranges();
    } catch (error) {
        showMessage('addMessage', error.message, 'error');
        console.error('Add error:', error);
    }
}

// Load oranges
async function loadOranges() {
    try {
        const [orangesResponse, votesResponse] = await Promise.all([
            fetch('/api/oranges'),
            fetch('/api/votes')
        ]);

        const oranges = await orangesResponse.json();
        const allVotes = await votesResponse.json();

        // Group votes by orange
        const votesByOrange = {};
        allVotes.forEach(vote => {
            if (!votesByOrange[vote.orange_id]) {
                votesByOrange[vote.orange_id] = [];
            }
            votesByOrange[vote.orange_id].push(vote);
        });

        const listDiv = document.getElementById('orangesList');

        if (oranges.length === 0) {
            listDiv.innerHTML = '<p style="color: #999;">No oranges yet. Add one above!</p>';
            return;
        }

        listDiv.innerHTML = oranges.map(orange => {
            const votes = votesByOrange[orange.id] || [];
            const votesByTier = votes.reduce((acc, vote) => {
                acc[vote.tier] = (acc[vote.tier] || 0) + 1;
                return acc;
            }, {});

            const voteSummary = ['S', 'A', 'B', 'C', 'D', 'F']
                .map(tier => votesByTier[tier] ? `${tier}: ${votesByTier[tier]}` : null)
                .filter(Boolean)
                .join(', ');

            return `
            <div class="orange-item" id="orange-${orange.id}"
                 data-name="${escapeHtml(orange.name)}"
                 data-store="${escapeHtml(orange.store || '')}"
                 data-description="${escapeHtml(orange.description || '')}"
                 data-imageurl="${escapeHtml(orange.image_url || '')}">
                <div class="orange-info">
                    <div class="orange-name"><a href="/vote.html?orange=${orange.id}" target="_blank" style="color: inherit; text-decoration: none; font-weight: 700;">${escapeHtml(orange.name)}</a> <span style="color: #999; font-size: 0.8rem; font-weight: normal;">(ID: ${orange.id})</span></div>
                    <div class="orange-description">${escapeHtml(orange.description || '')}</div>
                    ${orange.store ? `<div style="color: #666; font-size: 0.9rem; font-weight: 600; margin-top: 0.25rem;">${escapeHtml(orange.store)}</div>` : ''}
                    ${orange.image_url ? `<div style="color: #999; font-size: 0.8rem; margin-top: 0.25rem;">Image: ${escapeHtml(orange.image_url)}</div>` : ''}
                    <div id="vote-summary-${orange.id}" style="font-size: 0.85rem; margin-top: 0.5rem; font-weight: 600;">${votes.length > 0 ? `<span style="color: #4a9eff;">Votes (${votes.length}): ${voteSummary}</span>` : `<span style="color: #999;">No votes yet</span>`}</div>
                    <div id="votes-${orange.id}"></div>
                    <div id="edit-${orange.id}"></div>
                </div>
                <div class="orange-actions">
                    <button class="btn-small" onclick="editOrange(${orange.id})">Edit</button>
                    <button class="btn-small" onclick="editVotes(${orange.id})" style="background: #17a2b8;">Votes</button>
                    <button class="btn-small btn-delete" onclick="deleteOrange(${orange.id})">Delete</button>
                </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Load error:', error);
    }
}

// Edit orange
function editOrange(id) {
    // Close any existing edit forms
    document.querySelectorAll('.edit-form').forEach(form => form.remove());

    // Get data from data attributes
    const orangeDiv = document.getElementById(`orange-${id}`);
    const name = orangeDiv.dataset.name;
    const store = orangeDiv.dataset.store;
    const description = orangeDiv.dataset.description;
    const imageUrl = orangeDiv.dataset.imageurl;

    const editDiv = document.getElementById(`edit-${id}`);
    editDiv.innerHTML = `
        <div class="edit-form">
            <div class="form-group">
                <label>Name:</label>
                <input type="text" id="edit-name-${id}" value="${name}">
            </div>
            <div class="form-group">
                <label>Store:</label>
                <input type="text" id="edit-store-${id}" value="${store}">
            </div>
            <div class="form-group">
                <label>Description:</label>
                <textarea id="edit-description-${id}">${description}</textarea>
            </div>
            <div class="form-group">
                <label>Image URL:</label>
                <input type="text" id="edit-imageUrl-${id}" value="${imageUrl}">
            </div>
            <button onclick="saveOrange(${id})">Save</button>
            <button onclick="cancelEdit(${id})" style="background: #6c757d;">Cancel</button>
        </div>
    `;
}

// Save edited orange
async function saveOrange(id) {
    const name = document.getElementById(`edit-name-${id}`).value;
    const store = document.getElementById(`edit-store-${id}`).value;
    const description = document.getElementById(`edit-description-${id}`).value;
    const imageUrl = document.getElementById(`edit-imageUrl-${id}`).value;

    if (!name) {
        alert('Name is required');
        return;
    }

    try {
        const response = await fetch(`/api/admin/oranges/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                store,
                description,
                imageUrl,
                password
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to update orange');
        }

        loadOranges();
    } catch (error) {
        alert('Error updating orange: ' + error.message);
        console.error('Update error:', error);
    }
}

// Cancel edit
function cancelEdit(id) {
    document.getElementById(`edit-${id}`).innerHTML = '';
}

// Edit votes for an orange
async function editVotes(orangeId) {
    // Close any existing edit forms
    document.querySelectorAll('.edit-votes-form').forEach(form => form.remove());

    try {
        const votesResponse = await fetch('/api/votes');
        const allVotes = await votesResponse.json();
        const votes = allVotes.filter(v => v.orange_id === orangeId);

        const votesByTier = votes.reduce((acc, vote) => {
            acc[vote.tier] = (acc[vote.tier] || 0) + 1;
            return acc;
        }, {});
        const voteSummary = ['S', 'A', 'B', 'C', 'D', 'F']
            .map(tier => votesByTier[tier] ? `${tier}: ${votesByTier[tier]}` : null)
            .filter(Boolean).join(', ');
        const summaryDiv = document.getElementById(`vote-summary-${orangeId}`);
        if (summaryDiv) {
            summaryDiv.innerHTML = votes.length > 0
                ? `<span style="color: #4a9eff;">Votes (${votes.length}): ${voteSummary}</span>`
                : `<span style="color: #999;">No votes yet</span>`;
        }

        const votesDiv = document.getElementById(`votes-${orangeId}`);
        const tiers = ['S', 'A', 'B', 'C', 'D', 'F'];

        let formHTML = `<div class="edit-votes-form" style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <div style="font-weight: 600; margin-bottom: 0.75rem;">Edit Votes</div>`;

        if (votes.length > 0) {
            formHTML += `<div style="margin-bottom: 1rem;">`;
            votes.forEach(vote => {
                formHTML += `
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; padding: 0.5rem; background: white; border-radius: 3px;">
                        <span style="flex: 1;">${escapeHtml(vote.username)}</span>
                        <select id="tier-${vote.id}" style="padding: 0.25rem; border: 1px solid #ddd; border-radius: 3px;">
                            ${tiers.map(tier => `<option value="${tier}" ${vote.tier === tier ? 'selected' : ''}>${tier}</option>`).join('')}
                        </select>
                        <button onclick="updateVote(${vote.id}, ${orangeId}, '${vote.username}')" style="background: #28a745; color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Save</button>
                        <button onclick="deleteVote(${vote.id}, ${orangeId})" style="background: #dc3545; color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Delete</button>
                    </div>
                `;
            });
            formHTML += `</div>`;
        } else {
            formHTML += `<div style="color: #999; font-size: 0.85rem;">No votes yet</div>`;
        }

        formHTML += `<br><br><button onclick="closeVotesEdit(${orangeId})" style="background: #6c757d; color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Close</button>`;
        formHTML += `</div>`;

        votesDiv.innerHTML = formHTML;
    } catch (error) {
        console.error('Error loading votes:', error);
    }
}

// Update a vote
async function updateVote(voteId, orangeId, username) {
    const newTier = document.getElementById(`tier-${voteId}`).value;

    try {
        const response = await fetch(`/api/admin/votes/${voteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tier: newTier,
                password
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to update vote');
        }

        editVotes(orangeId);
    } catch (error) {
        console.error('Error updating vote:', error);
    }
}

// Delete a vote
async function deleteVote(voteId, orangeId) {

    try {
        const response = await fetch(`/api/admin/votes/${voteId}?password=${password}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to delete vote');
        }

        editVotes(orangeId);
    } catch (error) {
        console.error('Error deleting vote:', error);
    }
}

// Close votes edit
function closeVotesEdit(orangeId) {
    document.getElementById(`votes-${orangeId}`).innerHTML = '';
}

// Delete orange
async function deleteOrange(id) {
    const orangeDiv = document.getElementById(`orange-${id}`);
    const name = orangeDiv.dataset.name;

    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all votes for this orange.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/oranges/${id}?password=${password}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to delete orange');
        }

        loadOranges();
    } catch (error) {
        alert('Error deleting orange: ' + error.message);
        console.error('Delete error:', error);
    }
}

// Show message
function showMessage(elementId, message, type) {
    const messageDiv = document.getElementById(elementId);
    messageDiv.innerHTML = `<div class="message ${type}">${escapeHtml(message)}</div>`;

    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 3000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
checkAuth();
