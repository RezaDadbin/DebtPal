// public/signupBack.js

// --- Existing Functionality (Password Toggle, Transitions, Logo, Theme) ---

// Password toggle for signup fields
document.querySelectorAll('.password-toggle').forEach(toggle => {
  if (toggle) { // Added null check for robustness
    toggle.addEventListener('click', () => {
      const input = toggle.previousElementSibling;
      if (input) { // Added null check
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        toggle.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
      }
    });
  }
});

// Smooth page transition to login
document.querySelectorAll('a.back-to-login').forEach(link => {
  if (link) { // Added null check
    link.addEventListener('click', function(e) {
      e.preventDefault();
      document.body.classList.add('fade-out');
      setTimeout(() => {
        window.location.href = link.getAttribute('href'); // Navigates to '/' (login page route)
      }, 400);
    });
  }
});

// Logo re-render effect
const logo = document.querySelector('.logo');
if (logo) {
  logo.style.display = 'none'; // Hide initially
  requestAnimationFrame(() => {
    logo.style.display = 'inline-block'; // Show again in the next frame
    // Optional: Add a small animation for fade-in
    logo.style.opacity = '0';
    setTimeout(() => { logo.style.transition = 'opacity 0.5s'; logo.style.opacity = '1'; }, 50);
  });
}

// Apply dark theme if it was previously selected and saved in localStorage
// This assumes your themeToggle.js might handle more comprehensive theme application
// or that this page needs its own initial check.
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
  const themeIconOnLoad = document.getElementById('themeIcon'); // As in your original file
  if (themeIconOnLoad) themeIconOnLoad.textContent = '☀️';
}


// --- NEW: Signup Form Submission Logic ---
const signupButton = document.getElementById('signupBtn');
// It's better to get the form element if your button is type="submit"
// const signupForm = document.querySelector('form'); // Or give your form an ID: document.getElementById('signupForm');

if (signupButton) {
  signupButton.addEventListener('click', async (event) => {
    // If your button is type="submit" inside a <form> tag, prevent default.
    // If it's just type="button", this isn't strictly necessary but doesn't hurt.
    event.preventDefault();

    // Clear previous messages
    clearErrorMessages(); // Clears specific field errors
    const formMessagesDiv = document.getElementById('formMessages'); // For general form messages
    if (formMessagesDiv) formMessagesDiv.textContent = '';


    // Get form values
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('new-email'); // Matches your signup.html
    const passwordInput = document.getElementById('new-password'); // Matches your signup.html
    const repeatPasswordInput = document.getElementById('repeat-password'); // Matches your signup.html

    // Ensure elements exist before trying to get their values
    const username = usernameInput ? usernameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : ''; // Don't trim password leading/trailing spaces
    const repeatPassword = repeatPasswordInput ? repeatPasswordInput.value : '';

    // Client-Side Validation
    let isValid = true;
    if (!usernameInput || !username) { // Check if input element exists and has value
      displayErrorMessage('usernameError', 'Username is required.');
      isValid = false;
    }
    if (!emailInput || !email) {
      displayErrorMessage('emailError', 'Email is required.');
      isValid = false;
    } else if (email && !/\S+@\S+\.\S+/.test(email)) { // Basic email format check
        displayErrorMessage('emailError', 'Please enter a valid email address.');
        isValid = false;
    }
    if (!passwordInput || !password) {
      displayErrorMessage('passwordError', 'Password is required.');
      isValid = false;
    } else if (password.length < 6) { // Matching potential server-side validation
        displayErrorMessage('passwordError', 'Password must be at least 6 characters long.');
        isValid = false;
    }
    if (!repeatPasswordInput || password !== repeatPassword) {
      displayErrorMessage('repeatPasswordError', 'Passwords do not match.');
      isValid = false;
    }

    if (!isValid) {
      return; // Stop if client-side validation fails
    }

    // Prepare data for the API
    const signupData = {
      username: username,
      email: email,
      password: password
    };

    try {
      // Disable button to prevent multiple submissions
      signupButton.disabled = true;
      signupButton.textContent = 'Signing Up...';


      const response = await debtpalFetch('/api/auth/signup/', { // Our backend API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(signupData)
      });

      const result = await response.json(); // Try to parse JSON regardless of status

      if (response.ok) { // response.ok is true if status is 200-299 (e.g., 201 Created)
        // User successfully created on backend
        window.location.href = '/welcome'; // Redirect immediately to your main application page

      } else {
        // Handle errors from the server (e.g., validation errors, username/email taken)
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach(errMsg => {
            // Try to map errors to specific fields if possible
            if (errMsg.toLowerCase().includes('username')) {
              displayErrorMessage('usernameError', errMsg);
            } else if (errMsg.toLowerCase().includes('email')) {
              displayErrorMessage('emailError', errMsg);
            } else if (errMsg.toLowerCase().includes('password')) {
                displayErrorMessage('passwordError', errMsg);
            } else {
              // Display as a general form message if no specific field matches
              if (formMessagesDiv) {
                formMessagesDiv.innerHTML += `${errMsg}<br>`; // Append all errors
                formMessagesDiv.style.color = 'var(--danger-color, red)';
              } else {
                alert(errMsg); // Fallback to alert
              }
            }
          });
        } else if (result.message) { // General message from server
            if (formMessagesDiv) {
                formMessagesDiv.textContent = result.message;
                formMessagesDiv.style.color = 'var(--danger-color, red)';
            } else {
                alert(result.message);
            }
        } else { // Unknown error structure
            if (formMessagesDiv) {
                formMessagesDiv.textContent = 'An unknown error occurred during signup.';
                formMessagesDiv.style.color = 'var(--danger-color, red)';
            } else {
                alert('An unknown error occurred during signup.');
            }
        }
        // Re-enable button after error
        signupButton.disabled = false;
        signupButton.textContent = 'Sign Up';
      }
    } catch (error) {
      // Network error or other issue with fetch itself
      console.error('Error during signup fetch:', error);
      if (formMessagesDiv) {
        formMessagesDiv.textContent = 'Signup failed. Please check your connection and try again.';
        formMessagesDiv.style.color = 'var(--danger-color, red)';
      } else {
        alert('Signup failed. Please check your connection and try again.');
      }
      // Re-enable button after error
      signupButton.disabled = false;
      signupButton.textContent = 'Sign Up';
    }
  });
}

// Helper function to display error messages
// Assumes you might add <span class="error-message" id="usernameError"></span> etc., under your inputs
// Or a general <div id="formMessages"></div>
function displayErrorMessage(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    // Make sure your CSS defines --danger-color or use a default like 'red'
    errorElement.style.color = 'var(--danger-color, red)';
    errorElement.style.fontSize = '0.8em'; // Optional: smaller font for errors
    errorElement.style.display = 'block'; // Ensure it's visible
  }
}

// Helper function to clear all specific field error messages
function clearErrorMessages() {
  document.querySelectorAll('.error-message').forEach(el => {
    el.textContent = '';
    el.style.display = 'none'; // Hide them
  });
  // Also clear general form messages if you have one
  const formMessagesDiv = document.getElementById('formMessages');
  if (formMessagesDiv) {
    formMessagesDiv.textContent = '';
    formMessagesDiv.innerHTML = ''; // Clear any appended messages
  }
}