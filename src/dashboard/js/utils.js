// ============================================
// API CLIENT
// ============================================

const API_BASE = 'https://hollow-3mbn.onrender.com/api';
let authToken = null;

export function setAuthToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem('hollow_token', token);
    } else {
        localStorage.removeItem('hollow_token');
    }
}

export function getAuthToken() {
    if (!authToken) {
        authToken = localStorage.getItem('hollow_token');
    }
    return authToken;
}

export function removeAuthToken() {
    authToken = null;
    localStorage.removeItem('hollow_token');
}

export async function api(method, path, data = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
    };

    try {
        const response = await fetch(`${API_BASE}${path}`, options);

        // Handle 401 Unauthorized
        if (response.status === 401) {
            removeAuthToken();
            // Don't redirect automatically, let the auth page handle it
            throw new Error('Session expired. Please log in again.');
        }

        const json = await response.json();

        if (!response.ok) {
            throw new Error(json.message || json.error || 'API error');
        }

        return json;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your connection.');
        }
        throw error;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }

    // Fallback
    return new Promise((resolve, reject) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            resolve();
        } catch (err) {
            reject(err);
        } finally {
            document.body.removeChild(textarea);
        }
    });
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

export function truncate(str, length = 30) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

export function getMethodColor(method) {
    const colors = {
        GET: '#0066ff',
        POST: '#00cc66',
        PUT: '#ffa500',
        PATCH: '#ffa500',
        DELETE: '#ff3333'
    };
    return colors[method] || '#888';
}

export function getMethodBadge(method) {
    return `<span class="method-badge method-${method.toLowerCase()}">${method}</span>`;
}

export function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

export function safeJsonParse(str) {
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
}

export function jsonStringify(obj) {
    try {
        return JSON.stringify(obj, null, 2);
    } catch {
        return '{}';
    }
}