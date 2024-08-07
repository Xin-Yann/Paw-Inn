import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-storage.js";

// Initialize Firebase Storage
const storage = getStorage();

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

    const today = new Date().setHours(0, 0, 0, 0);
    const events = bookings.map(booking => {
        const roomClass = getRoomClass(booking.room_name);
        const checkoutDate = new Date(booking.checkout_date).setHours(0, 0, 0, 0);

        // Disable events where the checkout date has passed
        const eventClasses = checkoutDate < today ? `event-disabled ${roomClass}` : roomClass;

        return {
            id: booking.book_id,
            title: booking.room_name,
            start: new Date(booking.checkin_date).toISOString().split('T')[0],
            end: new Date(booking.checkout_date).toISOString().split('T')[0],
            className: eventClasses,
            extendedProps: {
                bookId: booking.book_id,
                roomName: booking.room_name,
                checkinDate: booking.checkin_date,
                checkoutDate: booking.checkout_date,
                nights: booking.nights,
                category: booking.category,
                ownerName: booking.owner_name,
                petName: booking.pet_name,
                vaccinationImage: booking.vaccination_image,
                status: booking.status
            }
        };
    });

    console.log('Mapped Events:', events);

    displayRoomCounts(events, today);

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
            const eventEndDate = new Date(event.extendedProps.checkoutDate).setHours(0, 0, 0, 0);

            if (eventEndDate < today) {
                console.log('Past event clicked, modal will not be displayed.');
                return;
            }

            displayRoomDetails(event.extendedProps);
        }
    });

    function displayRoomCounts(events, today) {
        const roomCountsToday = events.reduce((acc, event) => {
            const eventStartDate = new Date(event.start).setHours(0, 0, 0, 0);
            const eventEndDate = new Date(event.end).setHours(0, 0, 0, 0);

            if (today >= eventStartDate && today < eventEndDate) {
                acc[event.title] = (acc[event.title] || 0) + 1;
            }
            return acc;
        }, {});

        const roomCountsList = document.getElementById('roomCountsList');
        roomCountsList.innerHTML = '';

        for (const [roomName, count] of Object.entries(roomCountsToday)) {
            const listItem = document.createElement('li');
            listItem.textContent = `${roomName}: ${count}`;
            listItem.classList.add('pt-3');
            roomCountsList.appendChild(listItem);
        }
    }

    function getRoomClass(roomName) {
        switch (roomName.toLowerCase()) {
            case 'deluxe room':
                return 'event-deluxe-room';
            case 'suite room':
                return 'event-suite-room';
            // Add more cases as needed
            default:
                return '';
        }
    }

    async function displayRoomDetails(details) {
        const modalTitle = document.getElementById('eventModalLabel');
        const modalBody = document.querySelector('#eventModal .modal-body');
        const imageElement = document.getElementById('vaccination_image');

        // Create modal content
        let modalContent = `
            <strong>Booking ID:</strong> ${details.bookId}<br>
            <strong>Room Name:</strong> ${details.roomName}<br>
            <strong>Check-in Date:</strong> ${details.checkinDate}<br>
            <strong>Check-out Date:</strong> ${details.checkoutDate}<br>
            <strong>Nights:</strong> ${details.nights}<br>
            <strong>Category:</strong> ${details.category}<br>
            <strong>Owner Name:</strong> ${details.ownerName}<br>
            <strong>Pet Name:</strong> ${details.petName}<br>
            <strong>Status:</strong> ${details.status}<br>
        `;

        if (details.vaccinationImage) {
            try {
                const storageRef = ref(storage, details.vaccinationImage); // Create a reference to the image path
                const imageUrl = await getDownloadURL(storageRef); // Get the download URL
                modalContent += `<strong>Vaccination Image: <br><img id="vaccination_image" src="${imageUrl}" alt="Vaccination Image" style="width:50%; height:auto; padding-top: 20px;"></strong>`;
                if (imageElement) {
                    imageElement.style.display = 'block'; // Ensure the image is visible
                }
            } catch (error) {
                console.error('Error fetching vaccination image:', error);
                modalContent += `<p>Unable to load vaccination image.</p>`;
                if (imageElement) {
                    imageElement.style.display = 'none'; // Hide the image element if there's an error
                }
            }
        } else {
            modalContent += `<p>No vaccination image available.</p>`;
            if (imageElement) {
                imageElement.style.display = 'none'; // Hide the image element if no image path is provided
            }
        }

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
