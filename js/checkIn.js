import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import Typebot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.3/dist/web.js'

const db = getFirestore();
const auth = getAuth();

Typebot.initBubble({
    typebot: "customer-support-92olq2c",
    theme: {
        button: { backgroundColor: "#0d9488" },
        chatWindow: { backgroundColor: "#fff" },
    },
});

document.addEventListener("DOMContentLoaded", () => {

    function getCurrentUserId() {
        const user = auth.currentUser;
        return user ? user.uid : null;
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userId = getCurrentUserId();
            onlineCheckIn(userId);
        } else {
            console.error('No authenticated user found.');
        }
    });

    async function onlineCheckIn(userId) {
        const urlParams = new URLSearchParams(window.location.search);
        const book_id = urlParams.get('book_id');

        if (!book_id) {
            alert('No booking ID provided.');
            return;
        }

        if (!userId) {
            alert('You must be logged in to cancel a booking.');
            return;
        }

        const docRef = doc(db, 'payments', userId);
        const docSnapshot = await getDoc(docRef);

        if (!docSnapshot.exists()) {
            alert('No document found for this user.');
            return;
        }

        const data = docSnapshot.data();
        const payments = data.payments || [];

        if (!Array.isArray(payments)) {
            alert('Invalid data format.');
            return;
        }

        console.log('Retrieved Book ID:', book_id);
        console.log('Payments Array:', payments);

        const payment = payments.find(payment => {
            console.log('Checking Payment Book ID:', payment.book_id);
            return payment.book_id === book_id;
        });

        if (!payment) {
            alert('Booking ID not found.');
            return;
        }

        const bookingDetails = `
        <strong>Booking ID:</strong> ${payment.book_id}<br>
        <strong>Booking Date:</strong> ${new Date(payment.book_date).toLocaleString()}<br>
        <strong>Pet Name:</strong> ${payment.pet_name}<br>
        <strong>Owner Name:</strong> ${payment.owner_name}<br>
        <strong>Check-in Date:</strong> ${payment.checkin_date}<br>
        <strong>Check-out Date:</strong> ${payment.checkout_date}<br>
        <strong>Room:</strong> ${payment.room_name}<br>
        <strong>Status:</strong> ${payment.status}<br>
        <strong>Total Price:</strong> ${payment.totalPrice}<br>
    `;

        const confirmContainer = document.getElementById('book-detials');
        confirmContainer.innerHTML = `
        <p >Are you sure you want to check in the following booking?</p>
        <div class="py-4" id="booking-details">${bookingDetails}</div>
        <div class="button">
            <button class="checkin-button" id="confirm-checkin">Yes, Check-In Booking</button>
            <button class="back-button" onclick="window.history.back()">No, Go Back</button>
        </div>
    `;
        confirmContainer.style.display = 'block';

        //Function to check in booking
        document.getElementById('confirm-checkin').addEventListener('click', async () => {
            try {
                payment.status = 'Checked-In';
                await updateDoc(docRef, { payments });
                alert(`Booking ID: ${book_id} has been checked in.`);
                window.location.href = '/html/bookingHistory.html';
            } catch (error) {
                console.error('Error checking in booking:', error);
                alert('Failed to check in booking. Please try again.');
            }
        });
    }

});