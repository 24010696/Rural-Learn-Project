// Check login status and show/hide logout button
function checkAuth() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (loggedInUser) {
      logoutBtn.style.display = 'block';
      logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
      });
    } else {
      logoutBtn.style.display = 'none';
    }
  }
}

// Protect routes that require authentication
function protectRoute() {
  if (!sessionStorage.getItem('loggedInUser')) {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = 'login.html';
  }
}

// Call this when DOM is loaded
document.addEventListener('DOMContentLoaded', checkAuth);
