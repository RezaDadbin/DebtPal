// public/loginBack.js

// --- Existing Functionality ---

// Password toggle for login page
document.querySelectorAll('.password-toggle').forEach(toggle => {
  if (toggle) {
    toggle.addEventListener('click', () => {
      const input = toggle.previousElementSibling;
      if (input) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        toggle.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
      }
    });
  }
});

// Smooth page transition to signup (for "Create an account" link)
document.querySelectorAll('a.create-account').forEach(link => {
  if (link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      document.body.classList.add('fade-out');
      setTimeout(() => {
        window.location.href = link.getAttribute('href'); // Navigates to /signup
      }, 400);
    });
  }
});

// Logo fade-in effect
const logo = document.querySelector('.logo');
if (logo) {
  logo.style.display = 'none';
  requestAnimationFrame(() => {
    logo.style.display = 'inline-block';
    logo.style.opacity = '0';
    setTimeout(() => { logo.style.transition = 'opacity 0.5s'; logo.style.opacity = '1'; }, 50);
  });
}

// Apply dark theme if it was previously selected and saved in localStorage
// This assumes your themeToggle.js (linked in login.html) might handle the icon update comprehensively
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
  const themeIconOnLoad = document.getElementById('themeIcon');
  if (themeIconOnLoad) themeIconOnLoad.textContent = '☀️';
}


// --- NEW: Login Form Submission Logic ---
const loginButton = document.getElementById('loginBtn');
const loginFormMessagesDiv = document.getElementById('loginFormMessages');

if (loginButton) {
  loginButton.addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent default form submission if it's part of a <form> element

    if (loginFormMessagesDiv) {
      loginFormMessagesDiv.textContent = ''; // Clear previous messages
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : ''; // Don't trim password

    // Basic client-side validation
    if (!email || !password) {
      if (loginFormMessagesDiv) {
        loginFormMessagesDiv.textContent = 'Please enter both email and password.';
      } else {
        alert('Please enter both email and password.');
      }
      return;
    }

    const loginData = {
      email: email,
      password: password
    };

    try {
      // Disable button to prevent multiple submissions
      loginButton.disabled = true;
      loginButton.textContent = 'Logging In...';

      const response = await debtpalFetch('/api/auth/login/', { // Our backend login API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const result = await response.json(); // Get the JSON response from the server

      if (response.ok) { // HTTP status 200-299
        // Login successful! Backend validated credentials.
        // For now, we just redirect. Later we'll handle sessions/tokens.
        window.location.href = '/dashboard'; // Redirect to the main application page

      } else {
        // Login failed (e.g., invalid credentials, user not found - backend sent an error)
        if (loginFormMessagesDiv) {
          loginFormMessagesDiv.textContent = result.message || 'Login failed. Please try again.';
        } else {
          alert(result.message || 'Login failed. Please try again.');
        }
        loginButton.disabled = false;
        loginButton.textContent = 'Log In';
      }
    } catch (error) {
      // Network error or other issue with the fetch itself
      console.error('Error during login fetch:', error);
      if (loginFormMessagesDiv) {
        loginFormMessagesDiv.textContent = 'Login request failed. Please check your connection and try again.';
      } else {
        alert('Login request failed. Please check your connection and try again.');
      }
      loginButton.disabled = false;
      loginButton.textContent = 'Log In';
    }
  });
}