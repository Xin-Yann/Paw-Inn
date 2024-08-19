import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is logged in:', user.email);
    window.location.href = "../staff/staff-home.html";
  } else {
    console.log('No user is logged in.');
  }
});

async function generateStaffID() {
    const staffCounterDocRef = doc(db, 'metadata', 'staffCounter');
    try {
      const staffCounterDoc = await getDoc(staffCounterDocRef);
      let newstaffID = 1;
      if (staffCounterDoc.exists()) {
        newstaffID = staffCounterDoc.data().laststaffID + 1;
      }
      await setDoc(staffCounterDocRef, { laststaffID: newstaffID });
      return `S${newstaffID.toString().padStart(2, '0')}`; // Example format: P01
    } catch (e) {
      console.error('Failed to generate staff ID: ', e);
      throw new Error('Failed to generate staff ID');
    }
  }

document.getElementById('signUp').addEventListener('click', async (event) => {
  event.preventDefault();
  try {
    const name = document.getElementById('Name').value.trim();
    const email = document.getElementById('Email').value.trim();
    const password = document.getElementById('Password').value.trim();
    const contact = document.getElementById('Contact').value.trim();
    const checkbox = document.getElementById('checkbox');
    const staffId = await generateStaffID();

    const uppercase = /[A-Z]/;
    const lowercase = /[a-z]/;

    if (!name || !email || !password || !contact) {
      window.alert('Please fill in all the details.');
      return;
    }

    if (!email.endsWith('@staff.com')) {
      window.alert('Only staff members are allowed to register.');
      return;
    }

    if (password.length < 8 || !uppercase.test(password) || !lowercase.test(password)) {
      window.alert('Password must be at least 8 characters long and contain at least one uppercase and one lowercase character.');
      return;
    }

    if (!checkbox.checked) {
      window.alert('You must agree to the Privacy Policy & T&C.');
      return;
    }

    const staffCredential = await createUserWithEmailAndPassword(auth, email, password);

    const docRef = await addDoc(collection(db, 'staff'), {
      name: name,
      email: email,
      contact: contact,
      staffId: staffId,
    });

    console.log('Staff created with email: ', staffCredential.user.email);
    console.log('Document written with ID: ', docRef.id);
    window.location.href = "../staff/staff-home.html";
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error('Error adding document: ', errorCode, errorMessage);
    switch (errorCode) {
      case 'auth/wrong-password':
        window.alert("Invalid password. Please try again.");
        break;
      case 'auth/user-not-found':
        window.alert("No user found with this email. Please sign up.");
        break;
      case 'auth/invalid-email':
        window.alert("Invalid email format. Please check your email.");
        break;
      case 'auth/email-already-in-use':
        window.alert("The email address is already in use by another account.");
        break;
      default:
        window.alert("Error: " + errorMessage);
    }
  }
});