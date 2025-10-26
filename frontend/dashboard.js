const signupForm = document.getElementById("signupFormElement");
const loginForm = document.getElementById("loginFormElement");
const logoutbtn = document.getElementById("logoutbtn");

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

logoutbtn.addEventListener("click", () =>{
   window.location.href = "index.html";
});
