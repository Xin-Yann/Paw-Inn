import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// Initialize Firebase
const auth = getAuth();

document.getElementById('reset').addEventListener('click', async (event) => {
    event.preventDefault();
    const email = document.getElementById('Email').value.trim();

    try {
        await sendPasswordResetEmail(auth, email);
        window.alert('Password reset email sent!');
        window.location.href = "../html/login.html";
    } catch (error) {
        console.error('Error sending password reset email:', error);
        window.alert('Error sending password reset email: ' + error.message);
    }
});