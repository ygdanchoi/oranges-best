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
async function login() {
    const passwordInput = document.getElementById('password');
    password = passwordInput.value;

    try {
        const response = await fetch('/api/oranges', {
            headers: {
                'Cookie': `auth=${password}`
            }
        });

        // Try to make a request with the password
        const testResponse = await fetch('/api/admin/oranges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: '_test',
                description: '_test',
                imageUrl: '',
                password: password
            })
        });

        if (testResponse.status === 401) {
            showMessage('loginMessage', 'Invalid password', 'error');
            return;
        }

        // Delete the test orange if it was created
        if (testResponse.ok) {
            const data = await testResponse.json();
            if (data.success) {
                await fetch(`/api/admin/oranges/${data.orange.id}?password=${password}`, {
                    method: 'DELETE'
                });
            }
        }

        showMessage('loginMessage', 'Login successful!', 'success');
        showAdminPanel();
        loadOranges();
    } catch (error) {
        showMessage('loginMessage', 'Login failed', 'error');
        console.error('Login error:', error);
    }
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
                    <div class="orange-name">${escapeHtml(orange.name)} <span style="color: #999; font-size: 0.8rem; font-weight: normal;">(ID: ${orange.id})</span></div>
                    ${orange.store ? `<div style="color: #ff8c00; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.25rem;">${escapeHtml(orange.store)}</div>` : ''}
                    <div class="orange-description">${escapeHtml(orange.description || '')}</div>
                    ${orange.image_url ? `<div style="color: #999; font-size: 0.8rem; margin-top: 0.25rem;">Image: ${escapeHtml(orange.image_url)}</div>` : ''}
                    ${votes.length > 0 ? `<div style="color: #4a9eff; font-size: 0.85rem; margin-top: 0.5rem; font-weight: 600;">Votes (${votes.length}): ${voteSummary}</div>` : `<div style="color: #999; font-size: 0.85rem; margin-top: 0.5rem;">No votes yet</div>`}
                    <div style="color: #666; font-size: 0.85rem; margin-top: 0.5rem;">Vote URL: <code style="background: #f5f5f5; padding: 0.25rem 0.5rem; border-radius: 3px;">/vote.html?orange=${orange.id}</code></div>
                    <div id="edit-${orange.id}"></div>
                </div>
                <div class="orange-actions">
                    <button class="btn-small" onclick="editOrange(${orange.id})">Edit</button>
                    <button class="btn-small btn-delete" onclick="deleteOrange(${orange.id})">Delete</button>
                </div>
            </div>
        `).join('');
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
