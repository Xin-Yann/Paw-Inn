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
        fetchAndDisplayBookStatus(userId);
    } else {
        console.log('No user is authenticated. Redirecting to login page.');
        window.location.href = "/html/login.html";
    }
});

window. payBooking = function (bookingId) {
    window.location.href = `/html/payment.html?book_id=${encodeURIComponent(bookingId)}`;
}

async function fetchAndDisplayBookStatus(userId) {
    try {
        const bookDocRef = doc(db, 'book', userId); 
        console.log('Fetching document from:', bookDocRef.path); // Log the path
        const docSnap = await getDoc(bookDocRef);

        if (docSnap.exists()) {
            console.log('Document data:', docSnap.data()); // Log the data
            const bookData = docSnap.data();
            const bookArray = bookData.bookings || [];

            bookArray.sort((a, b) => {
                const idA = a.book_id || '';
                const idB = b.book_id || '';
                return idB.localeCompare(idA); // For strings
                // For numbers, use: return b.bookingId - a.bookingId;
            });

            const statusContainer = document.getElementById('statusContainer');
            statusContainer.innerHTML = '';

            if (bookArray.length > 0) {
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
                bookArray.forEach(book => {
                    const bookingId = book.book_id || 'N/A';
                    const bookingDetails = `
                        <strong>Booking Date:</strong> ${new Date(book.book_date).toLocaleString()}<br>
                        <strong>Check-in Date:</strong> ${book.checkin_date}<br>
                        <strong>Check-out Date:</strong> ${book.checkout_date}<br>
                        <strong>Room:</strong> ${book.room_name}<br>
                        <strong>Pet Name:</strong> ${book.pet_name}
                    `;
                    const bookingStatus = book.status || 'Pending';

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${bookingId}</td>
                        <td>${bookingDetails}</td>
                        <td>${bookingStatus}</td> 
                        <td>
                            <button onclick="payBooking('${bookingId}')" class="pay-button">Pay</button>
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
            const statusContainer = document.getElementById('statusContainer');
            statusContainer.innerHTML = '<p class="pt-3">No booking found.</p>';
        }
    } catch (error) {
        console.error('Error fetching booking status:', error);
    }
}



