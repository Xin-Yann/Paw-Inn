import { getFirestore, collection, query, getDoc, where, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

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

window.cancelBooking = function (bookingId) {
    window.location.href = `/html/cancelBooking.html?book_id=${encodeURIComponent(bookingId)}`;
}

window.checkinBooking = function (bookingId) {
    window.location.href = `/html/checkin.html?book_id=${encodeURIComponent(bookingId)}`;
}

function isPastDate(dateString) {
    const date = new Date(dateString);
    return date < new Date();
}

async function fetchAndDisplayBookings(userId) {
    try {
        const status = document.getElementById('status').value;
        const paymentDocRef = doc(db, 'payments', userId);
        const docSnap = await getDoc(paymentDocRef);

        if (docSnap.exists()) {
            const paymentData = docSnap.data();
            const paymentsArray = paymentData.payments || [];

            const paymentFilter = paymentsArray.filter(payment => {
                return payment.status === status;
            });

            const currentMonth = new Date().getMonth(); // e.g., September is 8 (0-indexed)
            const currentYear = new Date().getFullYear(); // e.g., 2024

            // Filter bookings by the current month and year
            paymentsArray.filter(payment => {
                const bookingDate = new Date(payment.book_date);
                return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
            });

            // Sort the filtered payments
            paymentFilter.sort((a, b) => {
                const idA = parseInt(a.book_id.replace(/^\D+/g, ''), 10); // Extract number part and parse to integer
                const idB = parseInt(b.book_id.replace(/^\D+/g, ''), 10); // Extract number part and parse to integer
                return idB - idA; // For numeric comparison
            });

            // Sort to move disabled rows to the bottom
            paymentFilter.sort((a, b) => {
                const isDisabledA = isPastDate(a.checkin_date) || isPastDate(a.checkout_date);
                const isDisabledB = isPastDate(b.checkin_date) || isPastDate(b.checkout_date);
                return isDisabledA - isDisabledB; // non-disabled first
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
                            <strong>Owner Name:</strong> ${payment.owner_name}<br>
                            <strong>Pet Name:</strong> ${payment.pet_name}<br>
                            <strong>Total Price:</strong> ${payment.totalPrice}<br>
                        </div>
                    `;
                    const bookingStatus = payment.status || 'Pending';

                    // Determine if the row should be disabled
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
                                ${buttonDisabled ? '' : checkinButtonVisible ? `<button onclick="checkinBooking('${bookingId}')" class="checkin-button" >Check In</button>` : ''} &nbsp;&nbsp;
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
