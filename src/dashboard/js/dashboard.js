// src/dashboard/js/dashboard.js
import { api, getAuthToken, removeAuthToken, copyToClipboard, formatDate, getMethodBadge, safeJsonParse, jsonStringify, setAuthToken } from './utils.js';

// ============================================
// STATE
// ============================================
const state = {
    projects: [],
    currentProject: null,
    currentEndpoint: null,
    endpoints: [],
    editingEndpoint: null,
    editingProject: null,
    view: 'projects'
};

// ============================================
// DOM REFERENCES
// ============================================
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// Views
const viewProjects = $('view-projects');
const viewProject = $('view-project');
const viewEndpointEditor = $('view-endpoint-editor');
const viewProfile = $('view-profile');

// Projects
const projectsList = $('projects-list');
const createProjectBtn = $('create-project-btn');

// Project Detail
const projectDetailContent = $('project-detail-content');
const backToProjects = $('back-to-projects');
const editProjectBtn = $('edit-project-btn');
const deleteProjectBtn = $('delete-project-btn');

// Endpoint Editor
const endpointEditorContent = $('endpoint-editor-content');
const backToProject = $('back-to-project');
const saveEndpointBtn = $('save-endpoint-btn');

// Modals
const projectModal = $('project-modal');
const projectForm = $('project-form');
const projectName = $('project-name');
const projectDescription = $('project-description');
const projectModalTitle = $('project-modal-title');
const projectModalSave = $('project-modal-save');
const projectModalCancel = $('project-modal-cancel');

const confirmModal = $('confirm-modal');
const confirmTitle = $('confirm-title');
const confirmMessage = $('confirm-message');
const confirmConfirm = $('confirm-confirm');
const confirmCancel = $('confirm-cancel');

// Toast
const toastContainer = $('toast-container');

// User
const userEmail = $('user-email');
const logoutBtn = $('logout-btn');
const sidebarLogo = $('sidebar-logo');

// Page title
const pageTitle = $('page-title');

// ============================================
// TOAST SYSTEM
// ============================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// MODAL HELPERS
// ============================================
function openModal(modal) {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            closeModal(modal);
        });
    }
});

// ============================================
// NAVIGATION
// ============================================
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById(`view-${viewId}`);
    if (view) view.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
    if (navItem) navItem.classList.add('active');

    state.view = viewId;
    
    // Update page title
    const titles = {
        'projects': 'Projects',
        'project': 'Project Details',
        'endpoint-editor': 'Endpoint Editor',
        'profile': 'Profile'
    };
    if (pageTitle) pageTitle.textContent = titles[viewId] || 'Dashboard';
}

function navigateToProjects() {
    showView('projects');
    renderProjects();
}

function navigateToProject(projectId) {
    showView('project');
    renderProjectDetail(projectId);
}

function navigateToEndpointEditor(projectId, endpointId = null) {
    showView('endpoint-editor');
    renderEndpointEditor(projectId, endpointId);
}

// ============================================
// PROJECT MODAL
// ============================================
function openProjectModal(project = null) {
    const isEditing = !!project;
    projectModalTitle.textContent = isEditing ? 'Edit Project' : 'New Project';
    projectName.value = project?.name || '';
    projectDescription.value = project?.description || '';
    projectModalSave.textContent = isEditing ? 'Update' : 'Create';
    state.editingProject = project?._id || null;
    openModal(projectModal);
    projectName.focus();
}

function closeProjectModal() {
    closeModal(projectModal);
    projectForm.reset();
    const errorEl = document.getElementById('project-name-error');
    if (errorEl) errorEl.textContent = '';
}

// Project modal cancel
if (projectModalCancel) {
    projectModalCancel.addEventListener('click', closeProjectModal);
}

// Project form submit
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = projectName.value.trim();
        const description = projectDescription.value.trim();

        const errorEl = document.getElementById('project-name-error');
        if (!name) {
            if (errorEl) errorEl.textContent = 'Project name is required';
            return;
        }
        if (errorEl) errorEl.textContent = '';

        try {
            if (state.editingProject) {
                // ✅ FIXED: Use relative path
                await api('PUT', `/projects/${state.editingProject}`, { name, description });
                showToast('Project updated', 'success');
            } else {
                // ✅ FIXED: Use relative path
                const result = await api('POST', '/projects', { name, description });
                state.projects.push(result.data);
                showToast('Project created', 'success');
            }
            closeProjectModal();
            renderProjects();
        } catch (error) {
            showToast('Failed to save project: ' + error.message, 'error');
        }
    });
}

// ============================================
// CONFIRM MODAL
// ============================================
let confirmCallback = null;

function confirmDelete(title, message, callback) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmCallback = callback;
    openModal(confirmModal);
}

function closeConfirmModal() {
    closeModal(confirmModal);
    confirmCallback = null;
}

if (confirmCancel) {
    confirmCancel.addEventListener('click', closeConfirmModal);
}

if (confirmConfirm) {
    confirmConfirm.addEventListener('click', () => {
        if (confirmCallback) {
            confirmCallback();
            confirmCallback = null;
        }
        closeModal(confirmModal);
    });
}

// ============================================
// PROJECTS
// ============================================
async function loadProjects() {
    try {
        // ✅ FIXED: Use relative path
        const result = await api('GET', '/projects');
        state.projects = result.data || [];
        return state.projects;
    } catch (error) {
        showToast('Failed to load projects: ' + error.message, 'error');
        return [];
    }
}

function renderProjects() {
    if (!state.projects.length) {
        projectsList.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <h3>No projects yet</h3>
                <p>Create your first project and start building APIs.</p>
                <button class="btn-primary" id="empty-create-project">+ New Project</button>
            </div>
        `;
        const emptyBtn = document.getElementById('empty-create-project');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openProjectModal());
        return;
    }

    projectsList.innerHTML = state.projects.map(project => `
        <div class="project-card" data-id="${project._id}">
            <div class="project-name">${project.name}</div>
            <div class="project-description">${project.description || 'No description'}</div>
            <div class="project-meta">
                <span>📌 ${project.projectId}</span>
                <span>📅 ${formatDate(project.createdAt)}</span>
            </div>
            <div class="project-actions">
                <button class="btn-secondary btn-sm open-project">Open</button>
                <button class="btn-danger btn-sm delete-project">Delete</button>
            </div>
        </div>
    `).join('');

    // Event listeners
    projectsList.querySelectorAll('.project-card').forEach(card => {
        const id = card.dataset.id;
        const openBtn = card.querySelector('.open-project');
        const deleteBtn = card.querySelector('.delete-project');
        
        if (openBtn) {
            openBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigateToProject(id);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = card.querySelector('.project-name')?.textContent || 'this project';
                confirmDelete('Delete Project', `Are you sure you want to delete "${name}"?`, () => deleteProject(id));
            });
        }
        
        card.addEventListener('click', () => navigateToProject(id));
    });
}

async function createProject(name, description) {
    try {
        // ✅ FIXED: Use relative path
        const result = await api('POST', '/projects', { name, description });
        state.projects.push(result.data);
        showToast('Project created successfully!', 'success');
        renderProjects();
        return result.data;
    } catch (error) {
        showToast('Failed to create project: ' + error.message, 'error');
        throw error;
    }
}

async function deleteProject(id) {
    try {
        // ✅ FIXED: Use relative path
        await api('DELETE', `/projects/${id}`);
        state.projects = state.projects.filter(p => p._id !== id);
        showToast('Project deleted', 'success');
        renderProjects();
    } catch (error) {
        showToast('Failed to delete project: ' + error.message, 'error');
    }
}

// ============================================
// PROJECT DETAIL
// ============================================
async function loadEndpoints(projectId) {
    try {
        // ✅ FIXED: Use relative path
        const result = await api('GET', `/projects/${projectId}/endpoints`);
        state.endpoints = result.data || [];
        return state.endpoints;
    } catch (error) {
        showToast('Failed to load endpoints: ' + error.message, 'error');
        return [];
    }
}

async function renderProjectDetail(projectId) {
    try {
        // ✅ FIXED: Use relative path
        const result = await api('GET', `/projects/${projectId}`);
        state.currentProject = result.data;

        await loadEndpoints(projectId);

        const project = state.currentProject;
        const endpoints = state.endpoints;

        const endpointsHtml = endpoints.length ? endpoints.map(ep => `
            <div class="endpoint-item" data-id="${ep._id}">
                <div class="endpoint-info">
                    <span class="method-badge method-${ep.method.toLowerCase()}">${ep.method}</span>
                    <span class="endpoint-path">${ep.path}</span>
                    <span class="endpoint-mode ${ep.mode}">${ep.mode}</span>
                    ${ep.mode === 'dynamic' ? `<span class="endpoint-stats">${ep._stats?.records || 0} records</span>` : ''}
                </div>
                <div class="endpoint-actions">
                    <button class="btn-secondary btn-sm edit-endpoint">Edit</button>
                    <button class="btn-danger btn-sm delete-endpoint">Delete</button>
                </div>
            </div>
        `).join('') : '<div class="empty-state" style="padding:20px;"><p>No endpoints yet. Create your first endpoint.</p></div>';

        projectDetailContent.innerHTML = `
            <div class="project-detail-header">
                <div class="project-name">${project.name}</div>
                <div class="project-description">${project.description || 'No description'}</div>
            </div>

            <div class="project-info-cards">
                <div class="info-card">
                    <div class="label">Project ID</div>
                    <div class="value">
                        ${project.projectId}
                        <button class="copy-btn" onclick="window.copyToClipboard('${project.projectId}')">Copy</button>
                    </div>
                </div>
                <div class="info-card">
                    <div class="label">API URL</div>
                    <div class="value">
                        /${project.projectId}
                        <button class="copy-btn" onclick="window.copyToClipboard('/${project.projectId}')">Copy</button>
                    </div>
                </div>
                <div class="info-card">
                    <div class="label">API Key</div>
                    <div class="value">
                        ${project.apiKey || 'Not generated'}
                        <button class="copy-btn" onclick="window.copyToClipboard('${project.apiKey || ''}')">Copy</button>
                        <button class="copy-btn" id="regenerate-key-btn">Regenerate</button>
                    </div>
                </div>
                <div class="info-card">
                    <div class="label">Require API Key</div>
                    <div class="value">
                        <label class="checkbox-label">
                            <input type="checkbox" id="require-api-key" ${project.requireApiKey ? 'checked' : ''}>
                            ${project.requireApiKey ? 'Enabled' : 'Disabled'}
                        </label>
                    </div>
                </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
                <h3 style="font-size:16px;font-weight:600;margin:0;">Endpoints</h3>
                <button class="btn-primary" id="add-endpoint-btn">+ New Endpoint</button>
            </div>
            <div class="endpoints-list">${endpointsHtml}</div>
        `;

        // Event listeners
        const addEndpointBtn = document.getElementById('add-endpoint-btn');
        if (addEndpointBtn) {
            addEndpointBtn.addEventListener('click', () => {
                navigateToEndpointEditor(projectId);
            });
        }

        const regenerateBtn = document.getElementById('regenerate-key-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', async () => {
                if (!confirm('Regenerate API key? This will invalidate the current key.')) return;
                try {
                    // ✅ FIXED: Use relative path
                    const result = await api('POST', `/projects/${projectId}/regenerate-key`);
                    showToast('API key regenerated', 'success');
                    renderProjectDetail(projectId);
                } catch (error) {
                    showToast('Failed to regenerate key: ' + error.message, 'error');
                }
            });
        }

        const requireApiKeyCheckbox = document.getElementById('require-api-key');
        if (requireApiKeyCheckbox) {
            requireApiKeyCheckbox.addEventListener('change', async (e) => {
                try {
                    // ✅ FIXED: Use relative path
                    await api('PUT', `/projects/${projectId}`, { requireApiKey: e.target.checked });
                    showToast(`API key requirement ${e.target.checked ? 'enabled' : 'disabled'}`, 'success');
                } catch (error) {
                    showToast('Failed to update: ' + error.message, 'error');
                    e.target.checked = !e.target.checked;
                }
            });
        }

        // Endpoint actions
        document.querySelectorAll('.endpoint-item .edit-endpoint').forEach(btn => {
            const item = btn.closest('.endpoint-item');
            const id = item.dataset.id;
            btn.addEventListener('click', () => navigateToEndpointEditor(projectId, id));
        });

        document.querySelectorAll('.endpoint-item .delete-endpoint').forEach(btn => {
            const item = btn.closest('.endpoint-item');
            const id = item.dataset.id;
            const path = item.querySelector('.endpoint-path')?.textContent || 'this endpoint';
            btn.addEventListener('click', () => {
                confirmDelete('Delete Endpoint', `Are you sure you want to delete "${path}"?`, () => deleteEndpoint(projectId, id));
            });
        });

    } catch (error) {
        showToast('Failed to load project: ' + error.message, 'error');
    }
}

async function deleteEndpoint(projectId, endpointId) {
    try {
        // ✅ FIXED: Use relative path
        await api('DELETE', `/projects/${projectId}/endpoints/${endpointId}`);
        showToast('Endpoint deleted', 'success');
        renderProjectDetail(projectId);
    } catch (error) {
        showToast('Failed to delete endpoint: ' + error.message, 'error');
    }
}

// ============================================
// ENDPOINT EDITOR
// ============================================
function renderEndpointEditor(projectId, endpointId = null) {
    const isEditing = !!endpointId;

    endpointEditorContent.innerHTML = `
        <div class="form-group">
            <label for="editor-method">Method</label>
            <select id="editor-method">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
            </select>
        </div>
        <div class="form-group">
            <label for="editor-path">Path</label>
            <input type="text" id="editor-path" placeholder="/users" required>
        </div>
        <div class="form-group">
            <label for="editor-mode">Mode</label>
            <select id="editor-mode">
                <option value="static">Static (Mock Responses)</option>
                <option value="dynamic">Dynamic (CRUD + Data Storage)</option>
            </select>
        </div>
        <div id="editor-static-fields">
            <div class="form-group">
                <label>Response Scenarios</label>
                <div id="editor-scenarios-container">
                    <p style="color:#666;font-size:13px;">Configure responses in the full editor (coming soon)</p>
                </div>
            </div>
        </div>
        <div id="editor-dynamic-fields" style="display:none;">
            <div class="form-group">
                <label>Schema Definition</label>
                <div id="editor-schema-container">
                    <p style="color:#666;font-size:13px;">Define schema in the full editor (coming soon)</p>
                </div>
            </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap;">
            <button class="btn-secondary" id="editor-cancel">Cancel</button>
            <button class="btn-primary" id="editor-save">${isEditing ? 'Update' : 'Create'}</button>
        </div>
    `;

    // If editing, load existing data
    if (isEditing) {
        const endpoint = state.endpoints.find(e => e._id === endpointId);
        if (endpoint) {
            const methodSelect = document.getElementById('editor-method');
            const pathInput = document.getElementById('editor-path');
            const modeSelect = document.getElementById('editor-mode');
            if (methodSelect) methodSelect.value = endpoint.method;
            if (pathInput) pathInput.value = endpoint.path;
            if (modeSelect) modeSelect.value = endpoint.mode;
            // Toggle fields based on mode
            toggleEditorFields(endpoint.mode);
        }
    }

    // Event listeners
    const cancelBtn = document.getElementById('editor-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => navigateToProject(projectId));
    }

    const saveBtn = document.getElementById('editor-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const method = document.getElementById('editor-method')?.value || 'GET';
            const path = document.getElementById('editor-path')?.value.trim() || '';
            const mode = document.getElementById('editor-mode')?.value || 'static';

            if (!path) {
                showToast('Path is required', 'error');
                return;
            }

            try {
                const data = { method, path, mode };

                if (mode === 'static') {
                    data.responses = [{
                        scenario: 'default',
                        isDefault: true,
                        statusCode: 200,
                        headers: { 'Content-Type': 'application/json' },
                        body: { message: 'Hello from Hollow!' },
                        delayMs: 0
                    }];
                } else {
                    data.schema = { fields: {} };
                }

                let result;
                if (isEditing) {
                    // ✅ FIXED: Use relative path
                    result = await api('PUT', `/projects/${projectId}/endpoints/${endpointId}`, data);
                    showToast('Endpoint updated', 'success');
                } else {
                    // ✅ FIXED: Use relative path
                    result = await api('POST', `/projects/${projectId}/endpoints`, data);
                    showToast('Endpoint created', 'success');
                }

                navigateToProject(projectId);
            } catch (error) {
                showToast('Failed to save endpoint: ' + error.message, 'error');
            }
        });
    }

    // Toggle static/dynamic fields
    const modeSelect = document.getElementById('editor-mode');
    if (modeSelect) {
        modeSelect.addEventListener('change', function() {
            toggleEditorFields(this.value);
        });
    }
}

function toggleEditorFields(mode) {
    const staticFields = document.getElementById('editor-static-fields');
    const dynamicFields = document.getElementById('editor-dynamic-fields');
    if (staticFields) staticFields.style.display = mode === 'dynamic' ? 'none' : 'block';
    if (dynamicFields) dynamicFields.style.display = mode === 'dynamic' ? 'block' : 'none';
}

// ============================================
// PROFILE VIEW
// ============================================
function renderProfile(user) {
    const content = document.getElementById('profile-content');
    if (!content) return;
    
    content.innerHTML = `
        <div style="max-width:400px;">
            <div class="info-card">
                <div class="label">Name</div>
                <div class="value">${user.name || 'Not set'}</div>
            </div>
            <div class="info-card">
                <div class="label">Email</div>
                <div class="value">${user.email}</div>
            </div>
            <div class="info-card">
                <div class="label">Member Since</div>
                <div class="value">${formatDate(user.createdAt)}</div>
            </div>
            <div style="margin-top:20px;">
                <button class="btn-secondary" id="change-password-btn">Change Password</button>
            </div>
        </div>
    `;
}

// ============================================
// NAVIGATION EVENTS
// ============================================
document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        if (view === 'projects') {
            navigateToProjects();
        } else if (view === 'profile') {
            showView('profile');
            // Load user data
            // ✅ FIXED: Use relative path
            api('GET', '/auth/me').then(result => {
                if (result.success) renderProfile(result.data);
            }).catch(() => {
                showToast('Failed to load profile', 'error');
            });
        }
    });
});

// ============================================
// SIDEBAR LOGO
// ============================================
if (sidebarLogo) {
    sidebarLogo.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToProjects();
    });
}

// ============================================
// BACK BUTTONS
// ============================================
if (backToProjects) {
    backToProjects.addEventListener('click', navigateToProjects);
}

if (backToProject) {
    backToProject.addEventListener('click', () => {
        if (state.currentProject) {
            navigateToProject(state.currentProject._id);
        } else {
            navigateToProjects();
        }
    });
}

// ============================================
// CREATE PROJECT
// ============================================
if (createProjectBtn) {
    createProjectBtn.addEventListener('click', () => openProjectModal());
}

// ============================================
// EDIT/DELETE PROJECT (from detail view)
// ============================================
if (editProjectBtn) {
    editProjectBtn.addEventListener('click', () => {
        if (state.currentProject) {
            openProjectModal(state.currentProject);
        }
    });
}

if (deleteProjectBtn) {
    deleteProjectBtn.addEventListener('click', () => {
        if (state.currentProject) {
            confirmDelete('Delete Project', `Are you sure you want to delete "${state.currentProject.name}"? All endpoints and data will be lost.`, async () => {
                await deleteProject(state.currentProject._id);
                navigateToProjects();
            });
        }
    });
}

// ============================================
// LOGOUT
// ============================================
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            // ✅ FIXED: Use relative path
            await api('POST', '/auth/logout');
        } catch (_) {}
        removeAuthToken();
        showToast('Logged out', 'info');
        setTimeout(() => {
            window.location.href = '../login.html';
        }, 500);
    });
}

// ============================================
// MOBILE SIDEBAR TOGGLE
// ============================================
const mobileToggle = document.getElementById('mobile-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('open');
    if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
}

function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}

if (mobileToggle) {
    mobileToggle.addEventListener('click', toggleSidebar);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
}

// Close sidebar on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeSidebar();
    }
});

// Close sidebar when a nav item is clicked (mobile)
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    });
});

// Close sidebar on window resize to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeSidebar();
    }
});

// ============================================
// MAKE COPY FUNCTION GLOBAL
// ============================================
window.copyToClipboard = copyToClipboard;

// ============================================
// INITIALIZATION
// ============================================
async function initDashboard() {
    try {
        // Check auth
        const token = getAuthToken();
        if (!token) {
            showToast('Please log in', 'error');
            window.location.href = '../login.html';
            return;
        }

        // Get user
        // ✅ FIXED: Use relative path
        const userResult = await api('GET', '/auth/me');
        if (userResult.success) {
            if (userEmail) userEmail.textContent = userResult.data.email;
            renderProfile(userResult.data);
        }

        // Load projects
        await loadProjects();

        // Show projects view
        navigateToProjects();

    } catch (error) {
        if (error.message.includes('Session expired')) {
            removeAuthToken();
            window.location.href = '../login.html';
        } else {
            showToast('Failed to load dashboard: ' + error.message, 'error');
        }
    }
}

// Start dashboard
initDashboard();

console.log('📊 Hollow dashboard ready');