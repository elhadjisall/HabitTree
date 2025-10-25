const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const newAccBtn = document.getElementById("newacc");
const existAccBtn = document.getElementById("existacc");

// Hide both forms initially
signupForm.style.display = "none";
loginForm.style.display = "none";

// Show signup form when "Create New Account" is clicked
newAccBtn.addEventListener("click", () => {
  signupForm.style.display = "block";
  loginForm.style.display = "none";
});

// Show login form when "Existing Account" is clicked
existAccBtn.addEventListener("click", () => {
  loginForm.style.display = "block";
  signupForm.style.display = "none";
});
