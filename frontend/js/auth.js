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
    
    static async googleAuth(credential) {
        try {
            const response = await fetch(`${this.API_BASE}/google/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credential: credential
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
            console.error('Google auth API error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }
}

// Google OAuth Handler
class GoogleAuth {
    static clientId = '20168939763-v261is7435m1kbu4gbtffvvr3nf5ut09.apps.googleusercontent.com';
    
    static initialize() {
        console.log('=== GOOGLE AUTH INITIALIZATION STARTED ===');
        
        // Check if Google API is loaded
        if (typeof google === 'undefined') {
            console.error('❌ Google API not loaded');
            this.showFallbackButtons();
            return;
        }
        
        // Check if google.accounts.id exists
        if (!google.accounts || !google.accounts.id) {
            console.error('❌ Google accounts API not available');
            this.showFallbackButtons();
            return;
        }
        
        try {
            console.log('🔄 Initializing Google OAuth with Client ID:', this.clientId);
            
            google.accounts.id.initialize({
                client_id: this.clientId,
                callback: this.handleCredentialResponse.bind(this),
                auto_select: false,
                cancel_on_tap_outside: true
            });
            
            console.log('✅ Google OAuth initialized successfully');
            this.renderButtons();
            
        } catch (error) {
            console.error('❌ Google OAuth initialization failed:', error);
            this.showFallbackButtons();
        }
    }
    
    static renderButtons() {
        try {
            console.log('🎨 Rendering Google buttons...');
            
            const googleSignIn = document.getElementById('googleSignIn');
            const googleSignUp = document.getElementById('googleSignUp');
            
            if (googleSignIn) {
                console.log('Found Google Sign In element');
                googleSignIn.innerHTML = '';
                google.accounts.id.renderButton(googleSignIn, {
                    theme: 'outline',
                    size: 'large',
                    width: 400,
                    text: 'continue_with'
                });
                console.log('✅ Google Sign In button rendered');
            }
            
            if (googleSignUp) {
                console.log('Found Google Sign Up element');
                googleSignUp.innerHTML = '';
                google.accounts.id.renderButton(googleSignUp, {
                    theme: 'outline',
                    size: 'large',
                    width: 400,
                    text: 'signup_with'
                });
                console.log('✅ Google Sign Up button rendered');
            }
            
        } catch (error) {
            console.error('❌ Google button rendering failed:', error);
            this.showFallbackButtons();
        }
    }
    
    static async handleCredentialResponse(response) {
        console.log('🔐 Google OAuth response received');
        
        // Show loading state
        const buttons = document.querySelectorAll('.btn-google');
        buttons.forEach(btn => {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in with Google...';
            btn.disabled = true;
        });
        
        try {
            console.log('📡 Sending credential to backend...');
            const result = await Auth.googleAuth(response.credential);
            
            if (result.success) {
                console.log('✅ Google authentication successful!');
                showSuccess('Welcome! Google authentication successful.');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                console.error('❌ Backend authentication failed:', result.error);
                showError('Google login failed: ' + result.error);
                this.resetButtons();
            }
        } catch (error) {
            console.error('❌ Authentication error:', error);
            showError('Login failed. Please try again.');
            this.resetButtons();
        }
    }
    
    static resetButtons() {
        setTimeout(() => {
            this.renderButtons();
        }, 3000);
    }
    
    static showFallbackButtons() {
        console.log('🔄 Showing fallback Google buttons');
        const googleButtons = document.querySelectorAll('.btn-google');
        
        googleButtons.forEach(btn => {
            btn.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 12px 16px; border: 1px solid #dadce0; border-radius: 4px; background: white; color: #3c4043; cursor: pointer;">
                    <i class="fab fa-google" style="color: #4285F4;"></i>
                    <span>${btn.id.includes('SignUp') ? 'Sign up with Google' : 'Continue with Google'}</span>
                </div>
            `;
            btn.onclick = (e) => {
                e.preventDefault();
                showError('Google Sign In is not available. Please check:<br>1. Google APIs are enabled<br>2. Client ID is correct<br>3. Authorized origins are set');
                console.error('Google OAuth Debug Info:');
                console.error('- Client ID:', this.clientId);
                console.error('- Google API loaded:', typeof google !== 'undefined');
                console.error('- Google accounts:', typeof google?.accounts);
            };
        });
    }
}

// Initialize Google OAuth
function initializeGoogleOAuth() {
    console.log('🚀 STARTING GOOGLE OAUTH SETUP...');
    
    // Method 1: Check if already loaded
    if (typeof google !== 'undefined') {
        console.log('✅ Google API already loaded');
        GoogleAuth.initialize();
        return;
    }
    
    // Method 2: Load Google API script
    console.log('📥 Loading Google OAuth script...');
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
        console.log('✅ Google OAuth script loaded successfully');
        setTimeout(() => {
            GoogleAuth.initialize();
        }, 1000);
    };
    script.onerror = (error) => {
        console.error('❌ FAILED to load Google OAuth script:', error);
        GoogleAuth.showFallbackButtons();
    };
    
    document.head.appendChild(script);
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Content Loaded - Initializing auth page...');
    initializeAuthPage();
});

function initializeAuthPage() {
    // Check if user is already authenticated
    if (Auth.isAuthenticated() && window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    console.log('🔧 Initializing authentication page...');
    
    // Initialize Google OAuth
    initializeGoogleOAuth();
    
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
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitBtn.disabled = true;
    
    const result = await Auth.loginUser(email, password);
    
    if (result.success) {
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
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;
    
    const result = await Auth.registerUser(formData);
    
    if (result.success) {
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
        errorElement.innerHTML = message;
        errorElement.style.display = 'block';
        errorElement.style.background = 'rgba(239, 68, 68, 0.1)';
        errorElement.style.borderColor = 'rgba(239, 68, 68, 0.2)';
        errorElement.style.color = 'var(--error)';
        
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
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
        }, 3000);
    }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    if (Auth.isAuthenticated() && window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
});