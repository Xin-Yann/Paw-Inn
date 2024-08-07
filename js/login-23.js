import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, getDoc, getDocs, doc, setDoc, query, collection, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Initialize Firebase
const db = getFirestore();
const auth = getAuth();
const provider = new GoogleAuthProvider();

function generateMembershipId() {
  return 'MID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

document.getElementById('signIn').addEventListener('click', (event) => {
  event.preventDefault();
  const email = document.getElementById('Email').value;
  const password = document.getElementById('Password').value;
  const checkbox = document.getElementById('checkbox');

  if (!email || !password) {
    window.alert('Email and password must be filled out.');
    return;
  }

  if (email.endsWith('@staff.com')) {
    window.alert('Invalid Email');
    return;
  }

  if (!checkbox.checked) {
    window.alert('You must agree to the Privacy Policy & T&C.');
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log('Signed in user:', user);

      sessionStorage.setItem('userEmail', user.email);

      window.location.href = "../html/home.html";
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Sign-in error:', errorCode, errorMessage);
      window.alert("Invalid email or password. Please try again.");
    });
});

document.getElementById('googleSignIn').addEventListener('click', () => {
  signInWithPopup(auth, provider)
    .then(async (result) => {
      console.log('Google sign-in result:', result);
      const user = result.user;
      console.log('Signed-in user:', user);
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          console.log("User already exists in Firestore");
        } else {
          // Check if the user's email is already registered with password
          const querySnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));
          if (!querySnapshot.empty) {
            console.log("User already registered with password. Skipping Firestore save.");
          } else {

            const membershipId = generateMembershipId();
            // Save user details to Firestore
            await setDoc(userRef, {
              userId: user.uid,
              name: user.displayName,
              email: user.email,
              membershipId: membershipId
            });
            console.log("User data saved to Firestore");
          }
        }

        sessionStorage.setItem('userEmail', user.email);
        window.location.href = "../html/home.html";
      } else {
        console.error('No user data found in sign-in result.');
        window.alert("Google sign-in failed. Please try again.");
      }
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Google sign-in error:', errorCode, errorMessage);
      window.alert("Google sign-in failed. Please try again.");
    });
});
