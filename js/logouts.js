import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('logOut').style.display = 'block'; 
  } else {
    document.getElementById('logOut').style.display = 'none'; 
  }
});


function handleProfileClick() {
  if (auth.currentUser) {
    window.location.href = "/html/profile.html";
  } else {
    window.location.href = "/html/login.html";
  }
}

const profile = document.getElementById('profile');
if (profile) {
  profile.addEventListener('click', handleProfileClick);
}

document.getElementById('logOut').addEventListener('click', () => {
  // Sign out the current user
  signOut(auth)
    .then(() => {
      // Sign-out successful, clear session storage
      sessionStorage.clear();
      console.log('User signed out');
      window.location.href = "../html/home.html";
      window.alert("You have been successfully signed out.");
    })
    .catch((error) => {
      // An error happened.
      console.error('Sign-out error:', error);
    });
});
