import { getFirestore, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
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

function getCurrentUserId() {
    const user = auth.currentUser;
    return user ? user.uid : null;
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        const userId = getCurrentUserId();
        fetchAndDisplayBookings(userId);
    } else {
        console.log('No user is authenticated. Redirecting to login page.');
        window.location.href = "/html/login.html";
    }
});

// Function to cancel booking page
window.cancelBooking = function (bookingId) {
    window.location.href = `/html/cancelBooking.html?book_id=${encodeURIComponent(bookingId)}`;
}

// Function to check in booking page
window.checkinBooking = function (bookingId) {
    window.location.href = `/html/checkin.html?book_id=${encodeURIComponent(bookingId)}`;
}

function isPastDate(dateString) {
    const date = new Date(dateString);
    return date < new Date();
}

// Function to fetch booking detials
async function fetchAndDisplayBookings(userId) {
    try {
        const status = document.getElementById('status').value;
        const paymentDocRef = doc(db, 'payments', userId);
        const docSnap = await getDoc(paymentDocRef);

        if (docSnap.exists()) {
            const paymentData = docSnap.data();
            const paymentsArray = paymentData.payments || [];

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const paymentFilter = paymentsArray.filter(payment => {
                const bookingDate = new Date(payment.book_date);
                return (
                    payment.status === status &&
                    bookingDate.getMonth() === currentMonth &&
                    bookingDate.getFullYear() === currentYear
                );
            });

            // Sort book_id in descending order
            paymentFilter.sort((a, b) => {
                const idA = parseInt(a.book_id.replace(/^\D+/g, ''), 10); 
                const idB = parseInt(b.book_id.replace(/^\D+/g, ''), 10);
                return idB - idA; 
            });

            // Sort to put enabled bookings before disabled ones
            paymentFilter.sort((a, b) => {
                const isDisabledA = isPastDate(a.checkin_date) || isPastDate(a.checkout_date);
                const isDisabledB = isPastDate(b.checkin_date) || isPastDate(b.checkout_date);
                return isDisabledA - isDisabledB; 
            });

            const statusContainer = document.getElementById('statusContainer');
            statusContainer.innerHTML = '';

            if (paymentFilter.length > 0) {
                const table = document.createElement('table');
                table.setAttribute('border', '1');
                table.setAttribute('width', '100%');

                const actionHeader = paymentFilter.some(payment => payment.status !== 'Cancelled') ? '<th class="text-center">Action</th>' : '';
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th class="text-center">Booking ID</th>
                        <th class="text-center">Booking Details</th>
                        <th class="text-center">Status</th>
                        ${actionHeader}
                    </tr>
                `;
                table.appendChild(thead);

                const tbody = document.createElement('tbody');
                paymentFilter.forEach(payment => {
                    const bookingId = payment.book_id || 'N/A';
                    const bookingDetails = `
                        <div class="book-details ${isPastDate(payment.checkin_date) || isPastDate(payment.checkout_date) ? 'disabled' : ''}">
                            <strong>Booking Date:</strong> ${new Date(payment.book_date).toLocaleString()}<br>
                            <strong>Check-in Date:</strong> ${payment.checkin_date}<br>
                            <strong>Check-out Date:</strong> ${payment.checkout_date}<br>
                            <strong>Room:</strong> ${payment.room_name}<br>
                            <strong>Category: </strong> ${payment.category}<br>
                            <strong>Owner Name:</strong> ${payment.owner_name}<br>
                            <strong>Pet Name:</strong> ${payment.pet_name}<br>
                            <strong>Total Price:</strong> RM ${payment.totalPrice}<br>
                        </div>
                    `;
                    const bookingStatus = payment.status || 'Pending';
                    
                    const isPastCheckinDate = isPastDate(payment.checkin_date);
                    const isPastCheckoutDate = isPastDate(payment.checkout_date);
                    const buttonDisabled = isPastCheckinDate || isPastCheckoutDate;
                    const buttonsHidden = bookingStatus === 'Cancelled';
                    const checkinButtonVisible = bookingStatus !== 'Checked-In' && !buttonsHidden;
                    const cancelButtonVisible = bookingStatus !== 'Cancelled' && !isPastCheckinDate;

                    const row = document.createElement('tr');
                    row.className = isPastCheckinDate || isPastCheckoutDate ? 'disabled' : '';

                    row.innerHTML = `
                        <td class="text-center book-id ${isPastDate(payment.checkin_date) || isPastDate(payment.checkout_date) ? 'disabled' : ''}">${bookingId}</td>
                        <td>${bookingDetails}</td>
                        <td class="text-center">${bookingStatus}</td> 
                   
                        ${buttonsHidden ? '' : `
                            <td class="text-center">
                                ${buttonDisabled ? '' : checkinButtonVisible ? `<button onclick="checkinBooking('${bookingId}')" class="checkin-button" >
                                    Check In
                                </button>` : ''} &nbsp;&nbsp;
                                ${((bookingStatus === 'Checked-In' || bookingStatus === 'Checked-Out') || !cancelButtonVisible) ? '' :
                                `<button onclick="cancelBooking('${bookingId}')" class="cancel-button" ${buttonDisabled ? 'disabled' : ''}>Cancel Booking</button>`}
                            </td>
                        `}               
                    `;
                    tbody.appendChild(row);
                });
                table.appendChild(tbody);

                statusContainer.appendChild(table);
            } else {
                statusContainer.innerHTML = '<p class="pt-3">No bookings found.</p>';
            }
        } else {
            console.log('No document found for the given userId.');
            statusContainer.innerHTML = '<p class="pt-3">No booking found.</p>';
        }
    } catch (error) {
        console.error('Error fetching delivery status:', error);
    }
}

document.getElementById('status').addEventListener('change', () => {
    const userId = getCurrentUserId();
    if (userId) {
        fetchAndDisplayBookings(userId);
    } else {
        console.error('No user ID available.');
    }
});
