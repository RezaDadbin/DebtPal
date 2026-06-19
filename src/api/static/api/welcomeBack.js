// public/welcomeBack.js
document.addEventListener('DOMContentLoaded', () => {
  // Look for the new button ID
  const proceedButton = document.getElementById('organizeDebtsBtn');

  if (proceedButton) {
    // The link is now an <a> tag, so we don't need JS to make it work.
    // This script is no longer strictly necessary but is good practice
    // if you want to add a fade-out effect later.
    console.log("Welcome page script loaded.");
  }
});