import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

async function fetchAndDisplayPersonalDetails(email) {
    try {
        console.log(`Fetching details for email: ${email}`);

        const usersCollectionRef = collection(db, 'users');
        const userQuery = query(usersCollectionRef, where("email", "==", email)); 
        const querySnapshot = await getDocs(userQuery);

        if (querySnapshot.empty) {
            console.log('No matching documents found.');
            window.alert('Email not registered');
            return null; 
        }

        let userData;
        querySnapshot.forEach((doc) => {
            userData = doc.data();
            console.log('User data fetched:', userData);
        });

        return userData; 
    } catch (error) {
        console.error('Error fetching user details:', error);
        window.alert('Error fetching user details: ' + error.message);
    }
}

document.getElementById('reset').addEventListener('click', async (event) => {
    event.preventDefault();
    const email = document.getElementById('Email').value.trim();

    if (!email) {
        window.alert('Please enter your email address.');
        return;
    }

    try {
        let userData = await fetchAndDisplayPersonalDetails(email); 
        if (userData) {
            userData = await fetchAndDisplayPersonalDetails(email);
            await sendPasswordResetEmail(auth, email);
            window.alert('Password reset email sent!')
        }

        window.location.href = "../html/login.html";
    } catch (error) {
        console.error('Error sending password reset email:', error);
        window.alert('Error sending password reset email: ' + error.message);
    }
});
