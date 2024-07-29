import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
    if (user) {
        initCalendar();
    } else {
        console.log('No user is authenticated. Redirecting to login page.');
        window.location.href = "/html/login.html";
    }
});

async function fetchAllBookings() {
    try {
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        console.log('Users fetched:', usersSnapshot.docs.length); // Log number of users

        const allBookings = [];

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.data().userId; // Use the user_id field from the users collection
            console.log(`Fetched user ID: ${userId}`);

            if (!userId) {
                console.error(`User ID is undefined for user document ID: ${userDoc.id}`);
                continue;
            }

            console.log(`Fetching payments for user ID: ${userId}`);

            // Fetch the payments document for the user
            const paymentsDocRef = doc(db, 'payments', userId);
            const paymentsDocSnapshot = await getDoc(paymentsDocRef);

            if (paymentsDocSnapshot.exists()) {
                const paymentData = paymentsDocSnapshot.data();
                console.log('Payment Document Data:', paymentData);

                // Check if `payments` field exists and is an array
                if (Array.isArray(paymentData.payments)) {
                    console.log('Payments Array:', paymentData.payments);

                    // Filter out the payments with status 'Paid'
                    const paidBookings = paymentData.payments.filter(payment => payment.status === 'Paid');
                    console.log('Paid Bookings:', paidBookings);

                    // Add the filtered payments to the allBookings array
                    allBookings.push(...paidBookings);
                } else {
                    console.log(`No payments array found in document for user ID: ${userId}`);
                }
            } else {
                console.log(`No payments document found for user ID: ${userId}`);
            }
        }

        console.log('All bookings:', allBookings); // Log all bookings fetched
        return allBookings;
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
    }
}

async function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    const bookings = await fetchAllBookings();

    // Map bookings to FullCalendar event format
    const events = bookings.map(booking => ({
        title: booking.owner_name,
        start: new Date(booking.checkin_date).toISOString().split('T')[0], // Format: YYYY-MM-DD
        end: new Date(booking.checkout_date).toISOString().split('T')[0],   // Format: YYYY-MM-DD
        extendedProps: {
            roomName: booking.room_name,
            nights: booking.nights,
            category: booking.category,
            ownerName: booking.owner_name,
            petName: booking.pet_name
        }
    }));
    
    console.log('Mapped Events:', events); // Log events being sent to FullCalendar

    // Initialize FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        initialDate: new Date().toISOString().split('T')[0],
        events: events,
        validRange: {
            start: new Date().getFullYear() + '-01-01',
            end: new Date().getFullYear() + '-12-31'
        },
        eventClick: function(info) {
            const event = info.event;
            displayRoomDetails(event.extendedProps);
        }
    });

    function displayRoomDetails(details) {
        const modalTitle = document.getElementById('eventModalLabel');
        const modalBody = document.querySelector('#eventModal .modal-body');
    
        // Create modal content
        let modalContent = `
            <strong>Room Name:</strong> ${details.roomName}<br>
            <strong>Quantity:</strong> ${details.quantity}<br>
            <strong>Category:</strong> ${details.category}<br>
            <strong>Owner Name:</strong> ${details.ownerName}<br>
            <strong>Pet Name:</strong> ${details.petName}
        `;
    
        // Set modal title and content
        modalTitle.textContent = `Room Details`;
        modalBody.innerHTML = modalContent;
    
        // Show the modal
        const eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
        eventModal.show();
    }
    
    calendar.render();
}

document.addEventListener('DOMContentLoaded', function() {
    initCalendar();
});
