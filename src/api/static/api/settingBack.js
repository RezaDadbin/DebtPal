// public/settingBack.js

document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Selection Logic (Existing) ---
  const themeSelect = document.getElementById('theme-select');
  const themeMessage = document.getElementById('themeMessage');

  function applyTheme(theme) {
    // Remove all theme classes first
    document.body.classList.remove('light', 'dark');
    document.documentElement.classList.remove('light', 'dark'); // Also apply to html element if styles depend on it

    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.body.classList.add('light');
      document.documentElement.classList.add('light');
    } else { // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.body.classList.add('dark');
        document.documentElement.classList.add('dark');
      } else {
        document.body.classList.add('light');
        document.documentElement.classList.add('light');
      }
    }
  }

  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      const selectedTheme = themeSelect.value;
      localStorage.setItem('theme', selectedTheme);
      applyTheme(selectedTheme);
      if (themeMessage) {
        themeMessage.textContent = `Theme set to ${selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)}.`;
        themeMessage.style.color = 'var(--success-color, green)';
        setTimeout(() => themeMessage.textContent = '', 3000);
      }
    });

    // Load and apply saved theme when page loads
    const savedTheme = localStorage.getItem('theme') || 'system';
    themeSelect.value = savedTheme;
    // applyTheme(savedTheme); // themeToggle.js linked via defer should handle initial application
                               // or call applyTheme() here if themeToggle.js is not on this page.
                               // Since themeToggle.js is linked with defer, let's assume it handles initial load.
                               // If not, uncomment the line above.
  }


  // --- Reset Password Logic ---
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const currentPasswordInput = document.getElementById('currentPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const repeatNewPasswordInput = document.getElementById('repeatNewPassword');
  const passwordChangeMessage = document.getElementById('passwordChangeMessage');

  // Helper to clear password error messages
  const clearPasswordErrors = () => {
    document.getElementById('currentPasswordError').textContent = '';
    document.getElementById('newPasswordError').textContent = '';
    document.getElementById('repeatNewPasswordError').textContent = '';
  };

  if (resetPasswordForm && changePasswordBtn) {
    resetPasswordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearPasswordErrors();
      if (passwordChangeMessage) passwordChangeMessage.textContent = '';

      const currentPassword = currentPasswordInput.value;
      const newPassword = newPasswordInput.value;
      const repeatNewPassword = repeatNewPasswordInput.value;

      let isValid = true;
      if (!currentPassword) {
        document.getElementById('currentPasswordError').textContent = 'Current password is required.';
        isValid = false;
      }
      if (!newPassword) {
        document.getElementById('newPasswordError').textContent = 'New password is required.';
        isValid = false;
      } else if (newPassword.length < 6) {
        document.getElementById('newPasswordError').textContent = 'New password must be at least 6 characters.';
        isValid = false;
      }
      if (newPassword !== repeatNewPassword) {
        document.getElementById('repeatNewPasswordError').textContent = 'New passwords do not match.';
        isValid = false;
      }
      if (newPassword === currentPassword && newPassword !== '') {
        document.getElementById('newPasswordError').textContent = 'New password cannot be the same as the current password.';
        isValid = false;
      }


      if (!isValid) return;

      changePasswordBtn.disabled = true;
      changePasswordBtn.textContent = 'Changing...';

      try {
        const response = await debtpalFetch('/api/user/change-password/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const result = await response.json();

        if (response.ok) {
          if (passwordChangeMessage) {
            passwordChangeMessage.textContent = result.message || 'Password changed successfully!';
            passwordChangeMessage.style.color = 'var(--success-color, green)';
          }
          resetPasswordForm.reset(); // Clear form fields
        } else {
          if (passwordChangeMessage) {
            passwordChangeMessage.textContent = result.message || 'Failed to change password.';
            passwordChangeMessage.style.color = 'var(--danger-color, red)';
          }
          // Potentially display field-specific errors if backend provides them
          if (result.errors) {
              result.errors.forEach(err => {
                  if (err.field === 'currentPassword') document.getElementById('currentPasswordError').textContent = err.message;
                  if (err.field === 'newPassword') document.getElementById('newPasswordError').textContent = err.message;
              });
          }
        }
      } catch (error) {
        console.error('Change password error:', error);
        if (passwordChangeMessage) {
          passwordChangeMessage.textContent = 'An error occurred. Please try again.';
          passwordChangeMessage.style.color = 'var(--danger-color, red)';
        }
      } finally {
        changePasswordBtn.disabled = false;
        changePasswordBtn.textContent = 'Change Password';
      }
    });
  }

  // --- Privacy & Data Logic ---
  const exportDataBtn = document.getElementById('exportDataBtn');
  const clearCacheBtn = document.getElementById('clearCacheBtn');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  const dataManagementMessage = document.getElementById('dataManagementMessage');
  const deleteAccountMessage = document.getElementById('deleteAccountMessage');

  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      if (dataManagementMessage) dataManagementMessage.textContent = '';
      // This would typically trigger a download from a backend endpoint
      alert('Export Data: Backend API endpoint not yet implemented. This would start a data download.');
      // window.location.href = '/api/user/export-data'; // Example for later
    });
  }

  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
      // Example: Clear specific localStorage items related to the app
      // Be careful not to clear the theme preference if you want to keep it
      // For now, just a message.
      localStorage.removeItem('someAppSpecificData'); // Example
      if (dataManagementMessage) {
        dataManagementMessage.textContent = 'Local cache (example data) cleared!';
        dataManagementMessage.style.color = 'var(--success-color, green)';
        setTimeout(() => dataManagementMessage.textContent = '', 3000);
      } else {
        alert('Local cache cleared (example action).');
      }
    });
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
      if (deleteAccountMessage) deleteAccountMessage.textContent = '';

      // Confirmation prompt
      const confirmation = window.confirm(
        'Are you absolutely sure you want to delete your account?\nThis action is irreversible and all your data will be permanently lost.'
      );

      if (confirmation) {
        // Second confirmation, perhaps requiring them to type something or re-enter password
        // For now, a simple second confirm. For real security, backend should re-authenticate.
        const passwordForDelete = prompt("To confirm deletion, please enter your current password:");

        if (passwordForDelete === null) { // User cancelled prompt
            return;
        }
        if (!passwordForDelete) {
            alert("Password is required to delete your account.");
            return;
        }

        try {
          const response = await debtpalFetch('/api/user/account/', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: passwordForDelete })
          });
          const result = await response.json();

          if (response.ok) {
            alert(result.message || 'Account deleted successfully. You will be logged out.');
            // Trigger a logout action (if not handled by server redirecting after delete)
            // This might involve calling a global logout function or directly clearing session/token info
            // and redirecting. For now, a simple redirect.
            window.location.href = '/'; // Redirect to login/home after deletion
          } else {
            if (deleteAccountMessage) {
              deleteAccountMessage.textContent = result.message || 'Failed to delete account. Password may be incorrect or an error occurred.';
              deleteAccountMessage.style.color = 'var(--danger-color, red)';
            } else {
              alert(result.message || 'Failed to delete account.');
            }
          }
        } catch (error) {
          console.error('Delete account error:', error);
          if (deleteAccountMessage) {
            deleteAccountMessage.textContent = 'An error occurred. Please try again.';
            deleteAccountMessage.style.color = 'var(--danger-color, red)';
          } else {
            alert('An error occurred while trying to delete your account.');
          }
        }
      } else {
        if (deleteAccountMessage) {
          deleteAccountMessage.textContent = 'Account deletion cancelled.';
          deleteAccountMessage.style.color = 'var(--main-text, black)';
          setTimeout(() => deleteAccountMessage.textContent = '', 3000);
        }
      }
    });
  }

  // Initial theme application if themeToggle.js is not handling it on this page
  // Or if themeSelect value needs to be honored immediately by themeToggle.js's system
  const initialTheme = localStorage.getItem('theme') || 'system';
  if (themeSelect && themeSelect.value !== initialTheme) {
    // This ensures if themeToggle sets a theme, the dropdown reflects it.
    // However, themeSelect already sets itself from localStorage.
    // The main thing is that applyTheme() is called.
    // If themeToggle.js is linked with defer and applies theme on load, this might be fine.
    // Let's ensure applyTheme is called for this page's specific select element handling.
    if (themeSelect.value === initialTheme) { // If dropdown is already correct
        applyTheme(initialTheme); // Ensure body classes are set
    }
  } else if (!themeSelect && initialTheme) { // If no dropdown but theme exists
      applyTheme(initialTheme);
  }


}); // End of DOMContentLoaded
