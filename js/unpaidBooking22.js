import { getFirestore, collection, query, getDoc, getDocs, where, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
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

window.payBooking = function (bookingId) {
    window.location.href = `/html/payment.html?book_id=${encodeURIComponent(bookingId)}`;
}

async function fetchAndDisplayBookStatus(userId) {
    try {
        const bookDocRef = doc(db, 'book', userId);
        console.log('Fetching document from:', bookDocRef.path); // Log the path
        const docSnap = await getDoc(bookDocRef);

        let bookArray = [];


        if (docSnap.exists()) {
            console.log('Document data:', docSnap.data()); // Log the data
            const bookData = docSnap.data();
            bookArray = bookData.bookings || [];

            bookArray = await deleteBooking(bookArray,bookDocRef);

            const today = new Date();
            const pastDate = bookArray.filter(booking => {
                const checkinDate = new Date(booking.checkin_date);
                return checkinDate < today;
            })

            if (pastDate.length > 0) {
                console.log(`You have ${pastDate.length} past checked in date bookings.`);
                const confirmDelete = window.confirm(
                    `You have ${pastDate.length} past checked in date bookings. Do you want to delete them?`
                );

                if (confirmDelete) {
                    // Proceed with deletion if user confirms
                    bookArray = bookArray.filter(book => new Date(book.checkin_date) >= now);

                    // Update Firestore with filtered bookings
                    await updateDoc(bookDocRef, { bookings: bookArray });
                } else {
                    console.log('User chose not to delete past bookings.');
                }
            }

            bookArray.sort((a, b) => {
                const idA = a.book_id && typeof a.book_id === 'string'
                    ? parseInt(a.book_id.replace(/^\D+/g, ''), 10)
                    : 0; // Default to 0 if undefined or not a string
                const idB = b.book_id && typeof b.book_id === 'string'
                    ? parseInt(b.book_id.replace(/^\D+/g, ''), 10)
                    : 0; // Default to 0 if undefined or not a string
                return idB - idA; // Numeric comparison
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
                        <th class="text-center">Booking ID</th>
                        <th>Booking Details</th>
                        <th class="text-center">Status</th>
                        <th class="text-center">Action</th>
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
                        <td class="text-center book-id">${bookingId}</td>
                        <td class="book-details">${bookingDetails}</td>
                        <td class="text-center">${bookingStatus}</td> 
                        <td class="text-center">
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

async function fetchRoomQuantity() {
    try {
        const roomCategories = [
            { category: 'cat', collectionName: 'cat rooms' },
            { category: 'dog', collectionName: 'dog rooms' },
            { category: 'rabbit', collectionName: 'rabbit rooms' },
            { category: 'cage', collectionName: 'cage rooms' },
        ];

        const roomData = [];

        for (const { category, collectionName } of roomCategories) {
            const docRef = doc(collection(db, 'rooms'), category);
            const roomCollectionRef = collection(docRef, collectionName);
            const roomQuerySnapshot = await getDocs(roomCollectionRef);



            roomQuerySnapshot.forEach(docSnap => {
                if (docSnap.exists()) {
                    const room = docSnap.data();
                    const roomName = room.room_name || 'Unknown';
                    const roomQuantities = room.room_quantity || []; // Array of maps

                    if (!Array.isArray(roomQuantities)) {
                        return;
                    }
                }
            });
        }

        console.log('Fetched room data:', roomData);
        return roomData;
    } catch (error) {
        console.error('Error fetching room quantity:', error);
        return [];
    }
}


async function deleteBooking(bookings,bookDocRef) {
    const deleteBook = [];

    for (const booking of bookings) {
        const roomQuantity = await fetchRoomQuantity(booking.room_quantity);

        if (roomQuantity === 0) {
            deleteBook.push(booking);
        }
    }  

    if (deleteBook.length > 0) {
        window.confirm('Deleting bookings with no room found:', bookingsToDelete);
        const updateBooking = bookings.filter(book=>!deleteBook.includes(book.book_id));
        await updateDoc(bookDocRef, {bookings:updateBooking});
        return updateBooking;
    }

    return bookings;
}