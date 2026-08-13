// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeBqGtaeNb5Tt7RetDOM26jpP3cojhZIE",
  authDomain: "stockshot-83ffe.firebaseapp.com",
  projectId: "stockshot-83ffe",
  storageBucket: "stockshot-83ffe.firebasestorage.app",
  messagingSenderId: "282437882969",
  appId: "1:282437882969:web:c1b1ab59a9e0d716db8d48",
  measurementId: "G-V0ZMMK1JF5"
};

// Wait for Firebase to load before initializing
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}

let auth = null;

// Get auth after Firebase loads
function getAuth() {
  if (typeof firebase !== 'undefined' && firebase.auth) {
    if (!auth) {
      auth = firebase.auth();
    }
    return auth;
  }
  return null;
}

// Show/Hide Password Toggle
function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    button.classList.remove('hidden');
  } else {
    input.type = "password";
    button.classList.add('hidden');
  }
}

// Sign Up Function
async function handleSignUp() {
  const auth = getAuth();
  if (!auth) {
    showMessage("signup-message", "Firebase not loaded. Please refresh.", "error");
    return;
  }

  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("signup-confirm-password").value;

  if (!email || !password || !confirmPassword) {
    showMessage("signup-message", "Please fill in all fields", "error");
    return;
  }

  if (password.length < 6) {
    showMessage("signup-message", "Password must be at least 6 characters", "error");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("signup-message", "Passwords do not match", "error");
    return;
  }

  if (!email.includes("@")) {
    showMessage("signup-message", "Please enter a valid email", "error");
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    await user.updateProfile({
      displayName: email.split("@")[0]
    });

    showMessage("signup-message", "Account created successfully! Redirecting...", "success");
    
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  } catch (error) {
    console.error("Sign up error:", error.message);
    
    if (error.code === "auth/email-already-in-use") {
      showMessage("signup-message", "Email already in use", "error");
    } else if (error.code === "auth/weak-password") {
      showMessage("signup-message", "Password is too weak", "error");
    } else if (error.code === "auth/invalid-email") {
      showMessage("signup-message", "Invalid email address", "error");
    } else {
      showMessage("signup-message", error.message, "error");
    }
  }
}

// Login Function
async function handleLogin() {
  const auth = getAuth();
  if (!auth) {
    showMessage("login-message", "Firebase not loaded. Please refresh.", "error");
    return;
  }

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showMessage("login-message", "Please fill in all fields", "error");
    return;
  }

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    console.log("Logged in as:", user.email);
    showMessage("login-message", "Login successful! Redirecting...", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  } catch (error) {
    console.error("Login error:", error.message);
    
    if (error.code === "auth/user-not-found") {
      showMessage("login-message", "Email not found", "error");
    } else if (error.code === "auth/wrong-password") {
      showMessage("login-message", "Wrong password", "error");
    } else if (error.code === "auth/invalid-email") {
      showMessage("login-message", "Invalid email address", "error");
    } else {
      showMessage("login-message", error.message, "error");
    }
  }
}

// Logout Function
function handleLogout() {
  const auth = getAuth();
  if (auth) {
    auth.signOut().then(() => {
      console.log("Logged out");
      window.location.href = "login.html";
    }).catch((error) => {
      console.error("Logout error:", error);
    });
  }
}

// Display Message
function showMessage(elementId, message, type) {
  const messageEl = document.getElementById(elementId);
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.className = type === "success" ? "message success" : "message error";
    messageEl.style.display = "block";

    if (type === "error") {
      setTimeout(() => {
        messageEl.style.display = "none";
      }, 5000);
    }
  }
}

// Toggle between Login and Sign Up
function toggleAuthForm() {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  
  if (loginForm.style.display === "none") {
    loginForm.style.display = "block";
    signupForm.style.display = "none";
  } else {
    loginForm.style.display = "none";
    signupForm.style.display = "block";
  }
}

// Check if user is logged in
window.addEventListener("load", () => {
  const auth = getAuth();
  if (auth) {
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("User is logged in:", user.email);
        if (window.location.pathname.includes("login.html")) {
          window.location.href = "index.html";
        }
      } else {
        console.log("User is not logged in");
        if (window.location.pathname.includes("index.html") || 
            window.location.pathname.includes("calculator.html")) {
          window.location.href = "login.html";
        }
      }
    });
  }
});

// Get current user
function getCurrentUser() {
  const auth = getAuth();
  return auth ? auth.currentUser : null;
}