// Authentication functionality
class Auth {
    static API_BASE = 'http://127.0.0.1:8000/api/auth';
    
    static isAuthenticated() {
        return localStorage.getItem('token') !== null;
    }
    
    static login(token, userData) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
    }
    
    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
    
    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
    
    static async loginUser(email, password) {
        try {
            const response = await fetch(`${this.API_BASE}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.login(data.tokens.access, data.user);
                return { success: true, data };
            } else {
                return { success: false, error: data.error || data.detail || 'Login failed' };
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    }
    
    static async registerUser(userData) {
        try {
            const response = await fetch(`${this.API_BASE}/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.login(data.tokens.access, data.user);
                return { success: true, data };
            } else {
                // Handle different error formats
                const errorMsg = data.error || data.detail || 
                               (data.username && data.username[0]) ||
                               (data.email && data.email[0]) ||
                               (data.password && data.password[0]) ||
                               'Registration failed';
                return { success: false, error: errorMsg };
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    }
    
    static async googleAuth(accessToken) {
        try {
            const response = await fetch(`${this.API_BASE}/google/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    access_token: accessToken
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.login(data.tokens.access, data.user);
                return { success: true, data };
            } else {
                return { success: false, error: data.error || data.detail || 'Google authentication failed' };
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    }
}

// Google OAuth Handler
class GoogleAuth {
    static clientId = '20168939763-v261is7435m1kbu4gbtfvvr3nf5ut09.apps.googleusercontent.com';
    
    static initialize() {
        if (typeof google === 'undefined') {
            console.warn('Google API not loaded');
            return;
        }
        
        google.accounts.id.initialize({
            client_id: this.clientId,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true,
        });
        
        // Render Google Sign In button
        this.renderButton();
    }
    
    static renderButton() {
        if (typeof google === 'undefined') return;
        
        const googleSignIn = document.getElementById('googleSignIn');
        const googleSignUp = document.getElementById('googleSignUp');
        
        if (googleSignIn) {
            google.accounts.id.renderButton(googleSignIn, {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: 'continue_with',
                shape: 'rectangular'
            });
        }
        
        if (googleSignUp) {
            google.accounts.id.renderButton(googleSignUp, {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: 'signup_with',
                shape: 'rectangular'
            });
        }
        
        // Also show One Tap prompt
        google.accounts.id.prompt(notification => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // Continue with normal flow
            }
        });
    }
    
    static async handleCredentialResponse(response) {
        console.log('Google auth response received');
        
        const submitBtn = document.querySelector('.btn-google');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
            submitBtn.disabled = true;
        }
        
        try {
            // Get the access token from the credential response
            const accessToken = response.credential;
            
            // Send to our backend
            const result = await Auth.googleAuth(accessToken);
            
            if (result.success) {
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                showError(result.error);
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Google auth error:', error);
            showError('Authentication failed. Please try again.');
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }
    
    static manualSignIn() {
        if (typeof google === 'undefined') {
            showError('Google Sign In not available. Please check your connection.');
            return;
        }
        
        google.accounts.id.prompt();
    }
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthPage();
});

function initializeAuthPage() {
    // Check if user is already authenticated
    if (Auth.isAuthenticated() && window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Initialize Google OAuth
    setTimeout(() => {
        GoogleAuth.initialize();
    }, 1000);
    
    // Form toggling
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const loginCard = document.querySelector('.auth-card:not(.signup-card)');
    const signupCard = document.querySelector('.signup-card');
    
    if (showSignup && showLogin) {
        showSignup.addEventListener('click', function(e) {
            e.preventDefault();
            if (loginCard) loginCard.style.display = 'none';
            if (signupCard) signupCard.style.display = 'block';
        });
        
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            if (signupCard) signupCard.style.display = 'none';
            if (loginCard) loginCard.style.display = 'block';
        });
    }
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        
        // Real-time password validation
        const passwordInput = document.getElementById('signupPassword');
        const confirmInput = document.getElementById('confirmPassword');
        
        if (passwordInput && confirmInput) {
            confirmInput.addEventListener('input', validatePasswords);
        }
    }
    
    // Manual Google buttons as fallback
    const googleSignIn = document.getElementById('googleSignIn');
    const googleSignUp = document.getElementById('googleSignUp');
    
    if (googleSignIn && !googleSignIn.querySelector('div[role="button"]')) {
        googleSignIn.addEventListener('click', () => GoogleAuth.manualSignIn());
    }
    
    if (googleSignUp && !googleSignUp.querySelector('div[role="button"]')) {
        googleSignUp.addEventListener('click', () => GoogleAuth.manualSignIn());
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitBtn.disabled = true;
    
    // Attempt login
    const result = await Auth.loginUser(email, password);
    
    if (result.success) {
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        showError(result.error);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const formData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        email: document.getElementById('signupEmail').value,
        username: document.getElementById('username').value,
        user_type: document.getElementById('userType').value,
        password: document.getElementById('signupPassword').value
    };
    
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validation
    if (!formData.first_name || !formData.last_name || !formData.email || 
        !formData.username || !formData.user_type || !formData.password) {
        showError('Please fill in all fields');
        return;
    }
    
    if (formData.password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    if (formData.password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (!agreeTerms) {
        showError('Please agree to the Terms of Service and Privacy Policy');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;
    
    // Attempt registration
    const result = await Auth.registerUser(formData);
    
    if (result.success) {
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        showError(result.error);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function validatePasswords() {
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    
    if (confirmPassword && password !== confirmPassword) {
        confirmInput.style.borderColor = 'var(--error)';
    } else if (confirmPassword) {
        confirmInput.style.borderColor = 'var(--success)';
    } else {
        confirmInput.style.borderColor = 'var(--border)';
    }
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        // Fallback alert
        alert(message);
    }
}

function showSuccess(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.background = 'rgba(16, 185, 129, 0.1)';
        errorElement.style.borderColor = 'rgba(16, 185, 129, 0.2)';
        errorElement.style.color = 'var(--success)';
        errorElement.style.display = 'block';
        
        setTimeout(() => {
            errorElement.style.display = 'none';
            errorElement.style.background = '';
            errorElement.style.borderColor = '';
            errorElement.style.color = '';
        }, 3000);
    }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    if (Auth.isAuthenticated() && window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
});