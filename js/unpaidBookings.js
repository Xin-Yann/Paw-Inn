import { getFirestore, collection, query, getDoc, getDocs, where, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
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
        fetchAndDisplayBookStatus(userId);
    } else {
        console.log('No user is authenticated. Redirecting to login page.');
        window.location.href = "/html/login.html";
    }
});

window.payBooking = function (bookingId) {
    window.location.href = `/html/payment.html?book_id=${encodeURIComponent(bookingId)}`;
}

// Function to fetch and display booking detials 
async function fetchAndDisplayBookStatus(userId) {
    try {
        const bookDocRef = doc(db, 'book', userId);
        console.log('Fetching document from:', bookDocRef.path);
        const docSnap = await getDoc(bookDocRef);

        let bookArray = [];


        if (docSnap.exists()) {
            console.log('Document data:', docSnap.data());
            const bookData = docSnap.data();
            bookArray = bookData.bookings || [];

            bookArray = await deleteBooking(bookArray, bookDocRef);

            const today = new Date();
            const pastDate = bookArray.filter(booking => {
                const checkinDate = new Date(booking.checkin_date);
                return checkinDate < today;
            })

            // Check past date booking
            if (pastDate.length > 0) {
                console.log(`You have ${pastDate.length} past checked in date bookings.`);
                const confirmDelete = window.confirm(
                    `You have ${pastDate.length} past checked in date bookings. The bookings will be deleted.`
                );

                if (confirmDelete) {
                    bookArray = bookArray.filter(book => new Date(book.checkin_date) >= today);

                    await updateDoc(bookDocRef, { bookings: bookArray });
                } else {
                    console.log('User chose not to delete past bookings.');
                }
            }

            // Sort book_id in descending order
            bookArray.sort((a, b) => {
                const idA = a.book_id && typeof a.book_id === 'string'
                    ? parseInt(a.book_id.replace(/^\D+/g, ''), 10)
                    : 0;
                const idB = b.book_id && typeof b.book_id === 'string'
                    ? parseInt(b.book_id.replace(/^\D+/g, ''), 10)
                    : 0;
                return idB - idA;
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

// Function to fetch roon quantity
async function fetchRoomQuantity(year = new Date().getFullYear()) {
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
                    const roomQuantities = room.room_quantity || [];

                    if (!Array.isArray(roomQuantities)) {
                        return;
                    }

                    roomQuantities.forEach((monthData, monthIndex) => {
                        for (const [date, quantity] of Object.entries(monthData)) {
                            const roomDate = new Date(date);
                            if (roomDate.getFullYear() === year) {
                                roomData.push({
                                    category,
                                    roomName,
                                    date: date,
                                    quantity: parseInt(quantity, 10),
                                    month: roomDate.getMonth(),
                                });
                            }
                        }
                    });
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

// Function to delete booking if insufficient room quantity
async function deleteBooking(bookings, bookDocRef) {
    const deleteBook = [];

    for (const booking of bookings) {
        const { checkin_date, checkout_date, room_name } = booking;
        const checkinDate = new Date(checkin_date);
        const checkoutDate = new Date(checkout_date);

        const checkinRoomQuantity = await fetchRoomQuantity(checkinDate.getFullYear());
        const checkoutRoomQuantity = await fetchRoomQuantity(checkoutDate.getFullYear());
        const checkinRoomAvailable = checkinRoomQuantity.find(room =>
            room.roomName === room_name && new Date(room.date).toDateString() === checkinDate.toDateString()
        );
        const checkoutRoomAvailable = checkoutRoomQuantity.find(room =>
            room.roomName === room_name && new Date(room.date).toDateString() === checkoutDate.toDateString()
        );

        const isRoomUnavailable = (!checkinRoomAvailable || checkinRoomAvailable.quantity === 0) ||
                                  (!checkoutRoomAvailable || checkoutRoomAvailable.quantity === 0);

        if (isRoomUnavailable) {
            deleteBook.push(booking);
        }
    }

    if (deleteBook.length > 0) {
        const confirmDelete = window.confirm(
            `Deleting bookings with no room found for ${deleteBook.map(b => b.book_id).join(', ')}`
        );

        if (confirmDelete) {
            const updatedBookings = bookings.filter(book => !deleteBook.includes(book));
            await updateDoc(bookDocRef, { bookings: updatedBookings });
            return updatedBookings;
        }
    }

    return bookings;
}
