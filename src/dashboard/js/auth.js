// src/dashboard/js/auth.js
import { api, setAuthToken } from './utils.js';

// DOM Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

// Login form elements
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const loginEmailError = document.getElementById('login-email-error');
const loginPasswordError = document.getElementById('login-password-error');

// Signup form elements
const signupName = document.getElementById('signup-name');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupConfirm = document.getElementById('signup-confirm');
const signupTerms = document.getElementById('signup-terms');
const signupBtn = document.getElementById('signup-btn');
const signupError = document.getElementById('signup-error');
const signupNameError = document.getElementById('signup-name-error');
const signupEmailError = document.getElementById('signup-email-error');
const signupPasswordError = document.getElementById('signup-password-error');
const signupConfirmError = document.getElementById('signup-confirm-error');
const signupTermsError = document.getElementById('signup-terms-error');
const passwordHint = document.getElementById('password-hint');

// ============================================
// HELPERS
// ============================================

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clearFieldError(input, errorElement) {
    input.classList.remove('error');
    errorElement.textContent = '';
}

function setFieldError(input, errorElement, message) {
    input.classList.add('error');
    errorElement.textContent = message;
}

function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-group input').forEach(el => el.classList.remove('error'));
    if (loginError) loginError.textContent = '';
    if (signupError) signupError.textContent = '';
}

// ============================================
// LOGIN
// ============================================

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        let hasError = false;

        if (!email || !isValidEmail(email)) {
            setFieldError(loginEmail, loginEmailError, 'Please enter a valid email address');
            hasError = true;
        }

        if (!password || password.length < 6) {
            setFieldError(loginPassword, loginPasswordError, 'Password must be at least 6 characters');
            hasError = true;
        }

        if (hasError) return;

        loginBtn.disabled = true;
        loginBtn.classList.add('loading');
        loginBtn.textContent = '';

        try {
            const result = await api('POST', '/auth/login', { email, password });

            if (result.success && result.data.token) {
                setAuthToken(result.data.token);
                window.location.href = '/dashboard/dashboard.html';
            } else {
                loginError.textContent = 'Login failed. Please try again.';
            }
        } catch (error) {
            if (error.message.includes('Invalid email or password')) {
                loginError.textContent = 'Invalid email or password';
            } else {
                loginError.textContent = error.message || 'Login failed. Please try again.';
            }
        } finally {
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            loginBtn.textContent = 'Sign In';
        }
    });

    loginEmail.addEventListener('input', () => {
        clearFieldError(loginEmail, loginEmailError);
        if (loginError) loginError.textContent = '';
    });

    loginPassword.addEventListener('input', () => {
        clearFieldError(loginPassword, loginPasswordError);
        if (loginError) loginError.textContent = '';
    });
}

// ============================================
// SIGNUP
// ============================================

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        const name = signupName.value.trim();
        const email = signupEmail.value.trim();
        const password = signupPassword.value;
        const confirm = signupConfirm.value;
        const termsAccepted = signupTerms.checked;

        let hasError = false;

        if (!email || !isValidEmail(email)) {
            setFieldError(signupEmail, signupEmailError, 'Please enter a valid email address');
            hasError = true;
        }

        if (!password || password.length < 6) {
            setFieldError(signupPassword, signupPasswordError, 'Password must be at least 6 characters');
            hasError = true;
        }

        if (!confirm || confirm !== password) {
            setFieldError(signupConfirm, signupConfirmError, 'Passwords do not match');
            hasError = true;
        }

        if (!termsAccepted) {
            signupTermsError.textContent = 'You must agree to the Terms of Service';
            hasError = true;
        }

        if (hasError) return;

        signupBtn.disabled = true;
        signupBtn.classList.add('loading');
        signupBtn.textContent = '';

        try {
            const result = await api('POST', '/auth/signup', {
                name: name || undefined,
                email,
                password
            });

            if (result.success && result.data.token) {
                setAuthToken(result.data.token);
                window.location.href = '/dashboard/dashboard.html';
            } else {
                signupError.textContent = 'Signup failed. Please try again.';
            }
        } catch (error) {
            if (error.message.includes('already exists')) {
                signupError.textContent = 'An account with this email already exists';
            } else {
                signupError.textContent = error.message || 'Signup failed. Please try again.';
            }
        } finally {
            signupBtn.disabled = false;
            signupBtn.classList.remove('loading');
            signupBtn.textContent = 'Create Account';
        }
    });

    signupName.addEventListener('input', () => {
        clearFieldError(signupName, signupNameError);
        if (signupError) signupError.textContent = '';
    });

    signupEmail.addEventListener('input', () => {
        clearFieldError(signupEmail, signupEmailError);
        if (signupError) signupError.textContent = '';
    });

    signupPassword.addEventListener('input', () => {
        clearFieldError(signupPassword, signupPasswordError);
        if (signupError) signupError.textContent = '';

        const val = signupPassword.value;
        if (val.length === 0) {
            passwordHint.textContent = 'Must be at least 6 characters';
            passwordHint.style.color = '#555';
        } else if (val.length < 6) {
            passwordHint.textContent = `Need ${6 - val.length} more character${6 - val.length > 1 ? 's' : ''}`;
            passwordHint.style.color = '#ff3333';
        } else {
            passwordHint.textContent = '✓ Password meets requirements';
            passwordHint.style.color = '#00cc66';
        }

        clearFieldError(signupConfirm, signupConfirmError);
    });

    signupConfirm.addEventListener('input', () => {
        clearFieldError(signupConfirm, signupConfirmError);
        if (signupError) signupError.textContent = '';
    });

    signupTerms.addEventListener('change', () => {
        signupTermsError.textContent = '';
    });
}

console.log('🔐 Hollow auth ready');