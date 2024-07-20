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
        fetchAndDisplayDeliveryStatus(userId);
    } else {
        console.log('No user is authenticated. Redirecting to login page.');
        window.location.href = "/html/login.html";
    }
});

async function fetchAndDisplayDeliveryStatus(userId) {
    try {
        const paymentDocRef = doc(db, 'payments', userId); 
        const docSnap = await getDoc(paymentDocRef);

        if (docSnap.exists()) {
            const paymentData = docSnap.data();
            const paymentsArray = paymentData.payments || [];

            paymentsArray.sort((a, b) => {
                const idA = a.book_id || '';
                const idB = b.book_id || '';
                return idB.localeCompare(idA); // For strings
                // For numbers, use: return b.bookingId - a.bookingId;
            });

            const statusContainer = document.getElementById('statusContainer');
            statusContainer.innerHTML = '';

            if (paymentsArray.length > 0) {
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
                paymentsArray.forEach(payment => {
                    const bookingId = payment.book_id || 'N/A';
                    const bookingDetails = `
                        <strong>Booking Date:</strong> ${new Date(payment.booking_date).toLocaleString()}<br>
                        <strong>Check-in Date:</strong> ${payment.checkin_date}<br>
                        <strong>Check-out Date:</strong> ${payment.checkout_date}<br>
                        <strong>Room:</strong> ${payment.room_name}<br>
                        <strong>Pet Name:</strong> ${payment.pet_name}
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
                statusContainer.innerHTML = '<p class="pt-3">No orders found.</p>';
            }
        } else {
            console.log('No document found for the given userId.');
            statusContainer.innerHTML = '<p class="pt-3">No orders found.</p>';
        }
    } catch (error) {
        console.error('Error fetching delivery status:', error);
    }
}

// window.cancelBooking = async (docId, paymentId) => {
//     const confirmed = confirm(`Are you sure you want to cancel booking ID: ${paymentId}?`);
//     if (confirmed) {
//         try {
//             // Fetch the document, remove the specific payment, and update the document
//             const docRef = doc(db, 'payments', docId);
//             const docSnapshot = await getDoc(docRef);
//             const data = docSnapshot.data();
//             let payments = data.payments || [];
//             payments = payments.filter(payment => payment.paymentId !== paymentId);

//             await updateDoc(docRef, { payments });
//             alert(`Booking ID: ${paymentId} has been cancelled.`);
//             const userId = getCurrentUserId();
//             fetchAndDisplayDeliveryStatus(userId); // Refresh the table
//         } catch (error) {
//             console.error('Error cancelling booking:', error);
//             alert('Failed to cancel booking. Please try again.');
//         }
//     }
// }
