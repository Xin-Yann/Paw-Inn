import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
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

async function fetchAndDisplayBookings(userId) {
    const status = document.getElementById('status').value;
    const statusContainer = document.getElementById('statusContainer');
    
    try {
        const paymentDocRef = doc(db, 'payments', userId); 
        const docSnap = await getDoc(paymentDocRef);

        if (docSnap.exists()) {
            const paymentData = docSnap.data();
            const paymentsArray = paymentData.payments || [];

            // Filter payments based on status
            const paymentFilter = paymentsArray.filter(payment => {
                return payment.status === status; 
            });

            // Sort the filtered payments
            paymentFilter.sort((a, b) => {
                const idA = a.book_id || '';
                const idB = b.book_id || '';
                return idB.localeCompare(idA); // For strings
                // For numbers, use: return b.book_id - a.book_id;
            });

            statusContainer.innerHTML = '';

            if (paymentFilter.length > 0) {
                const table = document.createElement('table');
                table.setAttribute('border', '1');
                table.setAttribute('width', '100%');

                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th>Booking ID</th>
                        <th>Booking Details</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                `;
                table.appendChild(thead);

                const tbody = document.createElement('tbody');
                paymentFilter.forEach(payment => {
                    const bookingId = payment.book_id || 'N/A';
                    const bookingDetails = `
                        <strong>Booking Date:</strong> ${new Date(payment.book_date).toLocaleString()}<br>
                        <strong>Pet Name:</strong> ${payment.pet_name}<br>
                        <strong>Owner Name:</strong> ${payment.owner_name}<br>
                        <strong>Check-in Date:</strong> ${payment.checkin_date}<br>
                        <strong>Check-out Date:</strong> ${payment.checkout_date}<br>
                        <strong>Room:</strong> ${payment.room_name}<br>
                    `;
                    const bookingStatus = payment.status || 'Pending';

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${bookingId}</td>
                        <td>${bookingDetails}</td>
                        <td>${bookingStatus}</td> 
                        <td>
                            <button onclick="cancelBooking('${bookingId}')" class="cancel-button">Cancel Booking</button>
                        </td>                
                    `;
                    tbody.appendChild(row);
                });
                table.appendChild(tbody);

                statusContainer.appendChild(table);
            } else {
                statusContainer.innerHTML = '<p class="pt-3">No booking found.</p>';
            }
        } else {
            console.log('No document found for the given userId.');
            statusContainer.innerHTML = '<p class="pt-3">No booking found.</p>';
        }
    } catch (error) {
        console.error('Error fetching booking:', error);
        statusContainer.innerHTML = '<p class="pt-3">Error fetching bookings.</p>';
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

fetchAndDisplayBookings();

