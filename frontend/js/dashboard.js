// Dashboard functionality
class Dashboard {
    static API_BASE = 'http://127.0.0.1:8000/api';
    
    static init() {
        this.checkAuthentication();
        this.loadUserData();
        this.setupEventListeners();
        this.loadDashboardData();
        this.setupThemeToggle();
    }
    
    static checkAuthentication() {
        if (!Auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
    }
    
    static loadUserData() {
        const user = Auth.getUser();
        if (user) {
            document.getElementById('userName').textContent = user.first_name || user.username;
            document.getElementById('userFullName').textContent = `${user.first_name} ${user.last_name}` || user.username;
            document.getElementById('userType').textContent = user.user_type === 'worker' ? 'Freelancer' : 'Employer';
            
            // Update user avatar with actual data
            const avatars = document.querySelectorAll('.user-avatar, .user-avatar-large');
            avatars.forEach(avatar => {
                avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name + ' ' + user.last_name)}&background=6366f1&color=fff`;
            });
        }
    }
    
    static setupEventListeners() {
        // Navigation
        const navItems = document.querySelectorAll('.nav-item, .nav-link');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.showPage(page);
            });
        });
        
        // Logout
        const logoutBtn = document.querySelector('[onclick="Auth.logout()"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Auth.logout();
            });
        }
        
        // Apply job buttons
        this.setupJobApplications();
    }
    
    static setupThemeToggle() {
        const themeBtn = document.getElementById('themeBtn');
        if (!themeBtn) return;
        
        const themeIcon = themeBtn.querySelector('i');
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(themeIcon, savedTheme);
        
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateThemeIcon(themeIcon, newTheme);
        });
    }
    
    static updateThemeIcon(iconElement, theme) {
        if (theme === 'dark') {
            iconElement.className = 'fas fa-sun';
        } else {
            iconElement.className = 'fas fa-moon';
        }
    }
    
    static setupJobApplications() {
        // Delegate job application clicks since jobs are loaded dynamically
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('apply-job-btn') || 
                e.target.closest('.apply-job-btn')) {
                e.preventDefault();
                const jobCard = e.target.closest('.job-card');
                const jobTitle = jobCard?.querySelector('h3')?.textContent || 'Unknown Job';
                this.applyForJob(jobTitle);
            }
        });
    }
    
    static showPage(page) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(p => p.style.display = 'none');
        
        // Remove active class from all nav items
        const navItems = document.querySelectorAll('.nav-item, .nav-link');
        navItems.forEach(item => item.classList.remove('active'));
        
        // Show selected page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.style.display = 'block';
        }
        
        // Add active class to clicked nav item
        const activeNav = document.querySelector(`[data-page="${page}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
        
        // Load page-specific data
        this.loadPageData(page);
    }
    
    static async loadDashboardData() {
        try {
            // Show loading states
            this.showLoadingStates();
            
            // Load user profile for trust score
            await this.loadUserProfile();
            
            // Load recommended jobs
            await this.loadRecommendedJobs();
            
            // Load recent activity
            await this.loadRecentActivity();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }
    
    static showLoadingStates() {
        const jobsContainer = document.getElementById('recommendedJobs');
        if (jobsContainer) {
            jobsContainer.innerHTML = '<div class="loading">Loading recommended jobs...</div>';
        }
        
        const activityContainer = document.getElementById('recentActivity');
        if (activityContainer) {
            activityContainer.innerHTML = '<div class="loading">Loading recent activity...</div>';
        }
    }
    
    static async loadUserProfile() {
        try {
            const response = await fetch(`${this.API_BASE}/auth/profile/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.updateUserStats(data.user);
            } else {
                console.warn('Could not load user profile, using default values');
                this.updateUserStats({ trust_score: 75, level: 1, xp_points: 0 });
            }
            
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.updateUserStats({ trust_score: 75, level: 1, xp_points: 0 });
        }
    }
    
    static updateUserStats(userData) {
        // Update trust score with animation
        this.animateValue('trustScore', 0, userData.trust_score || 75, 1000);
        this.animateValue('trustScoreCard', 0, userData.trust_score || 75, 1000);
        
        // Update other stats (you'll need to create API endpoints for these)
        document.getElementById('activeJobs').textContent = '3';
        document.getElementById('completedJobs').textContent = '12';
        document.getElementById('totalEarnings').textContent = '$2,450';
        
        // Update trust score circle visual
        this.updateTrustScoreCircle(userData.trust_score || 75);
    }
    
    static animateValue(elementId, start, end, duration) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    
    static updateTrustScoreCircle(score) {
        const circle = document.querySelector('.score-circle');
        if (circle) {
            circle.style.background = `conic-gradient(var(--primary) ${score}%, var(--bg-secondary) ${score}%)`;
        }
    }
    
    static async loadRecommendedJobs() {
        const jobsContainer = document.getElementById('recommendedJobs');
        if (!jobsContainer) return;
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const sampleJobs = [
                {
                    id: 1,
                    title: "Frontend Developer Needed",
                    description: "Build responsive React components for e-commerce platform. Experience with modern JavaScript frameworks required.",
                    budget: "$500-$1000",
                    skills: ["React", "JavaScript", "CSS", "HTML5"],
                    type: "Fixed Price",
                    duration: "2-4 weeks",
                    proposals: 12
                },
                {
                    id: 2,
                    title: "Mobile App UI/UX Design",
                    description: "Design modern UI for fitness tracking mobile application. Must provide wireframes and prototypes.",
                    budget: "$300-$700",
                    skills: ["Figma", "UI/UX", "Mobile Design", "Prototyping"],
                    type: "Hourly",
                    duration: "1-2 months",
                    proposals: 8
                },
                {
                    id: 3,
                    title: "Django Backend API Development",
                    description: "Create REST APIs for SaaS platform with PostgreSQL. Experience with Django REST Framework required.",
                    budget: "$800-$1500",
                    skills: ["Django", "Python", "REST API", "PostgreSQL"],
                    type: "Fixed Price",
                    duration: "3-6 weeks",
                    proposals: 5
                },
                {
                    id: 4,
                    title: "Full Stack Web Application",
                    description: "Develop complete web application with React frontend and Node.js backend. Database design experience preferred.",
                    budget: "$1200-$2500",
                    skills: ["React", "Node.js", "MongoDB", "Express"],
                    type: "Fixed Price",
                    duration: "1-2 months",
                    proposals: 15
                },
                {
                    id: 5,
                    title: "WordPress E-commerce Site",
                    description: "Build WooCommerce website with custom theme development. Payment gateway integration required.",
                    budget: "$400-$800",
                    skills: ["WordPress", "PHP", "WooCommerce", "CSS"],
                    type: "Hourly",
                    duration: "2-3 weeks",
                    proposals: 20
                },
                {
                    id: 6,
                    title: "Data Analysis Dashboard",
                    description: "Create interactive dashboard for business metrics using Python and visualization libraries.",
                    budget: "$600-$1200",
                    skills: ["Python", "Pandas", "Matplotlib", "Data Analysis"],
                    type: "Fixed Price",
                    duration: "3-5 weeks",
                    proposals: 7
                }
            ];
            
            jobsContainer.innerHTML = sampleJobs.map(job => `
                <div class="job-card" data-job-id="${job.id}">
                    <div class="job-header">
                        <h3>${job.title}</h3>
                        <span class="job-type">${job.type}</span>
                    </div>
                    <p class="job-description">${job.description}</p>
                    <div class="job-meta">
                        <span class="job-duration"><i class="fas fa-clock"></i> ${job.duration}</span>
                        <span class="job-proposals"><i class="fas fa-users"></i> ${job.proposals} proposals</span>
                    </div>
                    <div class="job-skills">
                        ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                    <div class="job-footer">
                        <span class="job-budget">${job.budget}</span>
                        <button class="btn btn-primary btn-sm apply-job-btn">
                            <i class="fas fa-paper-plane"></i> Apply Now
                        </button>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading jobs:', error);
            jobsContainer.innerHTML = '<div class="error">Failed to load recommended jobs. Please try again later.</div>';
        }
    }
    
    static async loadRecentActivity() {
        const activityContainer = document.getElementById('recentActivity');
        if (!activityContainer) return;
        
        try {
            const sampleActivities = [
                {
                    icon: 'fa-user-plus',
                    message: 'Welcome to WorkSphere! Your AI Career Passport is ready.',
                    time: 'Just now',
                    type: 'success'
                },
                {
                    icon: 'fa-briefcase',
                    message: 'New job recommendation: Frontend Developer position matches your skills.',
                    time: '5 minutes ago',
                    type: 'info'
                },
                {
                    icon: 'fa-star',
                    message: 'Your trust score has been updated based on your profile completion.',
                    time: '1 hour ago',
                    type: 'success'
                },
                {
                    icon: 'fa-bell',
                    message: 'Complete your profile to get better job matches and increase your trust score.',
                    time: '2 hours ago',
                    type: 'warning'
                }
            ];
            
            activityContainer.innerHTML = sampleActivities.map(activity => `
                <div class="activity-item activity-${activity.type}">
                    <i class="fas ${activity.icon}"></i>
                    <div class="activity-content">
                        <p>${activity.message}</p>
                        <span class="activity-time">${activity.time}</span>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading activity:', error);
            activityContainer.innerHTML = '<div class="error">Failed to load recent activity</div>';
        }
    }
    
    static async applyForJob(jobTitle) {
        try {
            // Show loading state
            const applyButtons = document.querySelectorAll('.apply-job-btn');
            applyButtons.forEach(btn => {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';
            });
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Show success message
            this.showSuccess(`Successfully applied for "${jobTitle}"!`);
            
            // Reset buttons after delay
            setTimeout(() => {
                applyButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Apply Now';
                });
            }, 2000);
            
            // Add to recent activity
            this.addActivity({
                icon: 'fa-paper-plane',
                message: `You applied for "${jobTitle}"`,
                time: 'Just now',
                type: 'success'
            });
            
        } catch (error) {
            console.error('Error applying for job:', error);
            this.showError('Failed to apply for job. Please try again.');
            
            // Reset buttons
            const applyButtons = document.querySelectorAll('.apply-job-btn');
            applyButtons.forEach(btn => {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Apply Now';
            });
        }
    }
    
    static addActivity(activity) {
        const activityContainer = document.getElementById('recentActivity');
        if (!activityContainer) return;
        
        const activityElement = document.createElement('div');
        activityElement.className = `activity-item activity-${activity.type}`;
        activityElement.innerHTML = `
            <i class="fas ${activity.icon}"></i>
            <div class="activity-content">
                <p>${activity.message}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        `;
        
        // Add to top of activity list
        activityContainer.insertBefore(activityElement, activityContainer.firstChild);
        
        // Limit to 10 activities
        const activities = activityContainer.querySelectorAll('.activity-item');
        if (activities.length > 10) {
            activities[activities.length - 1].remove();
        }
    }
    
    static loadPageData(page) {
        switch (page) {
            case 'jobs':
                this.loadJobsPage();
                break;
            case 'profile':
                this.loadProfilePage();
                break;
            case 'my-jobs':
                this.loadMyJobsPage();
                break;
            case 'messages':
                this.loadMessagesPage();
                break;
            case 'earnings':
                this.loadEarningsPage();
                break;
            case 'dashboard':
                this.loadDashboardData();
                break;
        }
    }
    
    static loadJobsPage() {
        console.log('Loading jobs page...');
        // Implement jobs page loading
        const jobsPage = document.getElementById('jobs-page');
        if (jobsPage) {
            jobsPage.innerHTML = `
                <div class="page-header">
                    <h1>Find Jobs</h1>
                    <p>AI-powered job matching just for you</p>
                </div>
                <div class="jobs-filters">
                    <div class="filter-section">
                        <h3>Filters</h3>
                        <div class="filter-options">
                            <select class="filter-select">
                                <option>All Categories</option>
                                <option>Web Development</option>
                                <option>Mobile Development</option>
                                <option>Design</option>
                                <option>Writing</option>
                            </select>
                            <select class="filter-select">
                                <option>Any Budget</option>
                                <option>Under $500</option>
                                <option>$500-$1000</option>
                                <option>$1000+</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="jobs-list" id="all-jobs-list">
                    <div class="loading">Loading all jobs...</div>
                </div>
            `;
        }
    }
    
    static loadProfilePage() {
        console.log('Loading profile page...');
        const user = Auth.getUser();
        const profilePage = document.getElementById('profile-page');
        if (profilePage && user) {
            profilePage.innerHTML = `
                <div class="page-header">
                    <h1>My Profile</h1>
                    <p>Manage your AI Career Passport</p>
                </div>
                <div class="profile-section">
                    <div class="profile-card">
                        <h3>Personal Information</h3>
                        <div class="profile-info">
                            <div class="info-item">
                                <label>Full Name</label>
                                <span>${user.first_name} ${user.last_name}</span>
                            </div>
                            <div class="info-item">
                                <label>Email</label>
                                <span>${user.email}</span>
                            </div>
                            <div class="info-item">
                                <label>Username</label>
                                <span>${user.username}</span>
                            </div>
                            <div class="info-item">
                                <label>User Type</label>
                                <span>${user.user_type === 'worker' ? 'Freelancer' : 'Employer'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-card">
                        <h3>AI Career Passport</h3>
                        <div class="passport-stats">
                            <div class="passport-stat">
                                <span class="stat-value">${user.trust_score || 75}</span>
                                <span class="stat-label">Trust Score</span>
                            </div>
                            <div class="passport-stat">
                                <span class="stat-value">${user.level || 1}</span>
                                <span class="stat-label">Level</span>
                            </div>
                            <div class="passport-stat">
                                <span class="stat-value">${user.xp_points || 0}</span>
                                <span class="stat-label">XP Points</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    static loadMyJobsPage() {
        console.log('Loading my jobs page...');
        // Implement my jobs page
    }
    
    static loadMessagesPage() {
        console.log('Loading messages page...');
        // Implement messages page
    }
    
    static loadEarningsPage() {
        console.log('Loading earnings page...');
        // Implement earnings page
    }
    
    static showSuccess(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
    
    static showError(message) {
        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--error);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    Dashboard.init();
});

// Export for global access
window.Dashboard = Dashboard;