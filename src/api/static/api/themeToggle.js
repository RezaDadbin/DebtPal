const toggleBtn = document.getElementById("themeToggleBtn"); // Get the theme toggle button
const themeIcon = document.getElementById("themeIcon"); // Get the icon to display current theme

// Load previously saved theme from localStorage
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark"); // Apply dark mode class if previously saved as dark
  themeIcon.textContent = "☀️"; // Change icon to sun (indicating light mode switch available)
}

// Event listener for theme toggle button click
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark"); // Toggle the dark mode class on body

  // Save the user's theme preference to localStorage
  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark"); // Set theme to dark in localStorage
    themeIcon.textContent = "☀️"; // Change icon to sun (indicating light mode switch available)
  } else {
    localStorage.setItem("theme", "light"); // Set theme to light in localStorage
    themeIcon.textContent = "🌙"; // Change icon to moon (indicating dark mode switch available)
  }
});

// Ensure dark mode is applied on page load based on saved preference
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark'); // Apply dark theme class to document element
}
