import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

const auth = getAuth();

document.getElementById('signIn').addEventListener('click', (event) => {
  event.preventDefault();
  const email = document.getElementById('Email').value;
  const password = document.getElementById('Password').value;
  const checkbox = document.getElementById('checkbox');

  if (!email || !password) {
    window.alert('Email and password must be filled out.');
    return;
  }

  if (!email.endsWith('@staff.com')) {
    window.alert('Only staff members are allowed to login.');
    return;
  }

  if (!checkbox.checked) {
    window.alert('You must agree to the Privacy Policy & T&C.');
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then((staffCredential) => {
      const staff = staffCredential.user;
      fetchStaffdata();
      console.log('Signed in user:', staff);

      sessionStorage.setItem('staffEmail', staff.email);

      window.location.href = "staff-home.html";
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      
      if (errorCode === 'auth/invalid-credential') {
        window.alert("Invalid credentials. Please check your input.");
      } else {
        window.alert("Error: " + errorMessage);
      }
  
    });
});

async function fetchStaffdata() {
  try {
      const staffsCollection = collection(db, 'staffs');
      const querySnapshot = await getDocs(staffsCollection);
  } catch (error) {
      console.error('Error fetching documents: ', error);
  }
}