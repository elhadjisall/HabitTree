const signupFormBox = document.getElementById("signupFormBox");
const loginFormBox = document.getElementById("loginFormBox");
const newAccBtn = document.getElementById("newacc");
const existAccBtn = document.getElementById("existacc");

const signupForm = document.getElementById("signupFormElement");
const loginForm = document.getElementById("loginFormElement");

// Hide both forms initially
signupFormBox.style.display = "none";
loginFormBox.style.display = "none";

// Show signup form when "Create New Account" is clicked
newAccBtn.addEventListener("click", () => {
  signupFormBox.style.display = "block";
  loginFormBox.style.display = "none";
});

// Show login form when "Existing Account" is clicked
existAccBtn.addEventListener("click", () => {
  loginFormBox.style.display = "block";
  signupFormBox.style.display = "none";
});

signupForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;

  //write database such that it has saved user details for further checks
  window.location.href="dashboard.html";
});

loginForm.addEventListener("submit", function(e) {
  e.preventDefault();

  //same as signup form database collection of user details
  // to authenticate user
  window.location.href = "dashboard.html";
});
