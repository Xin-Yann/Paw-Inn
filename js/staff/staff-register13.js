import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
const auth = getAuth();
const db = getFirestore();

function hashPassword(password) {
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

async function generateStaffID() {
    const staffCounterDocRef = doc(db, 'metadata', 'staffCounter');
    try {
      const staffCounterDoc = await getDoc(staffCounterDocRef);
      let newstaffID = 1;
      if (staffCounterDoc.exists()) {
        newstaffID = staffCounterDoc.data().laststaffID + 1;
      }
      await setDoc(staffCounterDocRef, { laststaffID: newstaffID });
      return `S${newstaffID.toString().padStart(2, '0')}`;
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

        if (!name || !email || !password || !contact) {
            window.alert("Please fill in all the details.");
            return;
        }

        const uppercase = /[A-Z]/;
        const lowercase = /[a-z]/;
        const contactNo = /^(\d{3}[- ]\d{3,4}[- ]?\d{4})$/;

        if (password.length < 8 || !uppercase.test(password) || !lowercase.test(password)) {
            window.alert("Password must be at least 8 characters long and contain at least one uppercase and one lowercase character");
            return;
        }

        if (!contactNo.test(contact)) {
            window.alert("Please enter a valid contact number");
            return;
        }

        if (!checkbox.checked) {
            window.alert('You must agree to the Privacy Policy & T&C.');
            return;
        }

        const hashedPassword = hashPassword(password);

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        const userId = userCredential.user.uid;

        try {

            const docRef = await setDoc(doc(db, 'staff', userId), {
                userId: userId,
                name: name,
                email: email,
                contact: contact,
                password: hashedPassword,
                staffId: staffId

            });

            sessionStorage.setItem('staffEmail', email);

            window.location.href = "../staff/staff-home.html";

            sessionStorage.setItem('userEmail', userCredential.user.email);

            console.log('User created with email: ', userCredential.user.email);
            console.log('Document written with ID (used as user ID): ', docRef.id);

        } catch (firestoreError) {
            console.error("Error adding document to Firestore: ", firestoreError.message);

            if (!userCredential.user) {
                try {
                    await userCredential.user.delete();
                    console.error("Firestore failed, user deleted from Firebase Authentication");
                } catch (deleteError) {
                    console.error("Error deleting user from Firebase Authentication: ", deleteError);
                }
            }

            console.error("Firestore failed, user deleted from Firebase Authentication");
        }

    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Error adding document: ', errorCode, errorMessage);

        if (errorCode === 'auth/email-already-in-use') {
            window.alert("The email address is already in use by another account.");
        } else {
            console.alert("Error: " + errorMessage);
        }

    }
});
